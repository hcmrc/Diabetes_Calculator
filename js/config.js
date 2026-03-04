/**
 * @fileoverview Configuration & Constants for the Diabetes Risk Calculator.
 *
 * Contains all model coefficients, clinical thresholds, treatment data, and
 * UI configuration. Values are derived from the Schmidt et al. (2005) ARIC
 * study logistic regression model and current clinical guidelines.
 *
 * @author Marco Haeckel
 * @version 4.0.0
 *
 * @references
 *   Schmidt, M. I., Duncan, B. B., Bang, H., Pankow, J. S., Ballantyne, C. M.,
 *     Golden, S. H., ... & Brancati, F. L. (2005). Identifying individuals at
 *     high risk for diabetes: The Atherosclerosis Risk in Communities study.
 *     Diabetes Care, 28(8), 2013-2018.
 *   ADA (2024). Standards of Care in Diabetes. Diabetes Care, 47(Suppl 1).
 *   ESC (2023). Guidelines for the management of cardiovascular disease in
 *     patients with diabetes. European Heart Journal, 44(39), 4043-4140.
 */

'use strict';

/**
 * Global namespace for the Diabetes Risk Calculator application.
 * @namespace DRC
 */
window.DRC = window.DRC || {};

/**
 * Immutable application configuration.
 * @const {Object}
 * @memberof DRC
 */
