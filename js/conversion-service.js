/**
 * @fileoverview Conversion Service — centralized unit conversion logic.
 *
 * Handles all conversions between US (imperial) and SI (metric) units
 * for medical measurements. Eliminates DRY violations across the codebase.
 *
 * @module ConversionService
 * @memberof DRC
 */

'use strict';

DRC.ConversionService = (() => {
    const CFG = DRC.CONFIG;

    /**
     * Convert raw input values to SI units.
     * @param {Object} inputs — Object with raw input values
     * @param {boolean} isMetric — Whether inputs are already in metric
     * @returns {Object} New object with values converted to SI
     */
    const toSI = (inputs, isMetric) => {
        if (isMetric) return { ...inputs };

        const c = CFG.CONVERSIONS;
        return {
            ...inputs,
            height:  inputs.height  * c.heightToCm,
            waist:   inputs.waist   * c.waistToCm,
            fastGlu: inputs.fastGlu * c.gluToMmol,
            cholHDL: inputs.cholHDL * c.hdlToMmol,
            cholTri: inputs.cholTri * c.triToMmol
        };
    };

    /**
     * Convert SI values to display units (US or SI).
     * @param {Object} siVals — Object with SI values
     * @param {boolean} isMetric — Target unit system (true=SI, false=US)
     * @returns {Object} New object with values converted to display units
     */
    const fromSI = (siVals, isMetric) => {
        if (isMetric) return { ...siVals };

        const c = CFG.CONVERSIONS;
        return {
            ...siVals,
            height:  siVals.height  / c.heightToCm,
            waist:   siVals.waist   / c.waistToCm,
            fastGlu: siVals.fastGlu / c.gluToMmol,
            cholHDL: siVals.cholHDL / c.hdlToMmol,
            cholTri: siVals.cholTri / c.triToMmol
        };
    };

    /**
     * Convert a single field value between unit systems.
     * @param {string} field — Field name (height, waist, fastGlu, cholHDL, cholTri)
     * @param {number} value — Value to convert
     * @param {boolean} toMetric — Direction: true=to SI, false=to US
     * @returns {number} Converted value
     */
    const convertField = (field, value, toMetric) => {
        const c = CFG.CONVERSIONS;
        const multiplier = {
            height:  c.heightToCm,
            waist:   c.waistToCm,
            fastGlu: c.gluToMmol,
            cholHDL: c.hdlToMmol,
            cholTri: c.triToMmol
        }[field];

        if (multiplier == null) return value; // No conversion needed for this field
        return toMetric ? value * multiplier : value / multiplier;
    };

    /**
     * Apply converted values to DOM elements with proper clamping.
     * Assumes savedValues contains SI values and converts to the target unit system.
     * @param {Object} siValues — Saved values in SI units
     * @param {boolean} isMetric — Target unit system
     * @param {Object} options — Optional callbacks { onValue, onComplete }
     */
    const applyConvertedValues = (siValues, isMetric, options = {}) => {
        const mode = isMetric ? 'si' : 'us';

        Object.entries(siValues).forEach(([field, siVal]) => {
            // Skip fields that have no slider range (e.g. race, parentHist, _riskPct)
            if (!CFG.RANGES[field]) return;

            // Convert from SI to target display unit
            // When in SI mode: use siVal directly (just need rounding)
            // When in US mode: convert from SI to US
            let val;
            if (isMetric) {
                val = siVal; // Already in SI
            } else {
                const multiplier = {
                    height:  CFG.CONVERSIONS.heightToCm,
                    waist:   CFG.CONVERSIONS.waistToCm,
                    fastGlu: CFG.CONVERSIONS.gluToMmol,
                    cholHDL: CFG.CONVERSIONS.hdlToMmol,
                    cholTri: CFG.CONVERSIONS.triToMmol
                }[field];
                val = multiplier ? siVal / multiplier : siVal;
            }

            const [min, max, step] = CFG.RANGES[field][mode];
            val = DRC.UIHelpers.clampAndRound(val, min, max, step);

            if (options.onValue) {
                options.onValue(field, val);
            }
        });

        if (options.onComplete) {
            options.onComplete();
        }
    };

    /**
     * Get conversion factor for a field.
     * @param {string} field — Field name
     * @returns {number|null} Conversion factor or null
     */
    const getConversionFactor = (field) => {
        const c = CFG.CONVERSIONS;
        return {
            height:  c.heightToCm,
            waist:   c.waistToCm,
            fastGlu: c.gluToMmol,
            cholHDL: c.hdlToMmol,
            cholTri: c.triToMmol
        }[field] || null;
    };

    return {
        toSI,
        fromSI,
        convertField,
        applyConvertedValues,
        getConversionFactor
    };
})();
