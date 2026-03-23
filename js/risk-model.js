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
    const { BETAS: B, MEANS: M, CONVERSIONS: C, RANGES, THRESHOLDS: T } = DRC.CONFIG;

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
     * @returns {number} The linear predictor score.
     */
    const linearPredictor = (si) =>
        B.sigma +
        B.age        * si.age        +
        B.race       * si.race       +
        B.parentHist * si.parentHist +
        B.sbp        * si.sbp        +
        B.waist      * si.waist      +
        B.height     * si.height     +
        B.fastGlu    * si.fastGlu    +
        B.cholHDL    * si.cholHDL    +
        B.cholTri    * si.cholTri;

    /**
     * Compute 9-year diabetes probability via logistic function.
     * @param {Object} siVals — Risk-factor values in SI units.
     * @returns {number} Probability in [0, 1].
     */
    const computeProbability = (siVals) => {
        const lp = linearPredictor(siVals);
        if (!isFinite(lp)) {
            console.warn('RiskModel: non-finite linear predictor, returning NaN');
            return NaN;
        }
        return 1 / (1 + Math.exp(-lp));
    };

    /**
     * Compute per-factor contribution (deviation from population mean).
     *
     * Mathematical basis (Van Belle & Calster, 2015):
     *   contribution_i = beta_i * (x_i - mean_i)
     *
     * @param {Object} siVals — Risk-factor values in SI units.
     * @returns {Object} Contribution per factor.
     */
    const computeContributions = (siVals) => {
        const result = {};
        for (const key of DRC.CONFIG.ALL_FIELDS) {
            result[key] = B[key] * (siVals[key] - M[key]);
        }
        return result;
    };

    /**
     * Identify clinically elevated modifiable risk factors.
     * All comparisons use SI values to ensure consistent results regardless
     * of the active UI unit system.
     * @param {Object} siVals — Risk-factor values in SI units.
     * @returns {{ elevatedFactors: string[], waistIsHigh: boolean }}
     */
    const getElevatedFactors = (siVals) => {
        const elevated = [];

        if (siVals.fastGlu >= T.fastGlu.elevated)  elevated.push('fastGlu');
        if (siVals.sbp     >= T.sbp.elevated)       elevated.push('sbp');
        if (siVals.cholHDL <= T.cholHDL.low)        elevated.push('cholHDL');
        if (siVals.cholTri >= T.cholTri.elevated)   elevated.push('cholTri');
        if (siVals.waist   >= T.waist.elevated)     elevated.push('waist');

        return { elevatedFactors: elevated, waistIsHigh: siVals.waist >= T.waist.high };
    };

    /**
     * EID KBB: Compute what-if risk delta for a single-field perturbation.
     * @param {Object} rawInputs — Current raw UI values.
     * @param {boolean} isMetric — Current unit system.
     * @param {string} field — The field to perturb.
     * @param {number} direction — +1 or -1.
     * @returns {number} Delta in percentage points.
     */
    const computeWhatIfDelta = (rawInputs, isMetric, field, direction) => {
        const baseProb = computeProbability(toSI(rawInputs, isMetric));
        const mode = isMetric ? 'si' : 'us';
        const step = RANGES[field]?.[mode]?.[2] ?? 1;
        const range = RANGES[field]?.[mode];
        let perturbedVal = rawInputs[field] + direction * step * 5;
        if (range) perturbedVal = Math.min(Math.max(perturbedVal, range[0]), range[1]);
        const altered = { ...rawInputs, [field]: perturbedVal };
        return (computeProbability(toSI(altered, isMetric)) - baseProb) * 100;
    };

    /**
     * Compute the baseline (population mean) diabetes risk.
     * LP_baseline = σ + Σ(βⱼ × μⱼ), P_baseline = 1/(1 + e^(-LP_baseline))
     * @returns {number} Baseline probability in [0, 1].
     */
    const computeBaselineRisk = () => {
        const lpBaseline = B.sigma +
            B.age        * M.age        +
            B.race       * M.race       +
            B.parentHist * M.parentHist +
            B.sbp        * M.sbp        +
            B.waist      * M.waist      +
            B.height     * M.height     +
            B.fastGlu    * M.fastGlu    +
            B.cholHDL    * M.cholHDL    +
            B.cholTri    * M.cholTri;
        return 1 / (1 + Math.exp(-lpBaseline));
    };

    /**
     * Compute marginal probability contributions per factor.
     * Δᵢ = P_full - P_without_i where P_without_i = 1/(1 + e^(-(LP - cᵢ)))
     * @param {Object} siVals — Risk-factor values in SI units.
     * @returns {Object} Marginal contribution per factor (decimal, e.g. 0.042).
     */
    const computeMarginalContributions = (siVals) => {
        const result = {};
        const lpFull = linearPredictor(siVals);
        const pFull = 1 / (1 + Math.exp(-lpFull));
        for (const key of DRC.CONFIG.ALL_FIELDS) {
            const ci = B[key] * (siVals[key] - M[key]);
            const pWithoutI = 1 / (1 + Math.exp(-(lpFull - ci)));
            result[key] = pFull - pWithoutI;
        }
        return result;
    };

    /**
     * Compute comprehensive marginal probability summary.
     * @param {Object} siVals — Risk-factor values in SI units.
     * @returns {{ contributions: Object, pFull: number, pBaseline: number, netDeviation: number, sumMarginals: number }}
     */
    const computeMarginalSummary = (siVals) => {
        const pFull = computeProbability(siVals);
        const pBaseline = computeBaselineRisk();
        const contributions = computeMarginalContributions(siVals);
        const sumMarginals = Object.values(contributions).reduce((a, b) => a + b, 0);
        return { contributions, pFull, pBaseline, netDeviation: pFull - pBaseline, sumMarginals };
    };

    return { toSI, computeProbability, computeContributions, computeBaselineRisk, computeMarginalContributions, computeMarginalSummary, getElevatedFactors, computeWhatIfDelta };
})();
