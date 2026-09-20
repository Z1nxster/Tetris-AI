const SVG_NS = "http://www.w3.org/2000/svg";

export function initBoardSVG(svgElement, rows, cols) {
    svgElement.setAttribute("viewBox", `0 0 ${cols} ${rows}`);
    const boardRects = [];
    for (let y = 0; y < rows; y++) {
        const rowOfRects = [];
        for (let x = 0; x < cols; x++) {
            const rect = document.createElementNS(SVG_NS, "rect");

            rect.setAttribute("x", x);
            rect.setAttribute("y", y);
            rect.setAttribute("width", 1);
            rect.setAttribute("height", 1);
            rect.setAttribute("class", "cell cell-empty");

            svgElement.appendChild(rect);
            rowOfRects.push(rect);
        }
        boardRects.push(rowOfRects);
    }
    return boardRects;
}
    
export function getExpectedPosition(game, state) {
    const ghostPiece = {...state.piece, shape: state.piece.shape.map(row => [...row])};
    const proxyState = { board: state.board, piece: ghostPiece};
    while (game.softDrop(proxyState)) {}
    return new Set(game.getPieceCells(proxyState.piece).map(({ x, y}) => `${y},${x}`));
}

export function renderBoard(game, state, cellRects) {
    const cells = new Set(game.getPieceCells(state.piece).map(({ x, y }) => `${y},${x}`));
    const expectedPosition = getExpectedPosition(game, state);
    for (let y = game.BUFFER_ROWS; y < state.board.length; y++) {
        for (let x = 0; x < game.COLS; x++) {
            let cellType = game.getCellType(state, x, y);
            if(cells.has(`${y},${x}`)) 
                cellRects[y - game.BUFFER_ROWS][x].setAttribute("class", `cell cell-${state.piece.name}`);
            else if (cellType)
                cellRects[y - game.BUFFER_ROWS][x].setAttribute("class", `cell cell-${cellType}`);
            else if (expectedPosition.has(`${y},${x}`))
                cellRects[y - game.BUFFER_ROWS][x].setAttribute("class", `cell cell-expected`);
            else
                cellRects[y - game.BUFFER_ROWS][x].setAttribute("class", `cell cell-empty`);
        }
    }
}

export function renderStats(state) {
    const scoreElement = document.getElementById("score");
    const levelElement = document.getElementById("level");
    const linesElement = document.getElementById("lines");

    scoreElement.textContent = state.score;
    levelElement.textContent = state.level;
    linesElement.textContent = state.totalLines;
}

export function renderPreview(game, pieceOrNull, svgElement) {
    svgElement.replaceChildren();
    if (!pieceOrNull || !pieceOrNull.name) return;

    const size = pieceOrNull.shape.length;
    const preview = initBoardSVG(svgElement, size, size);
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (pieceOrNull.shape[row][col]) {
                preview[row][col].setAttribute("class", `cell cell-${pieceOrNull.name}`);
            }
        }
    }
}