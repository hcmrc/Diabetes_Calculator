/**
 * @fileoverview Unit tests for the RiskModel and CONFIG modules.
 *
 * Tests cover:
 *   1. Schmidt et al. (2005) model integrity (known reference values)
 *   2. Unit conversion accuracy (US → SI)
 *   3. Contribution computation correctness
 *   4. Elevated factor detection (clinical thresholds)
 *   5. What-if delta computation
 *   6. Edge cases (min/max values, zero inputs)
 *   7. Error cases (missing fields)
 *
 * Run with: node tests/test-risk-model.js
 */

'use strict';

// ─── Bootstrap: Load modules in Node.js ─────────────────────────────
// Simulate browser globals needed by our modules
global.window = global;
global.document = { getElementById: () => null };

// Load modules in dependency order
require('../js/config.js');
require('../js/risk-model.js');

const { CONFIG } = DRC;
const { toSI, computeProbability, computeContributions, getElevatedFactors, computeWhatIfDelta } = DRC.RiskModel;

// ─── Test harness ───────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function assert(condition, name) {
    if (condition) {
        passed++;
        results.push(`  ✓ ${name}`);
    } else {
        failed++;
        results.push(`  ✗ FAIL: ${name}`);
    }
}

function assertApprox(actual, expected, tolerance, name) {
    const diff = Math.abs(actual - expected);
    if (diff <= tolerance) {
        passed++;
        results.push(`  ✓ ${name} (${actual.toFixed(4)} ≈ ${expected.toFixed(4)})`);
    } else {
        failed++;
        results.push(`  ✗ FAIL: ${name} — got ${actual.toFixed(6)}, expected ${expected.toFixed(6)}, diff ${diff.toFixed(6)}`);
    }
}

// =====================================================================
// TEST SUITE 1: CONFIG Integrity
// =====================================================================
console.log('\n═══ TEST SUITE 1: CONFIG Integrity ═══');

assert(CONFIG.BETAS.sigma === -9.9808, 'Intercept sigma = -9.9808');
assert(CONFIG.BETAS.fastGlu === 1.5849, 'Beta fastGlu = 1.5849 (strongest predictor)');
assert(CONFIG.BETAS.height === -0.0326, 'Beta height = -0.0326 (protective)');
assert(CONFIG.BETAS.cholHDL === -0.4718, 'Beta cholHDL = -0.4718 (protective)');
assert(Object.keys(CONFIG.BETAS).length === 10, 'BETAS has exactly 10 entries (9 predictors + sigma)');
assert(Object.isFrozen(CONFIG), 'CONFIG is frozen (immutable)');
assert(CONFIG.ALL_FIELDS.length === 9, 'ALL_FIELDS lists 9 risk factors');
assert(CONFIG.SLIDER_FIELDS.length === 7, 'SLIDER_FIELDS lists 7 numeric sliders');
results.forEach(r => console.log(r));
results.length = 0;

// =====================================================================
// TEST SUITE 2: Unit Conversion (toSI)
// =====================================================================
console.log('\n═══ TEST SUITE 2: Unit Conversion (toSI) ═══');

const usInputs = {
    age: 54, race: 0, parentHist: 0, sbp: 120,
    height: 66, waist: 38, fastGlu: 100, cholHDL: 50, cholTri: 150
};

// When already metric, should pass through unchanged
const siPassthrough = toSI(usInputs, true);
assert(siPassthrough.fastGlu === 100, 'SI passthrough: fastGlu unchanged');
assert(siPassthrough.height === 66, 'SI passthrough: height unchanged');

