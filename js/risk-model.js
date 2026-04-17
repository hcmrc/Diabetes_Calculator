/**
 * @fileoverview Pure risk-computation module — zero DOM dependencies.
 *
 * Implements the Schmidt et al. (2005) logistic regression model for
 * 9-year diabetes risk prediction from the ARIC study. All functions
 * are stateless and side-effect-free, operating solely on numeric inputs
 * and the frozen CONFIG constants.
 *
 * @module RiskModel
 * @memberof DRC
 */

'use strict';

DRC.RiskModel = (() => {
    const { MEANS: M, CONVERSIONS: C, RANGES, THRESHOLDS: T } = DRC.CONFIG;

    /**
     * Return the active model object, falling back to the default model.
     * @param {Object|undefined} model — Optional model object from CONFIG.MODELS.
     * @returns {Object} Model definition with intercept and betas.
     */
    const getModel = (model) => model || DRC.CONFIG.MODELS[DRC.CONFIG.DEFAULT_MODEL];

    /**
     * Convert raw UI values to SI units for model computation.
     * Delegates to ConversionService for DRY compliance.
     * @param {Object} inputs — Raw slider/input values.
     * @param {boolean} isMetric — Whether inputs are already in SI.
     * @returns {Object} Values in SI units.
     */
    const toSI = (inputs, isMetric) => DRC.ConversionService.toSI(inputs, isMetric);

    /**
     * Compute the logistic-regression linear predictor (log-odds).
     * @param {Object} si — Risk-factor values in SI units.
     * @param {Object} [model] — Optional model definition from CONFIG.MODELS.
     *   When omitted, falls back to DEFAULT_MODEL (clinicalGlucoseLipids).
     * @returns {number} The linear predictor score.
     */
    const linearPredictor = (si, model) => {
        const m = getModel(model);
        let lp = m.intercept;
        for (const key of Object.keys(m.betas)) {
            lp += m.betas[key] * si[key];
        }
        return lp;
    };

    /**
     * Compute 9-year diabetes probability via logistic function.
     * @param {Object} siVals — Risk-factor values in SI units.
     * @param {Object} [model] — Optional model definition from CONFIG.MODELS.
     * @returns {number} Probability in [0, 1].
     */
    const computeProbability = (siVals, model) => {
        const lp = linearPredictor(siVals, model);
        if (!isFinite(lp)) {
            console.warn('RiskModel: non-finite linear predictor, returning null');
            return null;
        }
        return 1 / (1 + Math.exp(-lp));
    };

    /**
     * Compute per-factor contribution (deviation from population mean).
     *
     * Mathematical basis — Linear SHAP (Lundberg & Lee, 2017):
     *   phi_i = beta_i * (x_i - mean_i)
     *
     * For additive models (logistic regression in log-odds space) this is the
     * unique attribution satisfying local accuracy, missingness, and consistency.
     * Used internally (log-odds space); the chart renders marginal probability
     * contributions via computeMarginalContributions.
     *
     * @param {Object} siVals — Risk-factor values in SI units.
     * @param {Object} [model] — Optional model definition from CONFIG.MODELS.
     * @returns {Object} Log-odds contribution per factor.
     */
    const computeContributions = (siVals, model) => {
        const m = getModel(model);
        const result = {};
        for (const key of Object.keys(m.betas)) {
            result[key] = m.betas[key] * (siVals[key] - M[key]);
        }
        return result;
    };

    /**
     * Identify clinically elevated modifiable risk factors.
     * All comparisons use SI values to ensure consistent results regardless
     * of the active UI unit system.
     * @param {Object} siVals — Risk-factor values in SI units.
     * @param {boolean} [isMale=true] — Sex for waist threshold selection.
     *   Male: ≥102 cm (NCEP ATP III), Female: ≥88 cm (NCEP ATP III).
     * @returns {{ elevatedFactors: string[], waistIsHigh: boolean }}
     */
    const getElevatedFactors = (siVals, isMale = true) => {
        const elevated = [];
        const waistThreshold = isMale ? T.waist.high : T.waist.elevated;

        if (siVals.fastGlu >= T.fastGlu.elevated)  elevated.push('fastGlu');
        if (siVals.sbp     >= T.sbp.elevated)       elevated.push('sbp');
        if (siVals.cholHDL <= T.cholHDL.low)        elevated.push('cholHDL');
        if (siVals.cholTri >= T.cholTri.elevated)   elevated.push('cholTri');
        if (siVals.waist   >= waistThreshold)        elevated.push('waist');

        return { elevatedFactors: elevated, waistIsHigh: siVals.waist >= T.waist.high };
    };

    /**
     * EID KBB: Compute what-if risk delta for a single-field perturbation.
     * @param {Object} rawInputs — Current raw UI values.
     * @param {boolean} isMetric — Current unit system.
     * @param {string} field — The field to perturb.
     * @param {number} direction — +1 or -1.
     * @param {Object} [model] — Optional model definition from CONFIG.MODELS.
     * @returns {number} Delta in percentage points.
     */
    const computeWhatIfDelta = (rawInputs, isMetric, field, direction, model) => {
        const m = getModel(model);
        const baseProb = computeProbability(toSI(rawInputs, isMetric), m);
        const mode = isMetric ? 'si' : 'us';
        const step = RANGES[field]?.[mode]?.[2] ?? 1;
        const range = RANGES[field]?.[mode];
        let perturbedVal = rawInputs[field] + direction * step * 5;
        if (range) perturbedVal = Math.min(Math.max(perturbedVal, range[0]), range[1]);
        const altered = { ...rawInputs, [field]: perturbedVal };
        return (computeProbability(toSI(altered, isMetric), m) - baseProb) * 100;
    };

    /**
     * Compute the baseline (population mean) diabetes risk.
     * LP_baseline = intercept + Σ(βⱼ × μⱼ), P_baseline = 1/(1 + e^(-LP_baseline))
     * @param {Object} [model] — Optional model definition from CONFIG.MODELS.
     * @returns {number} Baseline probability in [0, 1].
     */
    const computeBaselineRisk = (model) => {
        const m = getModel(model);
        let lpBaseline = m.intercept;
        for (const key of Object.keys(m.betas)) {
            lpBaseline += m.betas[key] * M[key];
        }
        return 1 / (1 + Math.exp(-lpBaseline));
    };

    /**
     * Compute marginal probability contributions per factor.
     *
     * Method (Robnik-Šikonja & Kononenko, 2008; probability-space adaptation of
     * the Linear SHAP decomposition by Lundberg & Lee, 2017):
     *   cᵢ        = βᵢ · (xᵢ − μᵢ)          — SHAP log-odds contribution
     *   LP₋ᵢ      = LP_full − cᵢ             — LP with xᵢ set to population mean
     *   P_without_i = 1 / (1 + e^(−LP₋ᵢ))   — counterfactual probability
     *   Δᵢ        = P_full − P_without_i     — marginal probability contribution
     *
     * Δᵢ answers: "By how many percentage points would this patient's risk drop
     * if only factor i were at the population mean, all others unchanged?"
     *
     * Note: Δᵢ values are NOT additive in probability space (sigmoid nonlinearity).
     *
     * @param {Object} siVals — Risk-factor values in SI units.
     * @param {Object} [model] — Optional model definition from CONFIG.MODELS.
     * @returns {Object} Marginal probability contribution per factor (e.g. 0.042 = 4.2 pp).
     */
    const computeMarginalContributions = (siVals, model) => {
        const m = getModel(model);
        const result = {};
        const lpFull = linearPredictor(siVals, m);
        const pFull = 1 / (1 + Math.exp(-lpFull));
        for (const key of Object.keys(m.betas)) {
            const ci = m.betas[key] * (siVals[key] - M[key]);
            const pWithoutI = 1 / (1 + Math.exp(-(lpFull - ci)));
            result[key] = pFull - pWithoutI;
        }
        return result;
    };

    /**
     * Compute comprehensive marginal probability summary.
     * @param {Object} siVals — Risk-factor values in SI units.
     * @param {Object} [model] — Optional model definition from CONFIG.MODELS.
     * @returns {{ contributions: Object, pFull: number, pBaseline: number, netDeviation: number, sumMarginals: number }}
     */
    const computeMarginalSummary = (siVals, model) => {
        const m = getModel(model);
        const pFull = computeProbability(siVals, m);
        if (pFull == null) return null;
        const pBaseline = computeBaselineRisk(m);
        const contributions = computeMarginalContributions(siVals, m);
        const sumMarginals = Object.values(contributions).reduce((a, b) => a + b, 0);
        return { contributions, pFull, pBaseline, netDeviation: pFull - pBaseline, sumMarginals };
    };

    return { toSI, computeProbability, computeContributions, computeBaselineRisk, computeMarginalContributions, computeMarginalSummary, getElevatedFactors, computeWhatIfDelta };
})();
