"""
Entry point: runs the genetic algorithm and saves the best weights found.

Run with: python3 train.py

Start small (see the __main__ block) to confirm everything actually runs
end-to-end before committing to a long real run — a full run with a large
population and many generations can take a while, and you want to know the
pipeline itself is correct before spending that time.
"""
import json
from genetic import train

if __name__ == "__main__":
    N_GENERATIONS = 20
    POPULATION_SIZE = 30

    best = train(N_GENERATIONS, POPULATION_SIZE)

    print("\nBest weights found:", best.weights)
    print("Best average score:", best.score)

    with open("best_weights.json", "w") as f:
        json.dump({"weights": best.weights, "score": best.score}, f, indent=2)
    print("Saved to best_weights.json")