// US → SI conversion
const siConverted = toSI(usInputs, false);
assertApprox(siConverted.height, 66 * 2.54, 0.01, 'Height: 66 in → 167.64 cm');
assertApprox(siConverted.waist, 38 * 2.54, 0.01, 'Waist: 38 in → 96.52 cm');
assertApprox(siConverted.fastGlu, 100 / 18, 0.01, 'Glucose: 100 mg/dL → 5.56 mmol/L');
assertApprox(siConverted.cholHDL, 50 / 38.67, 0.01, 'HDL: 50 mg/dL → 1.29 mmol/L');
assertApprox(siConverted.cholTri, 150 / 88.57, 0.01, 'Triglycerides: 150 mg/dL → 1.69 mmol/L');
assert(siConverted.age === 54, 'Age unchanged in conversion');
assert(siConverted.sbp === 120, 'SBP unchanged in conversion');
results.forEach(r => console.log(r));
results.length = 0;

// =====================================================================
// TEST SUITE 3: Model Probability (Schmidt et al. 2005)
// =====================================================================
console.log('\n═══ TEST SUITE 3: Model Probability (Schmidt et al. 2005) ═══');

// Population means → known reference risk
const popMeans = { ...CONFIG.MEANS };
const popRisk = computeProbability(popMeans) * 100;
assertApprox(popRisk, 14.58, 0.1, 'Population means → ~14.58% risk');

// Lowest possible risk (young, tall, low glucose, high HDL)
const lowRiskInputs = {
    age: 20, race: 0, parentHist: 0, sbp: 80,
    height: 213, waist: 64, fastGlu: 2.8, cholHDL: 2.6, cholTri: 0.6
};
const lowRisk = computeProbability(lowRiskInputs) * 100;
assert(lowRisk < 1, `Minimum risk profile: ${lowRisk.toFixed(4)}% < 1%`);

// Highest possible risk (old, all factors elevated)
const highRiskInputs = {
    age: 80, race: 1, parentHist: 1, sbp: 220,
    height: 122, waist: 152, fastGlu: 16.7, cholHDL: 0.5, cholTri: 5.6
};
const highRisk = computeProbability(highRiskInputs) * 100;
assert(highRisk > 99, `Maximum risk profile: ${highRisk.toFixed(4)}% > 99%`);

// Schmidt model reference: 54y, black, parent hist, elevated glucose
const schmidtRef = {
    age: 54, race: 1, parentHist: 1, sbp: 130,
    height: 168, waist: 102, fastGlu: 7.0, cholHDL: 1.0, cholTri: 2.3
};
const schmidtRisk = computeProbability(schmidtRef) * 100;
assert(schmidtRisk > 50 && schmidtRisk < 90, `High-risk Schmidt reference: ${schmidtRisk.toFixed(2)}% (expected 50-90%)`);

// Probability must be in [0, 1]
assert(computeProbability(popMeans) >= 0, 'Probability >= 0');
assert(computeProbability(popMeans) <= 1, 'Probability <= 1');

// Logistic function property: increasing glucose should increase risk
const baseRisk = computeProbability(popMeans);
const higherGlu = { ...popMeans, fastGlu: 7.0 };
assert(computeProbability(higherGlu) > baseRisk, 'Higher glucose → higher risk');

// Protective factor: higher HDL should decrease risk
const higherHDL = { ...popMeans, cholHDL: 2.0 };
assert(computeProbability(higherHDL) < baseRisk, 'Higher HDL → lower risk');

// Protective factor: greater height should decrease risk
const taller = { ...popMeans, height: 190 };
assert(computeProbability(taller) < baseRisk, 'Greater height → lower risk (negative beta)');

results.forEach(r => console.log(r));
results.length = 0;

// =====================================================================
// TEST SUITE 4: Contribution Computation
// =====================================================================
console.log('\n═══ TEST SUITE 4: Contribution Computation ═══');

// At population means, all contributions should be zero
const meanContrib = computeContributions(popMeans);
Object.entries(meanContrib).forEach(([key, val]) => {
    assertApprox(val, 0, 0.0001, `At pop. mean: contribution[${key}] = 0`);
});

// Above-mean glucose should have positive contribution
const aboveMeanGlu = { ...popMeans, fastGlu: 7.0 };
const gluContrib = computeContributions(aboveMeanGlu);
assert(gluContrib.fastGlu > 0, 'Above-mean glucose → positive contribution');
assert(gluContrib.age === 0, 'Unchanged age → zero contribution');

