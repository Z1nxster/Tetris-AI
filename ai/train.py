"""
Entry point: runs the genetic algorithm and saves the best weights found.

Run with: python3 train.py

Start small (see the __main__ block) to confirm everything actually runs
end-to-end before committing to a long real run — a full run with a large
population and many generations can take a while, and you want to know the
pipeline itself is correct before spending that time.
"""
import json
import os
import time
from environment import Game
import agent
from genetic import train

def watch_game(weights, delay=0.1):
    """Plays a visual game in the command prompt using the given weights."""
    game = Game()
    state = game.create_initial_state()

    while not state["gameOver"]:
        # Clear terminal screen (Windows uses 'cls', Mac/Linux uses 'clear')
        os.system("cls" if os.name == "nt" else "clear")

        # Display current stats and board
        print(f"Score: {state['score']} | Lines: {state['totalLines']} | Level: {state['level']}")
        game.print_board(state)

        # AI executes its move
        agent.play_move(state, weights)

        # Pause briefly to animate the frame
        time.sleep(delay)

    # Final frame rendering
    os.system("cls" if os.name == "nt" else "clear")
    print("=== GAME OVER ===")
    print(f"Final Score: {state['score']}")
    print(f"Total Lines Cleared: {state['totalLines']}")
    game.print_board(state)

if __name__ == "__main__":
    N_GENERATIONS = 200
    POPULATION_SIZE = 40

    best = train(N_GENERATIONS, POPULATION_SIZE)

    print("\nBest weights found:", best.weights)
    print("Best average score:", best.score)

    with open("best_weights.json", "w") as f:
        json.dump({"weights": best.weights, "score": best.score}, f, indent=2)
    print("Saved to best_weights.json")

    input("\nPress Enter to watch the AI play with the winning weights...")
    watch_game(best.weights, delay=0.1)