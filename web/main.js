import Game from "./game.js";
import { initBoardSVG, renderBoard, renderStats } from "./render.js";
import { handleKeyDown } from "./input.js";

const game = new Game();
let state = game.createInitialState();

const boardSvg = document.getElementById("board");
const gameOverOverlay = document.getElementById("game-over-overlay");
const restartButton = document.getElementById("restart-button");
const newGameButton = document.getElementById("new-game-button");

const cellRects = initBoardSVG(boardSvg, game.ROWS, game.COLS);

/** Repaints everything that depends on `state`. Call after any change. */
function draw() {
  renderBoard(game, state, cellRects);
  renderStats(state);
  gameOverOverlay.classList.toggle("hidden", !state.gameOver);
}

document.addEventListener("keydown", (event) => {
  handleKeyDown(event, game, state, draw);
});

draw(); // initial paint, before anything has happened

let timerId;

function startGameLoop() {
    if (state.gameOver) return;

    let delay = Math.max(100, 1000 - state.level * 75);
    game.tick(state);
    draw();
    if (state.gameOver) return;
    timerId = setTimeout(() => startGameLoop(), delay);
}

function resetGame() {
    clearTimeout(timerId);
    state = game.createInitialState();
    draw();
    startGameLoop();
} // TO-DO: add on button click (something like that)