// Below-mean HDL should have positive contribution (risk-increasing)
const lowHDL = { ...popMeans, cholHDL: 0.8 };
const hdlContrib = computeContributions(lowHDL);
assert(hdlContrib.cholHDL > 0, 'Below-mean HDL → positive contribution (negative beta × negative deviation)');

// Contributions should sum to the log-odds deviation from mean
const testVals = { ...popMeans, age: 65, fastGlu: 7.0, sbp: 140 };
const contrib = computeContributions(testVals);
const sumContrib = Object.values(contrib).reduce((a, b) => a + b, 0);
const logOddsTest = Math.log(computeProbability(testVals) / (1 - computeProbability(testVals)));
const logOddsMean = Math.log(computeProbability(popMeans) / (1 - computeProbability(popMeans)));
assertApprox(sumContrib, logOddsTest - logOddsMean, 0.001, 'Sum of contributions = log-odds deviation from mean');

results.forEach(r => console.log(r));
results.length = 0;

// =====================================================================
// TEST SUITE 5: Elevated Factor Detection
// =====================================================================
console.log('\n═══ TEST SUITE 5: Elevated Factor Detection ═══');

// Normal values → no elevated factors
const normalSI = { ...popMeans, fastGlu: 5.0, sbp: 120, cholHDL: 1.5, cholTri: 1.5, waist: 85 };
const normalResult = getElevatedFactors(normalSI, { cholTri: 130 }, false);
assert(normalResult.elevatedFactors.length === 0, 'Normal values → 0 elevated factors');
assert(normalResult.waistIsHigh === false, 'Normal waist → not high');

// Elevated glucose
const highGluSI = { ...normalSI, fastGlu: 6.0 };
const highGluResult = getElevatedFactors(highGluSI, { cholTri: 130 }, false);
assert(highGluResult.elevatedFactors.includes('fastGlu'), 'Glucose 6.0 mmol/L → elevated');

// Elevated BP
const highBPSI = { ...normalSI, sbp: 135 };
assert(getElevatedFactors(highBPSI, { cholTri: 130 }, false).elevatedFactors.includes('sbp'), 'SBP 135 → elevated');

// Low HDL
const lowHDLSI = { ...normalSI, cholHDL: 0.9 };
assert(getElevatedFactors(lowHDLSI, { cholTri: 130 }, false).elevatedFactors.includes('cholHDL'), 'HDL 0.9 → low/elevated');

// High waist with "high" threshold
const highWaistSI = { ...normalSI, waist: 105 };
const waistResult = getElevatedFactors(highWaistSI, { cholTri: 130 }, false);
assert(waistResult.elevatedFactors.includes('waist'), 'Waist 105 cm → elevated');
assert(waistResult.waistIsHigh === true, 'Waist 105 cm > 102 → high');

// Triglycerides US check (non-metric: uses rawInputs.cholTri >= 150)
const triResult = getElevatedFactors(normalSI, { cholTri: 160 }, false);
assert(triResult.elevatedFactors.includes('cholTri'), 'TG 160 mg/dL (US) → elevated');

// Triglycerides SI check
const triSIResult = getElevatedFactors({ ...normalSI, cholTri: 1.8 }, { cholTri: 1.8 }, true);
assert(triSIResult.elevatedFactors.includes('cholTri'), 'TG 1.8 mmol/L (SI) → elevated');

results.forEach(r => console.log(r));
results.length = 0;

// =====================================================================
// TEST SUITE 6: What-If Delta
// =====================================================================
console.log('\n═══ TEST SUITE 6: What-If Delta ═══');

const whatIfInputsUS = {
    age: 50, race: 0, parentHist: 0, sbp: 120,
    height: 66, waist: 36, fastGlu: 95, cholHDL: 50, cholTri: 150
};

// Increasing glucose should increase risk
const gluDeltaUp = computeWhatIfDelta(whatIfInputsUS, false, 'fastGlu', 1);
assert(gluDeltaUp > 0, `Glucose +5 step → positive delta (${gluDeltaUp.toFixed(4)}%)`);

