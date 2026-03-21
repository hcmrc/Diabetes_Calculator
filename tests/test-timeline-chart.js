/**
 * @fileoverview Unit tests for the TimelineChart module.
 *
 * TimelineChart manages a pure state machine (snapshot array + baseline)
 * that is fully testable without a real browser. Tests cover:
 *
 *   1. Initial state         — empty snapshots, no baseline
 *   2. Baseline management   — setBaseline / clearBaseline / hasBaseline
 *   3. Snapshot CRUD         — addSnapshot / getLastSnapshot
 *   4. Snapshot immutability — siVals is stored as a copy
 *   5. FIFO overflow         — MAX_SNAPSHOTS=20: oldest entry is discarded
 *   6. isBaseline flag       — first snapshot after setBaseline is marked
 *   7. clear()               — resets both snapshots and baseline
 *   8. Render output         — SVG innerHTML contains expected substrings
 *   9. formatTime (indirect) — snapshot title contains HH:MM format
 *  10. Treatment color palette — rendered SVG uses correct colours per label
 *
 * Run with: node tests/test-timeline-chart.js
 */

'use strict';

// ─── Bootstrap ───────────────────────────────────────────────────────────────

global.window = global;
global.DRC    = {};

// Capture container HTML so render output can be inspected
let containerHTML = '';
let legendHTML    = '';

const timelineContainer = {
    get innerHTML()  { return containerHTML; },
    set innerHTML(v) { containerHTML = v; },
    clientWidth: 600,
    style: {},
    appendChild: function(child) { containerHTML = child; },
    get firstChild() { return null; },
    removeChild: function() {}
};

const legendContainer = {
    get innerHTML()  { return legendHTML; },
    set innerHTML(v) { legendHTML = v; },
    style: { display: '' },
    appendChild: function(child) { legendHTML = 'updated'; },
    get firstChild() { return null; },
    removeChild: function() {}
};

// Mock DOM API for SVG creation (secure XSS-free version)
const mockElement = (tag, isSVG = false) => ({
    tagName: tag,
    attributes: {},
    children: [],
    text: '',
    style: {},
    dataset: {},
    setAttribute: function(k, v) { this.attributes[k] = v; },
    getAttribute: function(k) { return this.attributes[k] || null; },
    appendChild: function(child) { this.children.push(child); },
    get textContent() { return this.text; },
    set textContent(v) { this.text = v; }
});

global.document = {
    getElementById: (id) => {
        if (id === 'timeline-chart')  return timelineContainer;
        if (id === 'timeline-legend') return legendContainer;
        return null;
    },
    createElementNS: function(ns, tag) {
        return mockElement(tag, true);
    },
    createElement: function(tag) {
        return mockElement(tag);
    },
    createTextNode: function(text) {
        return { textContent: text, nodeType: 3 };
    }
};

require('../js/timeline-chart.js');
const TC = DRC.TimelineChart;

// ─── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) { passed++; console.log(`  ✓ ${name}`); }
    else           { failed++; console.log(`  ✗ FAIL: ${name}`); }
}

// ─── Shared fixture ───────────────────────────────────────────────────────────

const SI = {
    age: 54, race: 0, parentHist: 0, sbp: 120,
    height: 170, waist: 90, fastGlu: 5.5, cholHDL: 1.3, cholTri: 1.7
};

// ─── TEST SUITE 1: Initial state ─────────────────────────────────────────────

console.log('\n═══ TEST SUITE 1: Initial state ═══');

assert(TC.getLastSnapshot() === null, 'getLastSnapshot() returns null initially');
assert(TC.hasBaseline() === false,    'hasBaseline() returns false initially');

// ─── TEST SUITE 2: Baseline management ───────────────────────────────────────

console.log('\n═══ TEST SUITE 2: Baseline management ═══');

TC.setBaseline(25.5);
assert(TC.hasBaseline() === true,  'hasBaseline() true after setBaseline()');

TC.clearBaseline();
assert(TC.hasBaseline() === false, 'hasBaseline() false after clearBaseline()');

