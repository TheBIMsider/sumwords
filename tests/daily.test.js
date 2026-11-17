#!/usr/bin/env node
/**
 * Daily puzzle tests (generator side).
 *
 * Runs the real generateDailyPuzzle / getDailyNumber / getDailyDate from
 * V01/game.js. No dependencies: run with `node tests/daily.test.js`.
 *
 * Like generator.test.js, only the generator section of game.js is loaded
 * (via Node's `vm` module). game.js itself is not modified.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ---------------------------------------------------------------------------
// Load the generator section of game.js into a fresh sandbox
// ---------------------------------------------------------------------------

// game.js is stored with CRLF line endings; normalise so \n markers match
const source = fs
  .readFileSync(path.join(__dirname, '..', 'V01', 'game.js'), 'utf8')
  .split('\r\n')
  .join('\n');
const startMarker = 'const questionBanks = {';
const endMarker = 'const gameState = {';
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker);
if (start === -1 || end === -1 || end < start) {
  console.error(
    'Could not locate the generator section in V01/game.js (markers changed?)'
  );
  process.exit(2);
}

function loadGenerator(series = null) {
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    gameState: {},
  };
  vm.createContext(sandbox);
  let code = source.slice(start, end);
  if (series !== null) {
    // Run the same code as if DAILY_SERIES had been bumped
    code = code.replace(/const DAILY_SERIES = \d+;/, `const DAILY_SERIES = ${series};`);
  }
  vm.runInContext(
    code +
      '\n;this.generateDailyPuzzle = generateDailyPuzzle;' +
      ' this.getDailyNumber = getDailyNumber;' +
      ' this.getDailyLabel = getDailyLabel;' +
      ' this.getDailyDate = getDailyDate;' +
      ' this.questionBanks = questionBanks;',
    sandbox
  );
  return sandbox;
}

const sandbox = loadGenerator();
const { generateDailyPuzzle, getDailyNumber, getDailyLabel, getDailyDate } = sandbox;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let failures = 0;
function check(name, passed, detail = '') {
  if (passed) {
    console.log(`ok   ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${detail ? ` -- ${detail}` : ''}`);
  }
}

// Medium uses these operators and this range (mirrors DIFFICULTY_CONFIG)
const MEDIUM_OPERATORS = ['+', '-'];
const MEDIUM_MAX = 100;
const MEDIUM_DECOYS = 2;
const EQUATIONS = 5;

function applyOperator(op, a, b) {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '×') return a * b;
  if (op === '÷') return a / b;
  return undefined;
}

/** Returns a list of problems for one daily puzzle (empty when it is sound). */
function checkDailyPuzzle(puzzle, date) {
  const problems = [];
  if (!puzzle) return ['no puzzle returned'];

  if (puzzle.id !== `daily_1_${date}`) problems.push(`id is ${puzzle.id}`);
  if (puzzle.category !== 'Everything') problems.push(`category ${puzzle.category}`);
  if (puzzle.difficulty !== 'Medium') problems.push(`difficulty ${puzzle.difficulty}`);
  if (puzzle.equations.length !== EQUATIONS) {
    problems.push(`${puzzle.equations.length} equations, expected ${EQUATIONS}`);
  }

  const questions = new Set();
  let column1 = 0;
  let column2 = 0;
  const operands = [];

  puzzle.equations.forEach((eq) => {
    const { operand1: a, operand2: b, result } = eq.solution;
    if (questions.has(eq.question)) problems.push(`repeated question "${eq.question}"`);
    questions.add(eq.question);

    if (!MEDIUM_OPERATORS.includes(eq.operator)) {
      problems.push(`equation ${eq.id}: operator ${eq.operator} not allowed on Medium`);
    }
    if (![a, b, result].every(Number.isInteger)) {
      problems.push(`equation ${eq.id}: non-whole number`);
    }
    if (![a, b].every((n) => n >= 1 && n <= MEDIUM_MAX)) {
      problems.push(`equation ${eq.id}: operand outside 1..${MEDIUM_MAX}`);
    }
    if (applyOperator(eq.operator, a, b) !== eq.answer || result !== eq.answer) {
      problems.push(`equation ${eq.id}: ${a} ${eq.operator} ${b} is not ${eq.answer}`);
    }
    // Ambiguity: no other Medium operator may also give the answer
    MEDIUM_OPERATORS.forEach((other) => {
      if (other !== eq.operator && applyOperator(other, a, b) === eq.answer) {
        problems.push(`equation ${eq.id}: ${a} ${other} ${b} also gives ${eq.answer}`);
      }
    });

    column1 += a;
    column2 += b;
    operands.push(a, b);
  });

  if (column1 !== puzzle.columnTargets.column1) problems.push('column 1 target wrong');
  if (column2 !== puzzle.columnTargets.column2) problems.push('column 2 target wrong');

  if (puzzle.numberPool.length !== EQUATIONS * 2 + MEDIUM_DECOYS) {
    problems.push(`pool has ${puzzle.numberPool.length} numbers`);
  }
  const pool = [...puzzle.numberPool];
  for (const n of operands) {
    const at = pool.indexOf(n);
    if (at === -1) {
      problems.push(`operand ${n} missing from pool`);
      break;
    }
    pool.splice(at, 1);
  }
  if (pool.some((n) => n < 1 || n > MEDIUM_MAX)) {
    problems.push('decoy outside 1..100');
  }

  return problems;
}

