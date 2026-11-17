#!/usr/bin/env node
/**
 * Submit feedback test.
 *
 * Runs the real classifyEquation and buildAttemptEntry from V01/game.js (with
 * the helpers they rely on: applyOperator, isBlank). No dependencies: run with
 * `node tests/feedback.test.js`.
 *
 * game.js is a browser script (it touches `document` at load), so only the
 * needed sections are evaluated, via Node's `vm` module. game.js itself is
 * not modified.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ---------------------------------------------------------------------------
// Load the real code from game.js
// ---------------------------------------------------------------------------

const source = fs
  .readFileSync(path.join(__dirname, '..', 'V01', 'game.js'), 'utf8')
  .split('\r\n')
  .join('\n');

// applyOperator (generator section), then isBlank / sumColumn and the share
// section, which holds classifyEquation and buildAttemptEntry.
const opStart = source.indexOf('/**\n * Does one equation');
const opEnd = source.indexOf('/**\n * True when some OTHER operator');
const start = source.indexOf('/**\n * Adds up one column');
const end = source.indexOf('/**\n * True if the player has made a Submit');
if (opStart === -1 || opEnd < opStart || start === -1 || end < start) {
  console.error('Could not locate the share section in V01/game.js (markers changed?)');
  process.exit(2);
}

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(
  source.slice(opStart, opEnd) + source.slice(start, end) +
    '\n;this.classifyEquation = classifyEquation;' +
    ' this.buildAttemptEntry = buildAttemptEntry;',
  sandbox
);
const { classifyEquation, buildAttemptEntry } = sandbox;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let failures = 0;
function expect(name, condition, detail) {
  if (condition) {
    console.log(`ok   ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${detail ? `\n     ${detail}` : ''}`);
  }
}

// One equation of each operator the game uses, each with its trivia answer
const EQUATIONS = [
  { id: 1, operator: '+', answer: 5 },
  { id: 2, operator: '-', answer: 4 },
  { id: 3, operator: '×', answer: 8 },
  { id: 4, operator: '÷', answer: 4 },
  { id: 5, operator: '+', answer: 15 },
];

// Fully correct inputs for the five equations above
function correctInputs() {
  return {
    'op1-1': 2, 'op2-1': 3, 'sol-1': 5,
    'op1-2': 8, 'op2-2': 4, 'sol-2': 4,
    'op1-3': 4, 'op2-3': 2, 'sol-3': 8,
    'op1-4': 20, 'op2-4': 5, 'sol-4': 4,
    'op1-5': 7, 'op2-5': 8, 'sol-5': 15,
  };
}

const COLUMN_TARGETS = { column1: 2 + 8 + 4 + 20 + 7, column2: 3 + 4 + 2 + 5 + 8 };

// ---------------------------------------------------------------------------
// classifyEquation: one case per status
// ---------------------------------------------------------------------------

{
  const inputs = correctInputs();
  expect(
    'classifyEquation: right numbers and right solution is correct',
    classifyEquation(EQUATIONS[0], inputs) === 'correct'
  );
}

{
  const inputs = { ...correctInputs(), 'sol-1': 6 };
  expect(
    'classifyEquation: numbers that do not give the solution is math',
    classifyEquation(EQUATIONS[0], inputs) === 'math'
  );
}

{
  // 1 + 2 = 3 works, but the trivia answer for this equation is 5
  const inputs = { ...correctInputs(), 'op1-1': 1, 'op2-1': 2, 'sol-1': 3 };
  expect(
    'classifyEquation: working numbers with a solution that is not the trivia answer is answer',
    classifyEquation(EQUATIONS[0], inputs) === 'answer'
  );
}

{
  const inputs = { ...correctInputs() };
  delete inputs['sol-2'];
  expect(
    'classifyEquation: an empty solution is empty',
    classifyEquation(EQUATIONS[1], inputs) === 'empty'
  );
}

{
  const inputs = { ...correctInputs() };
  delete inputs['op1-3'];
  expect(
    'classifyEquation: an empty first operand is empty',
    classifyEquation(EQUATIONS[2], inputs) === 'empty'
  );
}

{
  // A real 0 is a value, so 0 + 0 = 0 with an answer of 0 is correct, not empty
  const zeroEq = { id: 9, operator: '+', answer: 0 };
  const inputs = { 'op1-9': 0, 'op2-9': 0, 'sol-9': 0 };
  expect(
    'classifyEquation: 0 counts as filled (0 + 0 = 0 is correct)',
    classifyEquation(zeroEq, inputs) === 'correct'
  );
}

// Each operator reaches correct and math; answer and empty do not depend on it
for (const eq of EQUATIONS) {
  const inputs = correctInputs();
  expect(
    `classifyEquation: ${eq.operator} equation ${eq.id} is correct when filled correctly`,
    classifyEquation(eq, inputs) === 'correct'
  );
  const wrongNumbers = { ...inputs, [`sol-${eq.id}`]: eq.answer + 1 };
  expect(
    `classifyEquation: ${eq.operator} equation ${eq.id} with a wrong solution is math`,
    classifyEquation(eq, wrongNumbers) === 'math'
  );
}

// ---------------------------------------------------------------------------
// buildAttemptEntry: same three share statuses as before
// ---------------------------------------------------------------------------

{
  const entry = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, correctInputs());
  expect(
    'buildAttemptEntry: a fully correct board gives all correct and both columns true',
    entry.equations.every((s) => s === 'correct') &&
      entry.columns[0] === true &&
      entry.columns[1] === true,
    JSON.stringify(entry)
  );
}

{
  // Equation 1 is math, equation 2 is answer, equation 3 is empty, 4 and 5 correct
  const inputs = correctInputs();
  inputs['sol-1'] = 6; // 2 + 3 is not 6: math
  inputs['op1-2'] = 6; inputs['op2-2'] = 3; inputs['sol-2'] = 3; // 6 - 3 = 3, but the answer is 4: answer
  delete inputs['sol-3']; // empty
  const entry = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, inputs);
  expect(
    'buildAttemptEntry: math and answer both map to wrong, empty stays empty',
    JSON.stringify(entry.equations) ===
      JSON.stringify(['wrong', 'wrong', 'empty', 'correct', 'correct']),
    JSON.stringify(entry.equations)
  );
}

{
  // Working numbers with a solution that is not the trivia answer (4) are saved as wrong
  const inputs = correctInputs();
  inputs['op1-2'] = 6; inputs['op2-2'] = 3; inputs['sol-2'] = 3; // 6 - 3 = 3
  const entry = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, inputs);
  expect(
    'buildAttemptEntry: working numbers with a non-trivia solution is saved as wrong',
    entry.equations[1] === 'wrong',
    JSON.stringify(entry.equations)
  );
}

{
  // Empty board: every equation empty, both columns false
  const entry = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, {});
  expect(
    'buildAttemptEntry: empty board is all empty with both columns false',
    entry.equations.every((s) => s === 'empty') &&
      entry.columns[0] === false &&
      entry.columns[1] === false,
    JSON.stringify(entry)
  );
}

// ---------------------------------------------------------------------------
// validatePuzzle: a wrong solution is reported, but the trivia answer is not printed
// ---------------------------------------------------------------------------

{
  // Only the page calls are needed (validatePuzzle adds the error class to cards)
  sandbox.document = {
    querySelector: () => ({ classList: { add() {}, remove() {} } }),
    querySelectorAll: () => [],
  };
  sandbox.currentPuzzle = { equations: EQUATIONS, columnTargets: COLUMN_TARGETS };
  const inputs = correctInputs();
  inputs['op1-1'] = 1; inputs['op2-1'] = 2; inputs['sol-1'] = 3; // works, but the answer is 5
  sandbox.gameState = { userInputs: inputs, poolNumbersUsed: new Array(10).fill(0) };
  const result = sandbox.validatePuzzle();
  expect(
    'validatePuzzle: a non-trivia solution fails the win with a message that names no answer',
    result.success === false &&
      result.errors.includes('Equation 1: the solution does not fit the question'),
    JSON.stringify(result.errors)
  );
  expect(
    'validatePuzzle: no equation message prints an answer ("Question N answer is" / "should be")',
    result.errors.every((e) => !/Question \d+|answer is|Equation \d+.*should be/.test(e)),
    JSON.stringify(result.errors)
  );
}

// ---------------------------------------------------------------------------

console.log(failures === 0 ? '\nAll feedback tests passed.' : `\n${failures} feedback test(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
