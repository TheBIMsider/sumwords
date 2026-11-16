#!/usr/bin/env node
/**
 * Puzzle solvability test.
 *
 * Runs the real generatePuzzle / generateOperands from V01/game.js many times
 * and checks every puzzle is solvable. No dependencies: run with `node tests/generator.test.js`.
 *
 * game.js is a browser script (it touches `document` at load), so only the
 * question-bank + generator section is loaded, via Node's `vm` module.
 * game.js itself is not modified.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PUZZLES_PER_COMBO = 1000;
const CATEGORIES = ['sports', 'everything'];
const DIFFICULTIES = {
  easy: { range: 50, pool: 10 },
  medium: { range: 100, pool: 12 },
  hard: { range: 200, pool: 16 },
};

// ---------------------------------------------------------------------------
// Load the real generator code from game.js
// ---------------------------------------------------------------------------

const source = fs.readFileSync(
  path.join(__dirname, '..', 'V01', 'game.js'),
  'utf8'
);
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

// Silence the generator's debug output inside the sandbox only.
const sandbox = {
  console: { log() {}, warn() {}, error() {} },
  // generatePuzzle writes to gameState; give it a throwaway one.
  gameState: {},
};
vm.createContext(sandbox);
vm.runInContext(
  source.slice(start, end) +
    '\n;this.generatePuzzle = generatePuzzle; this.generateOperands = generateOperands; this.questionBanks = questionBanks;',
  sandbox
);
const { generatePuzzle, questionBanks } = sandbox;

// ---------------------------------------------------------------------------
// Question bank rules
// ---------------------------------------------------------------------------

// Policy: answers run from 2 to 400. 400 is the largest answer that two
// operands of at most 200 can add up to (Hard). Larger answers can never be
// built, and 0 or 1 cannot be built as a sum of two whole numbers of at least 1.
const BANK_MIN_ANSWER = 2;
const BANK_MAX_ANSWER = 400;
const BANK_CATEGORIES = 10;
const BANK_PER_CATEGORY = 50;

function checkBank(banks) {
  const problems = [];
  const names = Object.keys(banks);
  if (names.length !== BANK_CATEGORIES) {
    problems.push(`expected ${BANK_CATEGORIES} categories, found ${names.length}`);
  }
  const seen = new Map();
  for (const name of names) {
    if (banks[name].length !== BANK_PER_CATEGORY) {
      problems.push(`${name}: expected ${BANK_PER_CATEGORY} questions, found ${banks[name].length}`);
    }
    for (const q of banks[name]) {
      const key = q.question.trim().toLowerCase();
      if (seen.has(key)) {
        problems.push(`duplicate question "${q.question}" in ${seen.get(key)} and ${name}`);
      } else {
        seen.set(key, name);
      }
      if (!Number.isInteger(q.answer)) {
        problems.push(`${name}: non-integer answer for "${q.question}"`);
      } else if (q.answer < BANK_MIN_ANSWER || q.answer > BANK_MAX_ANSWER) {
        problems.push(`${name}: answer ${q.answer} outside ${BANK_MIN_ANSWER}..${BANK_MAX_ANSWER} for "${q.question}"`);
      }
    }
  }
  return problems;
}

const bankProblems = checkBank(questionBanks);
if (bankProblems.length) {
  console.log('Question bank: FAIL');
  for (const p of bankProblems) console.log('  - ' + p);
} else {
  console.log(
    `Question bank: ok (${BANK_CATEGORIES * BANK_PER_CATEGORY} unique questions)`
  );
}
console.log('');


// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

const isWhole = (n) => typeof n === 'number' && Number.isInteger(n);

// Operators allowed at each difficulty (mirrors getOperatorsForDifficulty)
const OPERATORS = {
  easy: ['+', '-'],
  medium: ['+', '-'],
  hard: ['+', '-', '×', '÷'],
};

function applyOperator(op, a, b) {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? NaN : a / b;
    default:
      return undefined;
  }
}

/** Returns a list of { cause, detail } problems for one puzzle. */
function checkPuzzle(puzzle, difficulty) {
  const { range, pool } = DIFFICULTIES[difficulty];
  const problems = [];
  const add = (cause, detail) => problems.push({ cause, detail });

  if (!puzzle) {
    add('no puzzle returned', 'generatePuzzle returned null');
    return problems;
  }

  let sum1 = 0;
  let sum2 = 0;
  const poolCopy = [...puzzle.numberPool];

  for (const eq of puzzle.equations) {
    const { operand1: a, operand2: b } = eq.solution;
    const label = `eq${eq.id} (${a} ${eq.operator} ${b} = ${eq.answer})`;

    if (!isWhole(eq.answer)) {
      add('answer not a whole number', label);
    }
    for (const n of [a, b]) {
      if (!isWhole(n) || n < 1 || n > range) {
        add(`operand outside 1..${range}`, `${label}, operand ${n}`);
        break;
      }
    }

    const result = applyOperator(eq.operator, a, b);
    if (result === undefined) {
      add(
        'unrecognised operator',
        `${label}, operator codes: ${[...eq.operator]
          .map((c) => 'U+' + c.codePointAt(0).toString(16))
          .join(' ')}`
      );
    } else if (result !== eq.answer) {
      add('operator does not give answer', `${label}, actually ${result}`);
    }

    // Operators are hidden on Medium/Hard, so no OTHER allowed operator may
    // also give the answer (e.g. 2 + 2 = 2 × 2 would have two right answers)
    for (const other of OPERATORS[difficulty]) {
      if (other !== eq.operator && applyOperator(other, a, b) === eq.answer) {
        add('ambiguous operator', `${label}, ${other} also gives ${eq.answer}`);
      }
    }

    sum1 += a;
    sum2 += b;
    for (const n of [a, b]) {
      const i = poolCopy.indexOf(n);
      if (i === -1) add('operand missing from pool', `${label}, operand ${n}`);
      else poolCopy.splice(i, 1);
    }
  }

  if (puzzle.columnTargets.column1 !== sum1) {
    add(
      'column 1 target mismatch',
      `target ${puzzle.columnTargets.column1}, operands sum ${sum1}`
    );
  }
  if (puzzle.columnTargets.column2 !== sum2) {
    add(
      'column 2 target mismatch',
      `target ${puzzle.columnTargets.column2}, operands sum ${sum2}`
    );
  }
  if (puzzle.numberPool.length !== pool) {
    add(
      'wrong pool size',
      `expected ${pool}, got ${puzzle.numberPool.length}`
    );
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

let totalBroken = bankProblems.length;
const examples = [];
const rows = [];

for (const difficulty of Object.keys(DIFFICULTIES)) {
  for (const category of CATEGORIES) {
    let broken = 0;
    const causes = {};
    for (let i = 0; i < PUZZLES_PER_COMBO; i++) {
      const puzzle = generatePuzzle(category, difficulty);
      const problems = checkPuzzle(puzzle, difficulty);
      if (problems.length) {
        broken++;
        for (const p of problems) causes[p.cause] = (causes[p.cause] || 0) + 1;
        if (examples.length < 6 && !examples.some((e) => e.difficulty === difficulty && e.category === category)) {
          examples.push({ difficulty, category, problems, puzzle });
        }
      }
    }
    totalBroken += broken;
    rows.push({ difficulty, category, broken, causes });
  }
}

console.log(
  `Solvability test: ${PUZZLES_PER_COMBO} puzzles per difficulty/category\n`
);
for (const r of rows) {
  const pct = ((r.broken / PUZZLES_PER_COMBO) * 100).toFixed(1);
  const status = r.broken ? 'FAIL' : 'ok  ';
  console.log(
    `${status} ${r.difficulty.padEnd(7)} ${r.category.padEnd(11)} ${String(
      r.broken
    ).padStart(4)}/${PUZZLES_PER_COMBO} broken (${pct}%)`
  );
  for (const [cause, count] of Object.entries(r.causes)) {
    console.log(`       - ${cause}: ${count} equation/puzzle checks`);
  }
}

// ---------------------------------------------------------------------------
// Ambiguity sweep: every answer the bank allows, every operator, every
// difficulty. generateOperands must never return a pair where another allowed
// operator also gives the answer. (It may return null: that question is
// skipped and the puzzle uses another.)
// ---------------------------------------------------------------------------

const SWEEP_TRIES = 30;
let ambiguousPairs = 0;
const ambiguousExamples = [];
for (const difficulty of Object.keys(DIFFICULTIES)) {
  for (const operator of OPERATORS[difficulty]) {
    for (let answer = BANK_MIN_ANSWER; answer <= BANK_MAX_ANSWER; answer++) {
      for (let t = 0; t < SWEEP_TRIES; t++) {
        const pair = sandbox.generateOperands(answer, operator, difficulty);
        if (!pair) continue;
        const other = OPERATORS[difficulty].find(
          (o) => o !== operator && applyOperator(o, pair.op1, pair.op2) === answer
        );
        if (other) {
          ambiguousPairs++;
          if (ambiguousExamples.length < 5) {
            ambiguousExamples.push(
              `${difficulty}: ${pair.op1} ${operator} ${pair.op2} = ${answer}, but ${other} also gives ${answer}`
            );
          }
        }
      }
    }
  }
}
console.log(
  `\nAmbiguity sweep: ${ambiguousPairs ? 'FAIL' : 'ok  '} ${ambiguousPairs} ambiguous operand pairs`
);
for (const line of ambiguousExamples) console.log(`       - ${line}`);
totalBroken += ambiguousPairs;

if (examples.length) {
  console.log('\nExample failures (to reproduce):');
  for (const ex of examples) {
    console.log(`\n[${ex.difficulty} / ${ex.category}]`);
    for (const p of ex.problems) console.log(`  ${p.cause}: ${p.detail}`);
    console.log('  ' + JSON.stringify(ex.puzzle));
  }
}

if (totalBroken) {
  console.log(`\nFAILED: ${totalBroken} broken puzzles`);
  process.exit(1);
}
console.log('\nPASSED: every generated puzzle is solvable');