/** Calendar dates from a start date, one per day, as YYYY-MM-DD (UTC arithmetic) */
function consecutiveDates(startYmd, count) {
  const [y, m, d] = startYmd.split('-').map(Number);
  const dates = [];
  for (let i = 0; i < count; i++) {
    dates.push(new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10));
  }
  return dates;
}

const EPOCH = '2026-11-17';
// The pinned puzzle is for this date (it no longer matches the epoch)
const PINNED_DATE = '2026-11-16';

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

{
  const first = JSON.stringify(generateDailyPuzzle(EPOCH));
  let same = true;
  for (let i = 0; i < 100 && same; i++) {
    same = JSON.stringify(generateDailyPuzzle(EPOCH)) === first;
  }
  check('same date gives an identical puzzle, repeated 100 times', same);
}

// ---------------------------------------------------------------------------
// Different dates, different puzzles
// ---------------------------------------------------------------------------

{
  const dates = consecutiveDates(EPOCH, 365);
  const signatures = new Set();
  const repeats = [];
  dates.forEach((date) => {
    const puzzle = generateDailyPuzzle(date);
    const signature = puzzle.equations
      .map((eq) => eq.question)
      .sort()
      .join('|');
    if (signatures.has(signature)) repeats.push(date);
    signatures.add(signature);
  });
  check(
    '365 consecutive dates give 365 different question sets',
    repeats.length === 0,
    repeats.slice(0, 3).join(', ')
  );

  // Every one of the 365 dailies must be sound
  const broken = [];
  dates.forEach((date) => {
    const problems = checkDailyPuzzle(generateDailyPuzzle(date), date);
    if (problems.length) broken.push(`${date}: ${problems[0]}`);
  });
  check(
    'all 365 dailies pass solvability, ambiguity and layout checks',
    broken.length === 0,
    broken.slice(0, 3).join('; ')
  );
}

// ---------------------------------------------------------------------------
// Pinned date: a generator change that silently changes dailies fails here
// ---------------------------------------------------------------------------

{
  const expected = {
    id: 'daily_1_2026-11-16',
    category: 'Everything',
    difficulty: 'Medium',
    numberPool: [93, 86, 67, 7, 15, 9, 1, 26, 2, 4, 56, 67],
    columnTargets: { column1: 178, column2: 132 },
    equations: [
      {
        id: 1,
        question: 'How many seasons of Mad Men were there?',
        answer: 7,
        operator: '-',
        solution: { operand1: 93, operand2: 86, result: 7 },
      },
      {
        id: 2,
        question: 'Minutes in an hour',
        answer: 60,
        operator: '-',
        solution: { operand1: 67, operand2: 7, result: 60 },
      },
      {
        id: 3,
        question: 'Seconds on a basketball shot clock',
        answer: 24,
        operator: '+',
        solution: { operand1: 15, operand2: 9, result: 24 },
      },
      {
        id: 4,
        question: 'Member countries of the European Union',
        answer: 27,
        operator: '+',
        solution: { operand1: 1, operand2: 26, result: 27 },
      },
      {
        id: 5,
        question: 'How many Oscars did La La Land win?',
        answer: 6,
        operator: '+',
        solution: { operand1: 2, operand2: 4, result: 6 },
      },
    ],
  };
  const actual = JSON.parse(JSON.stringify(generateDailyPuzzle(PINNED_DATE)));
  check(
    'pinned date 2026-11-16 matches its recorded puzzle exactly',
    JSON.stringify(actual) === JSON.stringify(expected),
    'generator output changed; if intended, re-pin this date'
  );
}

// ---------------------------------------------------------------------------
// Math.random is restored after a daily build, even when generation throws
// ---------------------------------------------------------------------------

{
  const sb = loadGenerator();
  sb.generateDailyPuzzle(EPOCH);
  check(
    'Math.random is restored after a daily build',
    vm.runInContext('random === Math.random', sb) === true
  );
}

