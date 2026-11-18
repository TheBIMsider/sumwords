#!/usr/bin/env node
/**
 * Streak display tests: the header chip that shows the current win streak.
 *
 * Static checks on V01/index.html (chip placement) and V01/game.js (the
 * refresh function and its call sites after a win, a Reset and Reset Stats).
 *
 * Behaviour checks load the real streak functions from V01/game.js via Node's
 * `vm` module, with stub objects for the DOM and localStorage. They check the
 * text, label and muted class, the defensive read, and that refreshing the
 * chip never writes storage.
 *
 * Run with `node tests/streak.test.js`.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (file) =>
  fs.readFileSync(path.join(root, file), 'utf8').split('\r\n').join('\n');

const html = read(path.join('V01', 'index.html'));
const game = read(path.join('V01', 'game.js'));

let failures = 0;
function check(name, condition) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.log(`  FAIL ${name}`);
  }
}

/** Source of a top-level function: from `function name(` to the closing brace at column 0. */
function extract(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} not found in game.js`);
  const end = source.indexOf('\n}\n', start);
  return source.slice(start, end + 3);
}

// ---- index.html: chip placement ----
console.log('index.html');

const infoStart = html.indexOf('class="puzzle-info"');
const controlsStart = html.indexOf('id="header-controls"');
const chipIndex = html.indexOf('id="header-streak"');
check('the #header-streak chip exists', chipIndex >= 0);
check(
  'the chip sits inside .puzzle-info',
  infoStart >= 0 && chipIndex > infoStart && chipIndex < controlsStart
);
check('the chip is not inside #header-controls', chipIndex < controlsStart);

const chipTag = html.match(/<span\s+id="header-streak"[^>]*>/);
check('the chip is a span, not a button', chipTag !== null);
check('the chip is not focusable (no tabindex)', chipTag && !/tabindex/.test(chipTag[0]));
check('the chip has no live region', chipTag && !/aria-live|role=/.test(chipTag[0]));

// The phone copy sits beside the Menu button, outside the dropdown panel
const menuStart = html.indexOf('class="header-menu"');
const phoneChipIndex = html.indexOf('streak-chip-phone');
check(
  'a phone copy of the chip sits beside the Menu button',
  phoneChipIndex > menuStart &&
    phoneChipIndex > html.indexOf('id="menu-toggle"') &&
    phoneChipIndex < controlsStart
);
const phoneTag = html.slice(
  html.lastIndexOf('<span', phoneChipIndex),
  html.indexOf('>', phoneChipIndex)
);
check('the phone copy has no id (ids stay unique)', !/\sid=/.test(phoneTag));
check('the phone copy is not focusable', !/tabindex/.test(phoneTag));

// ---- game.js: call sites ----
console.log('game.js');

check('refreshStreakDisplay is defined', /function refreshStreakDisplay\(/.test(game));
check(
  'initializeGame calls refreshStreakDisplay',
  extract(game, 'initializeGame').includes('refreshStreakDisplay();')
);

const winBody = extract(game, 'handleWin');
const afterStats = winBody.indexOf('updateStatistics(');
const winRefresh = winBody.indexOf('refreshStreakDisplay();');
check(
  'the win path refreshes the chip after updateStatistics',
  afterStats >= 0 && winRefresh > afterStats
);

const resetBody = extract(game, 'handleReset');
check(
  'the Reset path refreshes the chip right after resetStreak()',
  /resetStreak\(\);\s*refreshStreakDisplay\(\);/.test(resetBody)
);

check(
  'handleResetStats refreshes the chip',
  extract(game, 'handleResetStats').includes('refreshStreakDisplay();')
);

const refreshBody = extract(game, 'refreshStreakDisplay');
check(
  'refreshStreakDisplay never writes storage',
  !/saveStatistics|localStorage\.(set|remove)/.test(refreshBody)
);

// ---- behaviour: the real functions, in a sandbox ----
console.log('behaviour');

function makeStorage(initial) {
  return {
    data: initial === undefined ? {} : { sumwords_statistics: initial },
    writes: 0,
    getItem(key) {
      return key in this.data ? this.data[key] : null;
    },
    setItem(key, value) {
      this.writes++;
      this.data[key] = String(value);
    },
    removeItem(key) {
      this.writes++;
      delete this.data[key];
    },
  };
}

function makeChip() {
  const classes = new Set();
  const attrs = {};
  return {
    textContent: '',
    classes,
    attrs,
    setAttribute(name, value) {
      attrs[name] = String(value);
    },
    getAttribute(name) {
      return attrs[name] === undefined ? null : attrs[name];
    },
    classList: {
      toggle(name, force) {
        if (force) classes.add(name);
        else classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
  };
}

function makeEnvironment(savedJson, { chipPresent = true } = {}) {
  const storage = makeStorage(savedJson);
  const chip = makeChip();
  const chips = chipPresent ? [chip] : [];
  const context = {
    localStorage: storage,
    console: { error() {} },
    document: {
      querySelectorAll: (selector) => (selector === '.streak-chip' ? chips : []),
    },
  };
  vm.createContext(context);
  const source = [
    'getDefaultStats',
    'loadStatistics',
    'getCurrentStreak',
    'formatStreakLabel',
    'refreshStreakDisplay',
  ]
    .map((name) => extract(game, name))
    .join('\n');
  vm.runInContext(
    source +
      '\nthis.getCurrentStreak = getCurrentStreak;' +
      '\nthis.formatStreakLabel = formatStreakLabel;' +
      '\nthis.refreshStreakDisplay = refreshStreakDisplay;',
    context
  );
  return { context, chip, storage };
}

const savedWith = (overall) => JSON.stringify({ overall });

// Reading the streak
{
  const { context } = makeEnvironment(savedWith({ currentStreak: 7 }));
  check('a saved streak of 7 reads as 7', context.getCurrentStreak() === 7);
}
{
  const { context } = makeEnvironment(undefined);
  check('no saved statistics reads as 0', context.getCurrentStreak() === 0);
}
{
  const { context } = makeEnvironment(savedWith({ totalCompleted: 3 }));
  check('a save without currentStreak reads as 0', context.getCurrentStreak() === 0);
}
{
  const bad = [
    ['a string', 'x'],
    ['a negative number', -3],
    ['a fraction', 2.5],
    ['null', null],
  ];
  for (const [label, value] of bad) {
    const { context } = makeEnvironment(savedWith({ currentStreak: value }));
    check(`${label} as currentStreak reads as 0`, context.getCurrentStreak() === 0);
  }
}
{
  const { context } = makeEnvironment(JSON.stringify({ overall: null }));
  check('an overall of null reads as 0', context.getCurrentStreak() === 0);
}
{
  const { context } = makeEnvironment('{ not json');
  check('a corrupt save reads as 0 without throwing', context.getCurrentStreak() === 0);
}

// Labels
{
  const { context } = makeEnvironment(undefined);
  check('label for 1 is singular', context.formatStreakLabel(1) === 'Current win streak: 1 win');
  check('label for 0 is plural', context.formatStreakLabel(0) === 'Current win streak: 0 wins');
  check('label for 12 is plural', context.formatStreakLabel(12) === 'Current win streak: 12 wins');
}

// Refreshing the chip
{
  const { context, chip, storage } = makeEnvironment(savedWith({ currentStreak: 7 }));
  const writesBefore = storage.writes;
  context.refreshStreakDisplay();
  check('refresh sets the text to the flame and streak', chip.textContent === '🔥 7');
  check(
    'refresh sets the aria-label',
    chip.getAttribute('aria-label') === 'Current win streak: 7 wins'
  );
  check('a streak of 7 is not muted', !chip.classList.contains('is-zero'));
  check('refresh writes nothing to storage', storage.writes === writesBefore);
}
{
  const { context, chip } = makeEnvironment(savedWith({ currentStreak: 1 }));
  context.refreshStreakDisplay();
  check(
    'a streak of 1 uses the singular label',
    chip.getAttribute('aria-label') === 'Current win streak: 1 win'
  );
}
{
  const { context, chip } = makeEnvironment(savedWith({ currentStreak: 4 }));
  context.refreshStreakDisplay();
  context.refreshStreakDisplay();
  check('refresh is safe to run twice', chip.textContent === '🔥 4');
}
{
  // A streak of 0 shows the muted chip (the class follows the value)
  const { context, chip } = makeEnvironment(savedWith({ currentStreak: 0 }));
  context.refreshStreakDisplay();
  check('a streak of 0 shows 🔥 0', chip.textContent === '🔥 0');
  check('a streak of 0 is muted', chip.classList.contains('is-zero'));
}
{
  const { context, chip } = makeEnvironment(savedWith({ currentStreak: -5 }));
  context.refreshStreakDisplay();
  check('a corrupted streak shows 🔥 0, never NaN', chip.textContent === '🔥 0');
  check('a corrupted streak has no NaN in the label', !/NaN/.test(chip.getAttribute('aria-label')));
}
{
  // No chip in the page: refresh must not throw
  const { context } = makeEnvironment(savedWith({ currentStreak: 2 }), {
    chipPresent: false,
  });
  let threw = false;
  try {
    context.refreshStreakDisplay();
  } catch (error) {
    threw = true;
  }
  check('refresh does nothing when the chip is missing', !threw);
}

console.log(failures === 0 ? '\nAll streak checks passed.' : `\n${failures} streak check(s) failed.`);
process.exitCode = failures === 0 ? 0 : 1;
