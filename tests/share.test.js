#!/usr/bin/env node
/**
 * Share results test.
 *
 * Runs the real buildAttemptEntry / buildShareText (and the Submit helpers
 * they rely on) from V01/game.js. No dependencies: run with
 * `node tests/share.test.js`.
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
// section, which sits just before the NEW PUZZLE handlers.
const opStart = source.indexOf('/**\n * Does one equation');
const opEnd = source.indexOf('/**\n * True when some OTHER operator');
const start = source.indexOf('/**\n * Adds up one column');
const end = source.indexOf('/**\n * True if the player has made a Submit');
if (opStart === -1 || opEnd < opStart || start === -1 || end < start) {
  console.error('Could not locate the share section in V01/game.js (markers changed?)');
  process.exit(2);
}

const sandbox = { console, GAME_VERSION: '1.1.0' };
vm.createContext(sandbox);
vm.runInContext(
  source.slice(opStart, opEnd) + source.slice(start, end) +
    '\n;this.buildAttemptEntry = buildAttemptEntry;' +
    ' this.buildShareText = buildShareText;',
  sandbox
);
const { buildAttemptEntry, buildShareText } = sandbox;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const URL_LINE = 'https://thebimsider.github.io/sumwords/V01/';
const GRID_ROW = /^[🟩🟨🟥⬜]{5} [🟩🟥]{2}$/u;

// Five equations, all correct: a [op] b = answer, with column totals on target
const SPECS = [
  [2, '+', 3, 5],
  [4, '×', 2, 8],
  [9, '-', 1, 8],
  [6, '+', 6, 12],
  [7, '-', 2, 5],
];
const COLUMN_TARGETS = {
  column1: SPECS.reduce((t, s) => t + s[0], 0),
  column2: SPECS.reduce((t, s) => t + s[2], 0),
};
const EQUATIONS = SPECS.map(([, operator, , answer], i) => ({
  id: i + 1,
  operator,
  answer,
}));

function fullInputs() {
  const inputs = {};
  SPECS.forEach(([a, , b, answer], i) => {
    inputs[`op1-${i + 1}`] = a;
    inputs[`op2-${i + 1}`] = b;
    inputs[`sol-${i + 1}`] = answer;
  });
  return inputs;
}

function winningEntry() {
  return buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, fullInputs());
}

function wrongEntry() {
  return {
    equations: ['wrong', 'wrong', 'wrong', 'wrong', 'wrong'],
    columns: [false, false],
  };
}

function shareText(overrides = {}) {
  return buildShareText({
    version: '1.1.0',
    url: URL_LINE,
    currentDifficulty: 'medium',
    assignedDifficulty: null,
    attempts: 3,
    hints: 1,
    history: [wrongEntry(), wrongEntry(), winningEntry()],
    ...overrides,
  });
}

function gridRows(text) {
  return text.split('\n').filter((line) => GRID_ROW.test(line));
}

let failures = 0;
function expect(name, condition, detail) {
  if (condition) {
    console.log(`ok   ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${detail ? `\n     ${detail}` : ''}`);
  }
}

// ---------------------------------------------------------------------------
// buildAttemptEntry: one Submit press
// ---------------------------------------------------------------------------

{
  const entry = winningEntry();
  expect(
    'a fully correct puzzle gives all equations correct and both columns true',
    entry.equations.every((s) => s === 'correct') &&
      entry.columns.every((ok) => ok === true),
    JSON.stringify(entry)
  );
}

{
  const entry = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, {});
  expect(
    'an empty board gives all equations empty and both columns false',
    entry.equations.every((s) => s === 'empty') &&
      entry.columns.every((ok) => ok === false),
    JSON.stringify(entry)
  );
}

{
  // Numbers 2 + 3 placed for equation 1, but the solution typed is 6
  const inputs = fullInputs();
  inputs['sol-1'] = 6;
  const entry = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, inputs);
  expect(
    'a complete equation whose numbers do not give the answer is wrong',
    entry.equations[0] === 'wrong' && entry.equations[1] === 'correct',
    JSON.stringify(entry.equations)
  );
}

{
  // Numbers work out (2 + 3 = 5) but the trivia answer for this equation is 6
  const equations = [{ id: 1, operator: '+', answer: 6 }];
  const inputs = { 'op1-1': 2, 'op2-1': 3, 'sol-1': 5 };
  const entry = buildAttemptEntry(equations, { column1: 2, column2: 3 }, inputs);
  expect(
    'a correct sum that does not match the trivia answer is wrong',
    entry.equations[0] === 'wrong',
    JSON.stringify(entry.equations)
  );
}

{
  // Equation 2 has its first operand missing; the rest is complete
  const inputs = fullInputs();
  delete inputs['op1-2'];
  const entry = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, inputs);
  expect(
    'an equation with a blank still empty is empty, not wrong',
    entry.equations[1] === 'empty',
    JSON.stringify(entry.equations)
  );
  expect(
    'a column with an unfilled blank is false even if the partial total matches',
    entry.columns[0] === false,
    JSON.stringify(entry.columns)
  );
}

{
  // Zero is a real value: a column of 0s can match a 0 target
  const equations = [{ id: 1, operator: '-', answer: 0 }];
  const inputs = { 'op1-1': 4, 'op2-1': 4, 'sol-1': 0 };
  const entry = buildAttemptEntry(equations, { column1: 4, column2: 4 }, inputs);
  expect(
    'zero is treated as a filled value, not an empty blank',
    entry.equations[0] === 'correct' && entry.columns[0] && entry.columns[1],
    JSON.stringify(entry)
  );
}

// ---------------------------------------------------------------------------
// buildShareText: header, attempts line and grid
// ---------------------------------------------------------------------------

{
  const lines = shareText().split('\n');
  expect(
    'header reads Sumwords v{version} · {Difficulty}',
    lines[0] === 'Sumwords v1.1.0 · Medium',
    lines[0]
  );
  expect(
    'plural attempts and hints',
    lines[1] === '3 attempts · 1 hint',
    lines[1]
  );
  expect(
    'last line is the game URL',
    shareText().split('\n').pop() === URL_LINE
  );
}

{
  const line = shareText({ attempts: 1, hints: 1, history: [winningEntry()] }).split('\n')[1];
  expect('singular attempt and hint wording', line === '1 attempt · 1 hint', line);
}

{
  const line = shareText({ attempts: 1, hints: 0, history: [winningEntry()] }).split('\n')[1];
  expect('a perfect game gets a star', line === '1 attempt · 0 hints ⭐', line);
}

{
  const line = shareText({ attempts: 2, hints: 0, history: [wrongEntry(), winningEntry()] }).split('\n')[1];
  expect('no star when the game is not perfect', !line.includes('⭐'), line);
}

{
  const text = shareText({
    currentDifficulty: 'random',
    assignedDifficulty: 'hard',
  });
  expect(
    'Random uses the assigned difficulty in the header',
    text.split('\n')[0] === 'Sumwords v1.1.0 · Hard',
    text.split('\n')[0]
  );
}

{
  const rows = gridRows(shareText());
  expect(
    'each Submit press is one grid row',
    rows.length === 3,
    `rows: ${rows.length}`
  );
  expect(
    'a row is five equation squares, a space, then two column squares',
    rows[0] === '🟥🟥🟥🟥🟥 🟥🟥' && rows[1] === '🟥🟥🟥🟥🟥 🟥🟥',
    rows.join(' | ')
  );
  expect(
    'the winning row is all green',
    rows[2] === '🟩🟩🟩🟩🟩 🟩🟩',
    rows[2]
  );
}

{
  const mixed = buildAttemptEntry(
    EQUATIONS,
    COLUMN_TARGETS,
    { ...fullInputs(), 'sol-1': 6 }
  );
  const rows = gridRows(shareText({ history: [mixed, winningEntry()], attempts: 2, hints: 0 }));
  expect(
    'squares show correct, wrong and empty per equation',
    rows[0] === '🟥🟩🟩🟩🟩 🟩🟩' && rows[1] === '🟩🟩🟩🟩🟩 🟩🟩',
    rows.join(' | ')
  );
}

{
  // 10 presses: the first two are all wrong, so they are the rows that must drop
  const history = [wrongEntry(), wrongEntry()];
  for (let i = 0; i < 8; i++) history.push(winningEntry());
  const text = shareText({ attempts: 10, hints: 2, history });
  const rows = gridRows(text);
  expect('only the last 8 rows are shown', rows.length === 8, `rows: ${rows.length}`);
  expect(
    'the header still shows the true attempt count',
    text.split('\n')[1] === '10 attempts · 2 hints',
    text.split('\n')[1]
  );
  expect(
    'the last row is still the all-green winning row',
    rows[rows.length - 1] === '🟩🟩🟩🟩🟩 🟩🟩',
    rows[rows.length - 1]
  );
  expect(
    'the dropped rows (the all-wrong ones) are not shown',
    rows.every((row) => row.startsWith('🟩')),
    rows.join(' | ')
  );
}

{
  // A save from before this feature: fewer history rows than attempts
  const text = shareText({ attempts: 4, hints: 0, history: [winningEntry()] });
  const rows = gridRows(text);
  expect(
    'a short history shows the rows it has, ending with the winning row',
    rows.length === 1 && rows[0] === '🟩🟩🟩🟩🟩 🟩🟩',
    rows.join(' | ')
  );
}

{
  // No trivia, answers, categories or puzzle numbers: only the header,
  // the attempts line and the grid, plus the fixed URL, can contain digits
  const text = shareText({
    history: [wrongEntry(), winningEntry()],
    attempts: 2,
    hints: 0,
  });
  const lines = text.split('\n');
  const body = lines.filter((line) => line !== URL_LINE && line !== lines[0] && line !== lines[1]);
  expect(
    'no digits from the puzzle appear in the share text body',
    body.every((line) => !/[0-9]/.test(line)),
    body.join(' | ')
  );
}

{
  const text = shareText({ history: [] });
  expect(
    'an empty history still builds the header and URL',
    text.split('\n')[0] === 'Sumwords v1.1.0 · Medium' &&
      text.split('\n').pop() === URL_LINE &&
      gridRows(text).length === 0
  );
}

// ---------------------------------------------------------------------------
// Hint squares: a correct equation with any hint shows yellow
// ---------------------------------------------------------------------------

{
  const entry = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, fullInputs(), { 2: ['?'] });
  expect(
    'hinted flags are one per equation, true only where a hint was used',
    JSON.stringify(entry.hinted) === '[false,true,false,false,false]',
    JSON.stringify(entry.hinted)
  );
  expect(
    'a hint does not change the equation status or the columns',
    entry.equations.every((s) => s === 'correct') && entry.columns.every((ok) => ok),
    JSON.stringify(entry)
  );
}

{
  const entry = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, fullInputs(), { 1: ['#'], 3: ['?', '#'] });
  expect(
    'either hint type counts, and two hints on one equation still count once',
    JSON.stringify(entry.hinted) === '[true,false,true,false,false]',
    JSON.stringify(entry.hinted)
  );
}

{
  const entry = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, fullInputs());
  expect(
    'no hintedEquations argument means no hints',
    entry.hinted.every((h) => h === false),
    JSON.stringify(entry.hinted)
  );
}

{
  const hints = {};
  const entry = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, fullInputs(), hints);
  hints[1] = ['?'];
  expect(
    'a hint used after a Submit does not change that Submit\'s entry',
    entry.hinted.every((h) => h === false),
    JSON.stringify(entry.hinted)
  );
}

{
  const inputs = fullInputs();
  inputs['sol-1'] = 6; // equation 1 is wrong; equation 2 is correct and hinted
  const entry = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, inputs, { 2: ['?'] });
  const rows = gridRows(shareText({ history: [entry], attempts: 1, hints: 1 }));
  expect(
    'a correct hinted equation renders yellow; a wrong one beside it stays red',
    rows[0] === '🟥🟨🟩🟩🟩 🟩🟩',
    rows.join(' | ')
  );
}

{
  const entry = {
    equations: ['wrong', 'correct', 'empty', 'correct', 'correct'],
    columns: [false, false],
    hinted: [true, true, true, false, true],
  };
  const rows = gridRows(shareText({ history: [entry], attempts: 1, hints: 3 }));
  expect(
    'a hinted wrong stays red and a hinted empty stays grey',
    rows[0] === '🟥🟨⬜🟩🟨 🟥🟥',
    rows.join(' | ')
  );
}

{
  // A save from before this feature: no hinted field at all
  const oldEntry = { equations: ['correct', 'correct', 'correct', 'correct', 'correct'], columns: [true, true] };
  const rows = gridRows(shareText({ history: [oldEntry], attempts: 1, hints: 0 }));
  expect(
    'an entry without hinted renders exactly as before',
    rows[0] === '🟩🟩🟩🟩🟩 🟩🟩',
    rows.join(' | ')
  );
}

{
  // Wrong Submit first, then a hint on the win: the first row must not change
  const wrong = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, { ...fullInputs(), 'sol-1': 6 }, {});
  const hints = { 2: ['?'] };
  const win = buildAttemptEntry(EQUATIONS, COLUMN_TARGETS, fullInputs(), hints);
  const rows = gridRows(shareText({ history: [wrong, win], attempts: 2, hints: 1 }));
  expect(
    'a wrong Submit then a hinted win: first row unchanged, last row yellow in the hinted slot',
    rows[0] === '🟥🟩🟩🟩🟩 🟩🟩' && rows[1] === '🟩🟨🟩🟩🟩 🟩🟩',
    rows.join(' | ')
  );
}

// ---------------------------------------------------------------------------

if (failures > 0) {
  console.log(`\nFAILED: ${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nPASSED: all share checks');
