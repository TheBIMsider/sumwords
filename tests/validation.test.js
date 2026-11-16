#!/usr/bin/env node
/**
 * Submit validation test.
 *
 * Runs the real sumColumn / isBlank / findBadEquations / validatePuzzle from
 * V01/game.js against hand-built puzzle states. No dependencies:
 * run with `node tests/validation.test.js`.
 *
 * game.js is a browser script (it touches `document` at load), so only the
 * validation section is loaded, via Node's `vm` module. game.js itself is not
 * modified.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ---------------------------------------------------------------------------
// Load the real validation code from game.js
// ---------------------------------------------------------------------------

const source = fs
  .readFileSync(path.join(__dirname, '..', 'V01', 'game.js'), 'utf8')
  .split('\r\n')
  .join('\n');
const startMarker = '/**\n * Adds up one column';
const endMarker = 'function handleWin()';
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker);
// applyOperator lives in the generator section (the generator uses it too)
const opStart = source.indexOf('/**\n * Does one equation');
const opEnd = source.indexOf('/**\n * True when some OTHER operator');
if (start === -1 || end === -1 || end < start || opStart === -1 || opEnd < opStart) {
  console.error(
    'Could not locate the validation section in V01/game.js (markers changed?)'
  );
  process.exit(2);
}

// validatePuzzle only touches the page to add/remove the red "error" class.
const highlighted = new Set();
const fakeDocument = {
  querySelector(selector) {
    const id = Number(/data-equation="(\d+)"/.exec(selector)[1]);
    return { classList: { add: () => highlighted.add(id) } };
  },
  querySelectorAll: () => [],
};

const sandbox = { document: fakeDocument, console };
vm.createContext(sandbox);
vm.runInContext(
  source.slice(opStart, opEnd) +
    source.slice(start, end) +
    '\n;this.validatePuzzle = validatePuzzle; this.sumColumn = sumColumn;' +
    ' this.isBlank = isBlank;',
  sandbox
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a puzzle where equation n is `a [op] b = answer`, with a fully
 * correct set of inputs. Returns { puzzle, state } to tweak before checking.
 */
function build(difficulty, specs) {
  const equations = [];
  const userInputs = {};
  const userOperators = {};
  let column1 = 0;
  let column2 = 0;
  specs.forEach(([a, operator, b, answer], i) => {
    const id = i + 1;
    equations.push({ id, operator, answer });
    userInputs[`op1-${id}`] = a;
    userInputs[`op2-${id}`] = b;
    userInputs[`sol-${id}`] = answer;
    userOperators[id] = operator;
    column1 += a;
    column2 += b;
  });
  const poolSize = { Easy: 10, Medium: 12, Hard: 16 }[difficulty];
  return {
    puzzle: {
      difficulty,
      numberPool: new Array(poolSize).fill(0),
      equations,
      columnTargets: { column1, column2 },
    },
    state: {
      userInputs,
      userOperators,
      poolNumbersUsed: new Array(poolSize).fill(1),
    },
  };
}

function check(puzzle, state) {
  sandbox.currentPuzzle = puzzle;
  sandbox.gameState = state;
  highlighted.clear();
  return sandbox.validatePuzzle();
}

let failures = 0;
function expect(name, condition, detail) {
  if (condition) {
    console.log(`ok   ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${detail ? ` -> ${detail}` : ''}`);
  }
}

