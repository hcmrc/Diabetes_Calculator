/**
 * @fileoverview Unit tests for the RadarChart module.
 *
 * RadarChart exposes three things: init(), render(), and AXES.
 * Of these, AXES and the normalisation/coordinate logic inside render()
 * are testable in Node.js with a minimal SVG DOM mock.  Tests cover:
 *
 *   1. AXES structure        — correct count and field names
 *   2. render() resilience   — safe no-op when elements are missing
 *   3. Polygon coordinates   — render() writes a non-empty points string
 *   4. Dot positioning       — cx/cy attributes are set for all 6 axes
 *   5. Elevated dots         — classList.toggle('elevated', true/false)
 *   6. normalizeAxis (indirect) — population-mean inputs map each axis
 *                                 to the expected radius fraction
 *   7. HDL axis inversion    — higher HDL value produces a smaller radius
 *                              (closer to centre = lower risk on that axis)
 *
 * Run with: node tests/test-radar-chart.js
 */

'use strict';

// ─── Bootstrap ───────────────────────────────────────────────────────────────

global.window = global;
global.DRC    = {};

require('../js/config.js');
require('../js/ui-helpers.js');

// ─── DOM mock ─────────────────────────────────────────────────────────────────

const AXES = ['fastGlu', 'sbp', 'cholTri', 'waist', 'cholHDL', 'age'];
const RADIUS = 115;

// Capture setAttribute calls on the patient polygon
let capturedPolyPoints = '';
const patientPolyEl = {
    setAttribute: (k, v) => { if (k === 'points') capturedPolyPoints = v; }
};

// Capture setAttribute calls on each radar dot
const dotCapture = {};
AXES.forEach(f => {
    dotCapture[f] = { cx: null, cy: null, elevated: null };
});

const makeDotEl = (field) => ({
    setAttribute: (k, v) => {
        if (k === 'cx') dotCapture[field].cx = parseFloat(v);
        if (k === 'cy') dotCapture[field].cy = parseFloat(v);
    },
    classList: {
        toggle: (cls, val) => {
            if (cls === 'elevated') dotCapture[field].elevated = val;
        }
    }
});

const svgEl = {
    innerHTML: '',
    appendChild: () => {}
};

global.document = {
    getElementById: (id) => {
        if (id === 'radar-svg')          return svgEl;
        if (id === 'radar-patient-poly') return patientPolyEl;
        const m = id.match(/^radar-dot-(.+)$/);
        if (m) return makeDotEl(m[1]);
        return null;
    },
    createElementNS: (_ns, _tag) => ({
        setAttribute:  () => {},
        textContent:   '',
        appendChild:   () => {}
    })
};

require('../js/radar-chart.js');
const RC = DRC.RadarChart;

// ─── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) { passed++; console.log(`  ✓ ${name}`); }
    else           { failed++; console.log(`  ✗ FAIL: ${name}`); }
}

function assertApprox(actual, expected, tol, name) {
    if (Math.abs(actual - expected) <= tol) {
        passed++; console.log(`  ✓ ${name} (${actual.toFixed(3)} ≈ ${expected.toFixed(3)})`);
    } else {
        failed++; console.log(`  ✗ FAIL: ${name} — got ${actual.toFixed(4)}, expected ${expected.toFixed(4)}`);
    }
}

// ─── Shared fixture ───────────────────────────────────────────────────────────

// Population-mean SI values
const popMeans = { ...DRC.CONFIG.MEANS };

// ─── TEST SUITE 1: AXES structure ────────────────────────────────────────────

console.log('\n═══ TEST SUITE 1: AXES structure ═══');

assert(Array.isArray(RC.AXES),          'AXES is an array');
assert(RC.AXES.length === 6,            'AXES has exactly 6 entries');
assert(RC.AXES.includes('fastGlu'),     'AXES includes fastGlu');
assert(RC.AXES.includes('sbp'),         'AXES includes sbp');
assert(RC.AXES.includes('cholTri'),     'AXES includes cholTri');
assert(RC.AXES.includes('waist'),       'AXES includes waist');
assert(RC.AXES.includes('cholHDL'),     'AXES includes cholHDL');
assert(RC.AXES.includes('age'),         'AXES includes age');