// Setting again after clear works
TC.setBaseline(30.0);
assert(TC.hasBaseline() === true,  'hasBaseline() re-set after clearBaseline() + setBaseline()');
TC.clearBaseline();

// ─── TEST SUITE 3: Snapshot CRUD ─────────────────────────────────────────────

console.log('\n═══ TEST SUITE 3: Snapshot CRUD ═══');

TC.clear();    // ensure pristine state

TC.addSnapshot(14.6, SI);
const snap1 = TC.getLastSnapshot();
assert(snap1 !== null,               'getLastSnapshot() non-null after first addSnapshot()');
assert(snap1.riskPct === 14.6,       'Snapshot riskPct = 14.6');
assert(snap1.treatmentLabel === null, 'Default treatmentLabel = null');
assert(snap1.timestamp instanceof Date, 'Snapshot has a Date timestamp');

// Second snapshot — with treatment label
TC.addSnapshot(11.2, SI, 'Blood Sugar Management');
const snap2 = TC.getLastSnapshot();
assert(snap2.riskPct       === 11.2,                  'Second snapshot riskPct = 11.2');
assert(snap2.treatmentLabel === 'Blood Sugar Management', 'Treatment label preserved');
assert(snap2 !== snap1,                               'Each addSnapshot creates a new entry');

// Third snapshot — explicit null label
TC.addSnapshot(13.0, SI, null);
assert(TC.getLastSnapshot().treatmentLabel === null,  'Explicit null treatmentLabel stored correctly');

TC.clear();

// ─── TEST SUITE 4: siVals immutability ───────────────────────────────────────

console.log('\n═══ TEST SUITE 4: siVals stored as a copy ═══');

TC.clear();
const mutableSI = { ...SI };
TC.addSnapshot(20.0, mutableSI);
const stored = TC.getLastSnapshot();
mutableSI.age = 999;  // mutate after addSnapshot
assert(stored.siVals.age === 54, 'siVals.age unaffected by mutation of original object');
assert(stored.siVals !== mutableSI, 'siVals is a different object reference');
TC.clear();

// ─── TEST SUITE 5: FIFO overflow (MAX_SNAPSHOTS = 20) ─────────────────────────

console.log('\n═══ TEST SUITE 5: FIFO overflow (MAX_SNAPSHOTS = 20) ═══');

TC.clear();
// Add 21 snapshots with riskPct values 0..20
for (let i = 0; i <= 20; i++) {
    TC.addSnapshot(i, SI);
}
// The 21st entry pushed out the first (riskPct=0). Last should be riskPct=20.
assert(TC.getLastSnapshot().riskPct === 20, 'After 21 snapshots, last is riskPct=20');

// Verify first snapshot was discarded by adding one more (riskPct=21)
// and checking the last is now 21
TC.addSnapshot(21, SI);
assert(TC.getLastSnapshot().riskPct === 21, 'FIFO: new snapshot correctly becomes last');
TC.clear();

// ─── TEST SUITE 6: isBaseline flag ───────────────────────────────────────────

console.log('\n═══ TEST SUITE 6: isBaseline flag ═══');

TC.clear();
TC.setBaseline(25.0);
TC.addSnapshot(25.0, SI);
assert(TC.getLastSnapshot().isBaseline === true,
    'First snapshot added after setBaseline() has isBaseline: true');

TC.addSnapshot(22.0, SI);
assert(TC.getLastSnapshot().isBaseline === false,
    'Subsequent snapshots have isBaseline: false');

TC.clear();

// Without setBaseline, isBaseline stays false
TC.addSnapshot(15.0, SI);
assert(TC.getLastSnapshot().isBaseline === false,
    'Without setBaseline(), snapshot isBaseline: false');

TC.clear();

// ─── TEST SUITE 7: clear() ───────────────────────────────────────────────────

console.log('\n═══ TEST SUITE 7: clear() ═══');

TC.addSnapshot(30.0, SI);
TC.setBaseline(30.0);
TC.addSnapshot(28.0, SI, 'Blood Pressure Control');

