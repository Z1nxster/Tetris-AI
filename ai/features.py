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


def max_height(board):
    heights = column_heights(board)
    return max(heights) if heights else 0


def extract_features(board):
    rows = len(board)
    cols = len(board[0])
    
    heights = [0] * cols
    hole_count = 0

    # Single pass column scan
    for c in range(cols):
        has_block = False
        for r in range(Game.BUFFER_ROWS, rows):
            if board[r][c]:
                if not has_block:
                    heights[c] = rows - r
                    has_block = True
            elif has_block:
                hole_count += 1

    agg_height = sum(heights)
    max_h = max(heights)
    bumpiness = sum(abs(heights[i] - heights[i + 1]) for i in range(cols - 1))

    return [agg_height, hole_count, bumpiness, max_h]
# or just return [aggregate_height(board), holes(board), bumpiness(board), max_height(board)]
# without the previous part of the function