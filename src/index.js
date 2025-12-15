import { realDictionary } from './dictionary.js';

// ==================== GAME CONSTANTS ====================
const GAME_CONFIG = {
  MAX_ROWS: 6,
  MAX_COLS: 5,
  ANIMATION_DURATION: 500,
  LETTER_ANIMATION_DELAY: 250, // animationDuration / 2
};

const COLOR_STATES = {
  CORRECT: 0,    // Green - correct letter in correct position
  WRONG_POS: 1,  // Yellow - correct letter in wrong position
  ABSENT: 2,     // Gray - letter not in word
};

const STORAGE_KEYS = {
  INPUTS: 'inputs',
  COLORING: 'coloring',
};

const KEYBOARD_CLASSES = {
  DEFAULT: 'btn',
  CORRECT: 'btn0',
  WRONG_POS: 'btn1',
  ABSENT: 'btn2',
};

// ==================== GAME STATE ====================
const gameState = {
  secret: realDictionary[Math.floor(Math.random() * realDictionary.length)],
  grid: Array(GAME_CONFIG.MAX_ROWS).fill().map(() => Array(GAME_CONFIG.MAX_COLS).fill('')),
  colors: Array(GAME_CONFIG.MAX_ROWS).fill().map(() => Array(GAME_CONFIG.MAX_COLS).fill(COLOR_STATES.ABSENT)),
  currentRow: 0,
  currentCol: 0,
};

// ==================== LOCAL STORAGE UTILITIES ====================
/**
 * Safely gets an item from localStorage
 * @param {string} key - Storage key
 * @param {string} defaultValue - Default value if key doesn't exist
 * @returns {string} Stored value or default
 */
function getStorageItem(key, defaultValue = '') {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage: ${error}`);
    return defaultValue;
  }
}

/**
 * Safely sets an item in localStorage
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 */
function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error writing to localStorage: ${error}`);
  }
}

/**
 * Appends a value to a storage item
 * @param {string} key - Storage key
 * @param {string} value - Value to append
 */
function appendStorageItem(key, value) {
  const current = getStorageItem(key);
  setStorageItem(key, current ? `${current}${value}` : value);
}

/**
 * Saves a word guess to storage
 * @param {string} word - Word to save
 */
function saveWordToStorage(word) {
  const existing = getStorageItem(STORAGE_KEYS.INPUTS);
  setStorageItem(STORAGE_KEYS.INPUTS, existing ? `${existing} ${word}` : word);
}

/**
 * Saves color state for a letter
 * @param {number} colorState - Color state (0, 1, or 2)
 */
function saveColorToStorage(colorState) {
  appendStorageItem(STORAGE_KEYS.COLORING, colorState.toString());
}

/**
 * Finalizes the color storage for a row
 */
function finalizeColorStorage() {
  appendStorageItem(STORAGE_KEYS.COLORING, ' ');
}

// ==================== GRID FUNCTIONS ====================
/**
 * Creates and displays the game grid
 * @param {HTMLElement} container - Container element for the grid
 */
function drawGrid(container) {
  const grid = document.createElement('div');
  grid.className = 'grid';
  
  for (let row = 0; row < GAME_CONFIG.MAX_ROWS; row++) {
    for (let col = 0; col < GAME_CONFIG.MAX_COLS; col++) {
      drawBox(grid, row, col);
    }
  }
  
  container.appendChild(grid);
}

/**
 * Creates a single box in the grid
 * @param {HTMLElement} container - Container element
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {string} letter - Optional letter to display
 * @returns {HTMLElement} Created box element
 */
function drawBox(container, row, col, letter = '') {
  const box = document.createElement('div');
  box.className = 'box';
  box.textContent = letter;
  box.id = `box${row}${col}`;
  container.appendChild(box);
  return box;
}

/**
 * Updates the grid display based on game state
 */
function updateGrid() {
  gameState.grid.forEach((row, rowIndex) => {
    row.forEach((letter, colIndex) => {
      const box = document.getElementById(`box${rowIndex}${colIndex}`);
      if (box) {
        box.textContent = letter;
      }
    });
  });
}

