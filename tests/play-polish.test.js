#!/usr/bin/env node
/**
 * Play polish test: the pure helpers behind the Reset/New Puzzle confirms and
 * auto-advance (hasPlayed, hasProgress, findNextEmptyPosition).
 *
 * Loads the real functions from V01/game.js via Node's `vm` module (game.js
 * touches `document` at load, so only this section is evaluated).
 * Run with `node tests/play-polish.test.js`.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs
  .readFileSync(path.join(__dirname, '..', 'V01', 'game.js'), 'utf8')
  .split('\r\n')
  .join('\n');
const start = source.indexOf('/**\n * True if the player has made a Submit');
const end = source.indexOf('/**\n * Ask before discarding progress');
if (start === -1 || end === -1 || end < start) {
  console.error('Could not locate the play-polish helpers in V01/game.js');
  process.exit(2);
}

const context = { gameState: { attempts: 0, hintsUsed: 0, poolNumbersUsed: [], userInputs: {} } };
vm.createContext(context);
vm.runInContext(
  source.slice(start, end) +
    '\nthis.hasPlayed = hasPlayed; this.hasProgress = hasProgress; this.findNextEmptyPosition = findNextEmptyPosition;',
  context
);
const { findNextEmptyPosition } = context;

// hasPlayed / hasProgress read the global gameState, so point it at each test state
const hasPlayed = (state) => {
  context.gameState = state;
  return context.hasPlayed();
};
const hasProgress = (state) => {
  context.gameState = state;
  return context.hasProgress();
};

let failures = 0;
function check(name, actual, expected) {
  if (actual === expected) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}: expected ${expected}, got ${actual}`);
  }
}

const fresh = () => ({ attempts: 0, hintsUsed: 0, poolNumbersUsed: [], userInputs: {} });

// hasPlayed: only a Submit or a hint counts
check('fresh puzzle is not played', hasPlayed(fresh()), false);
check('a number placed is not played', hasPlayed({ ...fresh(), poolNumbersUsed: [4] }), false);
check('a Submit is played', hasPlayed({ ...fresh(), attempts: 1 }), true);
check('a hint is played', hasPlayed({ ...fresh(), hintsUsed: 1 }), true);

// hasProgress: anything a reset or new puzzle would discard
check('fresh puzzle has no progress', hasProgress(fresh()), false);
check('a placed number is progress', hasProgress({ ...fresh(), poolNumbersUsed: [4] }), true);
check('a typed solution is progress', hasProgress({ ...fresh(), userInputs: { 'sol-2': 7 } }), true);
check('a Submit is progress', hasProgress({ ...fresh(), attempts: 1 }), true);
check('a hint is progress', hasProgress({ ...fresh(), hintsUsed: 1 }), true);
check('a typed 0 solution is progress', hasProgress({ ...fresh(), userInputs: { 'sol-1': 0 } }), true);

// A solved puzzle has nothing to lose: no confirm, and Reset keeps the streak
const solved = { ...fresh(), completed: true, attempts: 2, hintsUsed: 1, poolNumbersUsed: [4], userInputs: { 'sol-1': 7 } };
check('a solved puzzle is not played', hasPlayed(solved), false);
check('a solved puzzle has no progress', hasProgress(solved), false);

// findNextEmptyPosition
const positions = ['op1-1', 'op2-1', 'op1-2', 'op2-2'];
check('next empty after the first', findNextEmptyPosition(positions, { 'op1-1': 3 }, 'op1-1'), 'op2-1');
check(
  'skips filled blanks',
  findNextEmptyPosition(positions, { 'op1-1': 3, 'op2-1': 5 }, 'op1-1'),
  'op1-2'
);
check(
  'wraps to the first empty blank',
  findNextEmptyPosition(positions, { 'op2-2': 3, 'op2-1': 5 }, 'op2-2'),
  'op1-1'
);
check(
  'treats 0 as filled',
  findNextEmptyPosition(positions, { 'op1-1': 0, 'op2-1': 0 }, 'op1-1'),
  'op1-2'
);
check(
  'null when every blank is filled',
  findNextEmptyPosition(positions, { 'op1-1': 1, 'op2-1': 2, 'op1-2': 3, 'op2-2': 4 }, 'op2-2'),
  null
);

if (failures > 0) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll play-polish checks passed');
