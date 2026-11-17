// ==========================================
// SUMWORDS GAME - MAIN JAVASCRIPT
// ==========================================

// ==========================================
// THEME MANAGEMENT
// ==========================================

/**
 * Initialize theme based on:
 * 1. Saved preference in localStorage
 * 2. System preference (prefers-color-scheme)
 * 3. Default to light mode
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem('sumwords_landing_theme');
  const systemPrefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches;

  // Priority: saved preference > system preference > light default
  const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

  applyTheme(theme);
}

/**
 * Apply theme to the document
 * @param {string} theme - 'light' or 'dark'
 */
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('sumwords_landing_theme', theme);
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

// Initialize theme on page load (before DOM content loads to prevent flash)
initializeTheme();

// Game version shown at the bottom of the game. Change it only here.
const GAME_VERSION = '1.2.0';

/**
 * Show the game version in the footer label
 */
function showGameVersion() {
  const versionLabel = document.getElementById('game-version');
  if (versionLabel) {
    versionLabel.textContent = `Sumwords v${GAME_VERSION}`;
  }
}

// Trivia questions (questionBanks) live in questions.js, loaded before this file.

/* ===================================
   PUZZLE GENERATOR
   =================================== */

/**
 * Where the generator gets its random numbers. Normal play uses Math.random.
 * A daily build swaps in a seeded generator and always puts Math.random back.
 */
let random = Math.random;

// Fixed salt mixed into every daily seed. Changing it changes every daily.
const DAILY_SALT = 'sumwords-daily';

// The daily series. Bump it by hand (and set a new DAILY_EPOCH) whenever a
// change alters the dailies: adding or editing questions, or a generator
// change. The pinned-date test in tests/daily.test.js fails when that happens.
// Dailies are numbered "series-day", for example #1-1, then #2-1 after a bump.
const DAILY_SERIES = 2;

// Day 1 of the current series: its first daily's local calendar date (YYYY-MM-DD)
const DAILY_EPOCH = '2026-11-17';

// Fixed settings for every daily, so all players compare the same puzzle
const DAILY_CATEGORY = 'everything';
const DAILY_DIFFICULTY = 'medium';

/**
 * FNV-1a 32-bit hash of a string (a small, readable hash for the daily seed)
 * @param {string} text - Any string
 * @returns {number} Unsigned 32-bit integer
 */
function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * mulberry32: a small seeded generator returning floats in [0, 1)
 * @param {number} seed - Unsigned 32-bit seed
 * @returns {function(): number} Next random number each time it is called
 */
function mulberry32(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build the daily puzzle for a date. Same date in, same puzzle out.
 * Uses the normal generator (Everything, Medium) with a seeded random source.
 * Math.random is restored even if generation throws.
 * @param {string} dateString - Local calendar date, YYYY-MM-DD
 * @returns {object|null} Puzzle object, or null if generation failed
 */
function generateDailyPuzzle(dateString) {
  try {
    random = mulberry32(fnv1a(`${DAILY_SALT}|${DAILY_SERIES}|${dateString}`));
    const puzzle = generatePuzzle(DAILY_CATEGORY, DAILY_DIFFICULTY);
    if (puzzle) puzzle.id = `daily_${DAILY_SERIES}_${dateString}`;
    return puzzle;
  } finally {
    random = Math.random;
  }
}

/**
 * Today's local calendar date from the browser clock
 * @param {Date} [now=new Date()] - Clock to read (injectable for tests)
 * @returns {string} YYYY-MM-DD
 */
function getDailyDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Daily number: days since DAILY_EPOCH, where the epoch itself is 1.
 * Counted from calendar dates in UTC so daylight-saving changes cannot shift it.
 * @param {string} dateString - YYYY-MM-DD
 * @returns {number} Daily number, never below 1
 */
function getDailyNumber(dateString) {
  const toUtcDay = (ymd) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return Date.UTC(y, m - 1, d) / 86400000;
  };
  const days = Math.round(toUtcDay(dateString) - toUtcDay(DAILY_EPOCH));
  return Math.max(1, days + 1);
}

/**
 * The daily's displayed number: series and day, for example "2-12"
 * @param {string} dateString - YYYY-MM-DD
 * @returns {string} "series-day"
 */
function getDailyLabel(dateString) {
  return `${DAILY_SERIES}-${getDailyNumber(dateString)}`;
}

/**
 * Generate a random puzzle for given category and difficulty
 * @param {string} category - Category name (sports, history, geography, popculture, science)
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {object} Complete puzzle object ready for gameplay
 */
function generatePuzzle(category, difficulty = 'easy') {
  // Handle random difficulty selection
  let actualDifficulty = difficulty;
  if (difficulty === 'random') {
    const difficulties = ['easy', 'medium', 'hard'];
    actualDifficulty = difficulties[Math.floor(random() * difficulties.length)];
    gameState.assignedDifficulty = actualDifficulty;
  } else {
    gameState.assignedDifficulty = null;
  }

  // Step 1: Get questions from selected category
  let questions;
  if (category.toLowerCase() === 'everything') {
    // Combine all categories for maximum variety
    questions = Object.values(questionBanks).flat();
  } else {
    // Single category
    questions = questionBanks[category.toLowerCase()];
  }
  if (!questions || questions.length < 5) {
    console.error(`Not enough questions in category: ${category}`);
    return null;
  }

  // Step 2: Remove repeated question text (the same question can sit in two banks)
  questions = removeDuplicateQuestions(questions);

  // Step 3: Build 5 equations. Each slot takes the next shuffled question that
  // can be built with the chosen operator inside the range cap.
  const equations = [];
  const numberPool = [];
  let puzzleId = `${category}_${Date.now()}`;

  const shuffled = shuffleArray(questions);
  const operators = getOperatorsForDifficulty(actualDifficulty);
  let nextQuestion = 0;

  // First pass: one random operator per question, skip questions that do not fit
  while (equations.length < 5 && nextQuestion < shuffled.length) {
    const q = shuffled[nextQuestion++];
    const operator = operators[Math.floor(random() * operators.length)];
    const operands = generateOperands(q.answer, operator, actualDifficulty);
    if (operands) {
      equations.push(buildEquation(equations.length + 1, q, operator, operands));
    }
  }

  // Fallback (very unlikely): try every operator on every unused question
  for (
    let i = 0;
    equations.length < 5 && i < shuffled.length;
    i++
  ) {
    const q = shuffled[i];
    if (equations.some((eq) => eq.question === q.question)) continue;
    for (const operator of shuffleArray(operators)) {
      const operands = generateOperands(q.answer, operator, actualDifficulty);
      if (operands) {
        equations.push(
          buildEquation(equations.length + 1, q, operator, operands)
        );
        break;
      }
    }
  }

  if (equations.length < 5) {
    console.error(`Could not build a solvable puzzle for: ${category}`);
    return null;
  }

  equations.forEach((eq) => {
    numberPool.push(eq.solution.operand1, eq.solution.operand2);
  });

  // Step 4: Calculate column targets from generated operands
  let column1Total = 0;
  let column2Total = 0;

  equations.forEach((eq) => {
    column1Total += eq.solution.operand1;
    column2Total += eq.solution.operand2;
  });

  // Step 5: Add decoy numbers based on difficulty
  const { decoys: decoyCount, maxOperand } = DIFFICULTY_CONFIG[actualDifficulty];

  for (let i = 0; i < decoyCount; i++) {
    // Generate random decoy in valid range
    numberPool.push(randomInt(1, maxOperand));
  }

  // Step 6: Build puzzle object
  return {
    id: puzzleId,
    category: category.charAt(0).toUpperCase() + category.slice(1),
    difficulty:
      actualDifficulty.charAt(0).toUpperCase() + actualDifficulty.slice(1),
    numberPool: numberPool,
    columnTargets: {
      column1: column1Total,
      column2: column2Total,
    },
    equations: equations,
  };
}

/**
 * Everything that differs between difficulty levels, in one place.
 * maxOperand: largest operand (and decoy) value
 * decoys: extra pool numbers that belong to no equation
 * operators: operators the generator may use (all are shown to the player)
 */
const DIFFICULTY_CONFIG = {
  easy: { maxOperand: 50, decoys: 0, operators: ['+', '-'] },
  medium: { maxOperand: 100, decoys: 2, operators: ['+', '-'] },
  hard: { maxOperand: 200, decoys: 6, operators: ['+', '-', '×', '÷'] },
};

/**
 * Operators allowed for a difficulty
 * @param {string} difficulty - easy, medium or hard
 * @returns {array} Operator characters
 */
function getOperatorsForDifficulty(difficulty) {
  return DIFFICULTY_CONFIG[difficulty].operators;
}

/**
 * Build one equation object
 * @param {number} id - Equation number (1-5)
 * @param {object} q - Question { question, answer }
 * @param {string} operator - Operator shown on the equation
 * @param {object} operands - { op1, op2 }
 * @returns {object} Equation
 */
function buildEquation(id, q, operator, operands) {
  return {
    id: id,
    question: q.question,
    answer: q.answer,
    operator: operator,
    solution: {
      operand1: operands.op1,
      operand2: operands.op2,
      result: q.answer,
    },
  };
}

/**
 * Remove questions whose text repeats (case-insensitive)
 * @param {array} questions - Source question array
 * @returns {array} Questions with unique text
 */
