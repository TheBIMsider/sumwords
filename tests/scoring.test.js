#!/usr/bin/env node
/**
 * Scoring test: the star rating, the star tally in the statistics and the
 * play time clock.
 *
 * Runs the real getStarRating, statistics and clock helpers from V01/game.js
 * against a fake localStorage, a fake Date.now and a fake document. No dependencies: run with `node tests/scoring.test.js`.
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

const start = source.indexOf('/**\n * Star rating for a win');
const end = source.indexOf('/**\n * "1 attempt", "3 attempts"');
if (start === -1 || end < start) {
  console.error('Could not locate getStarRating in V01/game.js (markers changed?)');
  process.exit(2);
}

// The statistics section: getDefaultStats ... updateStatistics
const statsStart = source.indexOf('/**\n * Initialize statistics object');
const statsEnd = source.indexOf('/**\n * Reset current win streak');
if (statsStart === -1 || statsEnd < statsStart) {
  console.error('Could not locate the statistics section in V01/game.js (markers changed?)');
  process.exit(2);
}

// A tiny localStorage so loadStatistics / saveStatistics run for real
const store = {};
const sandbox = {
  console,
  gameState: { currentDifficulty: 'medium' },
  localStorage: {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
  },
};
vm.createContext(sandbox);
vm.runInContext(
  source.slice(start, end) +
    source.slice(statsStart, statsEnd) +
    '\n;this.getStarRating = getStarRating;' +
    ' this.getStarLine = getStarLine;' +
    ' this.STAR_LABELS = STAR_LABELS;' +
    ' this.getStarTally = getStarTally;' +
    ' this.formatStarsEarned = formatStarsEarned;' +
    ' this.updateStatistics = updateStatistics;' +
    ' this.loadStatistics = loadStatistics;' +
    ' this.getDefaultStats = getDefaultStats;',
  sandbox
);
const {
  getStarRating,
  getStarLine,
  STAR_LABELS,
  getStarTally,
  formatStarsEarned,
  updateStatistics,
  loadStatistics,
  getDefaultStats,
} = sandbox;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.log(`FAIL: ${name}${detail ? ` (${detail})` : ''}`);
  }
}

// ---------------------------------------------------------------------------
// The rating table from context/features/10-scoring.md
// ---------------------------------------------------------------------------

const TABLE = [
  [1, 0, 3],
  [1, 1, 2],
  [1, 2, 2],
  [1, 3, 2],
  [1, 4, 1],
  [2, 0, 2],
  [2, 1, 2],
  [2, 2, 1],
  [2, 3, 1],
  [3, 0, 1],
  [3, 2, 1],
];

for (const [attempts, hints, stars] of TABLE) {
  const got = getStarRating(attempts, hints);
  check(
    `getStarRating(${attempts}, ${hints}) is ${stars}`,
    got === stars,
    `got ${got}`
  );
}

check('getStarRating(1, 0) is 3', getStarRating(1, 0) === 3);

// Any win is at least 1 star, and the result is always 1, 2 or 3
let minOk = true;
let rangeOk = true;
for (let attempts = 1; attempts <= 12; attempts++) {
  for (let hints = 0; hints <= 12; hints++) {
    const stars = getStarRating(attempts, hints);
    if (stars < 1) minOk = false;
    if (![1, 2, 3].includes(stars)) rangeOk = false;
  }
}
check('every win is at least 1 star', minOk);
check('rating is always 1, 2 or 3', rangeOk);

// 3 stars exactly when the game is perfect (1 attempt, 0 hints), so the
// existing perfectGames rule and the star rating cannot drift apart.
let equivalent = true;
for (let attempts = 1; attempts <= 12; attempts++) {
  for (let hints = 0; hints <= 12; hints++) {
    const perfect = attempts === 1 && hints === 0;
    if (perfect !== (getStarRating(attempts, hints) === 3)) equivalent = false;
  }
}
check('3 stars exactly when attempts === 1 and hints === 0', equivalent);

// ---------------------------------------------------------------------------
// Win panel star line and label
// ---------------------------------------------------------------------------

check('3 stars reads ⭐⭐⭐', getStarLine(3) === '⭐⭐⭐', getStarLine(3));
check('2 stars reads ⭐⭐☆', getStarLine(2) === '⭐⭐☆', getStarLine(2));
check('1 star reads ⭐☆☆', getStarLine(1) === '⭐☆☆', getStarLine(1));
check(
  'every rating has its word',
  STAR_LABELS[3] === 'Perfect!' && STAR_LABELS[2] === 'Nice work!' && STAR_LABELS[1] === 'Solved!'
);

// ---------------------------------------------------------------------------
// Star tally in the statistics
// ---------------------------------------------------------------------------

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const ZERO_LINE = 'Stars earned: ⭐ 0 · ⭐⭐ 0 · ⭐⭐⭐ 0';

// A fresh save starts at zero and shows zeros
check(
  'fresh stats tally is zero',
  same(getStarTally(loadStatistics().overall), { 1: 0, 2: 0, 3: 0 })
);
check(
  'fresh stats line shows zeros',
  formatStarsEarned(loadStatistics().overall) === ZERO_LINE
);

// Wins are counted by rating, and perfectGames always equals the 3-star count
updateStatistics('easy', 1, 0); // 3 stars
updateStatistics('easy', 1, 0); // 3 stars
updateStatistics('medium', 2, 1); // 2 stars
updateStatistics('hard', 3, 3); // 1 star
let overall = loadStatistics().overall;
check(
  'tally counts each win by rating',
  same(overall.stars, { 1: 1, 2: 1, 3: 2 }),
  JSON.stringify(overall.stars)
);
check('perfectGames equals the 3-star count', overall.perfectGames === overall.stars[3]);
check('totalCompleted equals the star total', overall.totalCompleted === 4);
check(
  'stars line reflects the tally',
  formatStarsEarned(overall) === 'Stars earned: ⭐ 1 · ⭐⭐ 1 · ⭐⭐⭐ 2'
);

// A save from before star ratings has no stars field: it must load, read as
// zeros, and every existing number must change exactly as it did before.
const old = getDefaultStats();
delete old.overall.stars;
Object.assign(old.overall, {
  totalCompleted: 9,
  totalAttempts: 14,
  totalHints: 5,
  perfectGames: 4,
  currentStreak: 2,
  bestStreak: 6,
});
Object.assign(old.medium, { completed: 3, attempts: 5, hints: 1, perfectGames: 2 });
store.sumwords_statistics = JSON.stringify(old);

check('old save reads as zero stars', same(getStarTally(loadStatistics().overall), { 1: 0, 2: 0, 3: 0 }));
check('old save shows a zero stars line', formatStarsEarned(loadStatistics().overall) === ZERO_LINE);

updateStatistics('medium', 2, 0); // 2 stars, not perfect
overall = loadStatistics().overall;
const medium = loadStatistics().medium;
check(
  'old save: stars start counting from the new win',
  same(overall.stars, { 1: 0, 2: 1, 3: 0 }),
  JSON.stringify(overall.stars)
);
check(
  'old save: existing overall totals change as before',
  overall.totalCompleted === 10 &&
    overall.totalAttempts === 16 &&
    overall.totalHints === 5 &&
    overall.perfectGames === 4 &&
    overall.currentStreak === 3 &&
    overall.bestStreak === 6
);
check(
  'old save: difficulty bucket changes as before',
  medium.completed === 4 &&
    medium.attempts === 7 &&
    medium.hints === 1 &&
    medium.perfectGames === 2
);

// Missing keys inside a partial stars object also read as zero
check('partial stars object reads as zeros', same(getStarTally({ stars: { 2: 5 } }), { 1: 0, 2: 5, 3: 0 }));
check('missing overall reads as zeros', same(getStarTally(undefined), { 1: 0, 2: 0, 3: 0 }));

// ---------------------------------------------------------------------------
// Play time: formatting and the clock
// ---------------------------------------------------------------------------

const clockStart = source.indexOf('/* ===================================\n  PLAY TIME');
const clockEnd = source.indexOf('/* ===================================\n  LOCAL STORAGE FUNCTIONS');
if (clockStart === -1 || clockEnd < clockStart) {
  console.error('Could not locate the play time section in V01/game.js (markers changed?)');
  process.exit(2);
}

/** A fresh clock sandbox with a fake Date.now, a fake document and a save counter. */
function makeClock() {
  const clock = {
    now: 0,
    saves: 0,
    listeners: {},
    sb: {
      gameState: { elapsedMs: 0, clockStartedAt: null, completed: false },
      currentPuzzle: {},
      document: {
        hidden: false,
        addEventListener(type, fn) {
          clock.listeners[type] = fn;
        },
      },
      Date: { now: () => clock.now },
      savePuzzleState: () => {
        clock.saves++;
      },
    },
  };
  vm.createContext(clock.sb);
  vm.runInContext(
    source.slice(clockStart, clockEnd) +
      '\n;this.startClock = startClock; this.bankClock = bankClock;' +
      ' this.getElapsedMs = getElapsedMs; this.resetClock = resetClock;' +
      ' this.isValidPlayTime = isValidPlayTime; this.formatPlayTime = formatPlayTime;',
    clock.sb
  );
  return clock;
}