// All AXES entries must have a corresponding entry in CONFIG.RANGES (needed for normalisation)
RC.AXES.forEach(f => {
    assert(DRC.CONFIG.RANGES[f] != null, `CONFIG.RANGES has an entry for AXES field: ${f}`);
    assert(DRC.CONFIG.RANGES[f].si != null, `CONFIG.RANGES.${f} has SI range`);
});

// ─── TEST SUITE 2: render() resilience ───────────────────────────────────────

console.log('\n═══ TEST SUITE 2: render() resilience ═══');

// When radar-patient-poly is not in the DOM, render() should return without throwing
const savedGetById = global.document.getElementById;
global.document.getElementById = () => null;

let threw = false;
try { RC.render(popMeans, []); } catch (e) { threw = true; }
assert(!threw, 'render() does not throw when DOM elements are missing');

global.document.getElementById = savedGetById;  // restore

// render() with empty elevatedFactors array — safe
threw = false;
try { RC.render(popMeans, []); } catch (e) { threw = true; }
assert(!threw, 'render() with empty elevatedFactors array does not throw');

// render() with undefined elevatedFactors (default parameter) — safe
threw = false;
try { RC.render(popMeans); } catch (e) { threw = true; }
assert(!threw, 'render() with no elevatedFactors argument does not throw');

// ─── TEST SUITE 3: Polygon coordinates ───────────────────────────────────────

console.log('\n═══ TEST SUITE 3: Polygon coordinates ═══');

capturedPolyPoints = '';
RC.render(popMeans, []);

assert(capturedPolyPoints.length > 0, 'render() writes a non-empty points string to patient polygon');

// Points string should contain exactly 6 "x,y" pairs
const pointPairs = capturedPolyPoints.trim().split(' ').filter(p => p.includes(','));
assert(pointPairs.length === 6, `Polygon has exactly 6 coordinate pairs (got ${pointPairs.length})`);

// Each pair should parse to finite numbers
const allValid = pointPairs.every(pair => {
    const [x, y] = pair.split(',').map(Number);
    return isFinite(x) && isFinite(y);
});
assert(allValid, 'All polygon coordinate pairs are valid finite numbers');

// For population-mean inputs, each normalised radius is between 0 and RADIUS
// Therefore all x/y coordinates must be in a reasonable range around the centre (150)
const allInRange = pointPairs.every(pair => {
    const [x, y] = pair.split(',').map(Number);
    return x >= 0 && x <= 300 && y >= 0 && y <= 300;
});
assert(allInRange, 'All polygon coordinates are within the SVG viewport (0–300)');

// ─── TEST SUITE 4: Dot positioning ───────────────────────────────────────────

console.log('\n═══ TEST SUITE 4: Dot positioning (cx/cy attributes) ═══');

// Reset capture state
AXES.forEach(f => { dotCapture[f] = { cx: null, cy: null, elevated: null }; });
RC.render(popMeans, []);

AXES.forEach(f => {
    assert(dotCapture[f].cx !== null, `radar-dot-${f}: cx attribute was set`);
    assert(dotCapture[f].cy !== null, `radar-dot-${f}: cy attribute was set`);
    assert(isFinite(dotCapture[f].cx), `radar-dot-${f}: cx is a finite number`);
    assert(isFinite(dotCapture[f].cy), `radar-dot-${f}: cy is a finite number`);
});

// ─── TEST SUITE 5: Elevated-dot class toggling ────────────────────────────────

console.log('\n═══ TEST SUITE 5: Elevated-dot class toggling ═══');

AXES.forEach(f => { dotCapture[f] = { cx: null, cy: null, elevated: null }; });
RC.render(popMeans, ['fastGlu', 'sbp']);

assert(dotCapture['fastGlu'].elevated === true,  'fastGlu dot toggled to elevated=true');
assert(dotCapture['sbp'].elevated     === true,  'sbp dot toggled to elevated=true');
assert(dotCapture['waist'].elevated   === false, 'waist dot toggled to elevated=false');
assert(dotCapture['cholHDL'].elevated === false, 'cholHDL dot toggled to elevated=false');

// All factors elevated
AXES.forEach(f => { dotCapture[f] = { cx: null, cy: null, elevated: null }; });
RC.render(popMeans, [...AXES]);
AXES.forEach(f => {
    assert(dotCapture[f].elevated === true, `All AXES elevated: ${f}.elevated = true`);
});