function removeDuplicateQuestions(questions) {
  const seen = new Set();
  return questions.filter((q) => {
    const key = q.question.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Fisher-Yates shuffle (returns a new array)
 * @param {array} items - Source array
 * @returns {array} Shuffled copy
 */
function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Select N random questions from array without duplicates
 * @param {array} questions - Source question array
 * @param {number} count - Number of questions to select
 * @returns {array} Selected questions
 */
function selectRandomQuestions(questions, count) {
  return shuffleArray(questions).slice(0, count);
}

/**
 * Generate a valid operand pair for the given answer and operator.
 * Both operands are whole numbers from 1 to the difficulty's range cap.
 * The pair is also unambiguous: no OTHER operator allowed at this difficulty
 * gives the same answer with it (so 2 + 2 = 2 × 2 is never built), which keeps
 * every equation tied to a single operator.
 * @param {number} answer - The equation result
 * @param {string} operator - '+', '-', '×' or '÷'
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {object|null} { op1, op2 }, or null if this answer cannot be built
 *   with this operator inside the range (the caller picks another question)
 */
function generateOperands(answer, operator, difficulty = 'easy') {
  // A random pair is only occasionally ambiguous, so a few tries is plenty
  for (let attempt = 0; attempt < 20; attempt++) {
    const operands = pickOperands(answer, operator, difficulty);
    if (!operands) return null;
    if (!hasOtherOperatorThatWorks(operands, answer, operator, difficulty)) {
      return operands;
    }
  }
  return null;
}

/**
 * Picks ONE random operand pair for the answer and operator. It does not
 * check for ambiguity; generateOperands does that and retries.
 * @param {number} answer - The equation result
 * @param {string} operator - '+', '-', '×' or '÷'
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {object|null} { op1, op2 }, or null if none fits the range
 */
function pickOperands(answer, operator, difficulty) {
  const maxOperand = DIFFICULTY_CONFIG[difficulty].maxOperand;

  // Answers must be whole numbers of at least 1
  if (!Number.isInteger(answer) || answer < 1) return null;

  if (operator === '+') {
    // op1 + op2 = answer, both between 1 and maxOperand
    const minOp1 = Math.max(1, answer - maxOperand);
    const maxOp1 = Math.min(answer - 1, maxOperand);
    if (minOp1 > maxOp1) return null;

    const op1 = randomInt(minOp1, maxOp1);
    return { op1, op2: answer - op1 };
  }

  if (operator === '-') {
    // op1 - op2 = answer, op1 up to maxOperand and op2 at least 1
    const minOp1 = answer + 1;
    if (minOp1 > maxOperand) return null;

    const op1 = randomInt(minOp1, maxOperand);
    return { op1, op2: op1 - answer };
  }

  if (operator === '×') {
    // op1 × op2 = answer: collect factor pairs that fit in range
    const factors = [];
    for (let i = 1; i <= Math.min(answer, maxOperand); i++) {
      const other = answer / i;
      if (Number.isInteger(other) && other <= maxOperand) {
        factors.push([i, other]);
      }
    }
    if (factors.length === 0) return null;

    const [op1, op2] = factors[Math.floor(random() * factors.length)];
    return { op1, op2 };
  }

  if (operator === '÷') {
    // op1 ÷ op2 = answer, so op1 = answer × op2 (op2 of at least 2)
    const validDivisors = [];
    for (let divisor = 2; answer * divisor <= maxOperand; divisor++) {
      validDivisors.push(divisor);
    }
    if (validDivisors.length === 0) return null;

    const op2 = validDivisors[Math.floor(random() * validDivisors.length)];
    return { op1: answer * op2, op2 };
  }

  // Unknown operator: never guess
  return null;
}

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * Does one equation's maths: a [operator] b.
 * Shared by the generator (ambiguity check) and Submit validation.
 *
 * @param {string} operator - '+', '-', '×' or '÷'
 * @param {number} a - First operand
 * @param {number} b - Second operand
 * @returns {number|undefined} The result, or undefined for an unknown operator
 */
function applyOperator(operator, a, b) {
  if (operator === '+') return a + b;
  if (operator === '-') return a - b;
  if (operator === '×') return a * b;
  if (operator === '÷') return a / b;
  return undefined;
}

/**
 * True when some OTHER operator allowed at this difficulty also turns the
 * operand pair into the answer (e.g. 2 + 2 and 2 × 2 are both 4).
 *
 * @param {object} operands - { op1, op2 }
 * @param {number} answer - The equation result
 * @param {string} operator - The operator the equation was built with
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {boolean} True if the pair is ambiguous
 */
function hasOtherOperatorThatWorks(operands, answer, operator, difficulty) {
  return getOperatorsForDifficulty(difficulty).some(
    (other) =>
      other !== operator &&
      applyOperator(other, operands.op1, operands.op2) === answer
  );
}

const gameState = {
  selectedNumber: null,
  selectedNumberElement: null,
  selectedBlank: null, // Selected blank waiting for pool number
  userInputs: {}, // Will store: { '0-0': 5, '0-1': 2, 'sol-0': 7, etc. }
  poolNumbersUsed: [], // Array of used numbers
  attempts: 0,
  completed: false,
  currentCategory: 'sports', // Currently selected category
  currentDifficulty: 'easy', // Currently selected difficulty
  hintsUsed: 0, // Number of hints used
  hintedEquations: {}, // Object: { equationId: ['?', '#'] } tracks hint types used
  assignedDifficulty: null, // Stores actual difficulty when "random" is selected
  attemptHistory: [], // One entry per Submit press, used for the share result
  mode: 'normal', // 'normal' or 'daily'
  dailyDate: null, // YYYY-MM-DD of the daily being played (daily mode only)
  elapsedMs: 0, // Active play time counted so far (see PLAY TIME below)
  clockStartedAt: null, // When the clock last started running, or null while stopped
  undoHistory: [], // Moves for Undo in this puzzle, newest last (never saved)
};

/* ===================================
  PLAY TIME
  =================================== */

// Time counts only while a puzzle is on screen, the tab is visible and the
// puzzle is not won. It is shown on the win panel and never scored, shared
// or sent anywhere.

/**
 * Start the clock if a puzzle is being played. Safe to call anytime.
 */
function startClock() {
  if (gameState.clockStartedAt !== null) return;
  if (!currentPuzzle || gameState.completed || document.hidden) return;
  gameState.clockStartedAt = Date.now();
}

/**
 * Stop the clock and add the running stretch to elapsedMs. Safe to call anytime.
 */
function bankClock() {
  if (gameState.clockStartedAt === null) return;
  gameState.elapsedMs += Math.max(0, Date.now() - gameState.clockStartedAt);
  gameState.clockStartedAt = null;
}

/**
 * Play time so far, including the stretch that is still running
 * @returns {number} Milliseconds
 */
function getElapsedMs() {
  if (gameState.clockStartedAt === null) return gameState.elapsedMs;
  return (
    gameState.elapsedMs + Math.max(0, Date.now() - gameState.clockStartedAt)
  );
}

/**
 * Start the time over from 0 (Reset) and run it again
 */
function resetClock() {
  gameState.elapsedMs = 0;
  gameState.clockStartedAt = null;
  startClock();
}

/**
 * True for a usable saved or counted time. Saves from before play time was
 * added have none, so they are not valid.
 * @param {*} ms
 * @returns {boolean}
 */
function isValidPlayTime(ms) {
  return typeof ms === 'number' && Number.isFinite(ms) && ms >= 0;
}

/**
 * "2:41", or "1:05:09" past an hour
 * @param {number} ms - Milliseconds
 * @returns {string}
 */
function formatPlayTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`;
  return `${minutes}:${seconds}`;
}

/**
 * Pause the clock while the tab is hidden and run it again when it returns.
 * Closing a tab usually ends in "hidden", so the time is saved then too.
 */
function handleVisibilityChange() {
  if (document.hidden) {
    bankClock();
    if (currentPuzzle && !gameState.completed) savePuzzleState();
  } else {
    startClock();
  }
}

document.addEventListener('visibilitychange', handleVisibilityChange);

/* ===================================
  LOCAL STORAGE FUNCTIONS
  =================================== */

/**
 * Save current puzzle state to localStorage
 */
function savePuzzleState() {
  if (!currentPuzzle) return;

  try {
    // Collect hint-revealed elements for restoration
    const hintRevealedInputs = [];
    document.querySelectorAll('.hint-revealed').forEach((el) => {
      if (el.classList.contains('solution')) {
        hintRevealedInputs.push(el.dataset.position);
      } else if (el.classList.contains('operand')) {
        hintRevealedInputs.push(el.dataset.position);
      }
    });

    const puzzleState = {
      puzzle: currentPuzzle,
      gameState: {
        userInputs: gameState.userInputs,
        poolNumbersUsed: gameState.poolNumbersUsed,
        attempts: gameState.attempts,
        hintsUsed: gameState.hintsUsed,
        hintedEquations: gameState.hintedEquations,
        hintRevealedInputs: hintRevealedInputs, // NEW: Track which elements were hint-revealed
        currentCategory: gameState.currentCategory,
        currentDifficulty: gameState.currentDifficulty,
        assignedDifficulty: gameState.assignedDifficulty,
        attemptHistory: gameState.attemptHistory,
        elapsedMs: getElapsedMs(),
        mode: gameState.mode,
        dailyDate: gameState.dailyDate,
        dailySeries: gameState.mode === 'daily' ? DAILY_SERIES : null,
      },
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('sumwords_currentPuzzle', JSON.stringify(puzzleState));
  } catch (error) {
    console.error('Failed to save puzzle state:', error);
    // Game continues to work even if save fails
  }
}

/**
 * Load puzzle state from localStorage
 * @returns {object|null} Saved puzzle state or null if none exists
 */
function loadPuzzleState() {
  try {
    const saved = localStorage.getItem('sumwords_currentPuzzle');
    if (!saved) return null;

    const puzzleState = JSON.parse(saved);
    return puzzleState;
  } catch (error) {
    console.error('Failed to load puzzle state:', error);
    // Clear corrupted data
    localStorage.removeItem('sumwords_currentPuzzle');
    return null;
  }
}

/**
 * Check if saved puzzle has meaningful progress
 * @param {object} puzzleState - Saved puzzle state
 * @returns {boolean} True if user made at least one move
 */
function hasMeaningfulProgress(puzzleState) {
  if (!puzzleState || !puzzleState.gameState) return false;

  const state = puzzleState.gameState;

  // Check if any numbers were placed from pool
  if (state.poolNumbersUsed && state.poolNumbersUsed.length > 0) {
    return true;
  }

  // Check if any solutions were entered
  if (state.userInputs) {
    const hasAnswers = Object.keys(state.userInputs).some(
      (key) => key.startsWith('sol') && state.userInputs[key] !== undefined
    );
    if (hasAnswers) return true;
  }

  // Check if any hints were used
  if (state.hintsUsed && state.hintsUsed > 0) {
    return true;
  }

  // Check if any attempts were made
  if (state.attempts && state.attempts > 0) {
    return true;
  }

  // No meaningful progress
  return false;
}

/**
 * Clear saved puzzle from localStorage
 */
function clearPuzzleState() {
  try {
    localStorage.removeItem('sumwords_currentPuzzle');
  } catch (error) {
    console.error('Failed to clear puzzle state:', error);
  }
}

/**
 * Save a finished daily. Kept under its own key because handleWin clears the
 * current puzzle, and the finished result must survive a refresh.
 * @param {{date: string, number: number, attempts: number, hints: number, history: object[]}} result
 */
function saveDailyResult(result) {
  try {
    localStorage.setItem('sumwords_daily', JSON.stringify(result));
  } catch (error) {
    console.error('Failed to save daily result:', error);
  }
}

/**
 * Load the finished daily, if any
 * @returns {object|null} The saved result, or null when none exists or it cannot be read
 */
function loadDailyResult() {
  try {
    const saved = localStorage.getItem('sumwords_daily');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load daily result:', error);
    return null;
  }
}

/**
 * Save user preferences (category, difficulty)
 */
function savePreferences() {
  try {
    const preferences = {
      category: gameState.currentCategory,
      difficulty: gameState.currentDifficulty,
    };

    localStorage.setItem('sumwords_preferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}

/**
 * Load user preferences
 * @returns {object|null} Saved preferences or null
 */
function loadPreferences() {
  try {
    const saved = localStorage.getItem('sumwords_preferences');
    if (!saved) return null;

    const preferences = JSON.parse(saved);
    return preferences;
  } catch (error) {
    console.error('Failed to load preferences:', error);
    localStorage.removeItem('sumwords_preferences');
    return null;
  }
}

/**
 * Initialize statistics object with default values
 * @returns {object} Default statistics structure
 */
function getDefaultStats() {
  return {
    overall: {
      totalCompleted: 0,
      totalAttempts: 0,
      totalHints: 0,
      perfectGames: 0,
      currentStreak: 0,
      bestStreak: 0,
      stars: { 1: 0, 2: 0, 3: 0 },
    },
    easy: {
      completed: 0,
      attempts: 0,
      hints: 0,
      perfectGames: 0,
    },
    medium: {
      completed: 0,
      attempts: 0,
      hints: 0,
      perfectGames: 0,
    },
    hard: {
      completed: 0,
      attempts: 0,
      hints: 0,
      perfectGames: 0,
    },
    random: {
      completed: 0,
      attempts: 0,
      hints: 0,
      perfectGames: 0,
    },
    daily: {
      completed: 0,
      attempts: 0,
      hints: 0,
      perfectGames: 0,
    },
  };
}

/**
 * Load statistics from localStorage
 * @returns {object} Statistics object
 */
function loadStatistics() {
  try {
    const saved = localStorage.getItem('sumwords_statistics');
    if (!saved) return getDefaultStats();

    const stats = JSON.parse(saved);
    return stats;
  } catch (error) {
    console.error('Failed to load statistics:', error);
    localStorage.removeItem('sumwords_statistics');
    return getDefaultStats();
  }
}

/**
 * Save statistics to localStorage
 * @param {object} stats - Statistics object to save
 */
function saveStatistics(stats) {
  try {
    localStorage.setItem('sumwords_statistics', JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save statistics:', error);
  }
}

/**
 * Star counts from the overall stats. Saves from before star ratings have no
 * `stars` field (or only some keys), so missing counts read as 0.
 * @param {object} overall - stats.overall
 * @returns {{1: number, 2: number, 3: number}}
 */
function getStarTally(overall) {
  const saved = (overall && overall.stars) || {};
  return { 1: saved[1] || 0, 2: saved[2] || 0, 3: saved[3] || 0 };
}

/**
 * The Stats modal line: "Stars earned: ⭐ 4 · ⭐⭐ 7 · ⭐⭐⭐ 12"
 * @param {object} overall - stats.overall
 * @returns {string}
 */
function formatStarsEarned(overall) {
  const tally = getStarTally(overall);
  return `Stars earned: ⭐ ${tally[1]} · ⭐⭐ ${tally[2]} · ⭐⭐⭐ ${tally[3]}`;
}

/**
 * Update statistics when puzzle is completed
 * @param {string} difficulty - Difficulty level (easy/medium/hard) - the ACTUAL difficulty played
 * @param {number} attempts - Number of attempts taken
 * @param {number} hints - Number of hints used
 * @param {boolean} [isDaily=false] - True for a daily puzzle: it counts as a normal win of its difficulty AND in the daily totals
 */
function updateStatistics(difficulty, attempts, hints, isDaily = false) {
  const stats = loadStatistics();
  const isPerfect = attempts === 1 && hints === 0;
  const selectedDifficulty = gameState.currentDifficulty; // This might be "random"

  // Update overall stats
  stats.overall.totalCompleted++;
  stats.overall.totalAttempts += attempts;
  stats.overall.totalHints += hints;
  if (isPerfect) stats.overall.perfectGames++;

  // Star tally counts wins from the release that added stars (never backfilled)
  stats.overall.stars = getStarTally(stats.overall);
  stats.overall.stars[getStarRating(attempts, hints)]++;

  // Update streak
  stats.overall.currentStreak++;
  if (stats.overall.currentStreak > stats.overall.bestStreak) {
    stats.overall.bestStreak = stats.overall.currentStreak;
  }

  // Update difficulty-specific stats (always track by actual difficulty played)
  if (!stats[difficulty]) {
    stats[difficulty] = {
      completed: 0,
      attempts: 0,
      hints: 0,
      perfectGames: 0,
    };
  }
  stats[difficulty].completed++;
  stats[difficulty].attempts += attempts;
  stats[difficulty].hints += hints;
  if (isPerfect) stats[difficulty].perfectGames++;

  // If user selected "random", ALSO track in random category
  if (selectedDifficulty === 'random') {
    if (!stats.random) {
      stats.random = {
        completed: 0,
        attempts: 0,
        hints: 0,
        perfectGames: 0,
      };
    }
    stats.random.completed++;
    stats.random.attempts += attempts;
    stats.random.hints += hints;
    if (isPerfect) stats.random.perfectGames++;
  }

  // A daily is ALSO tracked on its own (saves from before the daily have no bucket)
  if (isDaily) {
    stats.daily = stats.daily || getDefaultStats().daily;
    stats.daily.completed++;
    stats.daily.attempts += attempts;
    stats.daily.hints += hints;
    if (isPerfect) stats.daily.perfectGames++;
  }

  saveStatistics(stats);
}

/**
 * Reset current win streak (called when user gives up or resets)
 */
function resetStreak() {
  const stats = loadStatistics();
  stats.overall.currentStreak = 0;
  saveStatistics(stats);
}

/* ===================================
  INITIALIZATION
  =================================== */

// Current puzzle (will be set by generator)
let currentPuzzle = null;

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeGame();
});

function initializeGame() {
  showGameVersion();

  // Load saved preferences
  const savedPreferences = loadPreferences();
  const categorySelect = document.getElementById('category-select');
  const difficultySelect = document.getElementById('difficulty-select');

  if (!categorySelect || !difficultySelect) {
    console.error('ERROR: Could not find dropdown elements');
    return;
  }

  if (savedPreferences) {
    categorySelect.value = savedPreferences.category;
    difficultySelect.value = savedPreferences.difficulty;
    gameState.currentCategory = savedPreferences.category;
    gameState.currentDifficulty = savedPreferences.difficulty;
  } else {
    // Use default values from dropdowns
    gameState.currentCategory = categorySelect.value;
    gameState.currentDifficulty = difficultySelect.value;
  }

  // Set up event listeners FIRST (before showing any modals)
  setupEventListeners();
  setupStatsModalListeners();
  refreshDailyUi();

  // Check for saved puzzle state
  const savedPuzzle = loadPuzzleState();

  if (savedPuzzle && isStaleDaily(savedPuzzle)) {
    // A daily from an earlier date is discarded; today's is started from the Daily button
    clearPuzzleState();
    startNewGame();
    showFeedback(
      `Your daily puzzle from ${savedPuzzle.gameState.dailyDate} was discarded. Press Daily for today's puzzle.`,
      'success'
    );
  } else if (savedPuzzle && hasMeaningfulProgress(savedPuzzle)) {
    // Show resume modal only if user made progress
    showResumeModal(savedPuzzle);
  } else {
    // No saved puzzle or no progress - start fresh
    if (savedPuzzle) {
      clearPuzzleState(); // Clear the empty saved puzzle
    }
    startNewGame();
  }
}

/**
 * Show the resume modal
 * @param {object} savedPuzzle - The saved puzzle state
 */
function showResumeModal(savedPuzzle) {
  const modal = document.getElementById('resume-modal');
  const resumeBtn = document.getElementById('resume-btn');
  const newGameBtn = document.getElementById('new-game-btn');

  // Show modal
  modal.classList.remove('hidden');

  // Resume button handler
  resumeBtn.onclick = () => {
    modal.classList.add('hidden');
    resumeSavedGame(savedPuzzle);
  };

  // New game button handler
  newGameBtn.onclick = () => {
    modal.classList.add('hidden');
    clearPuzzleState();
    startNewGame();
  };
}

/**
 * Start a new game
 */
function startNewGame() {
  // Generate a new puzzle
  currentPuzzle = generatePuzzle(
    gameState.currentCategory,
    gameState.currentDifficulty
  );

  if (!currentPuzzle) {
    console.error('Failed to generate puzzle');
    showFeedback(
      'Failed to generate puzzle. Please refresh the page.',
      'error'
    );
    return;
  }

  // Load puzzle into UI
  loadPuzzle(currentPuzzle);

  // Save the new puzzle state
  savePuzzleState();
}

/**
 * Resume a saved game
 * @param {object} savedPuzzle - The saved puzzle state
 */
function resumeSavedGame(savedPuzzle) {
  const saved = savedPuzzle.gameState;

  // Restore puzzle data
  currentPuzzle = savedPuzzle.puzzle;

  gameState.currentCategory = saved.currentCategory;
  gameState.currentDifficulty = saved.currentDifficulty;
  gameState.assignedDifficulty = saved.assignedDifficulty || null; // Read by loadPuzzle for "Playing: ..."

  // Update dropdowns to match saved puzzle
  document.getElementById('category-select').value = gameState.currentCategory;
  document.getElementById('difficulty-select').value =
    gameState.currentDifficulty;

  // Load puzzle into UI. This resets gameState, so the saved progress is
  // restored after it below.
  loadPuzzle(currentPuzzle);

  gameState.poolNumbersUsed = saved.poolNumbersUsed || [];
  gameState.attempts = saved.attempts || 0;
  gameState.hintsUsed = saved.hintsUsed || 0;
  gameState.hintedEquations = withoutOperatorMarkers(saved.hintedEquations);
  gameState.attemptHistory = Array.isArray(saved.attemptHistory)
    ? saved.attemptHistory
    : []; // Saves from before share results have no history
  // Time continues from the saved value; saves from before play time start at 0
  gameState.elapsedMs = isValidPlayTime(saved.elapsedMs) ? saved.elapsedMs : 0;
  // Saves from before the Daily puzzle have no mode, so they resume as normal
  gameState.mode = saved.mode === 'daily' ? 'daily' : 'normal';
  gameState.dailyDate = saved.mode === 'daily' ? saved.dailyDate || null : null;
  refreshDailyUi(); // Locks the selectors and shows the banner for a daily

  // Restore user inputs to UI (also sets gameState.userInputs)
  restoreUserInputs(saved);

  // Update counters
  document.getElementById('attempt-count').textContent = gameState.attempts;
  document.getElementById('hint-count').textContent = gameState.hintsUsed;

  showFeedback('Puzzle resumed!', 'success');
}

