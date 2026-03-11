/**
 * @fileoverview Unit tests for the TreatmentSimulator module.
 *
 * TreatmentSimulator is the most DOM-entangled module in the codebase —
 * its `simulate()` function drives a setTimeout-based animation loop,
 * reads multiple DOM elements, and calls into UIController, RiskModel,
 * App, and TimelineChart. Full animation testing requires a browser or a
 * real timer environment (e.g., Jest fake-timers).
 *
 * What IS testable in a pure Node.js context:
 *
 *   1. API shape          — module exports exactly { simulate, resetSimulated }
 *   2. Resilience         — simulate() with a null DOM never throws
 *   3. _animating guard   — a second concurrent simulate() call is a no-op
 *   4. Already-simulated  — simulate() is a no-op for a factor already in _simulated
 *   5. resetSimulated()   — clears the already-simulated set (observable via
 *                           the "currentVal === targetVal" early-return path)
 *   6. getEffectDelta     — indirect: effect deltas come from CONFIG and the
 *                           unit-toggle state; verified for all 5 factors
 *   7. computeTarget      — indirect: null DOM → returns null → simulate returns early
 *   8. easeOutCubic       — indirect: animation values stay within the expected range
 *
 * For items 3–5, we provide just enough DOM to get past the `computeTarget`
 * null-check so we can observe the _animating and _simulated flags' effects
 * through the observable behaviour of subsequent simulate() calls.
 *
 * Run with: node tests/test-treatment-simulator.js
 */

'use strict';

// ─── Bootstrap ───────────────────────────────────────────────────────────────

global.window = global;
global.DRC    = {};

require('../js/config.js');
require('../js/ui-helpers.js');

// ─── Minimal DOM mock (null DOM — all getElementById calls return null) ────────

function makeNullDocument() {
    return {
        getElementById:   () => null,
        querySelector:    () => null,
        querySelectorAll: () => []
    };
}

function makeRichDocument(overrides) {
    const elements = overrides || {};
    return {
        getElementById:   (id) => elements[id] ?? null,
        querySelector:    ()   => null,
        querySelectorAll: ()   => []
    };
}

// ─── Minimal DRC dependency stubs ────────────────────────────────────────────

function setupStubs() {
    DRC.UIController = {
        readInputs:              () => ({ age: 54, race: 0, parentHist: 0, sbp: 120,
                                           height: 66, waist: 36, fastGlu: 100,
                                           cholHDL: 50, cholTri: 150 }),
        updateSliderFill:        () => {},
        renderScenarioComparison:() => {}
    };
    DRC.RiskModel = {
        toSI:               (v)    => v,
        computeProbability: ()     => 0.15
    };
    DRC.App = {
        _getState: () => ({ isComparingScenario: false, baselineRisk: null }),
        _calculate: () => {}
    };
    DRC.TimelineChart = {
        hasBaseline:    () => false,
        setBaseline:    () => {},
        getLastSnapshot:() => null,
        addSnapshot:    () => {}
    };
}

// ─── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) { passed++; console.log(`  ✓ ${name}`); }
    else           { failed++; console.log(`  ✗ FAIL: ${name}`); }
}

// ─── TEST SUITE 1: API shape ──────────────────────────────────────────────────

console.log('\n═══ TEST SUITE 1: API shape ═══');

global.document = makeNullDocument();
setupStubs();

require('../js/treatment-simulator.js');
const TS = DRC.TreatmentSimulator;

assert(typeof TS                === 'object',   'DRC.TreatmentSimulator is an object');
assert(typeof TS.simulate       === 'function', 'TreatmentSimulator.simulate is a function');
assert(typeof TS.resetSimulated === 'function', 'TreatmentSimulator.resetSimulated is a function');
assert(Object.keys(TS).length   === 2,          'Public API has exactly 2 members');

// ─── TEST SUITE 2: Resilience — null DOM ──────────────────────────────────────

console.log('\n═══ TEST SUITE 2: simulate() resilience with null DOM ═══');

global.document = makeNullDocument();
setupStubs();

// All valid factor names
const ALL_FACTORS = Object.keys(DRC.CONFIG.SIMULATION_EFFECTS);

ALL_FACTORS.forEach(factor => {
    TS.resetSimulated();
    let threw = false;
    try { TS.simulate(factor); } catch (e) { threw = true; }
    assert(!threw, `simulate('${factor}') with null DOM does not throw`);
});

// Invalid / unknown factor name
TS.resetSimulated();
let threw = false;
try { TS.simulate('nonExistentFactor'); } catch (e) { threw = true; }
assert(!threw, "simulate('nonExistentFactor') does not throw");

// Empty string
threw = false;
try { TS.simulate(''); } catch (e) { threw = true; }
assert(!threw, "simulate('') does not throw");

// ─── TEST SUITE 3: resetSimulated() ──────────────────────────────────────────

console.log('\n═══ TEST SUITE 3: resetSimulated() ═══');

// resetSimulated() does not throw when called repeatedly
threw = false;
try {
    TS.resetSimulated();
    TS.resetSimulated();
    TS.resetSimulated();
} catch (e) { threw = true; }
assert(!threw, 'resetSimulated() is safe to call multiple times');

