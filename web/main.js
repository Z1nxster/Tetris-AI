import Game from "./GameModel.js";
import { initBoardSVG, renderBoard, renderStats, renderPreview } from "./render.js";
import { handleKeyDown } from "./input.js";
import { loadHighScores, qualifiesForLeaderboard, saveScore, renderLeaderboard, clearHighScores } from "./scores.js";

const game = new Game();
let state = game.createInitialState();
let timerId = null;

const boardSvg = document.getElementById("board");
const gameOverOverlay = document.getElementById("game-over-overlay");
const restartButton = document.getElementById("restart-button");
const newGameButton = document.getElementById("new-game-button");
const nextPreviewSvg = document.getElementById("next-preview");
const holdPreviewSvg = document.getElementById("hold-preview");
const finalScoreEl = document.getElementById("final-score");
const nameEntry = document.getElementById("name-entry");
const playerNameInput = document.getElementById("player-name");
const saveScoreButton = document.getElementById("save-score-button");
const clearScoresButton = document.getElementById("clear-scores-button");

const cellRects = initBoardSVG(boardSvg, game.ROWS, game.COLS);

/** Repaints everything that depends on `state`. Call after any change. */
function draw() {
    renderBoard(game, state, cellRects);
    renderStats(state);
    renderPreview(game, state.nextPiece, nextPreviewSvg);
    renderPreview(game, state.storage, holdPreviewSvg)
    gameOverOverlay.classList.toggle("hidden", !state.gameOver);
}

document.addEventListener("keydown", (event) => {
    handleKeyDown(event, game, state, draw);
});

function startGameLoop() {
    if (state.gameOver) return;

    let delay = Math.max(100, 1000 - state.level * 75);
    game.tick(state);
    draw();
    if (state.gameOver){
        onGameOver(state);
        return;
    } 
    timerId = setTimeout(startGameLoop, delay);
}

function resetGame() {
    clearTimeout(timerId);
    nameEntry.classList.add("hidden");
    state = game.createInitialState();
    draw();
    startGameLoop();   
}

newGameButton.addEventListener("click", resetGame);
restartButton.addEventListener("click", resetGame);
playerNameInput.addEventListener("keydown", (event) => {
    if (event.code === "Enter" || event.code === "NumpadEnter") {
        event.preventDefault();
        event.stopPropagation();
        saveScoreButton.click();
    }
});
clearScoresButton.addEventListener("click", () => {
    clearHighScores();
    renderLeaderboard(loadHighScores());
});
saveScoreButton.addEventListener("click", () => {
    const saved = saveScore(playerNameInput.value, state.score, state.totalLines);
    nameEntry.classList.add("hidden");
    const index = saved ? saved.findIndex(e => e.score === state.score && e.lines === state.totalLines) : -1;
    renderLeaderboard(saved ?? loadHighScores(), index);
});
draw(); // initial paint, before anything has happened
renderLeaderboard(loadHighScores());
startGameLoop();

function onGameOver(finishedState) {
    finalScoreEl.textContent = finishedState.score;
    if (qualifiesForLeaderboard(finishedState.score)) {
        nameEntry.classList.remove("hidden");
        playerNameInput.value = "";
        playerNameInput.focus(); // ???
    } else {
      nameEntry.classList.add("hidden");
    }
}