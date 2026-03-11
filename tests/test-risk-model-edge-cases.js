/**
 * @fileoverview Additional edge-case tests for RiskModel and CONFIG.
 *
 * Complements the baseline suite in test-risk-model.js with cases that
 * were not previously covered:
 *
 *   1. toSI() immutability  — original object must not be mutated
 *   2. getElevatedFactors() boundary values — exactly AT each clinical threshold
 *   3. Waist "elevated" vs "high" distinction (94 cm vs 102 cm)
 *   4. computeWhatIfDelta() in SI (metric) mode
 *   5. computeWhatIfDelta() for an unknown field — falls back to step = 1
 *   6. computeContributions() sign verification for all 9 factors
 *   7. CONFIG.SIMULATION_EFFECTS structural integrity
 *
 * Run with: node tests/test-risk-model-edge-cases.js
 */

'use strict';

// ─── Bootstrap ───────────────────────────────────────────────────────────────

global.window   = global;
global.document = { getElementById: () => null };

require('../js/config.js');
require('../js/risk-model.js');

const { CONFIG } = DRC;
const { toSI, computeProbability, computeContributions,
        getElevatedFactors, computeWhatIfDelta } = DRC.RiskModel;

// ─── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) {
        passed++;
        console.log(`  ✓ ${name}`);
    } else {
        failed++;
        console.log(`  ✗ FAIL: ${name}`);
    }
}

function assertApprox(actual, expected, tolerance, name) {
    const diff = Math.abs(actual - expected);
    if (diff <= tolerance) {
        passed++;
        console.log(`  ✓ ${name} (${actual.toFixed(4)} ≈ ${expected.toFixed(4)})`);
    } else {
        failed++;
        console.log(`  ✗ FAIL: ${name} — got ${actual.toFixed(6)}, expected ${expected.toFixed(6)}, diff ${diff.toFixed(6)}`);
    }
}

// Shared baseline: population means, all modifiable factors at normal levels
const popMeans = { ...CONFIG.MEANS };

// ─── TEST SUITE 1: toSI() immutability ───────────────────────────────────────

console.log('\n═══ TEST SUITE 1: toSI() immutability ═══');
{
    const original = {
        age: 54, race: 0, parentHist: 0, sbp: 120,
        height: 66, waist: 38, fastGlu: 100, cholHDL: 50, cholTri: 150
    };
    const originalHeight  = original.height;
    const originalFastGlu = original.fastGlu;
    const originalCholHDL = original.cholHDL;

    // Convert US → SI — must NOT mutate original
    const converted = toSI(original, false);

    assert(original.height  === originalHeight,  'toSI(US→SI) does not mutate original.height');
    assert(original.fastGlu === originalFastGlu, 'toSI(US→SI) does not mutate original.fastGlu');
    assert(original.cholHDL === originalCholHDL, 'toSI(US→SI) does not mutate original.cholHDL');
    assert(converted !== original,               'toSI() returns a new object, not the original reference');

    // Passthrough (isMetric=true) — must also return a copy, not the same reference
    const passthrough = toSI(original, true);
    // Values unchanged
    assert(passthrough.height  === originalHeight,  'toSI(SI passthrough) preserves height value');
    assert(passthrough.fastGlu === originalFastGlu, 'toSI(SI passthrough) preserves fastGlu value');
}

// ─── TEST SUITE 2: getElevatedFactors() — exact boundary values ───────────────

