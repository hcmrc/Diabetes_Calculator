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
    const computeProbability = (siVals) =>
        1 / (1 + Math.exp(-linearPredictor(siVals)));

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
        const altered = { ...rawInputs, [field]: rawInputs[field] + direction * step * 5 };
        return (computeProbability(toSI(altered, isMetric)) - baseProb) * 100;
    };

    return { toSI, computeProbability, computeContributions, getElevatedFactors, computeWhatIfDelta };
})();
