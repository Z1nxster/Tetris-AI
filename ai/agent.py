from environment import Game
import features
import copy

game = Game()

def evaluate(feature_values, weights):
    score = 0
    for value, weight in zip(feature_values, weights):
        score += value * weight
    return score


def get_features_vector(state):
    cleared_lines = game.clear_lines(state["board"])
    vector = features.extract_features(state["board"])
    vector.append(cleared_lines)
    return vector


def find_best_placement(state, weights):
    best_score = float("-inf")
    best_choice = None

    for rotation in range(4):
        for col in range(Game.COLS):
            proxy_state = copy.deepcopy(state)

            for _ in range(rotation):
                game.rotate_piece(proxy_state, True)

            piece = proxy_state["piece"]
            if not game.is_valid_position(proxy_state["board"], piece, col, piece["yPos"]):
                continue
            piece["xPos"] = col

            game.hard_drop(proxy_state)
            evaluated_score = evaluate(get_features_vector(proxy_state), weights)

            if evaluated_score > best_score:
                best_score = evaluated_score
                best_choice = {"rotation": rotation, "column": col}

    return best_choice


def play_move(state, weights):
    best_placement = find_best_placement(state, weights)

    for _ in range(best_placement["rotation"]):
        game.rotate_piece(state, True) 
    state["piece"]["xPos"] = best_placement["column"]
    
    game.hard_drop(state)  
    lines_cleared = game.clear_lines(state["board"])
    state["totalLines"] += lines_cleared
    state["score"] += game.calculate_score(lines_cleared, state)
    game.update_level(state)

    state["piece"] = game.spawn_piece(state["nextPiece"])
    state["nextPiece"] = game.set_raw_piece()

    if game.is_game_over(state):
        state["gameOver"] = True