/**
 * Drop the old '*' (Operator hint) marker from saved hint markers, so a save
 * made before the Operator hint was removed does not show a stale marker.
 * @param {object} hinted - Saved { equationId: ['?', '#', '*'] } (may be missing)
 * @returns {object} Same shape without '*' (equations left with no markers are dropped)
 */
function withoutOperatorMarkers(hinted) {
  const clean = {};
  Object.keys(hinted || {}).forEach((equationId) => {
    const markers = (hinted[equationId] || []).filter((m) => m !== '*');
    // An equation whose only hint was the Operator hint is no longer hinted
    if (markers.length > 0) clean[equationId] = markers;
  });
  return clean;
}

/**
 * Restore user inputs to the UI
 * @param {object} savedGameState - The saved game state
 */
function restoreUserInputs(savedGameState) {
  // IMPORTANT: Restore userInputs to gameState FIRST (needed for updateColumnTotals)
  gameState.userInputs = savedGameState.userInputs || {};

  // Restore operand blanks (userInputs contains both operands and solutions)
  Object.keys(savedGameState.userInputs || {}).forEach((position) => {
    const value = savedGameState.userInputs[position];

    if (position.startsWith('op')) {
      // Operand blank
      const blank = document.querySelector(`[data-position="${position}"]`);
      if (blank) {
        blank.textContent = value;
        blank.classList.add('filled');
      }
    } else if (position.startsWith('sol')) {
      // Solution input
      const input = document.querySelector(`[data-position="${position}"]`);
      if (input) {
        input.value = value;
      }
    }
  });

  // Mark used pool numbers
  savedGameState.poolNumbersUsed.forEach((number) => {
    const poolNumbers = document.querySelectorAll('.pool-number');
    let marked = false;

    poolNumbers.forEach((poolNum) => {
      if (
        !marked &&
        parseInt(poolNum.dataset.number) === number &&
        !poolNum.classList.contains('used')
      ) {
        poolNum.classList.add('used');
        marked = true;
      }
    });
  });

  // Restore hinted equations and hint markers
  Object.keys(savedGameState.hintedEquations || {}).forEach((equationId) => {
    const equation = document.querySelector(`[data-equation="${equationId}"]`);
    if (equation) {
      equation.classList.add('hinted');
    }
  });
  updateHintControls();

  // Restore hint-revealed styling
  (savedGameState.hintRevealedInputs || []).forEach((position) => {
    // Operand or solution (old 'operator-N' entries match nothing and are skipped)
    const element = document.querySelector(`[data-position="${position}"]`);
    if (element) {
      element.classList.add('hint-revealed');
    }
  });

  // Update column totals
  updateColumnTotals();
}

/**
 * Load a puzzle into the game UI
 * @param {object} puzzle - Puzzle object to load
 */
function loadPuzzle(puzzle) {
  hideWinPanel(); // Every new or resumed puzzle starts without the win panel

  // Show assigned difficulty if random was selected
  const assignedDifficultyEl = document.getElementById('assigned-difficulty');
  if (gameState.assignedDifficulty) {
    const difficultyName =
      gameState.assignedDifficulty.charAt(0).toUpperCase() +
      gameState.assignedDifficulty.slice(1);
    assignedDifficultyEl.textContent = `Playing: ${difficultyName}`;
    assignedDifficultyEl.style.display = 'block';
  } else {
    assignedDifficultyEl.style.display = 'none';
  }

  // Header dropdowns already show category/difficulty, no need to update

  // Update column targets
  document.getElementById('col1-goal').textContent =
    puzzle.columnTargets.column1;
  document.getElementById('col2-goal').textContent =
    puzzle.columnTargets.column2;

  // Update equation questions and operators
  puzzle.equations.forEach((eq) => {
    const equationDiv = document.querySelector(`[data-equation="${eq.id}"]`);
    equationDiv.querySelector('.question').textContent = eq.question;

    // Every level shows the operator as plain text
    const visibleOperator = equationDiv.querySelector(
      '.operator-container .operator'
    );
    visibleOperator.textContent = eq.operator;
  });

  // Clear any previous state
  resetGameState();

  // Populate number pool
  renderNumberPool(puzzle);

  // Update column totals (initially 0)
  updateColumnTotals();

  startClock(); // A new or resumed puzzle is now on screen
}

/**
 * Reset game state for new puzzle
 */
function resetGameState() {
  gameState.selectedNumber = null;
  gameState.selectedNumberElement = null;
  clearTypedBuffer(); // Digits typed before a new puzzle must not land in it
  gameState.selectedBlank = null; // Avoid a stale selection surviving a new puzzle
  gameState.userInputs = {};
  gameState.poolNumbersUsed = [];
  gameState.attempts = 0;
  gameState.completed = false;
  gameState.hintsUsed = 0;
  gameState.hintedEquations = {}; // Reset to empty object
  gameState.assignedDifficulty = null;
  gameState.attemptHistory = [];
  gameState.elapsedMs = 0;
  gameState.clockStartedAt = null;
  gameState.undoHistory = []; // Undo never reaches back past a new puzzle

  // Clear UI - operand blanks
  document.querySelectorAll('.blank.operand').forEach((blank) => {
    blank.textContent = '';
    blank.classList.remove('filled', 'selected', 'hint-revealed');
  });

  // Clear UI - solution inputs
  document.querySelectorAll('.blank.solution').forEach((input) => {
    input.value = '';
    input.classList.remove('hint-revealed');
  });

  // Clear UI - equations
  document.querySelectorAll('.equation').forEach((eq) => {
    eq.classList.remove('error', 'hinted');
  });

  // Submit marks are not saved, so a fresh or resumed board starts without them
  clearAllSubmitMarks();

  // Reset counters
  document.getElementById('attempt-count').textContent = '0';
  document.getElementById('hint-count').textContent = '0';

  // Reset buttons
  document.getElementById('submit-btn').disabled = false;
  document.getElementById('reset-btn').disabled = false;
  closeHintChoices();
  updateUndoControls();
  updateHintControls();

  // Clear feedback
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = 'feedback';
}

/* ===================================
  RENDER NUMBER POOL
  =================================== */

function renderNumberPool(puzzle) {
  const poolContainer = document.getElementById('number-pool');
  poolContainer.innerHTML = ''; // Clear existing

  const poolToRender = puzzle || currentPuzzle;

  // Set difficulty attribute for grid sizing
  poolContainer.setAttribute(
    'data-difficulty',
    poolToRender.difficulty.toLowerCase()
  );

  // Shuffle the number pool for random display order
  const shuffledPool = [...poolToRender.numberPool].sort(
    () => Math.random() - 0.5
  );

  shuffledPool.forEach((number, index) => {
    const button = document.createElement('button');
    button.className = 'pool-number';
    button.textContent = number;
    button.dataset.number = number;
    button.dataset.index = index;

    poolContainer.appendChild(button);
  });
}

/* ===================================
  EVENT LISTENERS
  =================================== */

/**
 * Mobile header menu: toggle button opens a dropdown panel of header actions.
 * Closes on item click, outside click, Escape, or when the screen grows past 600px.
 */
function setupHeaderMenu() {
  const toggle = document.getElementById('menu-toggle');
  const panel = document.getElementById('header-controls');
  const wideScreen = window.matchMedia('(min-width: 601px)');

  function setMenuOpen(open) {
    panel.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', () => {
    const open = !panel.classList.contains('open');
    setMenuOpen(open);
    if (open) panel.querySelector('.btn-header').focus();
  });

  // Running an item closes the menu
  panel.addEventListener('click', (event) => {
    if (event.target.closest('.btn-header')) setMenuOpen(false);
  });

  // Outside click closes it
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.header-menu')) setMenuOpen(false);
  });

  // Escape closes it and returns focus to the toggle
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.classList.contains('open')) {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  // Growing past the mobile breakpoint resets the menu
  wideScreen.addEventListener('change', (event) => {
    if (event.matches) setMenuOpen(false);
  });
}

function setupEventListeners() {
  // Keyboard input goes first so Escape reaches it before the header menu and
  // hint handlers below close what they own (see handleEscapeKey)
  document.addEventListener('keydown', handleKeyboardInput);

  setupHeaderMenu();

  // Number pool clicks (a keyboard click then moves focus to the selected blank)
  const pool = document.getElementById('number-pool');
  pool.addEventListener('click', handlePoolClick);
  pool.addEventListener('click', followKeyboardClick);

  // Operand blank clicks
  document.querySelectorAll('.blank.operand').forEach((blank) => {
    blank.addEventListener('click', handleOperandClick);
    blank.addEventListener('click', followKeyboardClick);
  });

  // Solution input changes (with validation)
  document.querySelectorAll('.blank.solution').forEach((input) => {
    input.addEventListener('input', validateSolutionInput);
    input.addEventListener('keydown', handleSolutionKeydown);
    input.setAttribute(
      'aria-label',
      `Equation ${equationIdOf(input.dataset.position)} answer`
    );
  });

  // Undo button, and Ctrl+Z / Cmd+Z on the board
  document.getElementById('undo-btn').addEventListener('click', undoLastMove);
  document.addEventListener('keydown', handleUndoShortcut);

  // Submit button
  document.getElementById('submit-btn').addEventListener('click', handleSubmit);

  // Header buttons
  document
    .getElementById('stats-btn')
    .addEventListener('click', showStatsModal);
  document
    .getElementById('daily-btn')
    .addEventListener('click', handleDailyClick);
  document
    .getElementById('new-puzzle-btn')
    .addEventListener('click', handleNewPuzzle);
  document.getElementById('reset-btn').addEventListener('click', handleReset);

  // Win panel
  document.getElementById('share-btn').addEventListener('click', handleShare);
  document
    .getElementById('win-new-puzzle-btn')
    .addEventListener('click', handleNewPuzzle);

  // Category and difficulty selectors
  document
    .getElementById('category-select')
    .addEventListener('change', handleCategoryChange);
  document
    .getElementById('difficulty-select')
    .addEventListener('change', handleDifficultyChange);

  // Hints: one delegated listener for every equation's Hint button and choices
  document
    .querySelector('.equations-container')
    .addEventListener('click', handleHintClick);
  document.addEventListener('keydown', handleHintKeydown);
}
/* ===================================
  POOL NUMBER CLICK HANDLER
  =================================== */

function handlePoolClick(event) {
  const clickedNumber = event.target.closest('.pool-number');
  if (!clickedNumber) return;

  // Ignore if already used
  if (clickedNumber.classList.contains('used')) return;

  // If clicking already selected number, deselect it
  if (clickedNumber.classList.contains('selected')) {
    deselectPoolNumber();
    return;
  }

  // If a blank is selected, place this number in it immediately
  if (gameState.selectedBlank) {
    const blank = gameState.selectedBlank;
    const position = blank.dataset.position;

    // Arrow keys can select a filled blank. Give its number back first (as a
    // recorded removal), so the pool and Undo stay in step
    if (blank.classList.contains('filled')) {
      returnNumberToPool(blank, position);
    }

    // Set up selected number state temporarily
    gameState.selectedNumber = parseInt(clickedNumber.dataset.number);
    gameState.selectedNumberElement = clickedNumber;

    // Place in blank (this also moves the selection to the next empty blank)
    placeNumberInBlank(blank, position);

    return;
  }

  // Deselect previous pool selection
  deselectPoolNumber();

  // Select this number
  clickedNumber.classList.add('selected');
  gameState.selectedNumber = parseInt(clickedNumber.dataset.number);
  gameState.selectedNumberElement = clickedNumber;
  syncInputLabels();
}

function deselectPoolNumber() {
  if (gameState.selectedNumberElement) {
    gameState.selectedNumberElement.classList.remove('selected');
  }
  gameState.selectedNumber = null;
  gameState.selectedNumberElement = null;
  syncInputLabels();
}

/* ===================================
  OPERAND BLANK CLICK HANDLER
  =================================== */

function handleOperandClick(event) {
  const blank = event.currentTarget;
  const position = blank.dataset.position;

  // If blank is filled, return number to pool
  if (blank.classList.contains('filled')) {
    returnNumberToPool(blank, position);
    // The player is fixing this number: the next tile goes back into this blank,
    // not into the blank auto-advance had selected
    if (gameState.selectedNumber === null) selectBlankForPlacement(blank);
    return;
  }

  // If no number selected, select this blank to receive next pool click
  if (gameState.selectedNumber === null) {
    selectBlankForPlacement(blank);
    return;
  }

  // Place selected number in blank
  placeNumberInBlank(blank, position);
}

/**
 * Select a blank to receive the next pool number clicked
 */
function selectBlankForPlacement(blank) {
  clearTypedBuffer(); // Digits typed for another blank must not land in this one

  // Deselect any previously selected blank
  document.querySelectorAll('.blank.operand.selected').forEach((b) => {
    b.classList.remove('selected');
  });

  // Select this blank
  blank.classList.add('selected');
  gameState.selectedBlank = blank;
  syncInputLabels();
}

/**
 * Deselect the selected blank
 */
function deselectBlank() {
  clearTypedBuffer();
  if (gameState.selectedBlank) {
    gameState.selectedBlank.classList.remove('selected');
  }
  gameState.selectedBlank = null;
  syncInputLabels();
}

function placeNumberInBlank(blank, position) {
  putNumberInBlank(
    blank,
    position,
    gameState.selectedNumber,
    gameState.selectedNumberElement
  );
  recordMove(gameState.undoHistory, {
    type: 'place',
    position,
    value: gameState.selectedNumber,
  });
  announce(`Placed ${gameState.selectedNumber} in ${operandSpot(position)}.`);

  // Deselect pool number, blank, and update totals
  deselectPoolNumber();
  selectNextEmptyBlank(position); // Clears this blank's selection, then auto-advances
  updateColumnTotals();
  updateUndoControls();
  savePuzzleState(); // AUTO-SAVE after number placement
}

/**
 * Fills one operand blank and marks one pool tile as used. Shared by normal
 * placement and Undo, so the board, `userInputs` and `poolNumbersUsed` agree.
 * Records nothing in the undo history.
 *
 * @param {HTMLElement} blank - The empty operand blank
 * @param {string} position - data-position of the blank, e.g. 'op1-3'
 * @param {number} value - The number going in
 * @param {HTMLElement|undefined} tile - The pool tile to mark used
 */
function putNumberInBlank(blank, position, value, tile) {
  blank.textContent = value;
  blank.classList.add('filled');
  gameState.userInputs[position] = value;
  clearEquationMark(equationIdOf(position)); // The player changed this equation

  if (tile) tile.classList.add('used');
  gameState.poolNumbersUsed.push(value);
}

