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

    /**
     * Population means from the ARIC Study baseline cohort (all SI).
     * race = 0.15: Schmidt et al. (2005) reports 85% white → 15% African-American.
     * fastGlu = 5.44: Median fasting glucose reported in the ARIC cohort (5.44 mmol/L).
     * parentHist = 0.3: Not explicitly reported in the publication; used as approximation.
     */
    MEANS: {
        age: 54, race: 0.15, parentHist: 0.3, sbp: 120,
        waist: 97, height: 168, fastGlu: 5.44, cholHDL: 1.3, cholTri: 1.7
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
        // Waist: 26 inches = 66.04 cm (was 25 inches = 63.5 cm, below SI min of 64)
        // Updated to eliminate 0.5 cm inconsistency between US and SI ranges
        waist:   { us: [26, 60, 1],       si: [66, 152, 1] },
        fastGlu: { us: [50, 300, 1],      si: [2.8, 16.7, 0.1] },
        cholHDL: { us: [20, 100, 1],      si: [0.5, 2.6, 0.1] },
        cholTri: { us: [50, 500, 1],      si: [0.6, 5.6, 0.1] }
    },

    /** Human-readable factor labels for charts and UI. */
    LABELS: {
        age: 'Age', race: 'Ethnicity', parentHist: 'Parental Diabetes',
        sbp: 'Blood Pressure', waist: 'Waist', height: 'Height',
        fastGlu: 'Fasting Glucose', cholHDL: 'HDL Cholesterol', cholTri: 'Blood Fats (Triglycerides)'
    },

    /** Short labels for radar chart axes. */
    RADAR_LABELS: {
        fastGlu: 'Glucose', sbp: 'BP', cholTri: 'Blood Fats',
        waist: 'Waist', cholHDL: 'HDL', age: 'Age'
    },

    /**
     * Clinical decision thresholds (SI units).
     * Sources: ADA (2024), NCEP ATP III, ACC/AHA (2017).
     *
     * fastGlu: ADA (2024) — Normal <100 mg/dL (<5.6), Prediabetes 100–124 mg/dL
     *   (5.6–6.9), Diabetes ≥125 mg/dL (≥6.9 mmol/L).
     * sbp: ACC/AHA (2017) — Normal <120, Elevated 120–129, Hypertension ≥130 mmHg.
     * cholHDL: NCEP ATP III — Low <40 mg/dL (<1.03 mmol/L), High (good) >60 mg/dL
     *   (>1.55 mmol/L). Sex is not a variable in the Schmidt et al. (2005) model,
     *   so the male threshold (1.03) is applied universally.
     * cholTri: NCEP ATP III — Normal <150, Borderline 150–199, High 200–499,
     *   Very High ≥500 mg/dL.
     * waist: NCEP ATP III — Women >88 cm (>35 in), Men >102 cm (>40 in).
     *   Sex is not in the model; elevated uses the female threshold (88 cm),
     *   high uses the male threshold (102 cm).
     */
    THRESHOLDS: {
        fastGlu: { elevated: 5.6,  high: 6.9  },
        sbp:     { elevated: 120,  high: 130  },
        cholHDL: { low: 1.03,      high: 1.55 },
        cholTri: { elevated: 1.7,  high: 2.3, veryHigh: 5.6 },
        waist:   { elevated: 88,   high: 102  }
    },

    /**
     * Published high-risk probability cut-off from Schmidt et al. (2005).
     * Patients with Pr(DM) >= 0.26 are classified as high-risk.
     * At this threshold: ~20% of population identified, sensitivity 52%, specificity 86%.
     */
    HIGH_RISK_CUTOFF: 0.26,

    /** Treatment recommendations per modifiable risk factor (ESC 2023). */
    TREATMENTS: {
        fastGlu: {
            id: 'glucose-treatment', icon: 'droplet',
            title: 'Fasting Glucose Management',
            therapies: [
                { name: 'Standard Medication', desc: 'Metformin is often the first step to help control blood sugar levels.' },
                { name: 'Heart & Kidney Protection', desc: 'If you have heart or kidney concerns, ask your doctor about newer medications that specifically protect these organs (SGLT2 inhibitors or GLP-1) while also supporting weight loss.' }
            ]
        },
        sbp: {
            id: 'bp-treatment', icon: 'heart',
            title: 'Blood Pressure Control',
            therapies: [
                { name: 'Combination Medications', desc: 'It is recommend to start with a combination of different blood pressure medications (e.g. RAS inhibitors and CCBs).' },
                { name: 'Heart-Healthy Diet', desc: 'Restriction of alcohol and sodium consumption, increased consumption of vegetables, use of low-fat dairy products can lower blood pressure naturally.' }
            ]
        },
        cholHDL: {
            id: 'hdl-treatment', icon: 'droplets',
            title: 'HDL Cholesterol Improvement',
            therapies: [
                { name: 'Regular Exercise', desc: 'Aim for 150 minutes per week of activity like brisk walking, or 75 minutes of intense exercise.' },
                { name: 'Medication', desc: 'CETP inhibitors and Cholesterol-lowering medication (Statins) can also help to raise HDL.' }
            ]
        },
        cholTri: {
            id: 'tri-treatment', icon: 'flask-conical',
            title: 'Blood Fats (Triglycerides) Treatment',
            therapies: [
                { name: 'Healthy Lifestyle', desc: 'Stopping smoking and eating healthy fats (olive oil, nuts, fish) all help and should be done first.' },
                { name: 'Prescription Fish Oil', desc: 'If blood fats (triglycerides) remain high, special prescription fish oil (icosapent ethyl) might be considered.' },
                { name: 'Medication', desc: 'Fibrate or Cholesterol lowering medication (Statins) can also help to reduce triglycerides.' }
            ]
        },
        waist: {
            id: 'waist-treatment', icon: 'ruler',
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
     *   fastGlu: -1.52 mmol/L (US: -27 mg/dL)
     *   sbp:     Sex-dependent — Female: -30.9 mmHg, Male: -17.7 mmHg
     *   cholHDL: +31% of default 1.3 mmol/L = +0.40 mmol/L (US: +16 mg/dL)
     *   cholTri: -30% of default 1.7 mmol/L = -0.51 mmol/L (US: -45 mg/dL)
     *   waist:   -7.13 kg weight loss ≈ -7.13 cm waist (1 cm/kg, Ross et al.) = -2.81 in
     */
    SIMULATION_EFFECTS: {
        fastGlu: { us: -27,   si: -1.52,  label: 'Fasting Glucose Management' },
        sbp:     { usMale: -17.7, usFemale: -30.9, siMale: -17.7, siFemale: -30.9, label: 'Blood Pressure Control' },
        cholHDL: { us: +16,   si: +0.40,  label: 'HDL Cholesterol Improvement' },
        cholTri: { us: -45,   si: -0.51,  label: 'Blood Fats (Triglycerides) Treatment' },
        waist:   { us: -2.81, si: -7.13,  label: 'Weight Management' }
    },

    /** Default slider values for the reset function. */
    DEFAULTS: {
        age: 50, sbp: 120,
        height:  { us: 66,  si: 168 },
        waist:   { us: 36,  si: 91 },
        fastGlu: { us: 95,  si: 5.3 },
        cholHDL: { us: 50,  si: 1.3 },
        cholTri: { us: 150, si: 1.7 },
        sex: true, race: false, parentHist: false
    },

    /** Ordered list of all field keys (sex is UI-only for waist thresholds, not in the ARIC model). */
    ALL_FIELDS: ['age', 'sex', 'race', 'parentHist', 'sbp', 'height', 'waist', 'fastGlu', 'cholHDL', 'cholTri'],

    /** Subset of fields that have numeric sliders. */
    SLIDER_FIELDS: ['age', 'sbp', 'height', 'waist', 'fastGlu', 'cholHDL', 'cholTri'],

    /** Fields requiring unit conversion between US and SI. */
    CONVERTIBLE_FIELDS: ['height', 'waist', 'fastGlu', 'cholHDL', 'cholTri'],

    /** Treatment color palette for timeline chart and legends. */
    TREATMENT_COLORS: {
        'Fasting Glucose Management':           '#e74c3c',
        'Blood Pressure Control':              '#2ecc71',
        'HDL Cholesterol Improvement':         '#f39c12',
        'Blood Fats (Triglycerides) Treatment': '#9b59b6',
        'Weight Management':                    '#1abc9c'
    },

    /** Animation timing constants. */
    ANIMATION_DURATION: 1500,
    ANIMATION_STEPS: 30,
    ANIMATION_FLASH_MS: 1200,

    /** UI timeout constants (milliseconds). */
    BADGE_TIMEOUT_MS: 2000,
    TOOLTIP_TIMEOUT_MS: 1200,

    /** Timeline chart limits. */
    MAX_SNAPSHOTS: 20,
    MIN_Y_AXIS: 25
});
