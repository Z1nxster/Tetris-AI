from train import watch_game
import json

DELAY = 0.2

with open("best_weights.json", "r") as file:
    data = json.load(file)

watch_game(data["weights"], DELAY)