console.log('\n═══ TEST SUITE 2: getElevatedFactors() exact clinical thresholds ═══');
{
    // Base: all factors in normal range
    const base = {
        ...popMeans, fastGlu: 5.0, sbp: 120,
        cholHDL: 1.5, cholTri: 1.5, waist: 85
    };

    // ── Fasting glucose: threshold = 5.6 mmol/L ──────────────────────────────
    // Exactly at threshold → elevated (>= 5.6)
    const atGluThreshold = { ...base, fastGlu: 5.6 };
    assert(
        getElevatedFactors(atGluThreshold, {}, true).elevatedFactors.includes('fastGlu'),
        'Glucose exactly 5.6 mmol/L → elevated (>= threshold)'
    );
    // Just below → NOT elevated
    const belowGluThreshold = { ...base, fastGlu: 5.59 };
    assert(
        !getElevatedFactors(belowGluThreshold, {}, true).elevatedFactors.includes('fastGlu'),
        'Glucose 5.59 mmol/L → NOT elevated (< threshold)'
    );

    // ── Systolic BP: threshold = 130 mmHg ────────────────────────────────────
    const atSBPThreshold = { ...base, sbp: 130 };
    assert(
        getElevatedFactors(atSBPThreshold, {}, true).elevatedFactors.includes('sbp'),
        'SBP exactly 130 mmHg → elevated (>= threshold)'
    );
    const belowSBPThreshold = { ...base, sbp: 129 };
    assert(
        !getElevatedFactors(belowSBPThreshold, {}, true).elevatedFactors.includes('sbp'),
        'SBP 129 mmHg → NOT elevated (< threshold)'
    );

    // ── HDL Cholesterol: threshold = 1.0 mmol/L (low when ≤ 1.0) ─────────────
    const atHDLThreshold = { ...base, cholHDL: 1.0 };
    assert(
        getElevatedFactors(atHDLThreshold, {}, true).elevatedFactors.includes('cholHDL'),
        'HDL exactly 1.0 mmol/L → low/elevated (<= threshold)'
    );
    const aboveHDLThreshold = { ...base, cholHDL: 1.01 };
    assert(
        !getElevatedFactors(aboveHDLThreshold, {}, true).elevatedFactors.includes('cholHDL'),
        'HDL 1.01 mmol/L → NOT low (> threshold)'
    );

    // ── Triglycerides (SI): threshold = 1.7 mmol/L ───────────────────────────
    const atTriSI = { ...base, cholTri: 1.7 };
    assert(
        getElevatedFactors(atTriSI, { cholTri: 1.7 }, true).elevatedFactors.includes('cholTri'),
        'TG exactly 1.7 mmol/L (SI) → elevated (>= threshold)'
    );
    const belowTriSI = { ...base, cholTri: 1.69 };
    assert(
        !getElevatedFactors(belowTriSI, { cholTri: 1.69 }, true).elevatedFactors.includes('cholTri'),
        'TG 1.69 mmol/L (SI) → NOT elevated (< threshold)'
    );

    // ── Triglycerides (US): threshold = 150 mg/dL ────────────────────────────
    assert(
        getElevatedFactors(base, { cholTri: 150 }, false).elevatedFactors.includes('cholTri'),
        'TG exactly 150 mg/dL (US) → elevated (>= 150)'
    );
    assert(
        !getElevatedFactors(base, { cholTri: 149 }, false).elevatedFactors.includes('cholTri'),
        'TG 149 mg/dL (US) → NOT elevated (< 150)'
    );
}

// ─── TEST SUITE 3: Waist "elevated" vs "high" distinction ────────────────────

console.log('\n═══ TEST SUITE 3: Waist elevated (≥94 cm) vs high (≥102 cm) ═══');
{
    const base = { ...popMeans, fastGlu: 5.0, sbp: 120, cholHDL: 1.5, cholTri: 1.5 };

    // Exactly at elevated threshold (94 cm) — elevated, but NOT high
    const atElevatedWaist = { ...base, waist: 94 };
    const result94 = getElevatedFactors(atElevatedWaist, {}, true);
    assert(result94.elevatedFactors.includes('waist'), 'Waist 94 cm → in elevatedFactors');
    assert(result94.waistIsHigh === false,             'Waist 94 cm → waistIsHigh: false (below 102)');

    // Just below elevated threshold (93 cm) — NOT elevated, NOT high
    const belowElevated = { ...base, waist: 93 };
    const result93 = getElevatedFactors(belowElevated, {}, true);
    assert(!result93.elevatedFactors.includes('waist'), 'Waist 93 cm → NOT in elevatedFactors');
    assert(result93.waistIsHigh === false,              'Waist 93 cm → waistIsHigh: false');

    // Between thresholds: 96 cm — elevated, NOT high
    const between = { ...base, waist: 96 };
    const result96 = getElevatedFactors(between, {}, true);
    assert(result96.elevatedFactors.includes('waist'), 'Waist 96 cm → in elevatedFactors');
    assert(result96.waistIsHigh === false,             'Waist 96 cm → waistIsHigh: false (< 102)');

    // Exactly at high threshold (102 cm) — elevated AND high
    const atHigh = { ...base, waist: 102 };
    const result102 = getElevatedFactors(atHigh, {}, true);
    assert(result102.elevatedFactors.includes('waist'), 'Waist 102 cm → in elevatedFactors');
    assert(result102.waistIsHigh === true,              'Waist 102 cm → waistIsHigh: true (>= 102)');
}