// Decreasing glucose should decrease risk
const gluDeltaDown = computeWhatIfDelta(whatIfInputsUS, false, 'fastGlu', -1);
assert(gluDeltaDown < 0, `Glucose -5 step → negative delta (${gluDeltaDown.toFixed(4)}%)`);

// Increasing HDL (protective) should decrease risk
const hdlDeltaUp = computeWhatIfDelta(whatIfInputsUS, false, 'cholHDL', 1);
assert(hdlDeltaUp < 0, `HDL +5 step → negative delta (protective, ${hdlDeltaUp.toFixed(4)}%)`);

// Increasing height (protective) should decrease risk
const heightDeltaUp = computeWhatIfDelta(whatIfInputsUS, false, 'height', 1);
assert(heightDeltaUp < 0, `Height +5 step → negative delta (protective, ${heightDeltaUp.toFixed(4)}%)`);

results.forEach(r => console.log(r));
results.length = 0;

// =====================================================================
// TEST SUITE 7: Edge Cases
// =====================================================================
console.log('\n═══ TEST SUITE 7: Edge Cases ═══');

// All zeros (edge case for logistic function)
const zeros = { age: 0, race: 0, parentHist: 0, sbp: 0, height: 0, waist: 0, fastGlu: 0, cholHDL: 0, cholTri: 0 };
const zeroRisk = computeProbability(zeros);
assert(zeroRisk >= 0 && zeroRisk <= 1, `All-zero inputs → valid probability: ${(zeroRisk * 100).toFixed(4)}%`);

// Very large values
const huge = { age: 999, race: 1, parentHist: 1, sbp: 999, height: 10, waist: 999, fastGlu: 999, cholHDL: 0.01, cholTri: 999 };
const hugeRisk = computeProbability(huge);
assert(hugeRisk > 0.99, `Extreme inputs → near-100% risk: ${(hugeRisk * 100).toFixed(4)}%`);
assert(isFinite(hugeRisk), 'Extreme inputs → finite result (no overflow)');

// Negative contribution total
const negContrib = computeContributions({ ...popMeans, cholHDL: 2.6, height: 213 });
const negSum = Object.values(negContrib).reduce((a, b) => a + b, 0);
assert(isFinite(negSum), 'Contribution sum is finite even with extreme protective values');

results.forEach(r => console.log(r));
results.length = 0;

// =====================================================================
// TEST SUITE 8: Treatment Simulation Effects Validation
// =====================================================================
console.log('\n═══ TEST SUITE 8: Simulation Effects Validation ═══');

// Verify all treatment effects reduce risk (directionally correct)
const simTestSI = { ...popMeans, fastGlu: 7.0, sbp: 140, cholHDL: 0.9, cholTri: 2.0, waist: 100 };
const simBaseRisk = computeProbability(simTestSI);

Object.entries(CONFIG.SIMULATION_EFFECTS).forEach(([factor, fx]) => {
    const treated = { ...simTestSI };
    treated[factor] += fx.si;
    const treatedRisk = computeProbability(treated);
    assert(treatedRisk < simBaseRisk,
        `${fx.label} (${factor}): ${(simBaseRisk*100).toFixed(1)}% → ${(treatedRisk*100).toFixed(1)}% (reduced)`);
});

// Cumulative treatment: applying all treatments should significantly reduce risk
const allTreated = { ...simTestSI };
Object.entries(CONFIG.SIMULATION_EFFECTS).forEach(([factor, fx]) => {
    allTreated[factor] += fx.si;
});
const allTreatedRisk = computeProbability(allTreated) * 100;
const reduction = (simBaseRisk * 100) - allTreatedRisk;
assert(reduction > 10, `All treatments combined: ${reduction.toFixed(1)}pp reduction (>10pp expected)`);

results.forEach(r => console.log(r));
results.length = 0;

// =====================================================================
// SUMMARY
// =====================================================================
console.log('\n═══════════════════════════════════════════');
console.log(`  TOTAL: ${passed + failed} tests — ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
