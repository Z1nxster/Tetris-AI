class Game {
    ROWS = 20;
    COLS = 10;
    TETROMINO_SHAPES = [
        {
          name: "I",
          shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
          ]
        },
        {
          name: "O",
          shape: [
            [1, 1],
            [1, 1]
          ]
        },
        {
          name: "T",
          shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
          ]
        },
        {
          name: "J",
          shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
          ]
        },
        {
          name: "L",
          shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
          ]
        },
        {
          name: "S",
          shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
          ]
        },
        {
          name: "Z",
          shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
          ]
        }
      ];
    // SRS Kick Tables: [dx, dy] offsets to test sequentially
    JLSTZ_KICKS = {
        "0->1": [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
        "1->0": [[0,0], [1,0],  [1,-1], [0,2],  [1,2]],
        "1->2": [[0,0], [1,0],  [1,-1], [0,2],  [1,2]],
        "2->1": [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
        "2->3": [[0,0], [1,0],  [1,1],  [0,-2], [1,-2]],
        "3->2": [[0,0], [-1,0], [-1,-1],[0,2],  [-1,2]],
        "3->0": [[0,0], [-1,0], [-1,-1],[0,2],  [-1,2]],
        "0->3": [[0,0], [1,0],  [1,1],  [0,-2], [1,-2]]
    };
    I_KICKS = {
        "0->1": [[0,0], [-2,0], [1,0],  [-2,-1], [1,2]],
        "1->0": [[0,0], [2,0],  [-1,0], [2,1],   [-1,-2]],
        "1->2": [[0,0], [-1,0], [2,0],  [-1,2],  [2,-1]],
        "2->1": [[0,0], [1,0],  [-2,0], [1,-2],  [-2,1]],
        "2->3": [[0,0], [2,0],  [-1,0], [2,1],   [-1,-2]],
        "3->2": [[0,0], [-2,0], [1,0],  [-2,-1], [1,2]],
        "3->0": [[0,0], [1,0],  [-2,0], [1,-2],  [-2,1]],
        "0->3": [[0,0], [-1,0], [2,0],  [-1,2],  [2,-1]]
    };

    createEmptyBoard(){
        return Array.from({length: this.ROWS + 4}, () => Array(this.COLS).fill(false));
    }

    spawnPiece(){
        const pick = Math.floor(Math.random() * this.TETROMINO_SHAPES.length);
        const shape = this.TETROMINO_SHAPES[pick].shape.map(row => [...row]);
        return {shape: shape, xPos: 3,yPos: 0, rotationState: 0};
    }

    rotateMatrix(matrix, rotation) {
      // rotation value: true - clockwise rotation, false - counterclockwise rotation

      const N = matrix.length;
      if (rotation) {
          for (let r = 0; r < N; r++) {
              for (let c = r + 1; c < N; c++) {
                  [matrix[r][c], matrix[c][r]] = [matrix[c][r], matrix[r][c]];
              }
          }
          for (let r = 0; r < N; r++) {
              matrix[r].reverse();
          }
      } else {
          for (let r = 0; r < N; r++) {
              matrix[r].reverse();
          }
          for (let r = 0; r < N; r++) {
              for (let c = r + 1; c < N; c++) {
                  [matrix[r][c], matrix[c][r]] = [matrix[c][r], matrix[r][c]];
              }
          }
      }
      return matrix;
    }

    getPieceCells(piece){
        const res = [{x : "", y : ""},
            {x : "", y : ""},
            {x : "", y : ""},
            {x : "", y : ""}];
        let i = 0;
        for (let r = 0; r < piece.shape.length; r++){
            for (let c = 0; c < piece.shape.length; c++){
                if(piece.shape[r][c]){
                    res[i].x = piece.xPos;
                    res[i++].y = piece.yPos;
                }
            }
        }
        return res;
    }

    isValidPosition(board, piece, xPos, yPos) {
        for (let r = 0; r < piece.shape.length; r++) {
          for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
              const boardX = xPos + c;
              const boardY = yPos + r;

              // Wall and floor collision bounds
              if (boardX < 0 || boardX >= this.COLS || boardY >= board.length) {
                return false;
              }
              // Collision with locked blocks on the board
              if (boardY >= 0 && board[boardY][boardX]) {
                return false;
              }
            }
          }
        }
        return true;
    }

    moveLeft(state){
        if(isValidPosition(state.board, state.piece, state.piece.xPos - 1, state.piece.yPos))
            state.piece.xPos -= 1;
    }

    moveRight(state){
        if(isValidPosition(state.board, state.piece, state.piece.xPos + 1, state.piece.yPos)))
            state.piece.xPos += 1;
    }

    softDrop(state){
        if(isValidPosition(state.board, state.piece, state.piece.xPos, state.piece.yPos + 1)))
            state.piece.yPos += 1;
    }

    superRotationSystem(state, direction){
        const { board, piece } = state;

            // O-Piece does not rotate or kick
            if (piece.name === "O") {
              return { ...piece };
            }

            // 1. Calculate target rotation state index (0 to 3)
            const currentState = piece.rotationState;
            const dir = clockwise ? 1 : 0;
            const targetState = (currentState + dir + 4) % 4;

            // 2. Rotate the shape matrix
            const rotatedShape = this.rotateMatrix(piece.shape, clockwise);

            // 3. Select kick data table
            const transitionKey = `${currentState}->${targetState}`;
            const kickTable = piece.name === "I" ? this.I_KICKS : this.JLSTZ_KICKS;
            const kicks = kickTable[transitionKey] || [[0, 0]];

            // Create a candidate piece object with rotated shape
            const candidatePiece = { ...piece, shape: rotatedShape };

            // 4. Test SRS Kick Offsets sequentially
            for (const [dx, dy] of kicks) {
              // SRS y-axis in kick data is inverted relative to standard array rows
              const testX = piece.xPos + dx;
              const testY = piece.yPos - dy;

              if (this.isValidPosition(board, candidatePiece, testX, testY)) {
                return {
                  ...candidatePiece,
                  xPos: testX,
                  yPos: testY,
                  rotationState: targetState
                };
              }
            }

            // Return null if all 5 kick tests fail (rotation blocked)
            return null;
          }
        }
    }

    hardDrop(state){

    }

    lockPiece(state){

    }

    clearLines(board){

    }

    calculateScore(linesCleared, level){

    }

    updateLevel(totalLines){

    }

    isGameOver(board){

    }

    tick(state){

    }
}