// No factors elevated
AXES.forEach(f => { dotCapture[f] = { cx: null, cy: null, elevated: null }; });
RC.render(popMeans, []);
AXES.forEach(f => {
    assert(dotCapture[f].elevated === false, `No factors elevated: ${f}.elevated = false`);
});

// ─── TEST SUITE 6: normalizeAxis (indirect via dot/polygon coordinates) ────────

console.log('\n═══ TEST SUITE 6: normalizeAxis — population means map to radius 0–115 ═══');

// For each axis, the population mean should produce a normalised ratio [0,1].
// We verify this indirectly: the resulting dot coordinates must be within the
// bounding box defined by centre ± RADIUS (i.e., [150-115, 150+115] = [35, 265]).
AXES.forEach(f => { dotCapture[f] = { cx: null, cy: null, elevated: null }; });
RC.render(popMeans, []);

AXES.forEach(f => {
    const cx = dotCapture[f].cx;
    const cy = dotCapture[f].cy;
    assert(cx >= 35 && cx <= 265, `${f} dot cx (${cx?.toFixed(1)}) within bounding box [35, 265]`);
    assert(cy >= 35 && cy <= 265, `${f} dot cy (${cy?.toFixed(1)}) within bounding box [35, 265]`);
});

// Minimum possible value (SI range min) → normalised ratio = 0 → dot at centre
const minInputs = {};
AXES.forEach(f => { minInputs[f] = DRC.CONFIG.RANGES[f].si[0]; });

AXES.forEach(f => { dotCapture[f] = { cx: null, cy: null, elevated: null }; });
RC.render(minInputs, []);

// For fields without inversion, min → ratio=0 → dot at centre (150, 150).
// For cholHDL (inverted): min → ratio = 1 - 0 = 1 → dot at full RADIUS from centre.
['fastGlu', 'sbp', 'cholTri', 'waist', 'age'].forEach(f => {
    assertApprox(dotCapture[f].cx, 150, 1,
        `${f} at SI min → cx ≈ 150 (centre, ratio=0, radius=0)`);
    assertApprox(dotCapture[f].cy, 150, 1,
        `${f} at SI min → cy ≈ 150 (centre, ratio=0, radius=0)`);
});

// ─── TEST SUITE 7: HDL axis inversion ─────────────────────────────────────────

console.log('\n═══ TEST SUITE 7: HDL axis inversion (higher HDL → smaller displayed radius) ═══');

const CFG = DRC.CONFIG;
const [hdlMin, hdlMax] = CFG.RANGES.cholHDL.si;

// Low HDL (min of range) → inverted ratio = 1 → maximum radius from centre
const lowHDL  = { ...popMeans, cholHDL: hdlMin };
// High HDL (max of range) → inverted ratio = 0 → dot at centre
const highHDL = { ...popMeans, cholHDL: hdlMax };

AXES.forEach(f => { dotCapture[f] = { cx: null, cy: null, elevated: null }; });
RC.render(lowHDL, []);
const lowHDLcx  = dotCapture['cholHDL'].cx;
const lowHDLcy  = dotCapture['cholHDL'].cy;

AXES.forEach(f => { dotCapture[f] = { cx: null, cy: null, elevated: null }; });
RC.render(highHDL, []);
const highHDLcx = dotCapture['cholHDL'].cx;
const highHDLcy = dotCapture['cholHDL'].cy;

// Low HDL should be far from centre; high HDL should be near centre
const distLow  = Math.hypot(lowHDLcx  - 150, lowHDLcy  - 150);
const distHigh = Math.hypot(highHDLcx - 150, highHDLcy - 150);
assert(distLow > distHigh,
    `HDL inversion: low HDL (dist=${distLow.toFixed(1)}) is further from centre than high HDL (dist=${distHigh.toFixed(1)})`);
assertApprox(distHigh, 0, 2, 'High HDL (max of range) → dot ≈ at centre (inverted ratio = 0)');
assertApprox(distLow, RADIUS, 2, 'Low HDL (min of range) → dot ≈ at full RADIUS from centre');

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n  TOTAL: ${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