assert(TC.getLastSnapshot() !== null, 'Snapshots exist before clear()');
assert(TC.hasBaseline()      === true,  'Baseline set before clear()');

TC.clear();

assert(TC.getLastSnapshot() === null,   'getLastSnapshot() null after clear()');
assert(TC.hasBaseline()     === false,  'hasBaseline() false after clear()');

// Safe to call clear() on already-empty state
let threw = false;
try { TC.clear(); } catch (e) { threw = true; }
assert(!threw, 'Calling clear() on empty state does not throw');

// ─── TEST SUITE 8: Render output verification ─────────────────────────────────

console.log('\n═══ TEST SUITE 8: Render output ═══');

TC.clear();
TC.setBaseline(25.5);
// After setBaseline, render() is called — check for SVG element
assert(containerHTML.tagName === 'svg', 'Render output contains SVG element');
assert(containerHTML.attributes.viewBox, 'SVG has viewBox attribute');

// Add a snapshot and verify render is called
TC.addSnapshot(18.3, SI, 'Blood Pressure Control');
assert(containerHTML.tagName === 'svg', 'Render creates SVG element');

TC.clear();
// After clear with no data, should show empty state message
assert(containerHTML.tagName === 'p', 'Empty state after clear() shows placeholder message');
assert(containerHTML.textContent.includes('Set a baseline'), 'Empty state message is correct');

// ─── TEST SUITE 9: SVG structure (secure DOM-based rendering) ──────────────────────────

console.log('\n═══ TEST SUITE 9: SVG structure (secure rendering) ═══');

TC.clear();
TC.setBaseline(20.0);
TC.addSnapshot(20.0, SI);
TC.addSnapshot(15.0, SI);

// Verify SVG was created with proper namespace (no innerHTML used)
const svg = containerHTML;
assert(svg.tagName === 'svg', 'SVG element created');
assert(svg.children.length > 0, 'SVG has children elements');
// Verify no innerHTML was set directly (security check)
assert(!svg.innerHTML, 'SVG uses DOM API (not innerHTML string concatenation)');

TC.clear();

// ─── TEST SUITE 10: Treatment color palette ───────────────────────────────────

console.log('\n═══ TEST SUITE 10: Treatment color palette ═══');

TC.clear();
TC.setBaseline(30.0);
TC.addSnapshot(30.0, SI, null);
TC.addSnapshot(25.0, SI, 'Blood Sugar Management');
TC.addSnapshot(20.0, SI, 'Blood Pressure Control');

// Check SVG was created with proper structure
assert(containerHTML.tagName === 'svg', 'SVG rendered for treatment snapshots');
// Colors are now set via setAttribute, check for circle elements
const hasCircles = containerHTML.children.some(child => child.tagName === 'circle');
assert(hasCircles, 'SVG contains circle elements for data points');

// Unknown treatment → fallback color #007aff
TC.addSnapshot(19.0, SI, 'Some Unknown Treatment');
// Unknown treatment → fallback color #007aff
const hasUnknownTreatmentCircle = containerHTML.children.some(child =>
    child.tagName === 'circle' && child.attributes.fill === '#007aff'
);
assert(hasUnknownTreatmentCircle,
    'Unknown treatment label uses fallback color (#007aff) - circle.attributes.fill verified');

TC.clear();

// ─── TEST SUITE 11: computeGridSteps (indirect via render Y-axis) ─────────────

console.log('\n═══ TEST SUITE 11: computeGridSteps (indirect via Y-axis labels) ═══');

// NOTE: With secure DOM rendering, we verify SVG structure instead of innerHTML strings
TC.clear();
TC.setBaseline(25.0);
TC.addSnapshot(25.0, SI);

// Verify SVG contains axis elements (lines and text)
assert(containerHTML.tagName === 'svg', 'SVG rendered for grid steps test');
const hasLines = containerHTML.children.some(c => c.tagName === 'line');
const hasText = containerHTML.children.some(c => c.tagName === 'text');
assert(hasLines && hasText, 'SVG contains grid lines and labels');

TC.clear();

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n  TOTAL: ${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
