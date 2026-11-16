#!/usr/bin/env node
/**
 * Hint gesture structure test.
 *
 * The reveal functions read and write the page, so this checks what can be
 * checked without a browser: every equation card has a Hint button wired to
 * its own choice row, the removed bottom buttons and selection code are really
 * gone, and the tip text matches the new flow. No dependencies: run with
 * `node tests/hints.test.js`.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const read = (...parts) =>
  fs
    .readFileSync(path.join(__dirname, '..', ...parts), 'utf8')
    .split('\r\n')
    .join('\n');

const html = read('V01', 'index.html');
const js = read('V01', 'game.js');
const css = read('V01', 'styles.css');
const landing = read('landing', 'index.html');

let failures = 0;
function check(name, ok) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failures++;
}

// --- Markup: one Hint button and one choice row per equation card ----------

const cards = [...html.matchAll(/<div class="equation" data-equation="(\d+)"/g)];
check('five equation cards', cards.length === 5);

cards.forEach(([, id]) => {
  const button = new RegExp(
    `class="btn-hint-equation"\\s+data-equation="${id}"\\s+aria-expanded="false"\\s+aria-controls="hint-choices-${id}"`
  );
  check(`equation ${id}: Hint button with aria-expanded and aria-controls`, button.test(html));

  const row = new RegExp(
    `id="hint-choices-${id}"\\s+role="group"\\s+aria-label="Hint options for equation ${id}"\\s+hidden`
  );
  check(`equation ${id}: labelled choice row starts hidden`, row.test(html));

  ['answer', 'numbers', 'cancel'].forEach((type) => {
    const choice = new RegExp(
      `class="btn-hint-choice"\\s+data-equation="${id}"\\s+data-hint="${type}"`
    );
    check(`equation ${id}: ${type} choice`, choice.test(html));
  });
});

// --- Removed code stays removed --------------------------------------------

const REMOVED = [
  'selectedEquationForHint',
  'updateHintButtonStates',
  'handleEquationSelect',
  'deselectEquation',
  'exitHintMode',
  'hintMode',
  'selected-for-hint',
  'reveal-answer-btn',
  'reveal-numbers-btn',
];
REMOVED.forEach((name) => {
  const found = [js, html, css].some((text) => text.includes(name));
  check(`"${name}" is gone`, !found);
});

// --- Wiring ----------------------------------------------------------------

check(
  'reveal functions take an equation id',
  /function revealAnswer\(equationId\)/.test(js) &&
    /function revealNumbers\(equationId\)/.test(js)
);

// --- Tip text --------------------------------------------------------------

check('tutorial tip updated', html.includes('Tap Hint on an equation to reveal its answer or its numbers'));
check(
  'landing tip updated',
  /Tap Hint on an equation to reveal\s+its answer or its numbers/.test(landing)
);

console.log(failures === 0 ? '\nAll hint checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
