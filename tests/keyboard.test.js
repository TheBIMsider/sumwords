#!/usr/bin/env node
/**
 * Keyboard test: the pure helpers behind typed placement, arrow navigation and
 * screen reader labels (matchTypedValue, nextOperandPosition, nextPoolIndex,
 * operandSpot, operandLabel).
 *
 * Loads the real functions from V01/game.js via Node's `vm` module (game.js
 * touches `document` at load, so only the section between the KEYBOARD HELPERS
 * markers is evaluated). Run with `node tests/keyboard.test.js`.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs
  .readFileSync(path.join(__dirname, '..', 'V01', 'game.js'), 'utf8')
  .split('\r\n')
  .join('\n');
const start = source.indexOf('// KEYBOARD HELPERS START');
const end = source.indexOf('// KEYBOARD HELPERS END');
if (start === -1 || end === -1 || end < start) {
  console.error('Could not locate the keyboard helpers in V01/game.js');
  process.exit(2);
}

const context = {};
vm.createContext(context);
vm.runInContext(
  source.slice(start, end) +
    `
this.matchTypedValue = matchTypedValue;
this.nextOperandPosition = nextOperandPosition;
this.nextPoolIndex = nextPoolIndex;
this.operandSpot = operandSpot;
this.operandLabel = operandLabel;
this.ARROW_DIRECTIONS = ARROW_DIRECTIONS;
`,
  context
);
const {
  matchTypedValue,
  nextOperandPosition,
  nextPoolIndex,
  operandSpot,
  operandLabel,
  ARROW_DIRECTIONS,
} = context;

let failures = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}: expected ${e}, got ${a}`);
  }
}

const none = (n) => new Array(n).fill(false);

// ---- matchTypedValue ----
check('single digit, one tile', matchTypedValue('7', [3, 7, 9], none(3)), { index: 1 });
check('value not in the pool', matchTypedValue('5', [3, 7, 9], none(3)), { none: true });
check(
  'duplicates: first unused tile wins',
  matchTypedValue('7', [7, 7, 9], [false, false, false]),
  { index: 0 }
);
check(
  'duplicates: a used tile is skipped',
  matchTypedValue('7', [7, 7, 9], [true, false, false]),
  { index: 1 }
);
check(
  'duplicates: all tiles used',
  matchTypedValue('7', [7, 7, 9], [true, true, false]),
  { none: true }
);
check(
  'a longer free value keeps the digits pending',
  matchTypedValue('1', [1, 12, 40], none(3)),
  { pending: true }
);
check(
  'pending resolves to the exact tile when final',
  matchTypedValue('1', [1, 12, 40], none(3), true),
  { index: 0 }
);
check(
  'second digit completes the longer value',
  matchTypedValue('12', [1, 12, 40], none(3)),
  { index: 1 }
);
check(
  'a used longer value no longer holds the digits back',
  matchTypedValue('1', [1, 12, 40], [false, true, false]),
  { index: 0 }
);
check(
  'prefix with no exact tile is pending, then none when final',
  matchTypedValue('4', [12, 40], none(2)),
  { pending: true }
);
check(
  'prefix with no exact tile is none when final',
  matchTypedValue('4', [12, 40], none(2), true),
  { none: true }
);
check('0 is a real value', matchTypedValue('0', [0, 5], none(2)), { index: 0 });
check('leading zero never matches', matchTypedValue('07', [7, 70], none(2)), { none: true });
check('empty buffer is none', matchTypedValue('', [7], none(1)), { none: true });
check('non-digit buffer is none', matchTypedValue('a', [7], none(1)), { none: true });

// ---- nextOperandPosition ----
const positions = ['op1-1', 'op2-1', 'op1-2', 'op2-2'];
check('operand: forward', nextOperandPosition(positions, 'op1-1', 1), 'op2-1');
check('operand: back', nextOperandPosition(positions, 'op1-2', -1), 'op2-1');
check('operand: forward wraps', nextOperandPosition(positions, 'op2-2', 1), 'op1-1');
check('operand: back wraps', nextOperandPosition(positions, 'op1-1', -1), 'op2-2');
check('operand: unknown start goes to first', nextOperandPosition(positions, 'x', 1), 'op1-1');
check('operand: unknown start back goes to last', nextOperandPosition(positions, 'x', -1), 'op2-2');

// ---- nextPoolIndex ----
check('pool: forward', nextPoolIndex(none(4), 0, 1), 1);
check('pool: skips used tiles', nextPoolIndex([false, true, true, false], 0, 1), 3);
check('pool: back skips used tiles', nextPoolIndex([false, true, true, false], 3, -1), 0);
check('pool: forward wraps', nextPoolIndex(none(4), 3, 1), 0);
check('pool: back wraps', nextPoolIndex(none(4), 0, -1), 3);
check('pool: all used', nextPoolIndex([true, true], 0, 1), -1);
check('pool: from a used tile', nextPoolIndex([false, true, false], 1, 1), 2);
check('pool: only the current tile free stays put', nextPoolIndex([true, false, true], 1, 1), 1);
check('pool: start before the first', nextPoolIndex(none(3), -1, 1), 0);
check('pool: start before the first, backwards', nextPoolIndex(none(3), -1, -1), 2);

// ---- labels ----
check('spot', operandSpot('op2-3'), 'equation 3, second number');
check('label: empty', operandLabel('op1-2', undefined), 'Equation 2, first number, empty');
check('label: filled', operandLabel('op1-2', 7), 'Equation 2, first number, 7');
check('label: a real 0 is a value', operandLabel('op2-5', 0), 'Equation 5, second number, 0');

// ---- arrow map ----
check(
  'arrow directions',
  [ARROW_DIRECTIONS.ArrowLeft, ARROW_DIRECTIONS.ArrowUp, ARROW_DIRECTIONS.ArrowRight, ARROW_DIRECTIONS.ArrowDown],
  [-1, -1, 1, 1]
);

if (failures > 0) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll keyboard checks passed');