/**
 * Select the next empty operand blank after `fromPosition` (wraps around).
 * Selects nothing when every blank is filled. The selection is not saved.
 * @param {string} fromPosition - Position of the blank just filled
 */
function selectNextEmptyBlank(fromPosition) {
  const blanks = Array.from(document.querySelectorAll('.blank.operand'));
  const nextPosition = findNextEmptyPosition(
    blanks.map((b) => b.dataset.position),
    gameState.userInputs,
    fromPosition
  );
  deselectBlank();
  if (nextPosition === null) return;

  const nextBlank = blanks.find((b) => b.dataset.position === nextPosition);
  selectBlankForPlacement(nextBlank);
}

/**
 * Empties one operand blank and frees one used pool tile with its value.
 * Shared by tap-to-fix, Backspace and Undo. Records nothing in the history.
 *
 * @param {HTMLElement} blank - The operand blank
 * @param {string} position - data-position of the blank, e.g. 'op1-3'
 * @returns {number} The value that was in the blank
 */
function takeNumberFromBlank(blank, position) {
  const numberValue = gameState.userInputs[position];

  // Clear blank
  blank.textContent = '';
  blank.classList.remove('filled');

  // Remove from game state
  delete gameState.userInputs[position];
  clearEquationMark(equationIdOf(position)); // The player changed this equation

  // Find and restore the FIRST 'used' pool number with this value
  const poolNumbers = document.querySelectorAll('.pool-number');
  let restored = false;

  poolNumbers.forEach((poolNum) => {
    if (
      !restored &&
      parseInt(poolNum.dataset.number) === numberValue &&
      poolNum.classList.contains('used')
    ) {
      poolNum.classList.remove('used');
      restored = true;

      // Remove ONE instance from used array
      const index = gameState.poolNumbersUsed.indexOf(numberValue);
      if (index > -1) {
        gameState.poolNumbersUsed.splice(index, 1);
      }
    }
  });

  return numberValue;
}

/**
 * Returns one operand's number to the pool and records the move, so Undo can put it back.
 *
 * @param {HTMLElement} blank - The filled operand blank
 * @param {string} position - data-position of the blank, e.g. 'op1-3'
 */
function returnNumberToPool(blank, position) {
  const numberValue = takeNumberFromBlank(blank, position);
  recordMove(gameState.undoHistory, {
    type: 'remove',
    position,
    value: numberValue,
  });

  announce(`Returned ${numberValue} to the pool.`);
  updateColumnTotals();
  updateUndoControls();
  savePuzzleState(); // AUTO-SAVE after returning number
}

/* ===================================
  UNDO (board moves only)
  =================================== */

// Why Undo skipped a move, by the action type planUndo returns
const UNDO_REFUSALS = {
  hint: "Can't undo: a hint filled that blank.",
  unavailable: "Can't undo: that number is now in use.",
  stale: "Can't undo: that move no longer applies.",
};

/**
 * Undoes the newest placement or removal on the board. Hints, Submit and typing
 * in the answer boxes are never undone.
 */
function undoLastMove() {
  if (gameState.completed || gameState.undoHistory.length === 0) return;

  const hintFilled = Array.from(
    document.querySelectorAll('.blank.operand.hint-revealed'),
    (blank) => blank.dataset.position
  );
  const { history, action } = planUndo(
    gameState.undoHistory,
    gameState.userInputs,
    currentPuzzle.numberPool,
    gameState.poolNumbersUsed,
    hintFilled
  );
  gameState.undoHistory = history;
  deselectPoolNumber(); // Undo drops any pool tile picked for placing

  if (action.type === 'clear') {
    const blank = operandBlankAt(action.position);
    takeNumberFromBlank(blank, action.position);
    announce(`Undid: removed ${action.value} from ${operandSpot(action.position)}.`);
    selectBlankForPlacement(blank);
  } else if (action.type === 'fill') {
    const blank = operandBlankAt(action.position);
    fillBlankFromPool(blank, action.position, action.value);
    announce(`Undid: put ${action.value} back in ${operandSpot(action.position)}.`);
    selectBlankForPlacement(blank);
  } else if (UNDO_REFUSALS[action.type]) {
    showFeedback(UNDO_REFUSALS[action.type], 'warning');
    announce(UNDO_REFUSALS[action.type]);
  }

  updateColumnTotals();
  updateUndoControls();
  followSelectedBlank();
  savePuzzleState();
}

/**
 * Puts a value into an empty operand blank and marks one unused pool tile with
 * that value. Any unused tile with the value will do, because they are alike.
 * Records nothing in the history.
 *
 * @param {HTMLElement} blank - The empty operand blank
 * @param {string} position - data-position of the blank, e.g. 'op1-3'
 * @param {number} value - The number to put back
 */
function fillBlankFromPool(blank, position, value) {
  const tile = Array.from(document.querySelectorAll('.pool-number')).find(
    (t) => parseInt(t.dataset.number) === value && !t.classList.contains('used')
  );
  putNumberInBlank(blank, position, value, tile);
}

/**
 * @param {string} position - data-position of an operand blank, e.g. 'op2-4'
 * @returns {HTMLElement|null}
 */
function operandBlankAt(position) {
  return document.querySelector(`.blank.operand[data-position="${position}"]`);
}

/**
 * Plain words for the move Undo would reverse, for the button's tooltip
 *
 * @param {{type: string, position: string, value: number}} move
 * @returns {string} e.g. "remove 7 from equation 2, first number"
 */
function describeUndo(move) {
  return move.type === 'place'
    ? `remove ${move.value} from ${operandSpot(move.position)}`
    : `put ${move.value} back in ${operandSpot(move.position)}`;
}

/**
 * Enables Undo only when there is a move to undo on a puzzle not yet won
 */
function updateUndoControls() {
  const button = document.getElementById('undo-btn');
  if (!button) return;

  const history = gameState.undoHistory;
  const canUndo = !gameState.completed && history.length > 0;
  button.disabled = !canUndo;
  button.title = canUndo
    ? `Undo: ${describeUndo(history[history.length - 1])}`
    : 'Nothing to undo';
}

/**
 * Ctrl+Z (Cmd+Z on Mac) undoes a move on the board. Text fields, selects and
 * open dialogs keep the browser's own undo, and Shift or Alt are not Undo.
 * @param {KeyboardEvent} event
 */
function handleUndoShortcut(event) {
  const isUndoKey =
    (event.ctrlKey || event.metaKey) &&
    !event.shiftKey &&
    !event.altKey &&
    event.key.toLowerCase() === 'z';
  if (!isUndoKey) return;
  if (event.target.closest?.('input, select, textarea')) return;
  if (document.querySelector('.modal:not(.hidden)')) return;
  if (gameState.completed || gameState.undoHistory.length === 0) return;

  event.preventDefault();
  undoLastMove();
}

/* ===================================
  COLUMN TOTALS UPDATE
  =================================== */

/**
 * Adds up one column of placed operands.
 * Loops over the puzzle's own equations so the count is never hardcoded.
 * Empty blanks add nothing; a real 0 still counts.
 *
 * @param {string} prefix - 'op1' for column 1 (first operands), 'op2' for column 2
 * @returns {number} Sum of the operands currently placed in that column
 */
function sumColumn(prefix) {
  let total = 0;
  currentPuzzle.equations.forEach((eq) => {
    const value = gameState.userInputs[`${prefix}-${eq.id}`];
    if (!isBlank(value)) {
      total += value;
    }
  });
  return total;
}

function updateColumnTotals() {
  const col1Total = sumColumn('op1');
  const col2Total = sumColumn('op2');

  // Update display
  document.getElementById('col1-current').textContent = col1Total;
  document.getElementById('col2-current').textContent = col2Total;

  // An operand changed, so the Submit marks on the columns no longer apply
  clearColumnMark('col1');
  clearColumnMark('col2');

  // Update visual status using current puzzle targets
  updateColumnStatus('col1', col1Total, currentPuzzle.columnTargets.column1);
  updateColumnStatus('col2', col2Total, currentPuzzle.columnTargets.column2);

  // Every placement, return, hint, resume and reset ends here, so the screen
  // reader labels and the pool's Tab stop are refreshed in one place
  syncInputLabels();
}

function updateColumnStatus(columnId, current, target) {
  const targetElement = document.querySelector(
    `.target:nth-child(${columnId === 'col1' ? 1 : 2})`
  );

  // Remove existing status classes
  targetElement.classList.remove('correct', 'incorrect', 'incomplete');

  // Add appropriate class
  if (current === 0) {
    // No class when empty
  } else if (current === target) {
    targetElement.classList.add('correct');
  } else {
    targetElement.classList.add('incorrect');
  }
}

/* ===================================
  SUBMIT & VALIDATION
  =================================== */

function handleSubmit() {
  if (gameState.completed) {
    showFeedback('You already completed this puzzle!', 'warning');
    return;
  }

  // Increment attempts
  gameState.attempts++;
  document.getElementById('attempt-count').textContent = gameState.attempts;

  // Record this attempt for the share result (before validating, which only highlights).
  // The on-screen marks below use the same classifyEquation results as this entry.
  const statuses = currentPuzzle.equations.map((eq) =>
    classifyEquation(eq, gameState.userInputs)
  );
  const entry = buildAttemptEntry(
    currentPuzzle.equations,
    currentPuzzle.columnTargets,
    gameState.userInputs,
    gameState.hintedEquations,
    statuses
  );
  gameState.attemptHistory.push(entry);

  // Validate all conditions (decides the win; its messages are not shown)
  const validation = validatePuzzle();

  showSubmitMarks(statuses, entry.columns);

  if (validation.success) {
    handleWin();
  } else {
    showSubmitSummary(statuses, entry.columns);
  }
}

/**
 * True when a blank has nothing usable placed in it.
 * Checks explicitly, because 0 is a real value (a plain `!value` check would
 * wrongly treat 0 as empty). NaN can only come from a damaged saved puzzle,
 * so it counts as empty rather than poisoning the column totals.
 *
 * @param {number|undefined|null} value - The blank's value from gameState.userInputs
 * @returns {boolean} True if nothing usable is placed
 */
function isBlank(value) {
  return value === undefined || value === null || Number.isNaN(value);
}

/**
 * Builds a plain-English label for one or more equation numbers.
 *
 * @param {number[]} ids - Equation ids, e.g. [2] or [2, 4]
 * @returns {string} "Equation 2" or "Equations 2, 4"
 */
function equationLabel(ids) {
  return ids.length === 1
    ? `Equation ${ids[0]}`
    : `Equations ${ids.join(', ')}`;
}

/**
 * Sorts every equation that isn't right yet into one of two groups, so
 * Submit can tell the player what kind of problem each one has.
 * The operator is part of the puzzle and always shown, so only the numbers
 * are checked, against the equation's own operator.
 *
 * @returns {{incompleteEquations: number[], wrongNumberEquations: number[], badEquationIds: number[]}}
 *   Equation ids: still has an empty blank, or has numbers that don't work
 *   out. badEquationIds lists every problem equation once.
 */
function findBadEquations() {
  const incompleteEquations = [];
  const wrongNumberEquations = [];

  currentPuzzle.equations.forEach((eq) => {
    const op1 = gameState.userInputs[`op1-${eq.id}`];
    const op2 = gameState.userInputs[`op2-${eq.id}`];
    const sol = gameState.userInputs[`sol-${eq.id}`];

    if (isBlank(op1) || isBlank(op2) || isBlank(sol)) {
      incompleteEquations.push(eq.id);
      return;
    }

    if (applyOperator(eq.operator, op1, op2) !== sol) {
      wrongNumberEquations.push(eq.id);
    }
  });

  // Every equation with any problem (once each), for highlighting
  const badEquationIds = [
    ...new Set([...incompleteEquations, ...wrongNumberEquations]),
  ];

  return { incompleteEquations, wrongNumberEquations, badEquationIds };
}

/**
 * Checks the whole puzzle and collects plain-English errors for Submit.
 * Each check is reported separately so the player knows what to fix.
 *
 * @returns {{success: boolean, errors: string[]}} Result and list of messages
 */
function validatePuzzle() {
  const errors = [];

  // Check 1: Every operand blank is filled from the pool. Decoys are never
  // placed, so the count needed is 2 per equation, not the whole pool size.
  const numbersNeeded = currentPuzzle.equations.length * 2;
  if (gameState.poolNumbersUsed.length !== numbersNeeded) {
    errors.push(
      `Only ${gameState.poolNumbersUsed.length}/${numbersNeeded} pool numbers used`
    );
  }

  // Check 2: Column 1 total correct
  const col1Total = sumColumn('op1');
  if (col1Total !== currentPuzzle.columnTargets.column1) {
    errors.push(
      `Column 1 total is ${col1Total}, should be ${currentPuzzle.columnTargets.column1}`
    );
  }

  // Check 3: Column 2 total correct
  const col2Total = sumColumn('op2');
  if (col2Total !== currentPuzzle.columnTargets.column2) {
    errors.push(
      `Column 2 total is ${col2Total}, should be ${currentPuzzle.columnTargets.column2}`
    );
  }

  // Check 4: Every equation is complete and works.
  const { incompleteEquations, wrongNumberEquations, badEquationIds } =
    findBadEquations();

  if (incompleteEquations.length > 0) {
    errors.push(
      `${equationLabel(incompleteEquations)}: a number is missing`
    );
  }
  if (wrongNumberEquations.length > 0) {
    errors.push(
      `${equationLabel(wrongNumberEquations)}: the numbers do not give the answer`
    );
  }

  if (badEquationIds.length > 0) {
    // Highlight incorrect equations
    badEquationIds.forEach((id) => {
      document.querySelector(`[data-equation="${id}"]`).classList.add('error');
    });
  } else {
    // Clear error highlighting
    document
      .querySelectorAll('.equation')
      .forEach((eq) => eq.classList.remove('error'));
  }

  // Check 5: Solutions match trivia answers.
  // An empty solution is already reported by Check 4, so skip it here.
  // The trivia answer is never printed: this only says the solution does not fit.
  currentPuzzle.equations.forEach((eq) => {
    const userAnswer = gameState.userInputs[`sol-${eq.id}`];
    if (!isBlank(userAnswer) && userAnswer !== eq.answer) {
      errors.push(`${equationLabel([eq.id])}: the solution does not fit the question`);
    }
  });

  return {
    success: errors.length === 0,
    errors: errors,
  };
}

function handleWin() {
  gameState.completed = true;
  bankClock(); // Play time stops at the win
  closeHintChoices();
  gameState.undoHistory = []; // A win ends the undo history
  updateUndoControls();

  // Update statistics
  updateStatistics(
    gameState.currentDifficulty,
    gameState.attempts,
    gameState.hintsUsed,
    gameState.mode === 'daily'
  );

  // A finished daily is remembered under its own key (see saveDailyResult)
  if (gameState.mode === 'daily') {
    saveDailyResult({
      series: DAILY_SERIES,
      date: gameState.dailyDate,
      number: getDailyNumber(gameState.dailyDate),
      attempts: gameState.attempts,
      hints: gameState.hintsUsed,
      history: gameState.attemptHistory,
      elapsedMs: gameState.elapsedMs,
    });
    document.getElementById('reset-btn').disabled = true; // No replaying the daily
  }

  // Clear saved puzzle (completed)
  clearPuzzleState();

  // Show the win panel in place of the one-line message
  showWinPanel(gameState.elapsedMs);

  // Trigger confetti
  triggerConfetti();
}

/* ===================================
  SUBMIT MARKS
  =================================== */

