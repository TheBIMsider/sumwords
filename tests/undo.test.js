#!/usr/bin/env node
/**
 * Undo and Check pure helpers test.
 *
 * Runs the real recordMove, freeTileCount, planUndo and
 * checkEquationOutcome from V01/game.js (with classifyEquation and the helpers
 * it needs). No dependencies: run with `node tests/undo.test.js`.
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

// applyOperator (generator section), then sumColumn through the undo helpers
// (which sit just before buildAttemptEntry).
const opStart = source.indexOf('/**\n * Does one equation');
const opEnd = source.indexOf('/**\n * True when some OTHER operator');
const start = source.indexOf('/**\n * Adds up one column');
const end = source.indexOf('/**\n * True if the player has made a Submit');
if (opStart === -1 || opEnd < opStart || start === -1 || end < start) {
  console.error('Could not locate the sections in V01/game.js (markers changed?)');
  process.exit(2);
}

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(
  source.slice(opStart, opEnd) +
    source.slice(start, end) +
    '\n;this.recordMove = recordMove;' +
    ' this.freeTileCount = freeTileCount;' +
    ' this.planUndo = planUndo;' +
    ' this.checkEquationOutcome = checkEquationOutcome;' +
    ' this.UNDO_LIMIT = UNDO_LIMIT;' +
    ' this.classifyEquation = classifyEquation;',
  sandbox
);
const {
  recordMove,
  freeTileCount,
  planUndo,
  checkEquationOutcome,
  classifyEquation,
  UNDO_LIMIT,
} = sandbox;

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

const place = (position, value) => ({ type: 'place', position, value });
const remove = (position, value) => ({ type: 'remove', position, value });

// ---------------------------------------------------------------------------
// planUndo
// ---------------------------------------------------------------------------

{
  const r = planUndo([], {}, [1, 2, 3], []);
  expect(
    'planUndo on an empty history returns nothing to do',
    r.action.type === 'none' && r.history.length === 0
  );
}

{
  const r = planUndo([place('op1-1', 5)], { 'op1-1': 5 }, [5, 7], [5]);
  expect(
    'undoing a placement clears the blank',
    r.action.type === 'clear' && r.action.position === 'op1-1' && r.action.value === 5,
    JSON.stringify(r.action)
  );
  expect('undoing a placement pops it from the history', r.history.length === 0);
}

{
  const r = planUndo([remove('op2-3', 7)], {}, [7, 2], []);
  expect(
    'undoing a removal puts the value back when a tile is free',
    r.action.type === 'fill' && r.action.position === 'op2-3' && r.action.value === 7,
    JSON.stringify(r.action)
  );
}

{
  // Two tiles show 5 and one is used: undoing a removal of a 5 is possible
  const pool = [5, 5, 3, 8];
  const used = [5];
  expect('duplicate values: one free 5 tile is counted', freeTileCount(pool, used, 5) === 1);
  const r = planUndo([remove('op1-2', 5)], {}, pool, used);
  expect('duplicate values: undoing a removal of 5 fills the blank', r.action.type === 'fill');
}

{
  // Both 5 tiles are used again (a hint took the other one): cannot undo
  const pool = [5, 5, 3, 8];
  const used = [5, 5];
  expect('duplicate values: no free 5 tile left', freeTileCount(pool, used, 5) === 0);
  const history = [remove('op1-2', 5), place('op2-1', 3)];
  const r = planUndo(history, { 'op2-1': 3 }, pool, used);
  expect(
    'a removal with no free tile is unavailable and only the newest move is dropped',
    r.action.type === 'clear' && r.history.length === 1 && r.history[0].position === 'op1-2',
    JSON.stringify(r)
  );
  const r2 = planUndo(r.history, {}, pool, used);
  expect(
    'the next press reports the unavailable removal',
    r2.action.type === 'unavailable' && r2.history.length === 0,
    JSON.stringify(r2)
  );
}

{
  // The blank no longer holds the placed value: nothing changes, the move is dropped
  const r = planUndo([place('op1-1', 4)], { 'op1-1': 9 }, [4, 9], [9]);
  expect(
    'a placement whose blank changed is stale and dropped',
    r.action.type === 'stale' && r.history.length === 0
  );
}

{
  // Moves unwind newest first, one per press
  const history = [place('op1-1', 2), place('op2-1', 3), remove('op1-1', 2)];
  const r = planUndo(history, { 'op2-1': 3 }, [2, 3, 8, 9], [3]);
  expect(
    'the newest move is undone first',
    r.action.type === 'fill' && r.action.position === 'op1-1' && r.history.length === 2
  );
}

// ---------------------------------------------------------------------------
// recordMove
// ---------------------------------------------------------------------------

{
  const history = [];
  for (let i = 0; i < UNDO_LIMIT + 5; i++) {
    recordMove(history, place('op1-1', i));
  }
  expect(`the history is capped at ${UNDO_LIMIT} moves`, history.length === UNDO_LIMIT);
  expect(
    'the cap drops the oldest moves',
    history[0].value === 5 && history[history.length - 1].value === UNDO_LIMIT + 4
  );
}

{
  // A hint filled the blank: Undo drops the move with 'hint' and changes nothing
  const r = planUndo([place('op1-1', 5)], { 'op1-1': 5 }, [5, 7], [5], ['op1-1']);
  expect(
    'a move on a hint-filled blank is dropped, not undone',
    r.action.type === 'hint' && r.history.length === 0,
    JSON.stringify(r)
  );

  const other = planUndo([place('op2-1', 7)], { 'op2-1': 7 }, [5, 7], [7], ['op1-1']);
  expect(
    'a hint on another blank does not block the move',
    other.action.type === 'clear'
  );
}

// ---------------------------------------------------------------------------
// checkEquationOutcome: one complete example per operator
// ---------------------------------------------------------------------------

// Each operator with two numbers that work, and the answer that sum gives
const CASES = [
  { operator: '+', a: 2, b: 3, sol: 5, answer: 5 },
  { operator: '-', a: 9, b: 5, sol: 4, answer: 4 },
  { operator: '×', a: 2, b: 4, sol: 8, answer: 8 },
  { operator: '÷', a: 16, b: 4, sol: 4, answer: 4 },
];

CASES.forEach(({ operator, a, b, sol, answer }) => {
  const eq = { id: 1, operator, answer };
  const key = (name) => `${name}-1`;

  const correct = { [key('op1')]: a, [key('op2')]: b, [key('sol')]: sol };
  const rCorrect = checkEquationOutcome(eq, correct, false);
  expect(
    `${operator}: correct equation has status correct and is charged`,
    rCorrect.status === 'correct' && rCorrect.charge === true,
    JSON.stringify(rCorrect)
  );

  // The numbers work, but the trivia answer is one more than the solution
  const wrongAnswer = { [key('op1')]: a, [key('op2')]: b, [key('sol')]: sol };
  const eqOther = { id: 1, operator, answer: sol + 1 };
  const rAnswer = checkEquationOutcome(eqOther, wrongAnswer, false);
  expect(
    `${operator}: a solution that does not fit the question gives answer status`,
    rAnswer.status === 'answer' && rAnswer.charge === true,
    JSON.stringify(rAnswer)
  );

  const wrongMath = { [key('op1')]: a, [key('op2')]: b, [key('sol')]: 999 };
  const rMath = checkEquationOutcome(eq, wrongMath, false);
  expect(
    `${operator}: numbers that do not work give math status and are charged`,
    rMath.status === 'math' && rMath.charge === true,
    JSON.stringify(rMath)
  );

  const partial = { [key('op1')]: a, [key('sol')]: sol };
  const rEmpty = checkEquationOutcome(eq, partial, false);
  expect(
    `${operator}: an incomplete equation is empty and free`,
    rEmpty.status === 'empty' && rEmpty.charge === false,
    JSON.stringify(rEmpty)
  );

  const rMarked = checkEquationOutcome(eq, correct, true);
  expect(
    `${operator}: an already-marked equation is free`,
    rMarked.status === 'correct' && rMarked.charge === false
  );

  expect(
    `${operator}: status matches classifyEquation`,
    rCorrect.status === classifyEquation(eq, correct)
  );
});

{
  // A real 0 is a filled blank: 0 + 5 = 5 is complete and charged
  const eq = { id: 1, operator: '+', answer: 5 };
  const r = checkEquationOutcome(eq, { 'op1-1': 0, 'op2-1': 5, 'sol-1': 5 }, false);
  expect(
    'a real 0 counts as filled: correct and charged',
    r.status === 'correct' && r.charge === true,
    JSON.stringify(r)
  );
}

// ---------------------------------------------------------------------------
// Wiring: the board records, clears and undoes as the spec says. These are
// text checks (the DOM code cannot run here), like tests/hints.test.js.
// ---------------------------------------------------------------------------

const read = (...parts) =>
  fs
    .readFileSync(path.join(__dirname, '..', ...parts), 'utf8')
    .split('\r\n')
    .join('\n');
const html = read('V01', 'index.html');
const css = read('V01', 'styles.css');

// The text of one top-level function, from its declaration to its closing brace
function functionText(name) {
  const from = source.indexOf(`function ${name}(`);
  if (from === -1) return '';
  return source.slice(from, source.indexOf('\n}\n', from) + 3);
}

const checkText = functionText('checkEquation');
const undoText =
  functionText('undoLastMove') +
  functionText('fillBlankFromPool') +
  functionText('takeNumberFromBlank');

const WIRING = [
  [
    'the Undo button is in the controls and starts disabled',
    /<button\s+class="btn-undo" id="undo-btn" disabled>/.test(html) && /\.btn-undo\b/.test(css),
  ],
  [
    'every equation card has a ✓ Check choice',
    (html.match(/data-hint="check"/g) || []).length === 5,
  ],
  [
    'placements are recorded as place moves',
    /recordMove\(gameState\.undoHistory, \{\s*type: 'place'/.test(source),
  ],
  [
    'removals are recorded as remove moves',
    /recordMove\(gameState\.undoHistory, \{\s*type: 'remove'/.test(source),
  ],
  [
    'a hint leaves the history alone; Undo skips blanks a hint filled',
    !/dropMovesFor/.test(source) &&
      functionText('undoLastMove').includes("'.blank.operand.hint-revealed'"),
  ],
  [
    'a new puzzle, resume and daily start clear the history (resetGameState)',
    /function resetGameState\(\) \{[\s\S]*?gameState\.undoHistory = \[\]/.test(source),
  ],
  [
    'Reset clears the history',
    /function handleReset\(\) \{[\s\S]*?gameState\.undoHistory = \[\]/.test(source),
  ],
  [
    'a win clears the history',
    /function handleWin\(\) \{[\s\S]*?gameState\.undoHistory = \[\]/.test(source),
  ],
  [
    'the Undo button and Ctrl+Z are wired',
    /'undo-btn'\)\.addEventListener\('click', undoLastMove\)/.test(source) &&
      /document\.addEventListener\('keydown', handleUndoShortcut\)/.test(source),
  ],
  [
    'the hint row sends ✓ Check to checkEquation',
    /choice\.dataset\.hint === 'check'\) checkEquation\(equationId\)/.test(source),
  ],
  [
    'Check never touches attempts, the share history, hinted equations or wins',
    checkText.length > 0 &&
      ['attempts', 'attemptHistory', 'hintedEquations', 'addHintMarker', 'handleSubmit', 'handleWin']
        .every((word) => !checkText.includes(word)),
  ],
  [
    'Undo never touches attempts, hints or hinted equations',
    undoText.length > 0 &&
      ['attempts', 'attemptHistory', 'hintsUsed', 'hintedEquations']
        .every((word) => !undoText.includes(word)),
  ],
];

WIRING.forEach(([name, ok]) => expect(name, ok));

console.log(failures === 0 ? '\nAll undo checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