{
  const sb = loadGenerator();
  // Make generation throw partway through: reading the bank throws
  Object.defineProperty(sb.questionBanks, 'sports', {
    get() {
      throw new Error('simulated failure');
    },
  });
  let threw = false;
  try {
    sb.generateDailyPuzzle(EPOCH);
  } catch (error) {
    threw = true;
  }
  check('generation failure is raised to the caller (test setup works)', threw);
  check(
    'Math.random is restored even when generation throws',
    vm.runInContext('random === Math.random', sb) === true
  );
}

// ---------------------------------------------------------------------------
// getDailyNumber: day count from the epoch, epoch = 1, never below 1
// ---------------------------------------------------------------------------

{
  check('getDailyNumber: the epoch date is 1', getDailyNumber(EPOCH) === 1);
  check('getDailyNumber: the next day is 2', getDailyNumber('2026-11-18') === 2);
  check('getDailyNumber: across a month end (Nov 30 = 14)', getDailyNumber('2026-11-30') === 14);
  check('getDailyNumber: the first of the next month (Dec 1 = 15)', getDailyNumber('2026-12-01') === 15);
  check('getDailyNumber: across a leap day (Feb 29 2028 = 470)', getDailyNumber('2028-02-29') === 470);
  check('getDailyNumber: the day after the leap day (Mar 1 2028 = 471)', getDailyNumber('2028-03-01') === 471);
  check('getDailyNumber: a date before the epoch is clamped to 1', getDailyNumber('2026-01-01') === 1);
}

// ---------------------------------------------------------------------------
// Series: the label is "series-day", and a new series gives new dailies
// ---------------------------------------------------------------------------

{
  check('getDailyLabel: the first daily is 1-1', getDailyLabel(EPOCH) === '1-1');
  check('getDailyLabel: the next day is 1-2', getDailyLabel('2026-11-18') === '1-2');

  const next = loadGenerator(2);
  check('after a bump the label starts with the new series (2-1)', next.getDailyLabel(EPOCH) === '2-1');
  check(
    'a different series gives a different puzzle for the same date',
    JSON.stringify(next.generateDailyPuzzle(EPOCH)) !==
      JSON.stringify(generateDailyPuzzle(EPOCH))
  );
}

// ---------------------------------------------------------------------------
// getDailyDate: local calendar date as YYYY-MM-DD
// ---------------------------------------------------------------------------

{
  check(
    'getDailyDate: late evening stays on the same local day',
    getDailyDate(new Date(2026, 10, 16, 23, 59)) === '2026-11-16'
  );
  check(
    'getDailyDate: pads month and day with zeros',
    getDailyDate(new Date(2026, 0, 5, 0, 1)) === '2026-01-05'
  );
}

// ---------------------------------------------------------------------------
// Share text header: daily number vs the step 7 output
// ---------------------------------------------------------------------------

/** Loads one slice of game.js (between two markers) into a fresh sandbox. */
function loadSlice(fromMarker, toMarker, exportNames, storage = null) {
  const from = source.indexOf(fromMarker);
  const to = source.indexOf(toMarker);
  if (from === -1 || to === -1 || to < from) {
    throw new Error(`markers not found in V01/game.js: ${fromMarker}`);
  }
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: storage,
  };
  vm.createContext(sb);
  vm.runInContext(
    source.slice(from, to) +
      '\n;' +
      exportNames.map((name) => `this.${name} = ${name};`).join(' '),
    sb
  );
  return sb;
}

{
  const { buildShareText } = loadSlice(
    '/**\n * Adds up one column',
    '/**\n * True if the player has made a Submit',
    ['buildShareText']
  );
  const url = 'https://example.test/game/';
  const history = [
    { equations: ['correct', 'wrong', 'empty', 'correct', 'correct'], columns: [true, false] },
    {
      equations: ['correct', 'correct', 'correct', 'correct', 'correct'],
      columns: [true, true],
      hinted: [false, true, false, false, false],
    },
  ];
  const rows = '🟩🟥⬜🟩🟩 🟩🟥\n🟩🟨🟩🟩🟩 🟩🟩';

  const daily = buildShareText({
    version: '1.1.0',
    url,
    currentDifficulty: 'medium',
    assignedDifficulty: null,
    attempts: 2,
    hints: 1,
    history,
    dailyNumber: 12,
  });
  check(
    'daily share text has the Daily # header and the same grid',
    daily === `Sumwords v1.1.0 · Daily #12\n2 attempts · 1 hint ⭐⭐\n\n${rows}\n\n${url}`,
    JSON.stringify(daily)
  );

  const normal = buildShareText({
    version: '1.1.0',
    url,
    currentDifficulty: 'medium',
    assignedDifficulty: null,
    attempts: 2,
    hints: 1,
    history,
  });
  check(
    'share text without dailyNumber keeps the difficulty header and the same grid',
    normal === `Sumwords v1.1.0 · Medium\n2 attempts · 1 hint ⭐⭐\n\n${rows}\n\n${url}`,
    JSON.stringify(normal)
  );
}