const EQUATION_STATUS_TEXT = {
  correct: '✓ Correct',
  math: "✗ Numbers don't work",
  answer: "✗ Answer doesn't fit the question",
  empty: '… Incomplete',
};
const EQUATION_STATUS_CLASS = {
  correct: 'is-correct',
  math: 'is-wrong',
  answer: 'is-wrong',
  empty: 'is-empty',
};
const EQUATION_STATUS_CLASSES = ['is-correct', 'is-wrong', 'is-empty'];

/**
 * Puts one status mark on every equation card and one ✓ or ✗ on each column target.
 *
 * @param {string[]} statuses - classifyEquation result per equation, in puzzle order
 * @param {boolean[]} columns - [column1 ok, column2 ok], as in the attempt entry
 */
function showSubmitMarks(statuses, columns) {
  currentPuzzle.equations.forEach((eq, index) => {
    setEquationMark(eq.id, statuses[index]);
  });
  setColumnMark('col1', columns[0]);
  setColumnMark('col2', columns[1]);
}

/**
 * Draws one equation's status mark on its card (the same mark Submit draws)
 *
 * @param {number} equationId - Equation id
 * @param {string} status - 'correct', 'math', 'answer' or 'empty'
 */
function setEquationMark(equationId, status) {
  const card = document.querySelector(`.equation[data-equation="${equationId}"]`);
  card.classList.remove(...EQUATION_STATUS_CLASSES);
  card.classList.add(EQUATION_STATUS_CLASS[status]);
  card.querySelector('.equation-status').textContent = EQUATION_STATUS_TEXT[status];
}

/**
 * One-line summary for a Submit that is not a win, plus a "Check equations ..."
 * line naming every equation that is not right yet.
 *
 * @param {string[]} statuses - classifyEquation result per equation, in puzzle order
 * @param {boolean[]} columns - [column1 ok, column2 ok]
 */
function showSubmitSummary(statuses, columns) {
  const correctCount = statuses.filter((s) => s === 'correct').length;
  const columnText = (name, ok) => `${name} ${ok ? '✓' : '✗'}`;
  let message =
    `${correctCount} of ${statuses.length} equations correct · ` +
    `${columnText('Column 1', columns[0])} · ${columnText('Column 2', columns[1])}`;

  const notRight = currentPuzzle.equations
    .filter((eq, index) => statuses[index] !== 'correct')
    .map((eq) => eq.id);
  if (notRight.length > 0) {
    const last = notRight[notRight.length - 1];
    const list =
      notRight.length === 1
        ? `${last}`
        : `${notRight.slice(0, -1).join(', ')} and ${last}`;
    message += `\nCheck ${notRight.length === 1 ? 'equation' : 'equations'} ${list}.`;
  }

  showFeedback(message, 'error');
}

/**
 * Removes the status mark from one equation card (called when the player edits it).
 *
 * @param {number} equationId - Equation id
 */
function clearEquationMark(equationId) {
  const card = document.querySelector(`.equation[data-equation="${equationId}"]`);
  if (!card) return;
  card.classList.remove(...EQUATION_STATUS_CLASSES);
  card.querySelector('.equation-status').textContent = '';
}

/**
 * Removes every status mark: all cards and both column targets.
 */
function clearAllSubmitMarks() {
  document.querySelectorAll('.equation').forEach((card) => {
    card.classList.remove(...EQUATION_STATUS_CLASSES);
    card.querySelector('.equation-status').textContent = '';
  });
  clearColumnMark('col1');
  clearColumnMark('col2');
}

/**
 * @param {string} columnId - 'col1' or 'col2'
 * @param {boolean} matches - True when the column is complete and on target
 */
function setColumnMark(columnId, matches) {
  const mark = document.getElementById(`${columnId}-mark`);
  mark.textContent = matches ? '✓' : '✗';
  mark.classList.toggle('is-correct', matches);
  mark.classList.toggle('is-wrong', !matches);
}

/**
 * @param {string} columnId - 'col1' or 'col2'
 */
function clearColumnMark(columnId) {
  const mark = document.getElementById(`${columnId}-mark`);
  mark.textContent = '';
  mark.classList.remove('is-correct', 'is-wrong');
}

/**
 * The equation number from a blank's position, e.g. 'op2-3' gives 3.
 *
 * @param {string} position - data-position of a blank ('op1-N', 'op2-N' or 'sol-N')
 * @returns {number} Equation id
 */
function equationIdOf(position) {
  return Number(position.split('-')[1]);
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
}

/* ===================================
  SHARE RESULTS
  =================================== */

const SHARE_URL = 'https://thebimsider.github.io/sumwords/V01/';
const SHARE_MAX_ROWS = 8; // Grid shows only the last rows of a very long game
const SHARE_SQUARES = { correct: '🟩', hinted: '🟨', wrong: '🟥', empty: '⬜' };
let shareLabelTimer = null;

/**
 * Classifies one equation for Submit feedback. Pure: reads only its arguments.
 * 'empty' when any blank is unset (a real 0 counts as set); 'math' when the two
 * numbers do not give the solution under the equation's own operator; 'answer'
 * when the numbers work but the solution is not the trivia answer; 'correct'
 * when both hold.
 *
 * @param {{id: number, operator: string, answer: number}} eq - One equation of currentPuzzle
 * @param {object} userInputs - gameState.userInputs
 * @returns {'correct'|'math'|'answer'|'empty'} The equation's status
 */
function classifyEquation(eq, userInputs) {
  const op1 = userInputs[`op1-${eq.id}`];
  const op2 = userInputs[`op2-${eq.id}`];
  const sol = userInputs[`sol-${eq.id}`];
  if (isBlank(op1) || isBlank(op2) || isBlank(sol)) return 'empty';
  if (applyOperator(eq.operator, op1, op2) !== sol) return 'math';
  if (sol !== eq.answer) return 'answer';
  return 'correct';
}

/* ===================================
  UNDO HISTORY (pure helpers)
  =================================== */

// A move is { type: 'place' | 'remove', position, value } for an operand blank.
// The history lives in memory only (gameState.undoHistory) and is never saved.
// Hints and answer-box typing are not recorded.
const UNDO_LIMIT = 100;

/**
 * Adds a move to the end of the history, dropping the oldest once past the cap.
 *
 * @param {object[]} history - Undo history (changed in place)
 * @param {{type: string, position: string, value: number}} move - Move to add
 * @returns {object[]} The same history array
 */
function recordMove(history, move) {
  history.push(move);
  if (history.length > UNDO_LIMIT) {
    history.splice(0, history.length - UNDO_LIMIT);
  }
  return history;
}

/**
 * Counts the unused pool tiles that show one value. Tiles with the same value
 * are interchangeable, so a count is all Undo needs.
 *
 * @param {number[]} poolValues - Every tile in the pool (currentPuzzle.numberPool)
 * @param {number[]} poolNumbersUsed - gameState.poolNumbersUsed
 * @param {number} value - Number to count
 * @returns {number} Unused tiles showing that value
 */
function freeTileCount(poolValues, poolNumbersUsed, value) {
  const total = poolValues.filter((v) => v === value).length;
  const used = poolNumbersUsed.filter((v) => v === value).length;
  return total - used;
}

/**
 * Works out the next Undo step. The newest move is always taken off the
 * history, even when it cannot be undone, so the next press goes one move
 * further back. Pure: reads its arguments only.
 *
 * Action types:
 *  - 'none': the history was empty
 *  - 'clear': empty the blank (undoing a placement)
 *  - 'fill': put the value back in the blank (undoing a removal)
 *  - 'unavailable': every tile with that value is in use again
 *  - 'hint': a hint filled that blank, so Undo never changes it
 *  - 'stale': the board no longer matches the move, so nothing changes
 *
 * @param {object[]} history - gameState.undoHistory
 * @param {object} userInputs - gameState.userInputs
 * @param {number[]} poolValues - currentPuzzle.numberPool
 * @param {number[]} poolNumbersUsed - gameState.poolNumbersUsed
 * @param {string[]} [hintFilled=[]] - Positions of blanks a hint filled
 * @returns {{history: object[], action: {type: string, position?: string, value?: number}}}
 */
function planUndo(history, userInputs, poolValues, poolNumbersUsed, hintFilled = []) {
  if (history.length === 0) return { history, action: { type: 'none' } };

  const move = history[history.length - 1];
  const rest = history.slice(0, -1);
  const { position, value } = move;

  if (hintFilled.includes(position)) {
    return { history: rest, action: { type: 'hint', position, value } };
  }

  if (move.type === 'place') {
    if (userInputs[position] !== value) {
      return { history: rest, action: { type: 'stale', position, value } };
    }
    return { history: rest, action: { type: 'clear', position, value } };
  }

  // A removal: the blank must be empty, and one unused tile must show the value
  if (userInputs[position] !== undefined) {
    return { history: rest, action: { type: 'stale', position, value } };
  }
  if (freeTileCount(poolValues, poolNumbersUsed, value) < 1) {
    return { history: rest, action: { type: 'unavailable', position, value } };
  }
  return { history: rest, action: { type: 'fill', position, value } };
}

/**
 * Decides what a Check does for one equation. A Check charges a hint only when
 * the equation is complete and its card has no current mark. Marks clear on
 * any edit, so an unmarked complete equation has changed since its last check.
 * The status comes from classifyEquation, the same as Submit uses.
 *
 * @param {{id: number, operator: string, answer: number}} eq - One equation of currentPuzzle
 * @param {object} userInputs - gameState.userInputs
 * @param {boolean} alreadyMarked - True when the card still shows a status mark
 * @returns {{status: string, charge: boolean}} status is 'correct', 'math', 'answer' or 'empty'
 */
function checkEquationOutcome(eq, userInputs, alreadyMarked) {
  const status = classifyEquation(eq, userInputs);
  return { status, charge: status !== 'empty' && !alreadyMarked };
}

/**
 * Records one Submit press as a spoiler-free result: each equation's status
 * and whether each column matches its target. Reads only its arguments.
 * An equation is 'correct' when its numbers work out AND the solution matches
 * the trivia answer, 'empty' when any blank is unfilled, otherwise 'wrong'.
 * A column is true only when all its blanks are filled and the total matches.
 * `hinted` is a snapshot: true for each equation with any hint used on it at
 * the moment of this Submit, so later hints do not change earlier rows.
 *
 * @param {object[]} equations - currentPuzzle.equations
 * @param {{column1: number, column2: number}} columnTargets - currentPuzzle.columnTargets
 * @param {object} userInputs - gameState.userInputs
 * @param {object} [hintedEquations={}] - gameState.hintedEquations ({ equationId: ['?', '#'] })
 * @param {string[]} [statuses] - classifyEquation result per equation; pass it when the
 *   caller already has it (Submit does) so each equation is classified once
 * @returns {{equations: string[], columns: boolean[], hinted: boolean[]}} One attempt's result
 */
function buildAttemptEntry(
  equations,
  columnTargets,
  userInputs,
  hintedEquations = {},
  statuses = equations.map((eq) => classifyEquation(eq, userInputs))
) {
  const equationResults = statuses.map((status) =>
    status === 'correct' || status === 'empty' ? status : 'wrong'
  );

  const columnComplete = (prefix, target) => {
    const values = equations.map((eq) => userInputs[`${prefix}-${eq.id}`]);
    if (values.some(isBlank)) return false;
    return values.reduce((total, value) => total + value, 0) === target;
  };

  return {
    equations: equationResults,
    columns: [
      columnComplete('op1', columnTargets.column1),
      columnComplete('op2', columnTargets.column2),
    ],
    hinted: equations.map((eq) => (hintedEquations[eq.id] || []).length > 0),
  };
}

/**
 * Builds the text copied by "Share result". Pure: no page or game globals.
 *
 * @param {object} result
 * @param {string} result.version - GAME_VERSION
 * @param {string} result.url - Game link shown on the last line
 * @param {string} result.currentDifficulty - 'easy', 'medium', 'hard' or 'random'
 * @param {string|null} result.assignedDifficulty - Actual level when random was chosen
 * @param {number} result.attempts - True attempt count (may exceed history length)
 * @param {number} result.hints - Hints used
 * @param {{equations: string[], columns: boolean[], hinted?: boolean[]}[]} result.history - One entry per Submit (hinted is absent in older saves)
 * @param {number|string} [result.dailyNumber] - Daily puzzle number (the "series-day" label, for example "2-12"). When present the header shows it instead of the difficulty
 * @returns {string} Share text with no trivia or puzzle numbers
 */
function buildShareText({
  version,
  url,
  currentDifficulty,
  assignedDifficulty,
  attempts,
  hints,
  history,
  dailyNumber,
}) {
  const difficultyKey = assignedDifficulty || currentDifficulty;
  const difficulty =
    difficultyKey.charAt(0).toUpperCase() + difficultyKey.slice(1);
  // A daily is always Medium, so its header names the daily number instead
  const header = dailyNumber
    ? `Sumwords v${version} · Daily #${dailyNumber}`
    : `Sumwords v${version} · ${difficulty}`;

  const lines = [
    header,
    `${countWord(attempts, 'attempt')} · ${countWord(hints, 'hint')} ${'⭐'.repeat(getStarRating(attempts, hints))}`,
    '',
  ];

  history.slice(-SHARE_MAX_ROWS).forEach((entry) => {
    // Yellow only replaces green: a wrong or empty hinted equation keeps its square.
    // Entries saved before `hinted` existed have no flags, so they render as before.
    const equationRow = entry.equations
      .map((status, i) => {
        if (status === 'correct' && entry.hinted && entry.hinted[i]) {
          return SHARE_SQUARES.hinted;
        }
        return SHARE_SQUARES[status] || SHARE_SQUARES.empty;
      })
      .join('');
    const columnRow = entry.columns
      .map((ok) => (ok ? SHARE_SQUARES.correct : SHARE_SQUARES.wrong))
      .join('');
    lines.push(`${equationRow} ${columnRow}`);
  });

  lines.push('', url);
  return lines.join('\n');
}

/**
 * Star rating for a win: 1 to 3 stars, worked out from attempts and hints.
 * penalty = extra attempts * 2 + hints. 0 is 3 stars (the perfect game),
 * 1 to 3 is 2 stars, 4 or more is 1 star. Any win is at least 1 star.
 * Recomputed every time, never saved.
 * @param {number} attempts - Submits used, 1 or more
 * @param {number} hints - Hints used
 * @returns {number} 1, 2 or 3
 */
function getStarRating(attempts, hints) {
  const penalty = Math.max(0, attempts - 1) * 2 + hints;
  if (penalty === 0) return 3;
  if (penalty <= 3) return 2;
  return 1;
}

// The word shown beside the stars, so the rating never depends on emoji alone
const STAR_LABELS = { 1: 'Solved!', 2: 'Nice work!', 3: 'Perfect!' };

/**
 * The win panel star line: earned stars, then empty ones ("⭐⭐☆")
 * @param {number} stars - 1 to 3
 * @returns {string}
 */
function getStarLine(stars) {
  return '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
}

/**
 * "1 attempt", "3 attempts", "1 hint", "2 hints"
 * @param {number} count
 * @param {string} word - Singular noun
 * @returns {string}
 */
