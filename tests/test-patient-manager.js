/**
 * @fileoverview Unit tests for the PatientManager module.
 *
 * Tests cover the exported public API and the underlying storage logic:
 *   1. Empty-state initialization (no prior localStorage data)
 *   2. Persistence round-trip: save → reload via init()
 *   3. loadPatient() switches the active patient
 *   4. getActivePatientData() returns correct data / null
 *   5. Corrupted localStorage is handled gracefully
 *   6. captureCurrentValues() returns a complete, correctly-typed record
 *
 * Because PatientManager is tightly coupled to the DOM, all tests use a
 * lightweight mock that returns stub elements so DOM interactions are
 * no-ops rather than errors.
 *
 * Run with: node tests/test-patient-manager.js
 */

'use strict';

// ─── Test harness ────────────────────────────────────────────────────────────

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

function assertDeepField(obj, field, expected, name) {
    const actual = obj?.[field];
    if (actual === expected) {
        passed++;
        console.log(`  ✓ ${name} (${actual})`);
    } else {
        failed++;
        console.log(`  ✗ FAIL: ${name} — got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
    }
}

// ─── DOM mock factory ────────────────────────────────────────────────────────
// Returns a stub element. querySelector() returns another stub (not null) so
// that addEventListener() calls on its result do not throw.

function makeMockEl(overrides) {
    const el = {
        value: '0',
        checked: false,
        innerHTML: '',
        textContent: '',
        className: '',
        style: {},
        classList: {
            contains: () => false,
            add: () => {},
            remove: () => {},
            toggle: () => false
        },
        addEventListener: () => {},
        removeEventListener: () => {},
        appendChild: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
        querySelector:    () => makeMockEl(),
        querySelectorAll: () => [],
        closest:          () => null,
        focus:            () => {},
        dispatchEvent:    () => {}
    };
    return Object.assign(el, overrides || {});
}

// ─── Per-test environment setup ──────────────────────────────────────────────
// Module cache key for PatientManager so we can reload it between scenarios.

const PM_PATH = require.resolve('../js/patient-manager.js');

/** Unload PatientManager and all DRC modules so each scenario starts fresh. */
function unloadModules() {
    Object.keys(require.cache).forEach(k => {
        if (k.includes('/js/')) delete require.cache[k];
    });
}

/** In-memory localStorage replacement. Reset between scenarios. */
function makeLocalStorage() {
    let store = {};
    return {
        getItem:    k       => (k in store ? store[k] : null),
        setItem:    (k, v)  => { store[k] = String(v); },
        removeItem: k       => { delete store[k]; },
        clear:      ()      => { store = {}; },
        _store:     ()      => store     // test helper to inspect raw content
    };
}

/** Bootstrap globals and require all modules, returning the PatientManager. */
function loadPatientManager(localStorageInstance, domOverrides) {
    // Browser globals
    global.window   = global;
    global.confirm  = () => true;
    global.alert    = () => {};
    global.localStorage = localStorageInstance;

    // Selective DOM — getElementById returns field-specific values when provided.
    const fieldMap = domOverrides || {};
    global.document = {
        getElementById:    id  => fieldMap[id] || makeMockEl(),
        createElement:     ()  => makeMockEl(),
        querySelectorAll:  ()  => []
    };

    // Stub dependent DRC modules (config values only; no real DOM needed here)
    global.DRC = {
        CONFIG: {
            ALL_FIELDS: ['age', 'race', 'parentHist', 'sbp', 'height', 'waist',
                         'fastGlu', 'cholHDL', 'cholTri']
        },
        UIController: { updateSliderFill: () => {} },
        App:           { _calculate: () => {} }
    };

    require('../js/patient-manager.js');
    return DRC.PatientManager;
}

// ─── Sample patient data ──────────────────────────────────────────────────────

const PATIENT_ALICE = {
    id: 'alice001',
    name: 'Alice',
    data: {
        age: 54, race: 0, parentHist: 0, sbp: 120,
        height: 170, waist: 90, fastGlu: 5.5, cholHDL: 1.3,
        cholTri: 1.7, _riskPct: 14.6
    },
    riskPct: 14.6,
    savedAt: '2024-01-01T10:00:00.000Z'
};

const PATIENT_BOB = {
    id: 'bob002',
    name: 'Bob',
    data: {
        age: 62, race: 1, parentHist: 1, sbp: 145,
        height: 180, waist: 105, fastGlu: 6.2, cholHDL: 0.9,
        cholTri: 2.5, _riskPct: 52.3
    },
    riskPct: 52.3,
    savedAt: '2024-02-15T08:30:00.000Z'
};

// ─── TEST SUITE 1: Empty state ───────────────────────────────────────────────

console.log('\n═══ TEST SUITE 1: Empty state (no localStorage data) ═══');
{
    unloadModules();
    const ls = makeLocalStorage();
    const pm = loadPatientManager(ls);
    pm.init();

    assert(pm.getActivePatientData() === null,
        'getActivePatientData() returns null when no patient is active');
}

// ─── TEST SUITE 2: Persistence round-trip ────────────────────────────────────

console.log('\n═══ TEST SUITE 2: Persistence round-trip via init() ═══');
{
    unloadModules();
    const ls = makeLocalStorage();

    // Pre-seed localStorage as if a previous session had saved two patients
    ls.setItem('diabetes_risk_patients', JSON.stringify({
        patients: [PATIENT_ALICE, PATIENT_BOB],
        activePatientId: 'alice001'
    }));

    const pm = loadPatientManager(ls);
    pm.init();

    const data = pm.getActivePatientData();
    assert(data !== null, 'getActivePatientData() returns data after init() with seeded storage');
    assertDeepField(data, 'age',      54,   'Active patient age = 54');
    assertDeepField(data, 'fastGlu',  5.5,  'Active patient fastGlu = 5.5');
    assertDeepField(data, 'cholHDL',  1.3,  'Active patient cholHDL = 1.3');
    assertDeepField(data, 'riskPct',  undefined, 'data object has no top-level riskPct field');
    assertDeepField(data, '_riskPct', 14.6, 'Active patient _riskPct = 14.6');
}

// ─── TEST SUITE 3: loadPatient() switches active patient ─────────────────────

console.log('\n═══ TEST SUITE 3: loadPatient() switches active patient ═══');
{
    unloadModules();
    const ls = makeLocalStorage();

    ls.setItem('diabetes_risk_patients', JSON.stringify({
        patients: [PATIENT_ALICE, PATIENT_BOB],
        activePatientId: 'alice001'
    }));

    const pm = loadPatientManager(ls);
    pm.init();

    // Confirm starting state is Alice
    const before = pm.getActivePatientData();
    assertDeepField(before, 'age', 54, 'Before loadPatient: active patient age = 54 (Alice)');

    // Switch to Bob
    pm.loadPatient('bob002');

    const after = pm.getActivePatientData();
    assert(after !== null, 'getActivePatientData() is non-null after loadPatient(bob002)');
    assertDeepField(after, 'age',      62,   'After loadPatient(bob002): age = 62');
    assertDeepField(after, 'riskPct',  undefined, 'After switch: top-level riskPct absent from data object');
    assertDeepField(after, '_riskPct', 52.3, 'After loadPatient(bob002): _riskPct = 52.3');
}

// ─── TEST SUITE 4: loadPatient() with unknown id is a no-op ──────────────────

console.log('\n═══ TEST SUITE 4: loadPatient() with unknown id is a no-op ═══');
{
    unloadModules();
    const ls = makeLocalStorage();

    ls.setItem('diabetes_risk_patients', JSON.stringify({
        patients: [PATIENT_ALICE],
        activePatientId: 'alice001'
    }));

    const pm = loadPatientManager(ls);
    pm.init();

    pm.loadPatient('nonexistent-id');

    // Active patient should remain Alice
    const data = pm.getActivePatientData();
    assert(data !== null, 'Active patient unchanged after loadPatient with unknown id');
    assertDeepField(data, 'age', 54, 'Still Alice (age 54) after no-op loadPatient');
}

// ─── TEST SUITE 5: Corrupted localStorage is handled gracefully ───────────────

console.log('\n═══ TEST SUITE 5: Corrupted localStorage handled gracefully ═══');
{
    unloadModules();
    const ls = makeLocalStorage();
    ls.setItem('diabetes_risk_patients', '{ this is not valid JSON ]]]');

    const pm = loadPatientManager(ls);
    let threw = false;
    try {
        pm.init();
    } catch (e) {
        threw = true;
    }

    assert(!threw, 'init() does not throw on corrupted localStorage');
    assert(pm.getActivePatientData() === null,
        'getActivePatientData() returns null after corrupted storage is recovered');
}

// ─── TEST SUITE 6: captureCurrentValues() structure ──────────────────────────

console.log('\n═══ TEST SUITE 6: captureCurrentValues() returns correct structure ═══');
{
    unloadModules();
    const ls = makeLocalStorage();

    // Provide specific DOM values for each field
    const domFields = {
        'race-toggle':      makeMockEl({ checked: true  }),
        'parentHist-toggle':makeMockEl({ checked: false }),
        'age-value':        makeMockEl({ value: '58'    }),
        'sbp-value':        makeMockEl({ value: '135'   }),
        'height-value':     makeMockEl({ value: '175'   }),
        'waist-value':      makeMockEl({ value: '98'    }),
        'fastGlu-value':    makeMockEl({ value: '5.8'   }),
        'cholHDL-value':    makeMockEl({ value: '1.1'   }),
        'cholTri-value':    makeMockEl({ value: '2.1'   }),
        'risk-percentage':  makeMockEl({ textContent: '28.4' })
    };

    const pm = loadPatientManager(ls, domFields);
    pm.init();

    const vals = pm.captureCurrentValues();

    assert(vals !== null && typeof vals === 'object', 'captureCurrentValues() returns an object');
    assert('age'        in vals, 'captureCurrentValues() includes age');
    assert('race'       in vals, 'captureCurrentValues() includes race');
    assert('parentHist' in vals, 'captureCurrentValues() includes parentHist');
    assert('sbp'        in vals, 'captureCurrentValues() includes sbp');
    assert('height'     in vals, 'captureCurrentValues() includes height');
    assert('waist'      in vals, 'captureCurrentValues() includes waist');
    assert('fastGlu'    in vals, 'captureCurrentValues() includes fastGlu');
    assert('cholHDL'    in vals, 'captureCurrentValues() includes cholHDL');
    assert('cholTri'    in vals, 'captureCurrentValues() includes cholTri');
    assert('_riskPct'   in vals, 'captureCurrentValues() includes _riskPct');

    assertDeepField(vals, 'race',       1,    'race-toggle checked → race = 1');
    assertDeepField(vals, 'parentHist', 0,    'parentHist-toggle unchecked → parentHist = 0');
    assertDeepField(vals, 'age',        58,   'age value parsed to 58');
    assertDeepField(vals, 'sbp',        135,  'sbp value parsed to 135');
    assertDeepField(vals, 'fastGlu',    5.8,  'fastGlu value parsed to 5.8');
    assertDeepField(vals, 'cholHDL',    1.1,  'cholHDL value parsed to 1.1');
    assertDeepField(vals, '_riskPct',   28.4, '_riskPct read from risk-percentage element');
}

// ─── TEST SUITE 7: captureCurrentValues() handles missing DOM elements ────────

console.log('\n═══ TEST SUITE 7: captureCurrentValues() tolerates missing DOM elements ═══');
{
    unloadModules();
    const ls = makeLocalStorage();

    // Simulate a DOM where every getElementById call returns null (missing elements)
    global.window  = global;
    global.confirm = () => true;
    global.alert   = () => {};
    global.localStorage = ls;
    global.document = {
        getElementById:   () => null,
        createElement:    () => makeMockEl(),
        querySelectorAll: () => []
    };
    global.DRC = {
        CONFIG: {
            ALL_FIELDS: ['age', 'race', 'parentHist', 'sbp', 'height', 'waist',
                         'fastGlu', 'cholHDL', 'cholTri']
        },
        UIController: { updateSliderFill: () => {} },
        App:           { _calculate: () => {} }
    };

    require('../js/patient-manager.js');
    const pm = DRC.PatientManager;
    pm.init();

    let threw = false;
    let vals;
    try {
        vals = pm.captureCurrentValues();
    } catch (e) {
        threw = true;
    }

    assert(!threw, 'captureCurrentValues() does not throw when DOM elements are missing');
    assert(typeof vals === 'object' && vals !== null,
        'captureCurrentValues() still returns an object with null DOM');
    // All numeric fields should fall back to 0 (the || 0 guard in source)
    assertDeepField(vals, 'age',      0, 'Missing age DOM element → falls back to 0');
    assertDeepField(vals, 'fastGlu',  0, 'Missing fastGlu DOM element → falls back to 0');
    assertDeepField(vals, '_riskPct', 0, 'Missing risk-percentage element → _riskPct falls back to 0');
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n  TOTAL: ${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