DRC.CONFIG = Object.freeze({

    /**
     * Logistic-regression beta coefficients from Schmidt et al. (2005).
     * All continuous predictors use SI units internally.
     */
    BETAS: {
        age:        0.0173,
        race:       0.4433,
        parentHist: 0.4981,
        sbp:        0.0111,
        waist:      0.0273,     // per cm
        height:    -0.0326,     // per cm
        fastGlu:    1.5849,     // per mmol/L
        cholHDL:   -0.4718,     // per mmol/L
        cholTri:    0.242,      // per mmol/L
        sigma:     -9.9808      // intercept
    },

    /** Population means from the ARIC Study baseline cohort (all SI). */
    MEANS: {
        age: 54, race: 0.25, parentHist: 0.3, sbp: 120,
        waist: 97, height: 168, fastGlu: 5.5, cholHDL: 1.3, cholTri: 1.7
    },

    /** US-to-SI conversion multipliers. */
    CONVERSIONS: {
        heightToCm: 2.54,
        waistToCm:  2.54,
        gluToMmol:  1 / 18,
        hdlToMmol:  1 / 38.67,
        triToMmol:  1 / 88.57
    },

    /** Slider [min, max, step] per field and unit system. */
    RANGES: {
        age:     { us: [20, 80, 1],       si: [20, 80, 1] },
        sbp:     { us: [80, 220, 1],      si: [80, 220, 1] },
        height:  { us: [48, 84, 1],       si: [122, 213, 1] },
        waist:   { us: [25, 60, 1],       si: [64, 152, 1] },
        fastGlu: { us: [50, 300, 1],      si: [2.8, 16.7, 0.1] },
        cholHDL: { us: [20, 100, 1],      si: [0.5, 2.6, 0.1] },
        cholTri: { us: [50, 500, 1],      si: [0.6, 5.6, 0.1] }
    },

    /** Human-readable factor labels for charts and UI. */
    LABELS: {
        age: 'Age', race: 'Race', parentHist: 'Parental History',
        sbp: 'Blood Pressure', waist: 'Waist Size', height: 'Height',
        fastGlu: 'Glucose', cholHDL: 'HDL Cholesterol', cholTri: 'Triglycerides'
    },

    /** Short labels for radar chart axes. */
    RADAR_LABELS: {
        fastGlu: 'Glucose', sbp: 'BP', cholTri: 'Triglyc.',
        waist: 'Waist', cholHDL: 'HDL', age: 'Age'
    },

    /**
     * Clinical decision thresholds (SI units).
     * Sources: ADA (2024), ESC (2023), WHO.
     */
    THRESHOLDS: {
        fastGlu: { elevated: 5.6,  high: 7.0  },
        sbp:     { elevated: 130,  high: 160  },
        cholHDL: { low: 1.0,       veryLow: 0.8 },
        cholTri: { elevated: 1.7,  high: 2.3  },
        waist:   { elevated: 94,   high: 102  }
    },

    /** Treatment recommendations per modifiable risk factor (ESC 2023). */
    TREATMENTS: {
        fastGlu: {
            id: 'glucose-treatment', icon: 'bloodtype',
            title: 'Blood Sugar Management',
            therapies: [
                { name: 'Standard Medication', desc: 'Metformin is often the first step to help control blood sugar levels.' },
                { name: 'Heart & Kidney Protection', desc: 'If you have heart or kidney concerns, ask your doctor about newer medications that specifically protect these organs (SGLT2 inhibitors or GLP-1) while also supporting weight loss.' }
            ]
        },
        sbp: {
            id: 'bp-treatment', icon: 'favorite',
            title: 'Blood Pressure Control',
            therapies: [
                { name: 'Combination Medications', desc: 'It is recommend to start with a combination of different blood pressure medications (e.g. RAS inhibitors and CCBs).' },
                { name: 'Heart-Healthy Diet', desc: 'Restriction of alcohol and sodium consumption, increased consumption of vegetables, use of low-fat dairy products can lower blood pressure naturally.' }
            ]
        },
        cholHDL: {
            id: 'hdl-treatment', icon: 'water_drop',
            title: 'Good Cholesterol (HDL) Improvement',
            therapies: [
                { name: 'Regular Exercise', desc: 'Aim for 150 minutes per week of activity like brisk walking, or 75 minutes of intense exercise.' },
                { name: 'Healthy Lifestyle', desc: 'Stopping smoking, limiting alcohol, and eating healthy fats (olive oil, nuts, fish) all help.' }
            ]
        },
        cholTri: {
            id: 'tri-treatment', icon: 'science',
            title: 'Blood Fats (Triglycerides)',
            therapies: [
                { name: 'Prescription Fish Oil', desc: 'If blood fats (triglycerides) remain high, special prescription fish oil (icosapent ethyl) might be considered.' },
                { name: 'Cholesterol Medication', desc: 'Cholesterol-lowering medication (Statins) is usually recommended to protect your blood vessels.' }
            ]
        },
        waist: {
            id: 'waist-treatment', icon: 'straighten',
            title: 'Weight Management',
            therapies: [
                { name: 'Diet & Exercise', desc: 'Reducing daily calories and exercising more leads to steady weight loss.' },
                { name: 'Medications', desc: 'Glucose-lowering drugs with additional weight-reducing effects (e.g. GLP-1RA) can also help.' }
            ],
            surgicalOption: { name: 'Surgical Options', desc: 'For significant obesity with health problems, weight-loss surgery may be discussed.' }
        }
    },

    /**
     * Evidence-based treatment simulation deltas (both unit systems).
     *
     * Sources:
     *   fastGlu: DPP/DPPOS (Aroda et al., 2017): -20 mg/dL (-1.1 mmol/L)
     *   sbp:     Wang et al. (2025, Lancet) + Canoy et al. (2022): ~-10 mmHg
     *   cholHDL: van Namen et al. (2019): +5 mg/dL (+0.13 mmol/L)
     *   cholTri: van Namen et al. (2019) + statins: -30 mg/dL (-0.34 mmol/L)
     *   waist:   Wong et al. (2025) + van Namen et al. (2019): -5 cm (-2 in)
     */
    SIMULATION_EFFECTS: {
        fastGlu: { us: -20,  si: -1.1,  label: 'Blood Sugar Management' },
        sbp:     { us: -10,  si: -10,   label: 'Blood Pressure Control' },
        cholHDL: { us: +5,   si: +0.13, label: 'HDL Improvement' },
        cholTri: { us: -30,  si: -0.34, label: 'Triglyceride Treatment' },
        waist:   { us: -2,   si: -5,    label: 'Weight Management' }
    },

    /** Default slider values for the reset function. */
    DEFAULTS: {
        age: 50, sbp: 120,
        height:  { us: 66,  si: 168 },
        waist:   { us: 36,  si: 91 },
        fastGlu: { us: 95,  si: 5.3 },
        cholHDL: { us: 50,  si: 1.3 },
        cholTri: { us: 150, si: 1.7 },
        race: false, parentHist: false
    },

    /** Ordered list of all risk-factor field keys. */
    ALL_FIELDS: ['age', 'race', 'parentHist', 'sbp', 'height', 'waist', 'fastGlu', 'cholHDL', 'cholTri'],

    /** Subset of fields that have numeric sliders. */
    SLIDER_FIELDS: ['age', 'sbp', 'height', 'waist', 'fastGlu', 'cholHDL', 'cholTri'],

    /** Fields requiring unit conversion between US and SI. */
    CONVERTIBLE_FIELDS: ['height', 'waist', 'fastGlu', 'cholHDL', 'cholTri']
});