const EASY = [
  [4, '+', 6, 10],
  [9, '-', 5, 4],
  [3, '+', 4, 7],
  [6, '-', 3, 3],
  [12, '+', 8, 20],
];
const MEDIUM = [...EASY, [10, '-', 4, 6]];
const HARD = [
  [2, '+', 3, 5],
  [30, '-', 27, 3],
  [6, '×', 4, 24],
  [20, '÷', 5, 4],
  [7, '+', 8, 15],
  [9, '-', 2, 7],
  [3, '×', 5, 15],
  [12, '÷', 3, 4],
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// A correct puzzle wins at every size (5, 6 and 8 equations)
for (const [difficulty, specs] of [
  ['Easy', EASY],
  ['Medium', MEDIUM],
  ['Hard', HARD],
]) {
  const { puzzle, state } = build(difficulty, specs);
  const result = check(puzzle, state);
  expect(
    `${difficulty} (${specs.length} equations): correct puzzle passes`,
    result.success,
    JSON.stringify(result.errors)
  );
}

// Pool-size message uses the real pool size
for (const [difficulty, specs, size] of [
  ['Easy', EASY, 10],
  ['Medium', MEDIUM, 12],
  ['Hard', HARD, 16],
]) {
  const { puzzle, state } = build(difficulty, specs);
  state.poolNumbersUsed.pop();
  const result = check(puzzle, state);
  expect(
    `${difficulty}: pool message says ${size - 1}/${size}`,
    result.errors.includes(`Only ${size - 1}/${size} pool numbers used`),
    JSON.stringify(result.errors)
  );
}

// The sixth and eighth equations count towards the column totals
{
  const { puzzle, state } = build('Hard', HARD);
  state.userInputs['op1-8'] = 13;
  const result = check(puzzle, state);
  const expected = puzzle.columnTargets.column1;
  expect(
    'Hard: a change in equation 8 changes the column 1 total',
    result.errors.some((e) => e.includes(`should be ${expected}`)),
    JSON.stringify(result.errors)
  );
}

// Inputs left over for equations the puzzle doesn't have are ignored
{
  const { puzzle, state } = build('Easy', EASY);
  state.userInputs['op1-6'] = 99;
  expect(
    'Easy: stale op1-6 does not count',
    check(puzzle, state).success
  );
}

// Wrong column total names the column and both numbers
{
  const { puzzle, state } = build('Easy', EASY);
  state.userInputs['op1-3'] = 5;
  const result = check(puzzle, state);
  expect(
    'wrong column 1 total names column and both numbers',
    result.errors.includes('Column 1 total is 36, should be 34'),
    JSON.stringify(result.errors)
  );
}

// A real 0 counts as a value, not as empty
{
  const { puzzle, state } = build('Easy', EASY);
  state.userInputs['op2-2'] = 0;
  state.userInputs['op1-2'] = 4;
  puzzle.columnTargets.column1 -= 5;
  puzzle.columnTargets.column2 -= 5;
  const result = check(puzzle, state);
  expect('Easy: 4 - 0 = 4 passes (0 is not empty)', result.success, JSON.stringify(result.errors));
  expect('isBlank(0) is false', sandbox.isBlank(0) === false);
}

// Blank-ish values
expect('isBlank(undefined)', sandbox.isBlank(undefined) === true);
expect('isBlank(null)', sandbox.isBlank(null) === true);
expect('isBlank(NaN)', sandbox.isBlank(NaN) === true);

// Incomplete equations (empty blank, or no operator chosen)
{
  const { puzzle, state } = build('Medium', MEDIUM);
  delete state.userInputs['sol-3'];
  delete state.userOperators[4];
  const result = check(puzzle, state);
  expect(
    'Medium: empty blank and missing operator reported as not finished',
    result.errors.includes('Equations 3, 4: a number or operator is missing'),
    JSON.stringify(result.errors)
  );
  expect(
    'Medium: an empty solution is not also reported as "answer is undefined"',
    !result.errors.some((e) => e.includes('undefined')),
    JSON.stringify(result.errors)
  );
}

// Wrong operator is reported separately from wrong numbers
{
  const { puzzle, state } = build('Medium', MEDIUM);
  state.userOperators[2] = '+'; // 9 + 5 = 14, not 4
  const result = check(puzzle, state);
  expect(
    'Medium: wrong operator reported on its own',
    result.errors.includes('Equation 2: wrong operator') &&
      !result.errors.some((e) => e.includes('numbers do not give')),
    JSON.stringify(result.errors)
  );
}
{
  const { puzzle, state } = build('Medium', MEDIUM);
  state.userInputs['op2-3'] = 9; // 3 + 9 = 12, not 7
  const result = check(puzzle, state);
  expect(
    'Medium: wrong numbers reported on their own',
    result.errors.includes(
      'Equation 3: the numbers do not give the answer'
    ) && !result.errors.some((e) => e.includes('wrong operator')),
    JSON.stringify(result.errors)
  );
}

// Wrong operator AND wrong numbers in the same equation: both reported
{
  const { puzzle, state } = build('Medium', MEDIUM);
  state.userOperators[2] = '+';
  state.userInputs['op2-2'] = 7; // 9 - 7 = 2, not 4, so numbers are wrong too
  const result = check(puzzle, state);
  expect(
    'Medium: wrong operator and wrong numbers both reported',
    result.errors.includes('Equation 2: wrong operator') &&
      result.errors.includes(
        'Equation 2: the numbers do not give the answer'
      ),
    JSON.stringify(result.errors)
  );
  expect('Medium: equation 2 highlighted', highlighted.has(2));
}

// The generator no longer builds ambiguous equations (see generator.test.js),
// but a puzzle saved by an older version might hold one. Submit accepts an
// equation that works with a different operator (2 + 2 = 2 x 2) rather than
// calling a correct equation "wrong operator".
{
  const specs = HARD.map((s) => [...s]);
  specs[0] = [2, '+', 2, 4];
  const { puzzle, state } = build('Hard', specs);
  state.userOperators[1] = '×';
  const result = check(puzzle, state);
  expect(
    'Hard: 2 × 2 = 4 accepted where the puzzle used +',
    result.success,
    JSON.stringify(result.errors)
  );
}

// ---------------------------------------------------------------------------

if (failures > 0) {
  console.log(`\nFAILED: ${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nPASSED: all validation checks');
