// Pure Tetris game logic — no rendering, no DOM, no timers.

class Game {
    ROWS = 20;        // visible playfield height
    COLS = 10;        // playfield width
    BUFFER_ROWS = 4;  // hidden spawn area above the visible field

    TETROMINO_SHAPES = [
        { name: "I", shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
        { name: "O", shape: [[1,1],[1,1]] },
        { name: "T", shape: [[0,1,0],[1,1,1],[0,0,0]] },
        { name: "J", shape: [[1,0,0],[1,1,1],[0,0,0]] },
        { name: "L", shape: [[0,0,1],[1,1,1],[0,0,0]] },
        { name: "S", shape: [[0,1,1],[1,1,0],[0,0,0]] },
        { name: "Z", shape: [[1,1,0],[0,1,1],[0,0,0]] },
    ];

    // SRS kick tables: sequential [dx, dy] offsets to try when a rotation would otherwise collide.
    JLSTZ_KICKS = {
        "0->1": [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
        "1->0": [[0,0], [1,0],  [1,-1], [0,2],  [1,2]],
        "1->2": [[0,0], [1,0],  [1,-1], [0,2],  [1,2]],
        "2->1": [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
        "2->3": [[0,0], [1,0],  [1,1],  [0,-2], [1,-2]],
        "3->2": [[0,0], [-1,0], [-1,-1],[0,2],  [-1,2]],
        "3->0": [[0,0], [-1,0], [-1,-1],[0,2],  [-1,2]],
        "0->3": [[0,0], [1,0],  [1,1],  [0,-2], [1,-2]],
    };
    I_KICKS = {
        "0->1": [[0,0], [-2,0], [1,0],  [-2,-1], [1,2]],
        "1->0": [[0,0], [2,0],  [-1,0], [2,1],   [-1,-2]],
        "1->2": [[0,0], [-1,0], [2,0],  [-1,2],  [2,-1]],
        "2->1": [[0,0], [1,0],  [-2,0], [1,-2],  [-2,1]],
        "2->3": [[0,0], [2,0],  [-1,0], [2,1],   [-1,-2]],
        "3->2": [[0,0], [-2,0], [1,0],  [-2,-1], [1,2]],
        "3->0": [[0,0], [1,0],  [-2,0], [1,-2],  [-2,1]],
        "0->3": [[0,0], [-1,0], [2,0],  [-1,2],  [2,-1]],
    };

    // ---------- Setup ----------

    createEmptyBoard() {
        return Array.from(
        { length: this.ROWS + this.BUFFER_ROWS },
        () => Array(this.COLS).fill(false));
    }

    //Bundles board + falling piece + score/level
    createInitialState() {
        return {
            board: this.createEmptyBoard(),
            piece: this.spawnPiece(),
            score: 0,
            level: 0,
            totalLines: 0,
            gameOver: false,
        };
    }

    spawnPiece() {
        const index = Math.floor(Math.random() * this.TETROMINO_SHAPES.length);
        const template = this.TETROMINO_SHAPES[index];
        return {
            name: template.name,
            shape: template.shape.map(row => [...row]),
            xPos: 3,
            yPos: 0,
            rotationState: 0,
        };
    }

    // ---------- Geometry ----------

    // Rotates a square matrix in place. true = clockwise, false = counter-clockwise.
    rotateMatrix(matrix, clockwise) {
        const n = matrix.length;
        if (clockwise) {
            for (let r = 0; r < n; r++) {
                for (let c = r + 1; c < n; c++) {
                    [matrix[r][c], matrix[c][r]] = [matrix[c][r], matrix[r][c]];
                }
            }
            matrix.forEach(row => row.reverse());
        } else {
            matrix.forEach(row => row.reverse());
            for (let r = 0; r < n; r++) {
                for (let c = r + 1; c < n; c++) {
                    [matrix[r][c], matrix[c][r]] = [matrix[c][r], matrix[r][c]];
                }
            }
        }
        return matrix;
    }

    // Returns the 4 absolute board {x, y} cells a piece currently occupies.
    getPieceCells(piece) {
        const cells = [];
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c]) {
                    cells.push({ x: piece.xPos + c, y: piece.yPos + r });
                }
            }
        }
        return cells;
    }

    isValidPosition(board, piece, xPos, yPos) {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (!piece.shape[r][c]) continue;
                const boardX = xPos + c;
                const boardY = yPos + r;
                if (boardX < 0 || boardX >= this.COLS || boardY >= board.length) return false;
                if (boardY >= 0 && board[boardY][boardX]) return false;
            }
        }
        return true;
    }

    // ---------- Movement ----------

    moveLeft(state) {
        if (this.isValidPosition(state.board, state.piece, state.piece.xPos - 1, state.piece.yPos)) {
            state.piece.xPos -= 1;
        }
    }

    moveRight(state) {
        if (this.isValidPosition(state.board, state.piece, state.piece.xPos + 1, state.piece.yPos)) {
            state.piece.xPos += 1;
        }
    }

    // Moves the piece down one row if possible. Returns whether it moved.
    softDrop(state) {
        if (this.isValidPosition(state.board, state.piece, state.piece.xPos, state.piece.yPos + 1)) {
            state.piece.yPos += 1;
            return true;
        }
        return false;
    }

    hardDrop(state) {
        while (this.softDrop(state)) {
        /* keep dropping until it can't move further */
        }
        this.lockPiece(state);
    }

    /**
    * Attempts an SRS rotation with wall kicks.
    * Returns the new piece object on success, or null if every kick failed.
    */
    superRotationSystem(state, clockwise) {
        const { board, piece } = state;
        if (piece.name === "O") return { ...piece }; // O piece doesn't needs to be rotated

        const currentState = piece.rotationState;
        const dir = clockwise ? 1 : -1;
        const targetState = (currentState + dir + 4) % 4;

        const shapeCopy = piece.shape.map(row => [...row]);
        const rotatedShape = this.rotateMatrix(shapeCopy, clockwise);

        const transitionKey = `${currentState}->${targetState}`;
        const kickTable = piece.name === "I" ? this.I_KICKS : this.JLSTZ_KICKS;
        const kicks = kickTable[transitionKey] || [[0, 0]];

        const candidatePiece = { ...piece, shape: rotatedShape };
        for (const [dx, dy] of kicks) {
            const testX = piece.xPos + dx;
            const testY = piece.yPos - dy;
            if (this.isValidPosition(board, candidatePiece, testX, testY)) {
                return { ...candidatePiece, xPos: testX, yPos: testY, rotationState: targetState };
            }
        }
        return null; // rotation failed
    }

    rotatePiece(state, clockwise) {
        const rotated = this.superRotationSystem(state, clockwise);
        if (rotated) state.piece = rotated;
    }

    // ---------- Locking & clearing ----------

    lockPiece(state) {
        for (const { x, y } of this.getPieceCells(state.piece)) {
            if (y >= 0) state.board[y][x] = state.piece.name;
        }
    }

    /**
    * Removes every full row, shifts everything above down, and adds fresh
    * empty rows at the top. Returns how many rows were cleared.
    */
    clearLines(board) {
        const remainingRows = board.filter(row => !row.every(cell => cell === true));
        const clearedCount = board.length - remainingRows.length;
        const freshRows = Array.from({ length: clearedCount }, () => Array(this.COLS).fill(false));
        const rebuilt = [...freshRows, ...remainingRows];
        for (let i = 0; i < board.length; i++) board[i] = rebuilt[i];
        return clearedCount;
    }

    isBoardEmpty(board) {
        return board.every(row => row.every(cell => cell === false));
    }

    // ---------- Scoring ----------

    // Returns the points earned for this clear (does not mutate state).
    calculateScore(linesCleared, state) {
        if (linesCleared === 0) return 0;
        const perfectClear = this.isBoardEmpty(state.board);
        const table = perfectClear
          ? { 1: 100, 2: 300, 3: 1200, 4: 2400 }
          : { 1: 40, 2: 100, 3: 300, 4: 1200 };
        const basePoints = table[linesCleared] ?? 0;
        return basePoints * (state.level + 1);
    }

    updateLevel(state) {
        state.level = Math.floor(state.totalLines / 10);
    }

    // ---------- Game over & main loop ----------

    isGameOver(state) {
        // A spawn is a game-over the moment the new piece doesn't fit where it spawns.
        return !this.isValidPosition(state.board, state.piece, state.piece.xPos, state.piece.yPos);
    }

    tick(state) {
        if (state.gameOver) return;

        if (this.softDrop(state)) return; // still falling — nothing else to do

        this.lockPiece(state);
        const linesCleared = this.clearLines(state.board);
        state.totalLines += linesCleared;
        state.score += this.calculateScore(linesCleared, state);
        this.updateLevel(state);

        state.piece = this.spawnPiece();
        if (this.isGameOver(state)) state.gameOver = true;
    }

    // ---------- Debug helper ----------

    /** Renders the visible playfield (with the falling piece) as text. */
    printBoard(state) {
        const cells = new Set(this.getPieceCells(state.piece).map(({ x, y }) => `${y},${x}`));
        const lines = [];
        for (let y = this.BUFFER_ROWS; y < state.board.length; y++) {
            let line = "";
            for (let x = 0; x < this.COLS; x++) {
                if (cells.has(`${y},${x}`)) line += "@";
                else line += state.board[y][x] ? "#" : ".";
            }
            lines.push(line);
        }
        console.log(lines.join("\n"));
    }
}

module.exports = Game;

/*  * commented function to display each tick with no
    * outside input until game over for test purpose.

function runLoop(state) {
    console.clear();
    game.printBoard(state);

    if (state.gameOver) {
        console.log(`stopped, gameOver=${state.gameOver}`);
        return;
    }

    game.tick(state);
    setTimeout(() => runLoop(state), 200);
}

const game = new Game();
const runState = game.createInitialState();
runLoop(runState);
*/