// ---------------------------------------------------------------------------
// Daily storage: sumwords_daily, read and written safely
// ---------------------------------------------------------------------------

function fakeStorage({ broken = false } = {}) {
  const items = new Map();
  return {
    items,
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => {
      if (broken) throw new Error('storage blocked');
      items.set(key, String(value));
    },
    removeItem: (key) => items.delete(key),
  };
}

{
  const storage = fakeStorage();
  const { saveDailyResult, loadDailyResult } = loadSlice(
    '/**\n * Clear saved puzzle from localStorage',
    '/**\n * Save user preferences',
    ['saveDailyResult', 'loadDailyResult'],
    storage
  );

  check('loadDailyResult: nothing saved gives null', loadDailyResult() === null);

  const result = {
    date: '2026-11-16',
    number: 1,
    attempts: 3,
    hints: 1,
    history: [{ equations: ['correct'], columns: [true] }],
  };
  saveDailyResult(result);
  check(
    'saveDailyResult then loadDailyResult round-trips the result',
    JSON.stringify(loadDailyResult()) === JSON.stringify(result)
  );
  check(
    'the result is stored under the sumwords_daily key',
    storage.items.has('sumwords_daily')
  );

  storage.items.set('sumwords_daily', '{not json');
  check('a corrupted saved daily reads as null, not an error', loadDailyResult() === null);
}

{
  const { saveDailyResult } = loadSlice(
    '/**\n * Clear saved puzzle from localStorage',
    '/**\n * Save user preferences',
    ['saveDailyResult', 'loadDailyResult'],
    fakeStorage({ broken: true })
  );
  let threw = false;
  try {
    saveDailyResult({ date: '2026-11-16', number: 1, attempts: 1, hints: 0, history: [] });
  } catch (error) {
    threw = true;
  }
  check('a blocked storage write does not throw', threw === false);
}

// ---------------------------------------------------------------------------
// Statistics: a daily win counts as a normal Medium win AND in the daily totals
// ---------------------------------------------------------------------------

{
  const storage = fakeStorage();
  const from = source.indexOf('/**\n * Initialize statistics object with default values');
  const to = source.indexOf('/**\n * Reset current win streak');
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: storage,
    gameState: { currentDifficulty: 'medium' },
  };
  // updateStatistics also tallies stars, so getStarRating has to be loaded too
  const starFrom = source.indexOf('/**\n * Star rating for a win');
  const starTo = source.indexOf('/**\n * "1 attempt", "3 attempts"');
  if (starFrom === -1 || starTo < starFrom) {
    throw new Error('getStarRating markers not found in V01/game.js');
  }
  vm.createContext(sb);
  vm.runInContext(
    source.slice(starFrom, starTo) +
      source.slice(from, to) +
      '\n;this.updateStatistics = updateStatistics; this.loadStatistics = loadStatistics;',
    sb
  );

  sb.updateStatistics('medium', 1, 0); // a normal perfect Medium win
  let stats = sb.loadStatistics();
  check(
    'a normal win leaves the daily totals at zero',
    stats.daily.completed === 0 && stats.medium.completed === 1
  );

  sb.updateStatistics('medium', 3, 2, true); // a daily win
  stats = sb.loadStatistics();
  check(
    'a daily win counts under Medium too',
    stats.medium.completed === 2 && stats.overall.totalCompleted === 2
  );
  check(
    'a daily win is tracked in the daily totals',
    stats.daily.completed === 1 && stats.daily.attempts === 3 && stats.daily.hints === 2
  );
  check('a daily with hints is not a perfect game', stats.daily.perfectGames === 0);

  // A save from before the daily has no daily bucket: it is created on the first daily win
  storage.items.set(
    'sumwords_statistics',
    JSON.stringify({
      overall: { totalCompleted: 4, totalAttempts: 5, totalHints: 0, perfectGames: 3, currentStreak: 1, bestStreak: 3 },
      medium: { completed: 4, attempts: 5, hints: 0, perfectGames: 3 },
    })
  );
  sb.updateStatistics('medium', 1, 0, true);
  stats = sb.loadStatistics();
  check(
    'an old save without a daily bucket gets one on the first daily win',
    stats.daily && stats.daily.completed === 1 && stats.daily.perfectGames === 1
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('');
if (failures > 0) {
  console.log(`FAILED: ${failures} daily check(s) failed`);
  process.exit(1);
}
console.log('PASSED: all daily checks');
