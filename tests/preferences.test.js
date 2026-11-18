#!/usr/bin/env node
/**
 * Preferences test: the remembered category and difficulty.
 *
 * Loads the real loadPreferences / sanitizePreferences / readSelectValues from
 * V01/game.js via Node's `vm` module, with a stub localStorage and console, and
 * checks that bad stored values fall back per field without throwing or logging.
 *
 * Static checks confirm that initializeGame and leaveDaily use the helper, that
 * loadDailyBoard never saves preferences, and that the valid category and
 * difficulty values match the <option>s in V01/index.html.
 *
 * Run with `node tests/preferences.test.js`. No dependencies.
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
    console.log('PASS ' + name);
  } else {
    failures++;
    console.log('FAIL ' + name);
  }
}

// ---------------------------------------------------------------------------
// Helpers for pulling pieces out of game.js
// ---------------------------------------------------------------------------

// Source from a start marker up to (not including) an end marker
function section(startMarker, endMarker) {
  const start = game.indexOf(startMarker);
  const end = game.indexOf(endMarker, start + 1);
  if (start === -1 || end === -1) {
    throw new Error('Marker not found: ' + startMarker.slice(0, 40));
  }
  return game.slice(start, end);
}

// Body of a top-level function, found by matching braces (game.js has no
// braces inside strings in these functions)
function functionSource(name) {
  const start = game.indexOf('function ' + name + '(');
  if (start === -1) throw new Error('Function not found: ' + name);
  const open = game.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < game.length; i++) {
    if (game[i] === '{') depth++;
    if (game[i] === '}') {
      depth--;
      if (depth === 0) return game.slice(start, i + 1);
    }
  }
  throw new Error('Unclosed function: ' + name);
}

// Option values of one <select> in index.html
function optionValues(selectId) {
  const block = html.match(
    new RegExp('<select id="' + selectId + '"[\\s\\S]*?</select>')
  );
  if (!block) return null;
  return [...block[0].matchAll(/<option value="([^"]*)"/g)].map((m) => m[1]);
}

// ---------------------------------------------------------------------------
// Load the preference code into a sandbox with stub storage and console
// ---------------------------------------------------------------------------

const prefsSource = section(
  '/**\n * Save user preferences',
  '/**\n * Initialize statistics object'
);

function loadPreferenceCode(storedValue) {
  const logs = [];
  const storage = new Map();
  if (storedValue !== undefined) storage.set('sumwords_preferences', storedValue);
  const sandbox = {
    console: {
      log: (...a) => logs.push(['log', a]),
      warn: (...a) => logs.push(['warn', a]),
      error: (...a) => logs.push(['error', a]),
    },
    gameState: {},
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(
    prefsSource +
      '\n;this.sanitizePreferences = sanitizePreferences;' +
      ' this.loadPreferences = loadPreferences;' +
      ' this.readSelectValues = readSelectValues;' +
      ' this.DEFAULT_PREFERENCES = DEFAULT_PREFERENCES;',
    sandbox
  );
  return { api: sandbox, logs, storage };
}

const { api } = loadPreferenceCode();
const CATEGORIES = optionValues('category-select');
const DIFFICULTIES = optionValues('difficulty-select');

// ---------------------------------------------------------------------------
// The option lists in index.html
// ---------------------------------------------------------------------------

console.log('\n-- Select options --');
check('index.html has a category select with options', CATEGORIES && CATEGORIES.length > 0);
check('index.html has a difficulty select with options', DIFFICULTIES && DIFFICULTIES.length > 0);
check(
  'default category "sports" and difficulty "random" are options',
  CATEGORIES.includes('sports') && DIFFICULTIES.includes('random')
);
check(
  'the category list includes everything and the step 14 categories',
  ['everything', 'music', 'holidays'].every((c) => CATEGORIES.includes(c))
);

// ---------------------------------------------------------------------------
// sanitizePreferences: pure behaviour
// ---------------------------------------------------------------------------

console.log('\n-- sanitizePreferences: valid pairs kept --');
const sanitize = (saved) =>
  api.sanitizePreferences(saved, CATEGORIES, DIFFICULTIES);

const valid = sanitize({ category: 'music', difficulty: 'hard' });
check('keeps a valid pair', valid.category === 'music' && valid.difficulty === 'hard');
check('keeps "random" difficulty', sanitize({ category: 'sports', difficulty: 'random' }).difficulty === 'random');
check('keeps "everything" category', sanitize({ category: 'everything', difficulty: 'easy' }).category === 'everything');
check('ignores extra fields and keeps the valid pair', (() => {
  const r = sanitize({ category: 'music', difficulty: 'easy', extra: 1 });
  return r.category === 'music' && r.difficulty === 'easy' && Object.keys(r).length === 2;
})());

console.log('\n-- sanitizePreferences: each field checked on its own --');
let r = sanitize({ category: 'nope', difficulty: 'hard' });
check('bad category falls back to sports, good difficulty kept', r.category === 'sports' && r.difficulty === 'hard');
r = sanitize({ category: 'music', difficulty: 'nope' });
check('bad difficulty falls back to random, good category kept', r.category === 'music' && r.difficulty === 'random');
r = sanitize({ category: 'music' });
check('missing difficulty falls back to random, category kept', r.category === 'music' && r.difficulty === 'random');
r = sanitize({ difficulty: 'hard' });
check('missing category falls back to sports, difficulty kept', r.category === 'sports' && r.difficulty === 'hard');
r = sanitize({});
check('empty object gives both defaults', r.category === 'sports' && r.difficulty === 'random');

console.log('\n-- sanitizePreferences: wrong types and shapes --');
const badInputs = {
  null: null,
  'an array': [],
  'an array with items': ['music', 'hard'],
  number: 5,
  string: 'x',
  boolean: true,
  undefined: undefined,
};
for (const [label, input] of Object.entries(badInputs)) {
  const out = sanitize(input);
  check(
    'saved = ' + label + ' gives sports / random',
    out.category === 'sports' && out.difficulty === 'random'
  );
}
r = sanitize({ category: 123, difficulty: null });
check('numeric category and null difficulty give defaults', r.category === 'sports' && r.difficulty === 'random');
r = sanitize({ category: ['music'], difficulty: { level: 'hard' } });
check('array and object values give defaults', r.category === 'sports' && r.difficulty === 'random');
r = sanitize({ category: 'Music', difficulty: 'HARD' });
check('case mismatch is not an option, falls back', r.category === 'sports' && r.difficulty === 'random');
r = sanitize({ category: '', difficulty: '' });
check('empty strings fall back', r.category === 'sports' && r.difficulty === 'random');
r = sanitize({ category: 'constructor', difficulty: 'toString' });
check('prototype names do not count as options', r.category === 'sports' && r.difficulty === 'random');

console.log('\n-- sanitizePreferences: pure (no DOM, no storage) --');
const seenValid = [...CATEGORIES];
const seenInput = { category: 'music', difficulty: 'hard' };
api.sanitizePreferences(seenInput, seenValid, DIFFICULTIES);
check('does not change its input', seenInput.category === 'music' && seenInput.difficulty === 'hard');
check('does not change the valid list', seenValid.length === CATEGORIES.length);

// ---------------------------------------------------------------------------
// loadPreferences: corrupt storage is dropped silently
// ---------------------------------------------------------------------------

console.log('\n-- loadPreferences with stored values --');
{
  const env = loadPreferenceCode('{"category":"music","difficulty":"hard"}');
  const loaded = env.api.loadPreferences();
  check('reads a valid stored object', loaded.category === 'music' && loaded.difficulty === 'hard');
}
{
  const env = loadPreferenceCode('{not json');
  const loaded = env.api.loadPreferences();
  check('invalid JSON returns null', loaded === null);
  check('invalid JSON removes the stored key', !env.storage.has('sumwords_preferences'));
  check('invalid JSON logs nothing', env.logs.length === 0);
}
{
  const env = loadPreferenceCode(undefined);
  check('no stored value returns null', env.api.loadPreferences() === null);
}
{
  const env = loadPreferenceCode('null');
  const out = env.api.sanitizePreferences(env.api.loadPreferences(), CATEGORIES, DIFFICULTIES);
  check('stored "null" resolves to the defaults', out.category === 'sports' && out.difficulty === 'random');
}
{
  const env = loadPreferenceCode('"x"');
  const out = env.api.sanitizePreferences(env.api.loadPreferences(), CATEGORIES, DIFFICULTIES);
  check('stored string resolves to the defaults, no log', out.category === 'sports' && env.logs.length === 0);
}

// ---------------------------------------------------------------------------
// readSelectValues: reads option values from a select-like object
// ---------------------------------------------------------------------------

console.log('\n-- readSelectValues --');
{
  const env = loadPreferenceCode();
  const fakeSelect = {
    options: [{ value: 'sports' }, { value: 'music' }],
  };
  const values = env.api.readSelectValues(fakeSelect);
  check('returns the option values in order', values.length === 2 && values[0] === 'sports' && values[1] === 'music');
}

// ---------------------------------------------------------------------------
// Call sites: one code path
// ---------------------------------------------------------------------------

console.log('\n-- Call sites --');
const initSrc = functionSource('initializeGame');
const leaveSrc = functionSource('leaveDaily');
const dailySrc = functionSource('loadDailyBoard');

check('initializeGame calls sanitizePreferences', /sanitizePreferences\(/.test(initSrc));
check('initializeGame reads options from the selects', /readSelectValues\(categorySelect\)/.test(initSrc) && /readSelectValues\(difficultySelect\)/.test(initSrc));
check('initializeGame no longer reads the raw saved object', !/savedPreferences\.category/.test(initSrc));
check('leaveDaily calls sanitizePreferences', /sanitizePreferences\(/.test(leaveSrc));
check('leaveDaily no longer uses its own inline defaults', !/category: 'sports'/.test(leaveSrc));
check('loadDailyBoard does not call savePreferences', !/savePreferences\(/.test(dailySrc));
check('no hard-coded second list of categories in game.js', !/['"]music['"]\s*,\s*['"]spaceastronomy['"]/.test(game));

// Defaults stay in sync with the dropdown's first options
check(
  'DEFAULT_PREFERENCES category is an option',
  CATEGORIES.includes(api.DEFAULT_PREFERENCES.category)
);
check(
  'DEFAULT_PREFERENCES difficulty is an option',
  DIFFICULTIES.includes(api.DEFAULT_PREFERENCES.difficulty)
);

console.log('');
if (failures > 0) {
  console.log(failures + ' check(s) failed.');
  process.exit(1);
}
console.log('All preferences checks passed.');
