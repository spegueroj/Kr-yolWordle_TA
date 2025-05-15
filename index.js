import {realDictionary } from './dictionary.js';


// Use `const` for constants and `let` for variables that change
const dictionary = realDictionary;
const state = {
  secret: dictionary[Math.floor(Math.random() * dictionary.length)],
  grid: Array(6).fill().map(() => Array(5).fill('')),
  colors: Array(6).fill().map(() => Array(5).fill(0)),
  currentRow: 0,
  currentCol: 0,
};

const animationDuration = 500; // ms for animation timing

// Function to create and display the grid
function drawGrid(container) {
  const grid = document.createElement('div');
  grid.className = 'grid';
  // Create grid boxes
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      drawBox(grid, row, col);
    }
  }

  container.appendChild(grid);
}

// Function to update grid based on the state
function updateGrid() {
  state.grid.forEach((row, i) => {
  row.forEach((letter, j) => {
      const box = document.getElementById(`box${i}${j}`);
      if (box) box.textContent = letter;
    });
  });
}

// Function to draw a single box in the grid
function drawBox(container, row, col, letter = '') {
  const box = document.createElement('div');
  box.className = 'box';
  box.textContent = letter;
  box.id = `box${row}${col}`;
  container.appendChild(box);
  return box;
}

// Function to handle keyboard input events
function registerKeyboardEvents() {
  document.body.onkeydown = (e) => {
    const key = e.key;

    if (key === 'Enter') {
      handleEnterKey();
    } else if (key === 'Backspace') {
      removeLetter();
    } else if (isLetter(key)) {
      addLetter(key);
    }

    updateGrid();
  };
}

// Handles the enter key logic
function handleEnterKey() {
  if (state.currentCol === 5) {
    const word = getCurrentWord();
    if (isWordValid(word)) {
      revealWord(word);
      state.currentRow++;
      state.currentCol = 0;
    } else {
      alert('Not a valid word.');
    }
  }
}

// Retrieves the current word from the grid
function getCurrentWord() {
  return state.grid[state.currentRow].join('');
}

// Validates if the current word exists in the dictionary
function isWordValid(word) {
  return dictionary.includes(word);
}

// Handles adding a letter to the grid
function addLetter(letter) {
  if (state.currentCol < 5) {
    state.grid[state.currentRow][state.currentCol] = letter;
    state.currentCol++;
  }
}

// Handles removing a letter from the grid
function removeLetter() {
  if (state.currentCol > 0) {
    state.grid[state.currentRow][state.currentCol - 1] = '';
    state.currentCol--;
  }
}

// Check if a key is a valid letter
function isLetter(key) {
  return key.length === 1 && key.match(/[a-z]/i);
}

// Reveal the word after a guess and animate the result
function revealWord(guess) {
  const row = state.currentRow;
  const c = state.colors;

  state.grid[row].forEach((letter, i) => {
    const box = document.getElementById(`box${row}${i}`);
    
    //number of times the inputted letter is in the answer
    const numOfOccurrencesSecret = getNumOfOccurrencesInWord(state.secret, letter);
    //number of times they have the inputted letter in their guess
    const numOfOccurrencesGuess = getNumOfOccurrencesInWord(guess, letter);

    const letterPosition = getPositionOfOccurrence(guess, letter, i);
    
    if (letter === state.secret[i]) 
      c[row][i] = 0;//green
    else if (state.secret.includes(letter)) 
      c[row][i] = 1;//yellow 
    else 
      c[row][i] = 2;//gray 


    setTimeout(() => {
      if (letter === state.secret[i]) {
        box.classList.add('right');
      } else if (state.secret.includes(letter)) {
        box.classList.add('wrong');
     
      } else {
        box.classList.add('empty');
      }
    }, (i + 1) * animationDuration / 2);
    //alert("${state.colors[state.currentRow][i]}");
    box.classList.add('animated');
    box.style.animationDelay = `${i * animationDuration / 2}ms`;
  });
  

  const isWinner = state.secret === guess;
  const isGameOver = state.currentRow === 5;

  setTimeout(() => {
    if (isWinner) {

      openPopup();
    } else if (isGameOver) {
      alert(`Better luck next time! The word was ${state.secret}.`);
    }
  }, 3 * animationDuration);

  updateKeyboard();
}

function updateKeyboard(){
  
  const a = state.colors;//color values
  const row = state.currentRow;//row number 

  for(let i = 0; i < a[row].length; i++)
  {
    let letter = state.grid[row][i].toUpperCase();//letter in word 

    //letter color value (ex. 0 - green, 1 - yellow, 2 - gray)
    let color = state.colors[row][i];

    //button that corresponds to letter 
    const key = document.querySelector(`button[data-key="${letter}"]`);
  
    if(color === 0){
      if(key.classList.contains('btn1'))
        key.classList.remove('btn1');
      else if(key.classList.contains('btn'))
        key.classList.remove('btn');

      key.classList.add('btn0'); 
    }
    else if(color === 1){


      key.classList.add('btn1'); 
    }
    else{
      key.classList.remove('btn');
      key.classList.add('btn2'); 
    }
  }
  
}

// Utility functions to count occurrences
function getNumOfOccurrencesInWord(word, letter) {
  return word.split('').filter((char) => char === letter).length;
}


function getPositionOfOccurrence(word, letter, position) {
  let count = 0;
  for (let i = 0; i <= position; i++) {
    if (word[i] === letter) {
      count++;
    }
  }
  return count;
}

//winner popup
const winner = document.getElementById("winner-popup");
function openPopup(){
  document.getElementById("tries").innerHTML = "" + state.currentRow;
  winner.classList.add("open-popup");
}

const closewin = document.querySelector('.closing');
closewin.addEventListener('click', () => {
  winner.classList.remove("open-popup");
  winner.classList.add("closing-popup");
})


// Initialize the game
function startup() {
  const game = document.getElementById('game');
  drawGrid(game);
  registerKeyboardEvents();
  window.alert(state.secret);
}



//handles the keyboard buttons - letters
const buttons = document.querySelectorAll('.btn');
buttons.forEach(btn => {

  btn.addEventListener('click', () => {
   var guy = "" + btn.innerHTML;
   addLetter(guy.toLowerCase());
   updateGrid();

  })
});

//handles the keyboard buttons - Enter button
const enter = document.querySelector('.Enter');
enter.addEventListener('click', () => {
 handleEnterKey();
 updateGrid();
});

//handles the keyboard buttons - delete button
const Delete = document.querySelector('.delete');
Delete.addEventListener('click', () => {
 removeLetter();
 updateGrid();
})

startup();