{
  const { sb } = makeClock();
  const cases = [
    [0, '0:00'],
    [5000, '0:05'],
    [59999, '0:59'],
    [60000, '1:00'],
    [161000, '2:41'],
    [3599000, '59:59'],
    [3600000, '1:00:00'],
    [3909000, '1:05:09'],
    [-500, '0:00'],
  ];
  for (const [ms, text] of cases) {
    check(`formatPlayTime(${ms}) is ${text}`, sb.formatPlayTime(ms) === text, sb.formatPlayTime(ms));
  }

  check('0 is a valid play time', sb.isValidPlayTime(0) === true);
  check('a positive number is a valid play time', sb.isValidPlayTime(1500) === true);
  check(
    'missing, null, text, negative and NaN are not valid play times',
    [undefined, null, '5', -1, NaN, Infinity].every((v) => sb.isValidPlayTime(v) === false)
  );
}

{
  // Counting, banking and the final time
  const clock = makeClock();
  const { sb } = clock;
  clock.now = 1000;
  sb.startClock();
  clock.now = 6000;
  check('running clock reports the time so far', sb.getElapsedMs() === 5000, String(sb.getElapsedMs()));
  sb.bankClock();
  check('banking adds the stretch and stops the clock', sb.gameState.elapsedMs === 5000 && sb.gameState.clockStartedAt === null);
  clock.now = 999999;
  check('a stopped clock does not move', sb.getElapsedMs() === 5000);
  sb.startClock();
  sb.gameState.completed = true;
  clock.now += 2000;
  sb.bankClock();
  check('time stops at the win and stays fixed', sb.getElapsedMs() === 7000 && sb.gameState.clockStartedAt === null);
}

