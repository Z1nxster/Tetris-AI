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

export function renderBoard(game, state, cellRects) {
    const cells = new Set(game.getPieceCells(state.piece).map(({ x, y }) => `${y},${x}`));
    for (let y = game.BUFFER_ROWS; y < state.board.length; y++) {
        for (let x = 0; x < game.COLS; x++) {
            let cellType = game.getCellType(state, x, y);
            if (cellType || cells.has(`${y},${x}`))
                cellRects[y - game.BUFFER_ROWS][x].setAttribute("class", 'cell cell-${game.getCellType(state, x, y)}');
            else
                cellRects[y - game.BUFFER_ROWS][x].setAttribute("class", 'cell cell-empty');
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

/*
 * OPTIONAL STRETCH — not required for a working game, come back to this
 * once movement/gravity/scoring are all rendering correctly.
 *
 * A renderPreview(pieceOrNull, svgElement) function could draw a piece's
 * shape into the small #next-preview / #hold-preview SVGs the same way
 * initBoardSVG draws the main board — set a small viewBox, create one
 * <rect> per filled shape cell. Handle the "nothing held yet" case
 * (state.storage.name === null) by just clearing the SVG's contents.
 */