// ==================== INPUT HANDLING ====================
/**
 * Checks if a key is a valid letter (including special characters È, Ò)
 * @param {string} key - Key to check
 * @returns {boolean} True if valid letter
 */
function isLetter(key) {
  if (key.length !== 1) return false;
  // Accept regular letters a-z and special characters È, Ò, è, ò
  return /[a-z]/i.test(key) || /[ÈÒèò]/.test(key);
}

/**
 * Normalizes a letter to lowercase, preserving special characters
 * @param {string} letter - Letter to normalize
 * @returns {string} Normalized letter
 */
function normalizeLetter(letter) {
  // Convert to lowercase, but handle special characters
  const lower = letter.toLowerCase();
  // Map uppercase special characters to lowercase
  if (letter === 'È') return 'è';
  if (letter === 'Ò') return 'ò';
  return lower;
}

/**
 * Adds a letter to the current position in the grid
 * @param {string} letter - Letter to add
 */
function addLetter(letter) {
  if (gameState.currentCol < GAME_CONFIG.MAX_COLS) {
    gameState.grid[gameState.currentRow][gameState.currentCol] = normalizeLetter(letter);
    gameState.currentCol++;
  }
}

/**
 * Removes the last letter from the current row
 */
function removeLetter() {
  if (gameState.currentCol > 0) {
    gameState.currentCol--;
    gameState.grid[gameState.currentRow][gameState.currentCol] = '';
  }
}

/**
 * Gets the current word from the grid
 * @returns {string} Current word
 */
function getCurrentWord() {
  return gameState.grid[gameState.currentRow].join('');
}

/**
 * Validates if a word exists in the dictionary
 * @param {string} word - Word to validate
 * @returns {boolean} True if word is valid
 */
function isWordValid(word) {
  return realDictionary.includes(word.toLowerCase());
}

// ==================== WORD REVEAL & COLORING ====================
/**
 * Determines the color states for all letters in a guess
 * Properly handles duplicate letters according to Wordle rules
 * @param {string} guess - The guessed word
 * @param {string} secret - The secret word
 * @returns {Array<number>} Array of color states for each position
 */
function getWordColorStates(guess, secret) {
  const colors = Array(GAME_CONFIG.MAX_COLS).fill(COLOR_STATES.ABSENT);
  const secretLetters = secret.split('');
  const guessLetters = guess.split('');
  
  // First pass: mark all exact matches (green)
  for (let i = 0; i < GAME_CONFIG.MAX_COLS; i++) {
    if (guessLetters[i] === secretLetters[i]) {
      colors[i] = COLOR_STATES.CORRECT;
      secretLetters[i] = null; // Mark as used
      guessLetters[i] = null; // Mark as processed
    }
  }
  
  // Second pass: mark wrong positions (yellow)
  // Only mark as yellow if the letter appears in secret and hasn't been used yet
  for (let i = 0; i < GAME_CONFIG.MAX_COLS; i++) {
    if (guessLetters[i] === null) continue; // Already processed (green)
    
    const letterIndex = secretLetters.indexOf(guessLetters[i]);
    if (letterIndex !== -1) {
      colors[i] = COLOR_STATES.WRONG_POS;
      secretLetters[letterIndex] = null; // Mark as used
    }
  }
  
  return colors;
}

/**
 * Applies color classes to a box element
 * @param {HTMLElement} box - Box element
 * @param {number} colorState - Color state
 */
function applyBoxColor(box, colorState) {
  box.classList.remove('right', 'wrong', 'empty');
  
  switch (colorState) {
    case COLOR_STATES.CORRECT:
      box.classList.add('right');
      break;
    case COLOR_STATES.WRONG_POS:
      box.classList.add('wrong');
      break;
    case COLOR_STATES.ABSENT:
      box.classList.add('empty');
      break;
  }
}

/**
 * Reveals the word after a guess and animates the result
 * @param {string} guess - The guessed word
 */
