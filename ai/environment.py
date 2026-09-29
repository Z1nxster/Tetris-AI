import copy
import math
import random


class Game:
    ROWS = 20  # visible playfield height
    COLS = 10  # playfield width
    BUFFER_ROWS = 4  # hidden spawn area above the visible field

    TETROMINO_SHAPES = [
        {"name": "I", "shape": [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]]},
        {"name": "O", "shape": [[1, 1], [1, 1]]},
        {"name": "T", "shape": [[0, 1, 0], [1, 1, 1], [0, 0, 0]]},
        {"name": "J", "shape": [[1, 0, 0], [1, 1, 1], [0, 0, 0]]},
        {"name": "L", "shape": [[0, 0, 1], [1, 1, 1], [0, 0, 0]]},
        {"name": "S", "shape": [[0, 1, 1], [1, 1, 0], [0, 0, 0]]},
        {"name": "Z", "shape": [[1, 1, 0], [0, 1, 1], [0, 0, 0]]},
    ]

    # SRS kick tables: sequential [dx, dy] offsets to try when a rotation would otherwise collide.
    JLSTZ_KICKS = {
        "0->1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        "1->0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        "1->2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        "2->1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        "2->3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        "3->2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        "3->0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        "0->3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    }

    I_KICKS = {
        "0->1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        "1->0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        "1->2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
        "2->1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        "2->3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        "3->2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        "3->0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        "0->3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    }

    # ---------- Setup ----------

    def create_empty_board(self):
        return [[False] * self.COLS for _ in range(self.ROWS + self.BUFFER_ROWS)]

    # Bundles board + falling, storage and next pieces + score/level
    def create_initial_state(self):
        return {
            "board": self.create_empty_board(),
            "piece": self.spawn_piece(),
            "nextPiece": self.set_raw_piece(),
            "storage": {"name": None, "shape": None},
            "canHold": True,
            "score": 0,
            "level": 0,
            "totalLines": 0,
            "gameOver": False,
        }

    # randomly chooses a shape
    def set_raw_piece(self):
        template = random.choice(self.TETROMINO_SHAPES)
        return {
            "name": template["name"],
            "shape": copy.deepcopy(template["shape"]),
        }

    # adds shape to board
    def spawn_piece(self, raw_piece=None):
        if raw_piece is None:
            raw_piece = self.set_raw_piece()
        return {
            "name": raw_piece["name"],
            "shape": copy.deepcopy(raw_piece["shape"]),
            "xPos": 3,
            "yPos": self.BUFFER_ROWS - 1,
            "rotationState": 0,
        }

    # returns if a cell is occupied on the board, falling piece not included
    def get_cell_type(self, state, x_pos, y_pos):
        return state["board"][y_pos][x_pos]

    # ---------- Geometry ----------

    # Rotates a square matrix in place. true = clockwise, false = counter-clockwise.
    def rotate_matrix(self, matrix, clockwise):
        n = len(matrix)
        if clockwise:
            for r in range(n):
                for c in range(r + 1, n):
                    matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]
            for row in matrix:
                row.reverse()
        else:
            for row in matrix:
                row.reverse()
            for r in range(n):
                for c in range(r + 1, n):
                    matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]
        return matrix

    # Returns the 4 absolute board {x, y} cells a piece currently occupies.
    def get_piece_cells(self, piece):
        cells = []
        for r in range(len(piece["shape"])):
            for c in range(len(piece["shape"][r])):
                if piece["shape"][r][c]:
                    cells.append({"x": piece["xPos"] + c, "y": piece["yPos"] + r})
        return cells

    def is_valid_position(self, board, piece, x_pos, y_pos):
        for r in range(len(piece["shape"])):
            for c in range(len(piece["shape"][r])):
                if not piece["shape"][r][c]:
                    continue
                board_x = x_pos + c
                board_y = y_pos + r
                if board_x < 0 or board_x >= self.COLS or board_y >= len(board):
                    return False
                if board_y >= 0 and board[board_y][board_x]:
                    return False
        return True

    # ---------- Movement ----------

    def move_left(self, state):
        if self.is_valid_position(
            state["board"], state["piece"], state["piece"]["xPos"] - 1, state["piece"]["yPos"]
        ):
            state["piece"]["xPos"] -= 1

    def move_right(self, state):
        if self.is_valid_position(
            state["board"], state["piece"], state["piece"]["xPos"] + 1, state["piece"]["yPos"]
        ):
            state["piece"]["xPos"] += 1

    # Moves the piece down one row if possible. Returns whether it moved.
    def soft_drop(self, state):
        if self.is_valid_position(
            state["board"], state["piece"], state["piece"]["xPos"], state["piece"]["yPos"] + 1
        ):
            state["piece"]["yPos"] += 1
            return True
        return False

    def hard_drop(self, state):
        while self.soft_drop(state):
            pass
        self.lock_piece(state)

    def get_expected_position(self, state):
        proxy_piece = copy.deepcopy(state["piece"])
        temp_state = {
            "board": state["board"], 
            "piece": proxy_piece
        }
        while self.soft_drop(temp_state):
            pass
        return self.get_piece_cells(proxy_piece)

    """
    Attempts an SRS rotation with wall kicks.
    Returns the new piece object on success, or None if every kick failed.
    """
    def super_rotation_system(self, state, clockwise):
        board = state["board"]
        piece = state["piece"]
        if piece["name"] == "O":
            return copy.deepcopy(piece)  # O piece doesn't need to be rotated

        current_state = piece["rotationState"]
        direction = 1 if clockwise else -1
        target_state = (current_state + direction + 4) % 4

        shape_copy = copy.deepcopy(piece["shape"])
        rotated_shape = self.rotate_matrix(shape_copy, clockwise)

        transition_key = f"{current_state}->{target_state}"
        kick_table = self.I_KICKS if piece["name"] == "I" else self.JLSTZ_KICKS
        kicks = kick_table.get(transition_key, [[0, 0]])

        candidate_piece = copy.deepcopy(piece)
        candidate_piece["shape"] = rotated_shape

        for dx, dy in kicks:
            test_x = piece["xPos"] + dx
            test_y = piece["yPos"] - dy
            if self.is_valid_position(board, candidate_piece, test_x, test_y):
                candidate_piece["xPos"] = test_x
                candidate_piece["yPos"] = test_y
                candidate_piece["rotationState"] = target_state
                return candidate_piece

        return None  # rotation failed

    def rotate_piece(self, state, clockwise):
        rotated = self.super_rotation_system(state, clockwise)
        if rotated:
            state["piece"] = rotated

    # ---------- Locking, clearing & storage ----------

    def lock_piece(self, state):
        for cell in self.get_piece_cells(state["piece"]):
            x, y = cell["x"], cell["y"]
            if y >= 0:
                state["board"][y][x] = state["piece"]["name"]
        state["canHold"] = True

    def store_piece(self, state):
        if state["canHold"]:
            template = next(
                t for t in self.TETROMINO_SHAPES if t["name"] == state["piece"]["name"]
            )
            current_piece_raw = {
                "name": template["name"],
                "shape": copy.deepcopy(template["shape"]),
            }

            if state["storage"]["name"] is None:
                state["storage"] = current_piece_raw
                state["piece"] = self.spawn_piece(state["nextPiece"])
                state["nextPiece"] = self.set_raw_piece()
            else:
                held = state["storage"]
                state["storage"] = current_piece_raw
                state["piece"] = self.spawn_piece(held)

            state["canHold"] = False

    """
    Removes every full row, shifts everything above down, and adds fresh
    empty rows at the top. Returns how many rows were cleared.
    """
    def clear_lines(self, board):
        remaining_rows = [row for row in board if not all(cell is not False for cell in row)]
        cleared_count = len(board) - len(remaining_rows)
        fresh_rows = [[False] * self.COLS for _ in range(cleared_count)]
        rebuilt = fresh_rows + remaining_rows
        for i in range(len(board)):
            board[i] = rebuilt[i]
        return cleared_count

    def is_board_empty(self, board):
        return all(all(cell is False for cell in row) for row in board)

    # ---------- Scoring ----------

    # Returns the points earned for this clear (does not mutate state).
    def calculate_score(self, lines_cleared, state):
        if lines_cleared == 0:
            return 0
        perfect_clear = self.is_board_empty(state["board"])
        table = (
            {1: 100, 2: 300, 3: 1200, 4: 2400}
            if perfect_clear
            else {1: 40, 2: 100, 3: 300, 4: 1200}
        )
        base_points = table.get(lines_cleared, 0)
        return base_points * (state["level"] + 1)

    def update_level(self, state):
        state["level"] = math.floor(state["totalLines"] / 10)

    # ---------- Game over & main loop ----------

    def is_game_over(self, state):
        # A spawn is a game-over the moment the new piece doesn't fit where it spawns.
        return not self.is_valid_position(
            state["board"], state["piece"], state["piece"]["xPos"], state["piece"]["yPos"]
        )

    def tick(self, state):
        if state["gameOver"]:
            return

        if self.soft_drop(state):
            return  # still falling — nothing else to do

        self.lock_piece(state)
        lines_cleared = self.clear_lines(state["board"])
        state["totalLines"] += lines_cleared
        state["score"] += self.calculate_score(lines_cleared, state)
        self.update_level(state)

        state["piece"] = self.spawn_piece(state["nextPiece"])
        state["nextPiece"] = self.set_raw_piece()
        if self.is_game_over(state):
            state["gameOver"] = True

    # ---------- Debug helper ----------

    """Renders the visible playfield (with the falling piece) as text."""
    def print_board(self, state):
        cells = {
            f"{cell['y']},{cell['x']}" for cell in self.get_piece_cells(state["piece"])
        }
        lines = []
        for y in range(self.BUFFER_ROWS, len(state["board"])):
            line = ""
            for x in range(self.COLS):
                if f"{y},{x}" in cells:
                    line += "@"
                else:
                    line += state["board"][y][x] if state["board"][y][x] else "."
            lines.append(line)
        print("\n".join(lines))

"""
import time
import os

tetris = Game()

current_state = tetris.create_initial_state()

while not tetris.is_game_over(current_state):
    os.system('cls' if os.name == 'nt' else 'clear')
    
    tetris.print_board(current_state)
    tetris.tick(current_state)
    current_state["piece"]["xPos"] = 0
    time.sleep(0.5)

print("Game Over!")
"""