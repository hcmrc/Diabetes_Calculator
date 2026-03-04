/**
 * @fileoverview Unit tests for UIHelpers utility functions.
 * Run with: node tests/test-ui-helpers.js
 */

'use strict';

global.window = global;
global.document = { getElementById: () => null };

require('../js/config.js');
require('../js/ui-helpers.js');

const { clampAndRound, formatAxisValue } = DRC.UIHelpers;

let passed = 0, failed = 0;
function assert(condition, name) {
    if (condition) { passed++; console.log(`  ✓ ${name}`); }
    else { failed++; console.log(`  ✗ FAIL: ${name}`); }
}

console.log('\n═══ UIHelpers: clampAndRound ═══');
assert(clampAndRound(5, 0, 10, 1) === 5, 'Within range: 5 in [0,10] = 5');
assert(clampAndRound(-5, 0, 10, 1) === 0, 'Below min: -5 clamped to 0');
assert(clampAndRound(15, 0, 10, 1) === 10, 'Above max: 15 clamped to 10');
assert(clampAndRound(5.67, 0, 10, 0.1) === 5.7, 'Float step: 5.67 → 5.7');
assert(clampAndRound(5.34, 0, 10, 0.1) === 5.3, 'Float step: 5.34 → 5.3');
assert(clampAndRound(5.5, 0, 10, 1) === 6, 'Integer step: 5.5 → 6');

console.log('\n═══ UIHelpers: formatAxisValue ═══');
assert(formatAxisValue(5, false) === '5', 'Integer: 5 → "5"');
assert(formatAxisValue(5.0, true) === '5.0', 'Float: 5.0 → "5.0"');
assert(formatAxisValue(3.14, true) === '3.1', 'Float: 3.14 → "3.1"');

console.log(`\n  TOTAL: ${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