function revealWord(guess) {
  const currentRow = gameState.currentRow;
  const secret = gameState.secret;
  
  // Get color states for all letters (handles duplicates correctly)
  const colorStates = getWordColorStates(guess, secret);
  
  // Process each letter in the guess
  gameState.grid[currentRow].forEach((letter, colIndex) => {
    const box = document.getElementById(`box${currentRow}${colIndex}`);
    if (!box) return;
    
    const colorState = colorStates[colIndex];
    gameState.colors[currentRow][colIndex] = colorState;
    
    // Save to storage
    saveColorToStorage(colorState);
    
    // Set up animation - apply color at the midpoint of the flip (when box is rotated 90deg)
    const animationDelay = colIndex * GAME_CONFIG.LETTER_ANIMATION_DELAY;
    const colorChangeDelay = animationDelay + (GAME_CONFIG.ANIMATION_DURATION / 2);
    
    box.style.animationDelay = `${animationDelay}ms`;
    box.classList.add('animated');
    
    // Apply color at the midpoint of the animation (when box is flipped 90 degrees)
    setTimeout(() => {
      applyBoxColor(box, colorState);
    }, colorChangeDelay);
  });
  
  // Finalize storage for this row
  finalizeColorStorage();
  
  // Save word to storage
  saveWordToStorage(guess);
  
  // Check game end conditions
  const isWinner = secret === guess;
  const isGameOver = currentRow === GAME_CONFIG.MAX_ROWS - 1;
  
  // Wait for all animations to complete before showing popup
  const totalAnimationTime = (GAME_CONFIG.MAX_COLS * GAME_CONFIG.LETTER_ANIMATION_DELAY) + GAME_CONFIG.ANIMATION_DURATION;
  setTimeout(() => {
    if (isWinner) {
      openWinnerPopup();
    } else if (isGameOver) {
      alert(`Better luck next time! The word was ${secret}.`);
    }
  }, totalAnimationTime);
  
  // Update keyboard colors after animations
  setTimeout(() => {
    updateKeyboard();
  }, totalAnimationTime);
  
  // Move to next row
  gameState.currentRow++;
  gameState.currentCol = 0;
}

// ==================== KEYBOARD UPDATE ====================
/**
 * Checks if a new color state is better than the current best state
 * Priority: correct (0) > wrong_pos (1) > absent (2)
 * @param {number} newState - New color state
 * @param {number|undefined} currentState - Current best state
 * @returns {boolean} True if new state is better or equal
 */
function isBetterState(newState, currentState) {
  if (currentState === undefined) return true;
  // Lower number = better state (0=correct, 1=wrong_pos, 2=absent)
  return newState < currentState;
}

/**
 * Updates keyboard button colors based on all letter states
 * Priority: correct > wrong_pos > absent
 */
function updateKeyboard() {
  // Track the best state for each letter across all rows
  const letterStates = new Map();
  
  // Process all completed rows
  for (let row = 0; row < gameState.currentRow; row++) {
    gameState.grid[row].forEach((letter, colIndex) => {
      if (!letter) return;
      
      const upperLetter = letter.toUpperCase();
      const colorState = gameState.colors[row][colIndex];
      const currentBestState = letterStates.get(upperLetter);
      
      // Update if this is a better state (correct > wrong_pos > absent)
      if (isBetterState(colorState, currentBestState)) {
        letterStates.set(upperLetter, colorState);
      }
    });
  }
  
  // Apply states to keyboard buttons
  letterStates.forEach((colorState, letter) => {
    const keyButton = document.querySelector(`button[data-key="${letter}"]`);
    if (!keyButton) {
      console.warn(`Keyboard button not found for letter: ${letter}`);
      return;
    }
    
    // Remove only color state classes, keep 'btn' class for functionality
    keyButton.classList.remove(
      KEYBOARD_CLASSES.CORRECT,
      KEYBOARD_CLASSES.WRONG_POS,
      KEYBOARD_CLASSES.ABSENT
    );
    
    // Apply appropriate color class
    switch (colorState) {
      case COLOR_STATES.CORRECT:
        keyButton.classList.add(KEYBOARD_CLASSES.CORRECT);
        break;
      case COLOR_STATES.WRONG_POS:
        keyButton.classList.add(KEYBOARD_CLASSES.WRONG_POS);
        break;
      case COLOR_STATES.ABSENT:
        keyButton.classList.add(KEYBOARD_CLASSES.ABSENT);
        break;
    }
  });
}