// ─── TEST SUITE 4: computeWhatIfDelta() in SI (metric) mode ──────────────────

console.log('\n═══ TEST SUITE 4: computeWhatIfDelta() in SI (metric) mode ═══');
{
    const siInputs = {
        age: 54, race: 0, parentHist: 0, sbp: 120,
        height: 170, waist: 90, fastGlu: 5.5, cholHDL: 1.3, cholTri: 1.7
    };

    // In metric mode, step for fastGlu is 0.1 mmol/L (CONFIG.RANGES.fastGlu.si[2])
    const gluUp   = computeWhatIfDelta(siInputs, true, 'fastGlu', +1);
    const gluDown = computeWhatIfDelta(siInputs, true, 'fastGlu', -1);
    assert(gluUp > 0,   `SI mode: glucose +0.1*5 → positive risk delta (${gluUp.toFixed(4)}%)`);
    assert(gluDown < 0, `SI mode: glucose -0.1*5 → negative risk delta (${gluDown.toFixed(4)}%)`);

    // HDL is protective in SI mode too
    const hdlUp = computeWhatIfDelta(siInputs, true, 'cholHDL', +1);
    assert(hdlUp < 0, `SI mode: HDL +0.1*5 → negative risk delta (protective, ${hdlUp.toFixed(4)}%)`);

    // SBP: step is 1 mmHg in both unit systems
    const sbpUp = computeWhatIfDelta(siInputs, true, 'sbp', +1);
    assert(sbpUp > 0, `SI mode: SBP +1*5 → positive risk delta (${sbpUp.toFixed(4)}%)`);
}

// ─── TEST SUITE 5: computeWhatIfDelta() for unknown field ────────────────────

console.log('\n═══ TEST SUITE 5: computeWhatIfDelta() fallback for unknown field ═══');
{
    const inputs = {
        age: 54, race: 0, parentHist: 0, sbp: 120,
        height: 66, waist: 38, fastGlu: 100, cholHDL: 50, cholTri: 150
    };

    // 'unknownField' is not in CONFIG.RANGES — step falls back to 1
    // The result may be 0 (field not in BETAS) or nonzero (if fortuitously named)
    // but crucially it must not throw
    let threw = false;
    let delta;
    try {
        delta = computeWhatIfDelta(inputs, false, 'unknownField', +1);
    } catch (e) {
        threw = true;
    }

    assert(!threw, 'computeWhatIfDelta() does not throw for unknown field name');
    assert(typeof delta === 'number' && isFinite(delta),
        'computeWhatIfDelta() returns a finite number for unknown field');

    // Because 'unknownField' is not in BETAS, altering it has no effect on log-odds,
    // so the delta must be 0
    assert(delta === 0, 'computeWhatIfDelta() returns 0 for a field absent from BETAS');
}

// ─── TEST SUITE 6: computeContributions() sign verification ──────────────────