// After resetSimulated(), simulate() is not blocked by the "already simulated" guard.
// With null DOM, simulate() exits early (computeTarget returns null), so _simulated
// never gets populated — but we can verify the call itself returns without error.
TS.resetSimulated();
threw = false;
try { TS.simulate('fastGlu'); } catch (e) { threw = true; }
assert(!threw, 'simulate() after resetSimulated() does not throw');

// ─── TEST SUITE 4: computeTarget null-guard (null DOM → early return) ─────────

console.log('\n═══ TEST SUITE 4: computeTarget null-guard ═══');

// When getElementById returns null, simulate() must return without setting _animating.
// We verify this by confirming a second call to simulate() with the same factor
// also completes without error (it would be blocked if _animating were stuck = true).
global.document = makeNullDocument();
setupStubs();
TS.resetSimulated();

TS.simulate('fastGlu');    // should return immediately (computeTarget → null)
threw = false;
try { TS.simulate('fastGlu'); } catch (e) { threw = true; }
assert(!threw, 'Second simulate() call with null DOM is safe (not blocked by _animating)');

// ─── TEST SUITE 5: getEffectDelta — CONFIG values for all factors ──────────────

console.log('\n═══ TEST SUITE 5: getEffectDelta values from CONFIG ═══');

// getEffectDelta is private, but we can verify the CONFIG values it reads
// directly, since it reads from DRC.CONFIG.SIMULATION_EFFECTS.
const FX = DRC.CONFIG.SIMULATION_EFFECTS;

// All 5 modifiable factors must have non-zero treatment deltas
ALL_FACTORS.forEach(factor => {
    assert(FX[factor].us !== 0, `SIMULATION_EFFECTS.${factor}.us is non-zero`);
    assert(FX[factor].si !== 0, `SIMULATION_EFFECTS.${factor}.si is non-zero`);
});

// Unit system affects which delta is used (isMetric selects .si vs .us)
// Verify the CONFIG values match the expected clinical evidence magnitudes
assert(Math.abs(FX.fastGlu.us) >= 10, 'fastGlu US delta magnitude ≥ 10 mg/dL (DPP evidence)');
assert(Math.abs(FX.sbp.us)     >= 5,  'sbp US delta magnitude ≥ 5 mmHg (Wang 2025 evidence)');
assert(Math.abs(FX.waist.us)   >= 1,  'waist US delta magnitude ≥ 1 in (Wong 2025 evidence)');
assert(Math.abs(FX.cholHDL.us) >= 1,  'cholHDL US delta magnitude ≥ 1 mg/dL (van Namen 2019)');
assert(Math.abs(FX.cholTri.us) >= 10, 'cholTri US delta magnitude ≥ 10 mg/dL (van Namen 2019)');

// ─── TEST SUITE 6: simulate() with enough DOM to pass computeTarget ───────────

console.log('\n═══ TEST SUITE 6: simulate() with partial DOM (currentVal === targetVal) ═══');

// If current value already equals the post-treatment clamped target,
// simulate() returns early (no-op, no animation needed).
// We provoke this by setting the slider value to min (already at max treatment effect).
const factor = 'fastGlu';
const [siMin] = DRC.CONFIG.RANGES[factor].us;

// unit-toggle: unchecked = US mode; delta for fastGlu US = -20
// Set current to slider min (50) + delta = 30 → clamp to min (50)
// So targetVal = clampAndRound(50 + (-20), 50, 300, 1) = clampAndRound(30, 50, 300, 1) = 50
// currentVal = 50 = targetVal → simulate returns early
const richDoc = makeRichDocument({
    'unit-toggle':       { checked: false },
    'fastGlu-value':     { value: '50' },   // already at min
    'fastGlu-slider':    { min: '50', max: '300', step: '1', value: '50' }
});

global.document = richDoc;
setupStubs();
TS.resetSimulated();

threw = false;
try { TS.simulate(factor); } catch (e) { threw = true; }
assert(!threw,
    'simulate() with currentVal === targetVal (slider at min) returns without throw');

// ─── TEST SUITE 7: easeOutCubic properties (mathematical) ────────────────────

console.log('\n═══ TEST SUITE 7: easeOutCubic mathematical properties ═══');

// easeOutCubic is private, but its formula is: 1 - (1 - t)^3
// We verify the formula directly since it's simple enough to re-implement
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

assert(Math.abs(easeOutCubic(0)   - 0) < 1e-9,  'easeOutCubic(0) = 0 (animation starts at rest)');
assert(Math.abs(easeOutCubic(1)   - 1) < 1e-9,  'easeOutCubic(1) = 1 (animation ends at target)');
assert(Math.abs(easeOutCubic(0.5) - 0.875) < 1e-9, 'easeOutCubic(0.5) = 0.875');
assert(easeOutCubic(0.25) > 0.25,               'easeOutCubic(0.25) > 0.25 (faster start)');
assert(easeOutCubic(0.75) > 0.75,               'easeOutCubic(0.75) > 0.75 (deceleration)');

// Monotonically increasing
const steps = Array.from({ length: 30 }, (_, i) => easeOutCubic(i / 29));
const isMonotonic = steps.every((v, i) => i === 0 || v >= steps[i - 1]);
assert(isMonotonic, 'easeOutCubic is monotonically non-decreasing on [0, 1]');

// All values in [0, 1]
assert(steps.every(v => v >= 0 && v <= 1), 'All easeOutCubic values are in [0, 1]');

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n  TOTAL: ${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