function countWord(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/**
 * Show the win panel in place of the one-line success message.
 * Call after updateStatistics so the streak is up to date.
 * @param {number} [timeMs] - Play time in ms. Left out (or invalid) hides the time, as for a daily saved before play time existed
 */
function showWinPanel(timeMs) {
  const stars = getStarRating(gameState.attempts, gameState.hintsUsed);
  const starsEl = document.getElementById('win-stars');
  starsEl.textContent = getStarLine(stars);
  starsEl.setAttribute('aria-label', `${stars} of 3 stars`);
  document.getElementById('win-label').textContent = STAR_LABELS[stars];

  document.getElementById('win-attempts').textContent = countWord(
    gameState.attempts,
    'attempt'
  );
  document.getElementById('win-hints').textContent = countWord(
    gameState.hintsUsed,
    'hint'
  );
  const hasTime = isValidPlayTime(timeMs);
  document.getElementById('win-time-item').hidden = !hasTime;
  document.getElementById('win-time').textContent = hasTime
    ? formatPlayTime(timeMs)
    : '';
  document.getElementById('win-streak').textContent =
    loadStatistics().overall.currentStreak;

  document.getElementById('win-next-daily').hidden =
    gameState.mode !== 'daily';
  document.getElementById('feedback').hidden = true;
  document.getElementById('win-panel').hidden = false;
  // Land keyboard and screen reader users on the result
  document.getElementById('win-label').focus();
}

/**
 * Hide the win panel and bring back the message line. Safe to call anytime.
 */
function hideWinPanel() {
  clearTimeout(shareLabelTimer);
  shareLabelTimer = null;
  document.getElementById('share-btn').textContent = 'Share result';
  document.getElementById('share-fallback').hidden = true;
  document.getElementById('share-fallback-text').value = '';

  document.getElementById('win-panel').hidden = true;
  document.getElementById('win-next-daily').hidden = true;
  document.getElementById('feedback').hidden = false;
}

/**
 * Copy the share text. If the clipboard is unavailable (for example a
 * file:// page or permission denied), show the text in a box to copy by hand.
 */
async function handleShare() {
  const text = buildShareText({
    version: GAME_VERSION,
    url: SHARE_URL,
    currentDifficulty: gameState.currentDifficulty,
    assignedDifficulty: gameState.assignedDifficulty,
    attempts: gameState.attempts,
    hints: gameState.hintsUsed,
    history: gameState.attemptHistory,
    dailyNumber:
      gameState.mode === 'daily'
        ? getDailyLabel(gameState.dailyDate)
        : undefined,
  });

  try {
    await navigator.clipboard.writeText(text);
    showShareCopied();
  } catch (error) {
    showShareFallback(text);
  }
}

/**
 * Tell the player the result was copied: the button reads "Copied!" for
 * two seconds, then goes back to "Share result".
 */
function showShareCopied() {
  const button = document.getElementById('share-btn');
  document.getElementById('share-fallback').hidden = true;
  button.textContent = 'Copied!';

  clearTimeout(shareLabelTimer);
  shareLabelTimer = setTimeout(() => {
    button.textContent = 'Share result';
    shareLabelTimer = null;
  }, 2000);
}

/**
 * Show the result in a read-only text box, selected, so the player can copy
 * it by hand when the clipboard is blocked (for example on a file:// page).
 * @param {string} text - The share text to show
 */
function showShareFallback(text) {
  const box = document.getElementById('share-fallback-text');
  box.value = text;
  document.getElementById('share-fallback').hidden = false;
  box.focus();
  box.select();
}

/* ===================================
  NEW PUZZLE & RESET HANDLERS
  =================================== */

/**
 * True if the player has made a Submit or used a hint on a puzzle they have not
 * solved yet (breaks the win streak on Reset). A solved puzzle never counts:
 * its win is already recorded.
 */
function hasPlayed() {
  return (
    !gameState.completed && (gameState.attempts > 0 || gameState.hintsUsed > 0)
  );
}

/**
 * True if the player has progress that a new puzzle or reset would discard.
 * A solved puzzle has nothing left to lose.
 */
function hasProgress() {
  return (
    !gameState.completed &&
    (hasPlayed() ||
      gameState.poolNumbersUsed.length > 0 ||
      Object.keys(gameState.userInputs).some((key) => key.startsWith('sol')))
  );
}

/**
 * Find the next empty operand position after `fromPosition`, wrapping around
 * @param {string[]} positions - Operand positions in play order (op1-1, op2-1, op1-2, ...)
 * @param {object} userInputs - gameState.userInputs
 * @param {string} fromPosition - Position just filled
 * @returns {string|null} Next empty position, or null if every blank is filled
 */
function findNextEmptyPosition(positions, userInputs, fromPosition) {
  const start = positions.indexOf(fromPosition);
  for (let i = 1; i <= positions.length; i++) {
    const candidate = positions[(start + i) % positions.length];
    if (userInputs[candidate] === undefined) return candidate;
  }
  return null;
}

/**
 * Ask before discarding progress. Returns true when there is nothing to lose or the player confirms.
 * @param {string} message - Confirmation text
 * @returns {boolean}
 */
function confirmDiscardProgress(message) {
  if (!hasProgress()) return true;
  return confirm(message);
}

/* ===================================
  KEYBOARD INPUT AND ACCESSIBILITY
  =================================== */

// KEYBOARD HELPERS START (pure functions, loaded by tests/keyboard.test.js)

const TYPED_PAUSE_MS = 700; // A typed multi-digit number is placed after this pause
const ARROW_DIRECTIONS = {
  ArrowLeft: -1,
  ArrowUp: -1,
  ArrowRight: 1,
  ArrowDown: 1,
};
const OPERAND_NAMES = { op1: 'first number', op2: 'second number' };

/**
 * Match typed digits to a pool tile.
 * An unused tile whose value equals the digits is placed at once, unless a longer
 * unused value starts with them (typing "1" while a 12 is free); then the digits
 * stay pending until Enter, a pause (`final`) or more digits.
 * @param {string} buffer - Digits typed so far
 * @param {number[]} values - Pool values in tile order
 * @param {boolean[]} used - Whether each tile is already used
 * @param {boolean} [final] - No more digits are coming: never pending
 * @returns {{index: number}|{pending: true}|{none: true}}
 */
function matchTypedValue(buffer, values, used, final = false) {
  if (!/^\d+$/.test(buffer)) return { none: true };
  let exact = -1;
  let longer = false;
  values.forEach((value, index) => {
    if (used[index]) return;
    const text = String(value);
    if (text === buffer) {
      if (exact === -1) exact = index;
    } else if (text.startsWith(buffer)) {
      longer = true;
    }
  });
  if (exact !== -1 && (final || !longer)) return { index: exact };
  if (longer && !final) return { pending: true };
  return { none: true };
}

/**
 * The operand position `direction` steps from `current`, wrapping at the ends
 * @param {string[]} positions - Operand positions in play order
 * @param {string} current - Current position (not found: start at the first or last)
 * @param {number} direction - 1 forward, -1 back
 * @returns {string}
 */
function nextOperandPosition(positions, current, direction) {
  const i = positions.indexOf(current);
  if (i === -1) return direction > 0 ? positions[0] : positions[positions.length - 1];
  return positions[(i + direction + positions.length) % positions.length];
}

/**
 * The index of the unused pool tile `direction` steps from `current`, wrapping
 * @param {boolean[]} used - Whether each tile is already used
 * @param {number} current - Current tile index (-1: start before the first)
 * @param {number} direction - 1 forward, -1 back
 * @returns {number} Tile index, or -1 when every tile is used
 */
function nextPoolIndex(used, current, direction) {
  const count = used.length;
  const from = current < 0 ? (direction > 0 ? -1 : count) : current;
  for (let step = 1; step <= count; step++) {
    const i = (((from + direction * step) % count) + count) % count;
    if (!used[i]) return i;
  }
  return -1;
}

/**
 * Plain-language spot for an operand blank, e.g. "equation 2, first number"
 * @param {string} position - 'op1-N' or 'op2-N'
 * @returns {string}
 */
function operandSpot(position) {
  const [prefix, id] = position.split('-');
  return `equation ${id}, ${OPERAND_NAMES[prefix]}`;
}

/**
 * Screen reader label for an operand blank
 * @param {string} position - 'op1-N' or 'op2-N'
 * @param {number|undefined} value - Placed number, if any
 * @returns {string} e.g. "Equation 2, first number, empty"
 */
function operandLabel(position, value) {
  const spot = operandSpot(position);
  const state = value === undefined || value === null ? 'empty' : value;
  return `${spot.charAt(0).toUpperCase()}${spot.slice(1)}, ${state}`;
}

// KEYBOARD HELPERS END

let typedBuffer = ''; // Digits typed toward a pool number; never saved
let typedTimer = null;
let lastAnnouncement = '';

/**
 * Say something to screen readers through the polite live region
 * @param {string} message - Text to announce
 */
function announce(message) {
  const region = document.getElementById('sr-announcer');
  if (!region) return;
  // The same message twice in a row would not be read again, so vary it
  lastAnnouncement = lastAnnouncement === message ? `${message} ` : message;
  region.textContent = lastAnnouncement;
}

/**
 * Refresh every operand blank and pool tile label, the selected state and the
 * pool's single Tab stop. Called wherever placement or selection changes.
 */
function syncInputLabels() {
  document.querySelectorAll('.blank.operand').forEach((blank) => {
    const position = blank.dataset.position;
    blank.setAttribute('aria-label', operandLabel(position, gameState.userInputs[position]));
    blank.setAttribute('aria-pressed', String(blank === gameState.selectedBlank));
  });

  const tiles = Array.from(document.querySelectorAll('.pool-number'));
  const unused = tiles.filter((tile) => !tile.classList.contains('used'));
  // The pool is one Tab stop: the focused tile, else the first unused one
  const stop = unused.includes(document.activeElement)
    ? document.activeElement
    : unused[0];
  tiles.forEach((tile) => {
    const isUsed = tile.classList.contains('used');
    const state = isUsed
      ? 'used'
      : tile.classList.contains('selected')
        ? 'selected'
        : 'available';
    tile.setAttribute('aria-label', `${tile.dataset.number}, ${state}`); // e.g. "7, available"
    tile.setAttribute('aria-disabled', String(isUsed));
    tile.tabIndex = tile === stop ? 0 : -1;
  });
}

function clearTypedBuffer() {
  clearTimeout(typedTimer);
  typedTimer = null;
  typedBuffer = '';
}

/**
 * Current pool as parallel arrays, in tile order
 */
function readPool() {
  const tiles = Array.from(document.querySelectorAll('.pool-number'));
  return {
    tiles,
    values: tiles.map((tile) => parseInt(tile.dataset.number)),
    used: tiles.map((tile) => tile.classList.contains('used')),
  };
}

/**
 * One delegated keydown handler for typing numbers, arrow navigation and Escape.
 * Registered before the header menu and hint handlers so that Escape still
 * closes an open menu or hint row first, and only then peels off a selection.
 * @param {KeyboardEvent} event
 */
function handleKeyboardInput(event) {
  if (event.ctrlKey || event.altKey || event.metaKey) return;
  if (gameState.completed) return;
  if (document.querySelector('.modal:not(.hidden)')) return;
  const target = event.target;
  if (target.closest('input, select, textarea')) return;

  const onBlank = target.closest('.blank.operand');
  const onTile = target.closest('.pool-number');
  const key = event.key;

  if (key === 'Escape') {
    handleEscapeKey();
  } else if (/^[0-9]$/.test(key)) {
    // Digits only count on a blank, a tile or the bare page
    if (onBlank || onTile || target === document.body) {
      handleTypedDigit(event, onBlank);
    }
  } else if (
    key === 'Enter' &&
    typedBuffer &&
    (onBlank || onTile || target === document.body) &&
    (onBlank || gameState.selectedBlank)
  ) {
    // Only on a blank, a tile or the bare page: Enter on a button keeps its job
    event.preventDefault(); // Enter places the typed number, not a click
    resolveTypedBuffer(onBlank || gameState.selectedBlank, true);
  } else if (onBlank) {
    handleBlankKey(event, onBlank);
  } else if (onTile) {
    handlePoolKey(event, onTile);
  }
}

/**
 * Escape undoes one thing: the typed digits, then the selected tile, then the
 * selected blank. An open hint row or header menu keeps Escape for itself.
 */
function handleEscapeKey() {
  if (document.querySelector('.hint-choices:not([hidden])')) return;
  const menu = document.getElementById('header-controls');
  if (menu && menu.classList.contains('open')) return;

  if (typedBuffer) {
    clearTypedBuffer();
  } else if (gameState.selectedNumberElement) {
    deselectPoolNumber();
  } else if (gameState.selectedBlank) {
    deselectBlank();
  }
}

/**
 * Arrows move between operand blanks (selecting each); Backspace or Delete
 * returns a filled blank's number to the pool. Enter and Space click natively.
 * @param {KeyboardEvent} event
 * @param {HTMLElement} blank - The focused operand blank
 */
function handleBlankKey(event, blank) {
  const position = blank.dataset.position;
  const direction = ARROW_DIRECTIONS[event.key];

  if (direction) {
    event.preventDefault();
    clearTypedBuffer();
    const positions = Array.from(document.querySelectorAll('.blank.operand')).map(
      (b) => b.dataset.position
    );
    const next = document.querySelector(
      `.blank.operand[data-position="${nextOperandPosition(positions, position, direction)}"]`
    );
    selectBlankForPlacement(next);
    next.focus();
  } else if (
    (event.key === 'Backspace' || event.key === 'Delete') &&
    blank.classList.contains('filled')
  ) {
    event.preventDefault();
    clearTypedBuffer();
    returnNumberToPool(blank, position);
    selectBlankForPlacement(blank); // Same as tap-to-fix: the next number goes back here
  }
}

/**
 * Arrows move focus across the unused pool tiles
 * @param {KeyboardEvent} event
 * @param {HTMLElement} tile - The focused pool tile
 */
function handlePoolKey(event, tile) {
  const direction = ARROW_DIRECTIONS[event.key];
  if (!direction) return;
  event.preventDefault();
  const { tiles, used } = readPool();
  const next = nextPoolIndex(used, tiles.indexOf(tile), direction);
  if (next === -1) return;
  tiles[next].focus();
  syncInputLabels(); // Moves the pool's Tab stop to the tile just focused
}

/**
 * Add a typed digit and place the number if it is clear which tile is meant
 * @param {KeyboardEvent} event
 * @param {HTMLElement|null} onBlank - The focused operand blank, if any
 */
function handleTypedDigit(event, onBlank) {
  const blank = onBlank || gameState.selectedBlank;
  if (!blank) return;
  event.preventDefault();
  typedBuffer += event.key;
  resolveTypedBuffer(blank, false);
}

/**
 * Place the typed number, keep waiting for more digits, or report no match
 * @param {HTMLElement} blank - Operand blank to fill
 * @param {boolean} final - Enter or the pause ended the typing
 */
function resolveTypedBuffer(blank, final) {
  clearTimeout(typedTimer);
  const { tiles, values, used } = readPool();
  const result = matchTypedValue(typedBuffer, values, used, final);

  if (result.pending) {
    typedTimer = setTimeout(() => {
      if (typedBuffer) resolveTypedBuffer(blank, true);
    }, TYPED_PAUSE_MS);
    return;
  }

  const typed = typedBuffer;
  clearTypedBuffer();
  if (result.none) {
    showFeedback(`No unused ${typed} in the pool.`, 'warning');
    return;
  }
  placeTypedNumber(blank, tiles[result.index]);
}

/**
 * Place a pool tile in a blank through the same code a tap uses, so
 * poolNumbersUsed and duplicate pool values stay correct
 * @param {HTMLElement} blank - Operand blank (a filled one is emptied first)
 * @param {HTMLElement} tile - Unused pool tile to place
 */
function placeTypedNumber(blank, tile) {
  const position = blank.dataset.position;
  if (blank.classList.contains('filled')) returnNumberToPool(blank, position);
  deselectPoolNumber();
  gameState.selectedNumber = parseInt(tile.dataset.number);
  gameState.selectedNumberElement = tile;
  placeNumberInBlank(blank, position);
  followSelectedBlank();
}

/**
 * After a placement, keep keyboard focus on the blank that is now selected
 * so typing can carry on
 */
function followSelectedBlank() {
  if (gameState.selectedBlank) gameState.selectedBlank.focus();
}

/**
 * Click listener added after the tap handlers: a click from Enter or Space
 * (detail 0) moves focus on, a mouse or touch click keeps its own focus
 * @param {MouseEvent} event
 */
function followKeyboardClick(event) {
  if (event.detail === 0) followSelectedBlank();
}

/* ===================================
  DAILY PUZZLE
  =================================== */

/**
 * True when a saved puzzle is a daily that is no longer today's: from another
 * date, or from an earlier series (the dailies were changed since)
 * @param {object} puzzleState - Saved puzzle state
 * @returns {boolean}
 */
function isStaleDaily(puzzleState) {
  const saved = puzzleState.gameState;
  return (
    !!saved &&
    saved.mode === 'daily' &&
    (saved.dailyDate !== getDailyDate() || saved.dailySeries !== DAILY_SERIES)
  );
}

/**
 * Daily button: start today's daily. Does nothing while today's daily is
 * already loaded, so the current progress is never replaced by accident.
 */
function handleDailyClick() {
  const today = getDailyDate();
  if (gameState.mode === 'daily' && gameState.dailyDate === today) return;

  if (
    !confirmDiscardProgress(
      "Start today's daily puzzle? Your progress on this one will be lost."
    )
  ) {
    return;
  }

  // Already won today: show the saved result instead of a new puzzle
  const finished = loadDailyResult();
  if (finished && finished.date === today && finished.series === DAILY_SERIES) {
    showFinishedDaily(finished);
  } else {
    startDailyPuzzle(today);
  }
}

/**
 * Show a finished daily: today's board with the win panel, the saved
 * attempts and hints, Share result and "Next puzzle tomorrow". The daily
 * cannot be played again, so Submit and the hints are turned off.
 * @param {{date: string, attempts: number, hints: number, history: object[]}} result - From loadDailyResult
 */
function showFinishedDaily(result) {
  if (!loadDailyBoard(result.date)) return;

  gameState.attempts = result.attempts || 0;
  gameState.hintsUsed = result.hints || 0;
  gameState.attemptHistory = Array.isArray(result.history) ? result.history : [];
  gameState.completed = true;
  gameState.clockStartedAt = null; // Nothing to time: the daily is already done
  updateUndoControls(); // A finished daily cannot be undone
  document.getElementById('attempt-count').textContent = gameState.attempts;
  document.getElementById('hint-count').textContent = gameState.hintsUsed;
  document.getElementById('submit-btn').disabled = true;
  document.getElementById('reset-btn').disabled = true;
  document.querySelectorAll('.btn-hint-equation').forEach((button) => {
    button.disabled = true;
  });

  clearPuzzleState(); // Nothing to resume: the daily is done
  showWinPanel(result.elapsedMs); // A daily saved before play time has none
}

/**
 * Start today's (unfinished) daily
 * @param {string} dateString - Local calendar date, YYYY-MM-DD
 */
function startDailyPuzzle(dateString) {
  if (!loadDailyBoard(dateString)) return;

  showFeedback(
    `Daily puzzle #${getDailyLabel(dateString)} loaded!`,
    'success'
  );
  savePuzzleState();
}

/**
 * Load the daily puzzle for a date onto the board and switch the game into
 * daily mode (selectors locked, banner shown)
 * @param {string} dateString - Local calendar date, YYYY-MM-DD
 * @returns {boolean} False if the puzzle could not be generated
 */
function loadDailyBoard(dateString) {
  const puzzle = generateDailyPuzzle(dateString);
  if (!puzzle) {
    showFeedback('Failed to generate puzzle. Please try again.', 'error');
    return false;
  }

  currentPuzzle = puzzle;
  gameState.currentCategory = DAILY_CATEGORY;
  gameState.currentDifficulty = DAILY_DIFFICULTY;
  gameState.mode = 'daily';
  gameState.dailyDate = dateString;
  document.getElementById('category-select').value = DAILY_CATEGORY;
  document.getElementById('difficulty-select').value = DAILY_DIFFICULTY;

  loadPuzzle(currentPuzzle); // Resets the play state; mode and date are kept
  refreshDailyUi();
  return true;
}

/**
 * Leave daily mode: restore the player's own category and difficulty and
 * re-enable the selectors. Does nothing outside daily mode.
 */
function leaveDaily() {
  if (gameState.mode !== 'daily') return;

  const prefs = loadPreferences() || {
    category: 'sports',
    difficulty: 'random',
  }; // Same defaults as the first dropdown options
  gameState.mode = 'normal';
  gameState.dailyDate = null;
  gameState.currentCategory = prefs.category;
  gameState.currentDifficulty = prefs.difficulty;
  document.getElementById('category-select').value = prefs.category;
  document.getElementById('difficulty-select').value = prefs.difficulty;
  refreshDailyUi();
}

/**
 * Show the daily state in the header and banner: the Daily button label,
 * the daily banner, and the category and difficulty selectors (locked in daily mode)
 */
function refreshDailyUi() {
  const inDaily = gameState.mode === 'daily';

  document.getElementById('category-select').disabled = inDaily;
  document.getElementById('difficulty-select').disabled = inDaily;
  document.getElementById('daily-btn').textContent = `📅 Daily #${getDailyLabel(
    getDailyDate()
  )}`;

  const banner = document.getElementById('daily-banner');
  if (inDaily) {
    banner.textContent = `Daily puzzle #${getDailyLabel(
      gameState.dailyDate
    )} · Medium · Everything`;
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }
}

/**
 * Generate and load a completely new puzzle
 */
function handleNewPuzzle() {
  if (
    !confirmDiscardProgress(
      'Start a new puzzle? Your progress on this one will be lost.'
    )
  ) {
    return;
  }

  leaveDaily(); // New Puzzle always leaves daily mode

  // Generate new puzzle
  currentPuzzle = generatePuzzle(
    gameState.currentCategory,
    gameState.currentDifficulty
  );

  if (!currentPuzzle) {
    showFeedback('Failed to generate puzzle. Please try again.', 'error');
    return;
  }

  loadPuzzle(currentPuzzle);
  showFeedback('New puzzle loaded!', 'success');

  clearPuzzleState(); // Clear old saved puzzle
  savePuzzleState(); // Save the fresh puzzle
}

/**
 * Reset current puzzle (clear all inputs, keep same puzzle)
 */
function handleReset() {
  // A finished daily cannot be replayed, so there is nothing to reset
  if (gameState.mode === 'daily' && gameState.completed) return;

  // Only a played puzzle (Submit or hint) breaks the win streak
  const breaksStreak = hasPlayed();

  if (hasProgress()) {
    const streak = loadStatistics().overall.currentStreak;
    const streakNote =
      breaksStreak && streak > 0 ? ' Your win streak will be reset.' : '';
    const message = `Reset this puzzle? Your blanks and hints will be cleared.${streakNote}`;
    if (!confirm(message)) return;
  }

  // Clear all user inputs
  gameState.userInputs = {};
  gameState.poolNumbersUsed = [];
  gameState.selectedNumber = null;
  gameState.selectedNumberElement = null;
  gameState.selectedBlank = null;
  clearTypedBuffer();
  gameState.attempts = 0;
  gameState.completed = false;
  gameState.hintsUsed = 0;
  gameState.hintedEquations = {}; // Reset to empty object
  gameState.attemptHistory = [];
  gameState.undoHistory = [];
  resetClock(); // A reset starts the puzzle over, and the time with it
  hideWinPanel();

  // Clear UI - operand blanks
  document.querySelectorAll('.blank.operand').forEach((blank) => {
    blank.textContent = '';
    blank.classList.remove('filled', 'selected', 'hint-revealed');
  });

  // Clear UI - solution inputs
  document.querySelectorAll('.blank.solution').forEach((input) => {
    input.value = '';
    input.classList.remove('hint-revealed');
  });

  // Clear UI - equations
  document.querySelectorAll('.equation').forEach((eq) => {
    eq.classList.remove('error', 'hinted');
  });

  // Clear UI - pool numbers
  document.querySelectorAll('.pool-number').forEach((num) => {
    num.classList.remove('used', 'selected');
  });

  // Reset counters
  document.getElementById('attempt-count').textContent = '0';
  document.getElementById('hint-count').textContent = '0';

  // Reset buttons
  document.getElementById('submit-btn').disabled = false;
  closeHintChoices();
  updateHintControls();

  // Clear feedback
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = 'feedback';

  // Update column totals to 0
  updateColumnTotals();
  updateUndoControls();

  showFeedback('Puzzle reset. Try again!', 'warning');

  // Reset streak only if the player had played this puzzle
  if (breaksStreak) {
    resetStreak();
  }

  // Clear saved state and save fresh reset state
  clearPuzzleState();
  savePuzzleState();
}

/**
 * Handle category selection change
 */
function handleCategoryChange(event) {
  if (
    !confirmDiscardProgress(
      'Change category? Your progress on this puzzle will be lost.'
    )
  ) {
    event.target.value = gameState.currentCategory; // Snap back to the loaded category
    return;
  }

  gameState.currentCategory = event.target.value;

  // Generate new puzzle with selected category
  currentPuzzle = generatePuzzle(
    gameState.currentCategory,
    gameState.currentDifficulty
  );

  if (!currentPuzzle) {
    showFeedback('Failed to generate puzzle. Please try again.', 'error');
    return;
  }

  loadPuzzle(currentPuzzle);
  showFeedback(`New ${gameState.currentCategory} puzzle loaded!`, 'success');

  savePreferences(); // Save category preference
  clearPuzzleState(); // Clear old puzzle
  savePuzzleState(); // Save new puzzle
}

/**
 * Handle difficulty selection change
 */
function handleDifficultyChange(event) {
  if (
    !confirmDiscardProgress(
      'Change difficulty? Your progress on this puzzle will be lost.'
    )
  ) {
    event.target.value = gameState.currentDifficulty; // Snap back to the loaded difficulty
    return;
  }

  gameState.currentDifficulty = event.target.value;

  // Generate new puzzle with selected difficulty
  currentPuzzle = generatePuzzle(
    gameState.currentCategory,
    gameState.currentDifficulty
  );

  if (!currentPuzzle) {
    showFeedback('Failed to generate puzzle. Please try again.', 'error');
    return;
  }

  loadPuzzle(currentPuzzle);
  showFeedback(`New ${gameState.currentDifficulty} puzzle loaded!`, 'success');

  savePreferences(); // Save difficulty preference
  clearPuzzleState(); // Clear old puzzle
  savePuzzleState(); // Save new puzzle
}

/* ===================================
  INPUT VALIDATION
  =================================== */

/**
 * Validate and sanitize solution input (integers only, 0-999)
 * @param {Event} event - Input event
 */
function validateSolutionInput(event) {
  const input = event.target;
  let value = input.value;

  // Remove all non-digit characters
  value = value.replace(/[^0-9]/g, '');

  // Limit to 3 digits (0-999)
  if (value.length > 3) {
    value = value.substring(0, 3);
  }

  // Convert to number and ensure it's within range
  if (value !== '') {
    const numValue = parseInt(value, 10);
    if (numValue > 999) {
      value = '999';
    }
  }

  // Update input with sanitized value
  input.value = value;

  // Update gameState with parsed integer or delete if empty
  const position = input.dataset.position;
  clearEquationMark(equationIdOf(position)); // The player changed this equation
  if (value !== '') {
    gameState.userInputs[position] = parseInt(value, 10);
  } else {
    delete gameState.userInputs[position];
  }

  savePuzzleState(); // AUTO-SAVE after solution input

  // Third digit typed: move on (fewer digits never advance, so the answer's
  // length is not revealed). The last input stays focused.
  if (value.length === 3) focusNextSolutionInput(input, false);
}

/**
 * Enter moves to the next solution input; Enter on the last one focuses Submit
 * @param {KeyboardEvent} event
 */
function handleSolutionKeydown(event) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  focusNextSolutionInput(event.target, true);
}

