#!/usr/bin/env node
/**
 * Tutorial test: the How to Play replay and the dialog behaviour of the tutorial
 * overlay.
 *
 * Static checks on V01/index.html (button placement, dialog attributes, the
 * Keyboard controls section) and V01/game.js (the replay wiring).
 *
 * Behaviour checks load the real tutorial functions from V01/game.js via Node's
 * `vm` module, with stub objects for the DOM and localStorage, and check that a
 * replay never writes the "seen" flag and returns focus correctly.
 *
 * Run with `node tests/tutorial.test.js`.
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

// ---- index.html: button and dialog ----
console.log('index.html');

const headerStart = html.indexOf('id="header-controls"');
const headerEnd = html.indexOf('</header>', headerStart);
const headerBlock = html.slice(headerStart, headerEnd);
check(
  'How to Play button is inside #header-controls',
  /id="how-to-play-btn"/.test(headerBlock)
);
check(
  'How to Play button uses the header button class',
  /<button class="btn-header" id="how-to-play-btn">📖 How to Play<\/button>/.test(
    headerBlock
  )
);

const overlayMatch = html.match(/<div\s+id="tutorial-overlay"[\s\S]*?>/);
const overlayOpen = overlayMatch ? overlayMatch[0] : '';
check('tutorial overlay has role="dialog"', /role="dialog"/.test(overlayOpen));
check('tutorial overlay has aria-modal="true"', /aria-modal="true"/.test(overlayOpen));
check(
  'tutorial overlay has aria-labelledby="tutorial-title"',
  /aria-labelledby="tutorial-title"/.test(overlayOpen)
);
check(
  'the labelled heading exists and takes programmatic focus',
  /<h2 id="tutorial-title" tabindex="-1">/.test(html)
);

// ---- index.html: Keyboard controls section ----
const details = html.match(/<details class="tutorial-details">([\s\S]*?)<\/details>/);
const keysBlock = details ? details[1] : '';
check('Keyboard controls is a <details> element', Boolean(details));
check(
  'Keyboard controls summary text',
  /<summary>⌨️ Keyboard controls<\/summary>/.test(keysBlock)
);
check(
  'the <details> starts collapsed (no open attribute)',
  details !== null && !/<details[^>]*\sopen/.test(details[0])
);
for (const phrase of [
  'Tab',
  'Type a number',
  'Arrow keys',
  'Enter or Space',
  'Backspace or Delete',
  'Escape',
  'Ctrl+Z',
]) {
  check(`Keyboard section lists ${phrase}`, keysBlock.includes(`<strong>${phrase}</strong>`));
}

check(
  'checkbox label has the id the replay mode hides',
  /<label class="tutorial-checkbox" id="tutorial-checkbox">/.test(html)
);

// ---- game.js: wiring ----
console.log('game.js');

check(
  'How to Play button opens the tutorial in replay mode',
  /getElementById\('how-to-play-btn'\)[\s\S]*?openTutorial\('replay'\)/.test(game)
);
check(
  'DOMContentLoaded sets up the tutorial before the first-visit check',
  /setupTutorial\(\);\s*\n\s*showTutorialIfFirstVisit\(\);/.test(game)
);

// ---- behaviour: load the real tutorial functions ----
console.log('behaviour');

const blockStart = game.indexOf('let tutorialMode');
const keydownStart = game.indexOf('function handleTutorialKeydown');
const keydownEnd = game.indexOf('\n}\n', keydownStart) + 3;
if (blockStart === -1 || keydownStart === -1 || keydownEnd < 3) {
  console.log('  FAIL could not locate the tutorial functions in game.js');
  process.exit(2);
}
const tutorialSource = game.slice(blockStart, keydownEnd);

function makeEnvironment() {
  const flags = {};
  const storage = {
    writes: [],
    getItem: (key) => (key in flags ? flags[key] : null),
    setItem: (key, value) => {
      storage.writes.push(key);
      flags[key] = value;
    },
  };

  const makeClassList = (el) => ({
    contains: (name) => el.classes.has(name),
    add: (name) => el.classes.add(name),
    remove: (name) => el.classes.delete(name),
  });
  const makeElement = (overrides = {}) => {
    const el = {
      classes: new Set(),
      checked: false,
      hidden: false,
      textContent: '',
      offsetParent: {},
      focusCount: 0,
      focus() {
        this.focusCount++;
      },
      ...overrides,
    };
    el.classList = makeClassList(el);
    return el;
  };

  const elements = {
    'tutorial-overlay': makeElement({ classes: new Set(['hidden']) }),
    'tutorial-title': makeElement(),
    'tutorial-checkbox': makeElement(),
    'tutorial-close': makeElement(),
    'tutorial-dont-show': makeElement(),
    'how-to-play-btn': makeElement(),
    'menu-toggle': makeElement(),
  };

  const context = {
    localStorage: storage,
    document: {
      getElementById: (id) => elements[id] || null,
    },
    window: {},
  };
  vm.createContext(context);
  vm.runInContext(
    tutorialSource +
      `
this.openTutorial = openTutorial;
this.closeTutorial = closeTutorial;
this.setTutorialMode = (m) => { tutorialMode = m; };
`,
    context
  );
  return { context, elements, storage };
}

{
  const { context, elements, storage } = makeEnvironment();
  context.openTutorial('first');
  check(
    'first visit: overlay opens and the checkbox is shown',
    !elements['tutorial-overlay'].classes.has('hidden') && elements['tutorial-checkbox'].hidden === false
  );
  check(
    "first visit: button reads \"Got It! Let's Play\"",
    elements['tutorial-close'].textContent === "Got It! Let's Play"
  );
  check('first visit: focus moves to the heading', elements['tutorial-title'].focusCount === 1);

  context.closeTutorial();
  check('first visit, box unticked: closing sets no flag', storage.writes.length === 0);
}

{
  const { context, elements, storage } = makeEnvironment();
  elements['tutorial-dont-show'].checked = true;
  context.openTutorial('first');
  context.closeTutorial();
  check(
    'first visit, box ticked: closing saves sumwords_tutorial_seen',
    storage.writes.length === 1 && storage.writes[0] === 'sumwords_tutorial_seen'
  );
}

{
  const { context, elements, storage } = makeEnvironment();
  elements['tutorial-dont-show'].checked = true;
  context.openTutorial('replay');
  check(
    'replay: checkbox is hidden and button reads Close',
    elements['tutorial-checkbox'].hidden === true && elements['tutorial-close'].textContent === 'Close'
  );
  context.closeTutorial();
  check(
    'replay: closing with the box ticked never writes the seen flag',
    storage.writes.length === 0
  );
  check(
    'replay: overlay hides and focus returns to How to Play',
    elements['tutorial-overlay'].classes.has('hidden') && elements['how-to-play-btn'].focusCount === 1
  );
}

{
  // Phones: How to Play sits in the closed header menu, so focus goes to the toggle
  const { context, elements } = makeEnvironment();
  elements['how-to-play-btn'].offsetParent = null;
  context.openTutorial('replay');
  context.closeTutorial();
  check(
    'replay with the menu closed: focus goes to the menu toggle',
    elements['menu-toggle'].focusCount === 1 && elements['how-to-play-btn'].focusCount === 0
  );
}

if (failures > 0) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll tutorial checks passed');