// ==================== GAME FLOW ====================
/**
 * Handles the Enter key press
 */
function handleEnterKey() {
  if (gameState.currentCol === GAME_CONFIG.MAX_COLS) {
    const word = getCurrentWord();
    if (isWordValid(word)) {
      revealWord(word);
    } else {
      alert('Pa yon mo valab.');
    }
  }
  updateGrid();
}

/**
 * Checks if the winner popup is currently open
 * @returns {boolean} True if popup is open
 */
function isWinnerPopupOpen() {
  const winnerPopup = document.getElementById('winner-popup');
  return winnerPopup && winnerPopup.classList.contains('open-popup');
}

/**
 * Registers keyboard event handlers
 */
function registerKeyboardEvents() {
  document.addEventListener('keydown', (e) => {
    const key = e.key;
    
    // If winner popup is open, allow Enter to close it
    if (key === 'Enter' && isWinnerPopupOpen()) {
      e.preventDefault();
      closeWinnerPopup();
      return;
    }
    
    if (key === 'Enter') {
      e.preventDefault();
      handleEnterKey();
    } else if (key === 'Backspace') {
      e.preventDefault();
      removeLetter();
      updateGrid();
    } else if (isLetter(key)) {
      addLetter(key);
      updateGrid();
    }
  });
}

// ==================== POPUP MANAGEMENT ====================
/**
 * Opens the winner popup
 */
function openWinnerPopup() {
  const winnerPopup = document.getElementById('winner-popup');
  const triesElement = document.getElementById('tries');
  
  if (winnerPopup && triesElement) {
    triesElement.textContent = gameState.currentRow.toString();
    winnerPopup.classList.add('open-popup');
    winnerPopup.classList.remove('closing-popup');
  }
}

/**
 * Closes the winner popup
 */
function closeWinnerPopup() {
  const winnerPopup = document.getElementById('winner-popup');
  if (winnerPopup) {
    winnerPopup.classList.remove('open-popup');
    winnerPopup.classList.add('closing-popup');
  }
}

// ==================== PERSISTENCE ====================
/**
 * Restores the grid from localStorage
 */
function restoreGridFromStorage() {
  const inputs = getStorageItem(STORAGE_KEYS.INPUTS);
  if (!inputs || !inputs.trim()) return;
  
  try {
    const words = inputs.trim().split(/\s+/).filter(word => word.length === GAME_CONFIG.MAX_COLS);
    
    words.forEach((word, rowIndex) => {
      if (rowIndex >= GAME_CONFIG.MAX_ROWS) return;
      
      const letters = word.split('');
      letters.forEach((letter, colIndex) => {
        if (colIndex < GAME_CONFIG.MAX_COLS) {
          gameState.grid[rowIndex][colIndex] = letter;
        }
      });
    });
    
    gameState.currentRow = Math.min(words.length, GAME_CONFIG.MAX_ROWS);
    updateGrid();
  } catch (error) {
    console.error('Error restoring grid from storage:', error);
  }
}

/**
 * Restores colors from localStorage
 */
function restoreColorsFromStorage() {
  const coloring = getStorageItem(STORAGE_KEYS.COLORING);
  if (!coloring || !coloring.trim()) return;
  
  try {
    const rows = coloring.trim().split(/\s+/).filter(row => row.length > 0);
    
    rows.forEach((rowColors, rowIndex) => {
      if (rowIndex >= GAME_CONFIG.MAX_ROWS) return;
      
      const colors = rowColors.split('');
      colors.forEach((colorChar, colIndex) => {
        if (colIndex < GAME_CONFIG.MAX_COLS) {
          const colorState = parseInt(colorChar, 10);
          const box = document.getElementById(`box${rowIndex}${colIndex}`);
          
          if (box && !isNaN(colorState) && colorState >= 0 && colorState <= 2) {
            gameState.colors[rowIndex][colIndex] = colorState;
            applyBoxColor(box, colorState);
          }
        }
      });
    });
  } catch (error) {
    console.error('Error restoring colors from storage:', error);
  }
}

// ==================== KEYBOARD BUTTON HANDLERS ====================
/**
 * Sets up keyboard button event handlers using event delegation
 */