/**
 * Focus the solution input after `input`, selecting its text so typing replaces it
 * @param {HTMLInputElement} input - Current solution input
 * @param {boolean} submitAtEnd - Focus the Submit button when there is no next input
 */
function focusNextSolutionInput(input, submitAtEnd) {
  const inputs = Array.from(document.querySelectorAll('.blank.solution'));
  const next = inputs[inputs.indexOf(input) + 1];
  if (next) {
    next.focus();
    next.select();
  } else if (submitAtEnd) {
    document.getElementById('submit-btn').focus();
  }
}

/* ===================================
  HINT SYSTEM
  =================================== */

/**
 * Has this hint type already been used on the equation?
 * @param {number} equationId - ID of equation
 * @param {string} markerType - '?' (answer) or '#' (numbers)
 */
function hasHint(equationId, markerType) {
  return (gameState.hintedEquations[equationId] || []).includes(markerType);
}

/**
 * Delegated click handler for every equation's Hint button and choice row
 */
function handleHintClick(event) {
  const toggle = event.target.closest('.btn-hint-equation');
  if (toggle) {
    if (gameState.completed) return;
    const row = document.getElementById(`hint-choices-${toggle.dataset.equation}`);
    if (row.hidden) {
      openHintChoices(parseInt(toggle.dataset.equation));
    } else {
      closeHintChoices(true);
    }
    return;
  }

  const choice = event.target.closest('.btn-hint-choice');
  if (choice) {
    const equationId = parseInt(choice.dataset.equation);
    if (choice.dataset.hint === 'answer') revealAnswer(equationId);
    if (choice.dataset.hint === 'numbers') revealNumbers(equationId);
    if (choice.dataset.hint === 'check') checkEquation(equationId);
    updateHintControls();
    closeHintChoices(true);
    return;
  }

  // Tapping a blank closes any open choice row (the blank still does its job)
  if (event.target.closest('.blank')) closeHintChoices();
}

/**
 * Escape closes the open choice row and returns focus to its Hint button
 */
function handleHintKeydown(event) {
  if (event.key !== 'Escape') return;
  if (document.querySelector('.hint-choices:not([hidden])')) {
    closeHintChoices(true);
  }
}

/**
 * Open one equation's choice row (closing any other) and focus its first choice
 * @param {number} equationId - ID of equation
 */
function openHintChoices(equationId) {
  closeHintChoices();
  const row = document.getElementById(`hint-choices-${equationId}`);
  const toggle = document.querySelector(
    `.btn-hint-equation[data-equation="${equationId}"]`
  );
  if (!row || !toggle) return;
  row.hidden = false;
  toggle.setAttribute('aria-expanded', 'true');
  const first = row.querySelector('.btn-hint-choice:not(:disabled)');
  if (first) first.focus();
}

/**
 * Close every choice row
 * @param {boolean} returnFocus - Move focus back to the Hint button that was open
 */