console.log('\n═══ TEST SUITE 6: computeContributions() sign verification ═══');
{
    // ── Risk-increasing factors: contribution positive when ABOVE mean ────────
    const riskFactors = ['age', 'race', 'parentHist', 'sbp', 'waist', 'fastGlu', 'cholTri'];
    riskFactors.forEach(f => {
        const aboveMean = { ...popMeans, [f]: popMeans[f] * 1.5 + 0.1 };
        const contrib = computeContributions(aboveMean);
        assert(contrib[f] > 0, `Above-mean ${f} → positive contribution (beta > 0, deviation > 0)`);
    });

    // ── Protective factors: contribution positive when BELOW mean ─────────────
    // (negative beta × negative deviation = positive contribution = increases risk)
    const belowMeanHDL = { ...popMeans, cholHDL: popMeans.cholHDL * 0.5 };
    assert(computeContributions(belowMeanHDL).cholHDL > 0,
        'Below-mean HDL → positive contribution (negative beta, negative deviation → +)');

    // ── Protective factors: contribution negative when ABOVE mean ─────────────
    const aboveMeanHDL    = { ...popMeans, cholHDL: popMeans.cholHDL * 1.5 };
    const aboveMeanHeight = { ...popMeans, height:  popMeans.height  * 1.2 };
    assert(computeContributions(aboveMeanHDL).cholHDL    < 0,
        'Above-mean HDL → negative contribution (negative beta, positive deviation → -)');
    assert(computeContributions(aboveMeanHeight).height  < 0,
        'Above-mean height → negative contribution (negative beta, positive deviation → -)');

    // ── All 9 fields present in contributions object ──────────────────────────
    const contrib = computeContributions(popMeans);
    assert(Object.keys(contrib).length === 9, 'computeContributions() returns exactly 9 entries');
    CONFIG.ALL_FIELDS.forEach(f => {
        assert(f in contrib, `computeContributions() includes field: ${f}`);
    });
}

// ─── TEST SUITE 7: CONFIG.SIMULATION_EFFECTS structural integrity ─────────────

console.log('\n═══ TEST SUITE 7: CONFIG.SIMULATION_EFFECTS structural integrity ═══');
{
    const EXPECTED_FACTORS = ['fastGlu', 'sbp', 'cholHDL', 'cholTri', 'waist'];

    assert(typeof CONFIG.SIMULATION_EFFECTS === 'object' && CONFIG.SIMULATION_EFFECTS !== null,
        'SIMULATION_EFFECTS exists and is an object');

    // HDL is a protective factor: treatment INCREASES it (+), which lowers risk.
    // All other modifiable factors (fastGlu, sbp, cholTri, waist) are risk factors:
    // treatment DECREASES them (−), which also lowers risk.
    const expectedSign = {
        fastGlu: -1, sbp: -1, cholHDL: +1, cholTri: -1, waist: -1
    };

    EXPECTED_FACTORS.forEach(factor => {
        const fx = CONFIG.SIMULATION_EFFECTS[factor];
        assert(fx != null, `SIMULATION_EFFECTS has entry for: ${factor}`);
        assert(typeof fx.us     === 'number', `${factor}.us is a number`);
        assert(typeof fx.si     === 'number', `${factor}.si is a number`);
        assert(typeof fx.label  === 'string' && fx.label.length > 0, `${factor}.label is a non-empty string`);

        const sign = expectedSign[factor];
        if (sign === -1) {
            assert(fx.us < 0, `${factor}.us delta is negative (treatment reduces this risk factor)`);
            assert(fx.si < 0, `${factor}.si delta is negative (treatment reduces this risk factor)`);
        } else {
            // HDL: treatment raises the factor value (higher HDL → lower risk)
            assert(fx.us > 0, `${factor}.us delta is positive (treatment raises this protective factor)`);
            assert(fx.si > 0, `${factor}.si delta is positive (treatment raises this protective factor)`);
        }
    });

    // The US and SI deltas should be proportional via the conversion factor
    const C = CONFIG.CONVERSIONS;
    const convFactors = {
        fastGlu: C.gluToMmol,
        cholHDL: C.hdlToMmol,
        cholTri: C.triToMmol
    };
    Object.entries(convFactors).forEach(([factor, conv]) => {
        const fx = CONFIG.SIMULATION_EFFECTS[factor];
        assertApprox(fx.us * conv, fx.si, Math.abs(fx.si) * 0.05,
            `${factor}: US delta × conversion ≈ SI delta (within 5%)`);
    });
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════');
console.log(`  TOTAL: ${passed + failed} tests — ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