function setupKeyboardButtons() {
  const keyboard = document.querySelector('.keyboard');
  if (!keyboard) return;
  
  keyboard.addEventListener('click', (e) => {
    const target = e.target;
    
    if (target.classList.contains('btn')) {
      // Letter button - use data-key attribute to preserve special characters
      const letter = target.getAttribute('data-key') || target.textContent.trim();
      if (letter && isLetter(letter)) {
        addLetter(letter);
        updateGrid();
      }
    } else if (target.classList.contains('Enter')) {
      // Enter button
      handleEnterKey();
    } else if (target.classList.contains('delete')) {
      // Delete button
      removeLetter();
      updateGrid();
    }
  });
}

// ==================== INITIALIZATION ====================
/**
 * Clears the game board and storage
 */
function clearBoard() {
  // Clear localStorage
  setStorageItem(STORAGE_KEYS.INPUTS, '');
  setStorageItem(STORAGE_KEYS.COLORING, '');
  
  // Reset game state
  gameState.secret = realDictionary[Math.floor(Math.random() * realDictionary.length)];
  gameState.grid = Array(GAME_CONFIG.MAX_ROWS).fill().map(() => Array(GAME_CONFIG.MAX_COLS).fill(''));
  gameState.colors = Array(GAME_CONFIG.MAX_ROWS).fill().map(() => Array(GAME_CONFIG.MAX_COLS).fill(COLOR_STATES.ABSENT));
  gameState.currentRow = 0;
  gameState.currentCol = 0;
  
  // Clear visual board
  updateGrid();
  
  // Reset keyboard colors
  document.querySelectorAll('.keyboard button').forEach(button => {
    button.classList.remove(KEYBOARD_CLASSES.CORRECT, KEYBOARD_CLASSES.WRONG_POS, KEYBOARD_CLASSES.ABSENT);
    button.classList.add(KEYBOARD_CLASSES.DEFAULT);
  });
  
  // Clear box colors
  for (let row = 0; row < GAME_CONFIG.MAX_ROWS; row++) {
    for (let col = 0; col < GAME_CONFIG.MAX_COLS; col++) {
      const box = document.getElementById(`box${row}${col}`);
      if (box) {
        box.classList.remove('right', 'wrong', 'empty', 'animated');
        box.style.animationDelay = '';
      }
    }
  }
}

/**
 * Animates keyboard buttons with a wave effect on page load
 */
function animateKeyboardWave() {
  const keyboardRows = document.querySelectorAll('.keyboard .row');
  const WAVE_DELAY_INCREMENT = 50; // milliseconds between each key
  const ROW_DELAY_INCREMENT = 100; // milliseconds between rows
  
  keyboardRows.forEach((row, rowIndex) => {
    const buttons = row.querySelectorAll('.btn, .Enter, .delete');
    buttons.forEach((button, buttonIndex) => {
      const delay = (rowIndex * ROW_DELAY_INCREMENT) + (buttonIndex * WAVE_DELAY_INCREMENT);
      button.style.animationDelay = `${delay}ms`;
    });
  });
}

/**
 * Initializes the game
 */
function initializeGame() {
  const gameContainer = document.getElementById('game');
  if (!gameContainer) {
    console.error('Game container not found');
    return;
  }
  
  drawGrid(gameContainer);
  registerKeyboardEvents();
  setupKeyboardButtons();
  
  // Set up winner popup close handler
  const closeWinnerButton = document.getElementById('close-winner-popup');
  if (closeWinnerButton) {
    closeWinnerButton.addEventListener('click', closeWinnerPopup);
  }
  
  // Clear board on page refresh
  clearBoard();
  
  // Animate keyboard with wave effect
  animateKeyboardWave();
  
  // Debug: show secret word (remove in production)
  const answerDisplay = document.getElementById('answer-display');
  if (answerDisplay) {
    answerDisplay.textContent = gameState.secret;
  }
}

// ==================== EXPORT FOR HTML SCRIPT ====================
// Make functions available globally for inline handlers (to be removed later)
window.openWinnerPopup = openWinnerPopup;
window.closeWinnerPopup = closeWinnerPopup;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}