function closeHintChoices(returnFocus = false) {
  // Only one row is ever open; its Hint button points at it via aria-controls
  const openRow = document.querySelector('.hint-choices:not([hidden])');
  const toggle =
    openRow && document.querySelector(`[aria-controls="${openRow.id}"]`);

  if (openRow) openRow.hidden = true;
  document.querySelectorAll('.btn-hint-equation').forEach((button) => {
    button.setAttribute('aria-expanded', 'false');
  });
  if (returnFocus && toggle && !toggle.disabled) toggle.focus();
}

/**
 * Sync every Hint button and choice with the hints used so far: a used choice
 * is disabled, and an equation with both hints used shows "Hinted"
 */
function updateHintControls() {
  document.querySelectorAll('.btn-hint-equation').forEach((toggle) => {
    const id = parseInt(toggle.dataset.equation);
    const answerUsed = hasHint(id, '?');
    const numbersUsed = hasHint(id, '#');
    const row = document.getElementById(`hint-choices-${id}`);
    row.querySelector('[data-hint="answer"]').disabled = answerUsed;
    row.querySelector('[data-hint="numbers"]').disabled = numbersUsed;
    // Both hints used: the pill reads "Hinted" but stays tappable, so the
    // row still offers ✓ Check (the other two choices are off)
    const allHinted = answerUsed && numbersUsed;
    toggle.classList.toggle('is-hinted', allHinted);
    toggle.textContent = allHinted ? 'Hinted' : 'Hint';
  });
}

/**
 * Check one equation without a Submit. Shows the same status mark Submit
 * would, never marks the columns, adds no attempt and never wins. A complete
 * equation whose mark is not current costs one hint; an incomplete equation,
 * or one whose mark is already current, is free.
 *
 * @param {number} equationId - ID of equation
 */
function checkEquation(equationId) {
  if (gameState.completed) return;

  const equation = currentPuzzle.equations.find((eq) => eq.id === equationId);
  if (!equation) return;

  const card = document.querySelector(`.equation[data-equation="${equationId}"]`);
  const alreadyMarked = EQUATION_STATUS_CLASSES.some((name) =>
    card.classList.contains(name)
  );
  const { status, charge } = checkEquationOutcome(
    equation,
    gameState.userInputs,
    alreadyMarked
  );

  if (status === 'empty') {
    showFeedback(`Fill every blank in equation ${equationId} first.`, 'warning');
    return;
  }

  setEquationMark(equationId, status);

  if (!charge) {
    showFeedback(`Equation ${equationId} is unchanged since its last check.`, 'warning');
    return;
  }

  gameState.hintsUsed++;
  updateHintCounter();
  savePuzzleState();
  showFeedback(`Checked equation ${equationId}. That counts as 1 hint.`, 'warning');
}

/**
 * Reveal the answer (solution) for an equation
 * @param {number} equationId - ID of equation
 */
function revealAnswer(equationId) {
  if (hasHint(equationId, '?')) return;

  const equation = currentPuzzle.equations.find((eq) => eq.id === equationId);

  if (!equation) return;

  // Find the solution input for this equation
  // Note: HTML uses sol-1, sol-2, etc (1-based, not 0-based)
  const solutionInput = document.querySelector(
    `.blank.solution[data-position="sol-${equationId}"]`
  );

  if (!solutionInput) {
    console.warn(`Could not find solution input for equation ${equationId}`);
    return;
  }

  // Reveal the answer
  solutionInput.value = equation.answer.toString();
  solutionInput.classList.add('hint-revealed');

  // Update gameState (using the HTML position format)
  gameState.userInputs[`sol-${equationId}`] = equation.answer;
  clearEquationMark(equationId); // The equation changed, so its old mark no longer applies
  gameState.hintsUsed++;

  // Add hint marker emoji
  addHintMarker(equationId, '?');

  // Update displays
  updateHintCounter();
  markEquationAsHinted(equationId);

  // Save state
  savePuzzleState();

  showFeedback('Answer revealed!', 'success');
}

/**
 * Reveal both numbers (operands) for an equation
 * @param {number} equationId - ID of equation
 */
function revealNumbers(equationId) {
  if (hasHint(equationId, '#')) return;

  const equation = currentPuzzle.equations.find((eq) => eq.id === equationId);

  if (!equation) return;

  // Get operands from solution object
  const operands = [equation.solution.operand1, equation.solution.operand2];

  // Reveal both operands
  // Note: HTML uses op1-1, op1-2 etc (not 0-based positions)
  operands.forEach((number, index) => {
    const operandNum = index + 1; // Convert to 1-based (op1 or op2)
    const position = `op${operandNum}-${equationId}`;
    const blank = document.querySelector(
      `.blank.operand[data-position="${position}"]`
    );

    if (!blank) {
      console.warn(`Could not find blank for position: ${position}`);
      return;
    }

    // Leave a blank the player already filled alone. Its pool tile was
    // marked when it was placed, so counting it again would double count.
    if (gameState.userInputs[position] !== undefined) return;

    // Fill the blank
    blank.textContent = number;
    blank.classList.add('filled', 'hint-revealed');

    // Mark one unused pool tile with this value. Duplicate values each have
    // their own tile, so every revealed operand takes one tile.
    const poolNumbers = document.querySelectorAll('.pool-number');
    for (let poolNum of poolNumbers) {
      if (
        parseInt(poolNum.dataset.number) === number &&
        !poolNum.classList.contains('used')
      ) {
        poolNum.classList.add('used');
        gameState.poolNumbersUsed.push(number);
        break;
      }
    }

    // Store in userInputs (using the HTML position format)
    gameState.userInputs[position] = number;
  });

  // If the hint filled the selected blank, move the selection on
  const selected = gameState.selectedBlank;
  if (selected && selected.classList.contains('filled')) {
    selectNextEmptyBlank(selected.dataset.position);
  }

  // Update column totals
  updateColumnTotals();
  clearEquationMark(equationId); // The equation changed, so its old mark no longer applies

  // Track hint usage
  gameState.hintsUsed++;
  addHintMarker(equationId, '#');

  // Update displays
  updateHintCounter();
  markEquationAsHinted(equationId);

  // Save state
  savePuzzleState();

  showFeedback('Numbers revealed!', 'success');
}

/**
 * Record which hint types were used on an equation (the 💡 is drawn by CSS)
 * @param {number} equationId - ID of equation
 * @param {string} markerType - Type of hint ('?' or '#')
 */
function addHintMarker(equationId, markerType) {
  // Initialize array for this equation if needed
  if (!gameState.hintedEquations[equationId]) {
    gameState.hintedEquations[equationId] = [];
  }

  // Add marker if not already present
  if (!gameState.hintedEquations[equationId].includes(markerType)) {
    gameState.hintedEquations[equationId].push(markerType);
  }
}

/**
 * Mark equation as hinted (visual state)
 * @param {number} equationId - ID of equation
 */
function markEquationAsHinted(equationId) {
  const equationElement = document.querySelector(
    `.equation[data-equation="${equationId}"]`
  );

  if (equationElement) {
    equationElement.classList.add('hinted');
  }
}

/**
 * Update hint counter display
 */
function updateHintCounter() {
  const hintCountElement = document.getElementById('hint-count');
  if (hintCountElement) {
    hintCountElement.textContent = gameState.hintsUsed;
  }
}

/* ===================================
  WIN ANIMATION
  =================================== */

/**
 * Trigger confetti animation
 */
function triggerConfetti() {
  const container = document.getElementById('confetti-container');

  // Clear any existing confetti
  container.innerHTML = '';

  // Create 50 confetti pieces
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';

    // Random horizontal position
    confetti.style.left = Math.random() * 100 + '%';

    // Random delay (stagger the confetti)
    confetti.style.animationDelay = Math.random() * 0.5 + 's';

    // Random duration (between 2-4 seconds)
    confetti.style.animationDuration = Math.random() * 2 + 2 + 's';

    // Random size
    const size = Math.random() * 6 + 6; // 6-12px
    confetti.style.width = size + 'px';
    confetti.style.height = size + 'px';

    container.appendChild(confetti);
  }

  // Remove confetti after animation completes
  setTimeout(() => {
    container.innerHTML = '';
  }, 4000);
}

/* ===================================
  STATISTICS MODAL
  =================================== */

/**
 * Show the statistics modal
 */
function showStatsModal() {
  const modal = document.getElementById('stats-modal');
  const stats = loadStatistics();

  // Update overall stats
  document.getElementById('total-completed').textContent =
    stats.overall.totalCompleted;
  document.getElementById('total-attempts').textContent =
    stats.overall.totalAttempts;
  document.getElementById('total-hints').textContent = stats.overall.totalHints;
  document.getElementById('perfect-games').textContent =
    stats.overall.perfectGames;
  document.getElementById('current-streak').textContent =
    stats.overall.currentStreak;
  document.getElementById('best-streak').textContent = stats.overall.bestStreak;
  document.getElementById('stars-earned').textContent = formatStarsEarned(
    stats.overall
  );

  // Update Easy stats
  updateDifficultyStats('easy', stats.easy);

  // Update Medium stats
  updateDifficultyStats('medium', stats.medium);

  // Update Hard stats
  updateDifficultyStats('hard', stats.hard);

  // Update Random stats
  updateDifficultyStats('random', stats.random);

  // Update Daily stats
  updateDifficultyStats('daily', stats.daily);

  // Show modal
  modal.classList.remove('hidden');
}

/**
 * Update difficulty-specific stats in the modal
 * @param {string} difficulty - Difficulty level (easy/medium/hard)
 * @param {object} stats - Stats object for this difficulty
 */
function updateDifficultyStats(difficulty, stats) {
  // Safety check - if stats doesn't exist, use default values
  if (!stats) {
    stats = {
      completed: 0,
      attempts: 0,
      hints: 0,
      perfectGames: 0,
    };
  }

  document.getElementById(`${difficulty}-completed`).textContent =
    stats.completed;
  document.getElementById(`${difficulty}-attempts`).textContent =
    stats.attempts;
  document.getElementById(`${difficulty}-hints`).textContent = stats.hints;
  document.getElementById(`${difficulty}-perfect`).textContent =
    stats.perfectGames;

  // Calculate average attempts (avoid division by zero)
  const avgAttempts =
    stats.completed > 0 ? (stats.attempts / stats.completed).toFixed(1) : '0.0';
  document.getElementById(`${difficulty}-avg`).textContent = avgAttempts;
}

/**
 * Close the statistics modal
 */
function closeStatsModal() {
  const modal = document.getElementById('stats-modal');
  modal.classList.add('hidden');
}

/**
 * Reset all statistics (with confirmation)
 */
function handleResetStats() {
  const confirmed = confirm(
    'Are you sure you want to reset all statistics? This cannot be undone.'
  );

  if (confirmed) {
    // Clear statistics from localStorage
    localStorage.removeItem('sumwords_statistics');

    // Also reset tutorial flag so user can see it again if they want
    localStorage.removeItem('sumwords_tutorial_seen');

    // Reload the stats modal to show zeros
    showStatsModal();

    showFeedback(
      'Statistics reset successfully. Tutorial will show on next page load.',
      'success'
    );
  }
}

/**
 * Set up statistics modal event listeners
 */
function setupStatsModalListeners() {
  // Close button
  document
    .getElementById('close-stats-btn')
    .addEventListener('click', closeStatsModal);

  // Reset stats button
  document
    .getElementById('reset-stats-btn')
    .addEventListener('click', handleResetStats);

  // Click outside modal to close
  document.getElementById('stats-modal').addEventListener('click', (event) => {
    if (event.target.id === 'stats-modal') {
      closeStatsModal();
    }
  });
}

/* ===================================
  INITIALIZATION - COMBINED LISTENERS
  =================================== */

// Note: Main game initialization happens at line 1526
// This listener handles additional setup after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle button event listener
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Tutorial system
  setupTutorial();
  showTutorialIfFirstVisit();
});

// ===================================
// TUTORIAL SYSTEM
// ===================================

// One overlay, two openings. 'first' is automatic on the first visit and shows
// the "Don't show this again" checkbox. 'replay' comes from the How to Play
// button: no checkbox, a Close button, and it never reads or writes the seen flag.
let tutorialMode = 'first';

/**
 * Wires the tutorial overlay once: How to Play button, close button, background
 * click, and the keyboard handler (Escape and the Tab trap while it is open)
 */
function setupTutorial() {
  const overlay = document.getElementById('tutorial-overlay');
  if (!overlay) return;

  document
    .getElementById('how-to-play-btn')
    .addEventListener('click', () => openTutorial('replay'));
  document
    .getElementById('tutorial-close')
    .addEventListener('click', closeTutorial);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeTutorial();
  });

  // Capture phase: Escape and Tab reach the dialog before any page handler
  window.addEventListener('keydown', handleTutorialKeydown, true);
}

/**
 * Shows the tutorial automatically until the player ticks "Don't show this again"
 * Uses localStorage to track if user has seen it
 */
function showTutorialIfFirstVisit() {
  const tutorialSeen = localStorage.getItem('sumwords_tutorial_seen');
  if (!tutorialSeen) openTutorial('first');
}

/**
 * Opens the tutorial overlay in the given mode and moves focus into the dialog
 * @param {'first'|'replay'} mode
 */
function openTutorial(mode) {
  const overlay = document.getElementById('tutorial-overlay');
  if (!overlay || !overlay.classList.contains('hidden')) return;

  tutorialMode = mode;
  const replay = mode === 'replay';
  document.getElementById('tutorial-checkbox').hidden = replay;
  document.getElementById('tutorial-close').textContent = replay
    ? 'Close'
    : "Got It! Let's Play";

  overlay.classList.remove('hidden');
  document.getElementById('tutorial-title').focus();
}

/**
 * Closes the tutorial. Only a first-visit close can save the "don't show" flag,
 * and only when its checkbox is ticked. Replay returns focus to How to Play.
 */
function closeTutorial() {
  const overlay = document.getElementById('tutorial-overlay');
  if (!overlay || overlay.classList.contains('hidden')) return;

  overlay.classList.add('hidden');

  if (tutorialMode === 'first') {
    const dontShowCheckbox = document.getElementById('tutorial-dont-show');
    if (dontShowCheckbox.checked) {
      localStorage.setItem('sumwords_tutorial_seen', 'true');
    }
  } else {
    // On phones the How to Play button sits in the closed header menu, so the
    // menu toggle takes focus instead
    const howToPlay = document.getElementById('how-to-play-btn');
    const target = howToPlay.offsetParent
      ? howToPlay
      : document.getElementById('menu-toggle');
    target.focus();
  }
}

/**
 * While the tutorial is open: Escape closes it, and Tab / Shift+Tab stay inside
 * the dialog (wrapping at both ends). Registered in the capture phase.
 * @param {KeyboardEvent} event
 */
function handleTutorialKeydown(event) {
  const overlay = document.getElementById('tutorial-overlay');
  if (!overlay || overlay.classList.contains('hidden')) return;

  if (event.key === 'Escape') {
    event.stopPropagation(); // Escape belongs to the dialog, not the header menu or a hint row
    closeTutorial();
    return;
  }
  if (event.key !== 'Tab') return;

  // Visible stops in DOM order: the heading, then every control that can take focus
  const stops = Array.from(
    overlay.querySelectorAll('#tutorial-title, summary, input, button')
  ).filter((el) => el.offsetParent !== null);
  const index = stops.indexOf(document.activeElement);

  if (event.shiftKey && index <= 0) {
    event.preventDefault();
    stops[stops.length - 1].focus();
  } else if (!event.shiftKey && (index === -1 || index === stops.length - 1)) {
    event.preventDefault();
    stops[0].focus();
  }
}
