/*
 * @param {KeyboardEvent} event
 * @param {Game} game
 * @param {object} state
 * @param {() => void} onStateChange - call this after any action that changes state
 */
export function handleKeyDown(event, game, state, onStateChange) {
    if(state.gameOver) return;

    switch(event.code) {
        case("ArrowLeft"):
            event.preventDefault();
            game.moveLeft(state);
            onStateChange();
            break;
        case("ArrowRight"):
            event.preventDefault();
            game.moveRight(state);
            onStateChange();
            break;
        case("ArrowDown"):
            event.preventDefault();
            game.softDrop(state);
            onStateChange();
            break;
        case("KeyZ"):
            event.preventDefault();
            game.rotatePiece(state, true);
            onStateChange();
            break;
        case("KeyX"):
            event.preventDefault();
            game.rotatePiece(state, false);
            onStateChange();
            break;
        case("Space"):
            event.preventDefault();
            game.hardDrop(state);
            onStateChange();
            break;
        case("KeyC"):
            event.preventDefault();
            game.storePiece(state);
            onStateChange();
            break;
        default:
            return;
    }
}