{
  // The clock only runs for a visible, unfinished puzzle on screen
  const hidden = makeClock();
  hidden.sb.document.hidden = true;
  hidden.sb.startClock();
  check('clock does not start in a hidden tab', hidden.sb.gameState.clockStartedAt === null);

  const won = makeClock();
  won.sb.gameState.completed = true;
  won.sb.startClock();
  check('clock does not start on a won puzzle', won.sb.gameState.clockStartedAt === null);

  const none = makeClock();
  none.sb.currentPuzzle = null;
  none.sb.startClock();
  check('clock does not start with no puzzle on screen', none.sb.gameState.clockStartedAt === null);
}

{
  // Hiding the tab pauses the clock and saves; the hidden minute is not counted
  const clock = makeClock();
  const { sb } = clock;
  clock.now = 10000;
  sb.startClock();
  clock.now = 12000;
  sb.document.hidden = true;
  clock.listeners.visibilitychange();
  check('hiding the tab banks the time so far', sb.gameState.elapsedMs === 2000 && sb.gameState.clockStartedAt === null);
  check('hiding the tab saves the puzzle once', clock.saves === 1, String(clock.saves));

  clock.now = 72000; // a minute passes while hidden
  sb.document.hidden = false;
  clock.listeners.visibilitychange();
  check('showing the tab runs the clock again', sb.gameState.clockStartedAt === 72000);
  clock.now = 75000;
  check('the hidden minute is not counted', sb.getElapsedMs() === 5000, String(sb.getElapsedMs()));

  // After a win, hiding the tab must not save a puzzle that could be resumed
  sb.gameState.completed = true;
  sb.bankClock();
  sb.document.hidden = true;
  clock.listeners.visibilitychange();
  check('hiding the tab after a win does not save', clock.saves === 1, String(clock.saves));
}

{
  // Reset starts the time over and runs it again
  const clock = makeClock();
  const { sb } = clock;
  clock.now = 1000;
  sb.startClock();
  clock.now = 9000;
  sb.resetClock();
  check('reset clears the time and runs again', sb.gameState.elapsedMs === 0 && sb.gameState.clockStartedAt === 9000);
  clock.now = 10000;
  check('time after a reset counts from the reset', sb.getElapsedMs() === 1000);
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
