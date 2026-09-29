from environment import Game

def column_heights(board):
    rows = len(board)
    cols = len(board[0])
    heights = []
    for c in range(cols):
        col_height = 0
        for r in range(Game.BUFFER_ROWS, rows):
            if board[r][c]:
                col_height = rows - r
                break  
        heights.append(col_height)
    return heights


def aggregate_height(board):
    return sum(column_heights(board))


def holes(board):
    rows = len(board)
    cols = len(board[0])
    hole_count = 0
    for c in range(cols):
        roof = False
        for r in range(Game.BUFFER_ROWS, rows):
            if board[r][c]:
                roof = True
            elif roof:
                hole_count += 1
    return hole_count


def bumpiness(board):
    heights = column_heights(board)
    total = 0
    for i in range(len(heights) - 1):
        total += abs(heights[i] - heights[i + 1])
    return total


def extract_features(board):
    return [aggregate_height(board), holes(board), bumpiness(board)]