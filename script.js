const board = document.querySelector(".board");
const startButton = document.querySelector(".btn-start");
const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");
const restartButton = document.querySelector(".btn-restart");

const highScoreElement = document.querySelector("#high_score");
const scoreElement = document.querySelector("#score");
const timerElement = document.querySelector("#time");
const finalScoreElement = document.querySelector("#final-score");

const blockHeight = 50;
const blockWidth = 50;

const BASE_SPEED_MS = 500;
const MIN_SPEED_MS = 120;
const SPEED_STEP_MS = 15;
const POINTS_PER_FOOD = 5;

let highScore = Number(localStorage.getItem("highScore")) || 0;
let score = 0;
let secondsElapsed = 0;

highScoreElement.innerText = highScore;
timerElement.innerText = "00:00";

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

let isPaused = false;
let isGameActive = false;

let intervalId = null;
let timerIntervalId = null;

const blocks = {};
let snake = [{ x: 1, y: 3 }];
let direction = "down";
let nextDirection = "down";
let food = null;

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const block = document.createElement("div");
    block.classList.add("block");
    board.appendChild(block);
    blocks[`${row}-${col}`] = block;
  }
}

function getMoveIntervalMs() {
  const foodsEaten = Math.floor(score / POINTS_PER_FOOD);
  return Math.max(MIN_SPEED_MS, BASE_SPEED_MS - foodsEaten * SPEED_STEP_MS);
}

function scheduleMoveLoop() {
  clearInterval(intervalId);
  intervalId = setInterval(renderSnake, getMoveIntervalMs());
}

function startLoops() {
  clearInterval(timerIntervalId);
  scheduleMoveLoop();

  timerIntervalId = setInterval(() => {
    secondsElapsed += 1;
    timerElement.innerText = formatTime(secondsElapsed);
  }, 1000);
}

function stopLoops() {
  clearInterval(intervalId);
  clearInterval(timerIntervalId);
  intervalId = null;
  timerIntervalId = null;
}

function togglePause() {
  if (!isGameActive) return;

  if (!isPaused) {
    isPaused = true;
    stopLoops();
  } else {
    isPaused = false;
    startLoops();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const cell = blocks[`${segment.x}-${segment.y}`];
    if (!cell) return;

    if (index === 0) {
      cell.classList.add("head");
    } else {
      cell.classList.add("fill");
    }
  });
}

function spawnFood() {
  if (food && blocks[`${food.x}-${food.y}`]) {
    blocks[`${food.x}-${food.y}`].classList.remove("food");
  }

  const occupied = new Set(snake.map((seg) => `${seg.x}-${seg.y}`));
  const freeCells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!occupied.has(`${r}-${c}`)) {
        freeCells.push({ x: r, y: c });
      }
    }
  }

  if (freeCells.length === 0) {
    endGame(); // Board completely filled
    return;
  }

  food = freeCells[Math.floor(Math.random() * freeCells.length)];
  blocks[`${food.x}-${food.y}`].classList.add("food");
}

function clearBoardVisuals() {
  Object.values(blocks).forEach((block) => {
    block.classList.remove("fill", "head", "food");
  });
}

function endGame() {
  isGameActive = false;
  isPaused = false;
  stopLoops();

  if (finalScoreElement) {
    finalScoreElement.innerText = score;
  }

  modal.style.display = "flex";
  startGameModal.style.display = "none";
  gameOverModal.style.display = "flex";
}

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function renderSnake() {
  if (isPaused || !isGameActive) return;

  direction = nextDirection;

  const currentHead = snake[0];
  let head;

  if (direction === "left") head = { x: currentHead.x, y: currentHead.y - 1 };
  else if (direction === "right") head = { x: currentHead.x, y: currentHead.y + 1 };
  else if (direction === "down") head = { x: currentHead.x + 1, y: currentHead.y };
  else head = { x: currentHead.x - 1, y: currentHead.y };

  // Wall collision
  if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
    endGame();
    return;
  }

  const willEatFood = food && head.x === food.x && head.y === food.y;
  const bodyToCheck = willEatFood ? snake : snake.slice(0, -1);

  // Self-collision
  const hitSelf = bodyToCheck.some((seg) => seg.x === head.x && seg.y === head.y);
  if (hitSelf) {
    endGame();
    return;
  }

  // Clear previous snake styling
  snake.forEach((segment) => {
    blocks[`${segment.x}-${segment.y}`].classList.remove("fill", "head");
  });

  snake.unshift(head);
  if (!willEatFood) {
    snake.pop();
  }

  if (willEatFood) {
    score += POINTS_PER_FOOD;
    scoreElement.innerText = score;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore);
      highScoreElement.innerText = highScore;
    }

    spawnFood();
    scheduleMoveLoop();
  }

  drawSnake();
}

function initGameState() {
  clearBoardVisuals();
  score = 0;
  secondsElapsed = 0;
  isPaused = false;
  isGameActive = true;

  scoreElement.innerText = score;
  timerElement.innerText = "00:00";
  highScoreElement.innerText = highScore;

  direction = "down";
  nextDirection = "down";
  snake = [{ x: 1, y: 3 }];

  drawSnake();
  spawnFood();

  modal.style.display = "none";
  startLoops();
}

startButton.addEventListener("click", initGameState);
restartButton.addEventListener("click", initGameState);

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }

  if (key === " " || key === "p") {
    togglePause();
    return;
  }

  if (!isGameActive || isPaused) return;

  if ((key === "arrowup" || key === "w") && direction !== "down") {
    nextDirection = "up";
  } else if ((key === "arrowdown" || key === "s") && direction !== "up") {
    nextDirection = "down";
  } else if ((key === "arrowleft" || key === "a") && direction !== "right") {
    nextDirection = "left";
  } else if ((key === "arrowright" || key === "d") && direction !== "left") {
    nextDirection = "right";
  }
});