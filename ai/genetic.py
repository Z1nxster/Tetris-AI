import features
import agent
import random
from environment import Game

game = Game()
WEIGHTS_COUNT = 4

class Player:
    def __init__(self, weights=None, score=None):
        self.weights = weights
        self.score = score 

    def __repr__(self):
        return f"Player(score = {self.score}, weights = {self.weights})"

def random_weights(n):
    return [random.uniform(-1, 1) for _ in range(n)]

def create_population(size, n):
    return [Player(weights=random_weights(n), score=0) for _ in range(size)]

def evaluate_fitness(weights, n_games = 3):
    total_score = 0

    for run in range(n_games):
        state = game.create_initial_state()
        while not state["gameOver"]:
            agent.play_move(state, weights)
        total_score += state["score"]

    return total_score / n_games

def select_parents(population):
    def one_tournament():
        contenders = random.sample(population, k=min(3, len(population)))
        return max(contenders, key=lambda p: p.score)
    return one_tournament(), one_tournament()

def crossover(parent_a, parent_b):
    child = []
    for weight_a, weight_b in zip(parent_a.weights, parent_b.weights):
        child.append(random.choice([weight_a, weight_b]))
    
    return child

def mutate(weights, rate, amount):
    mutated = list(weights)

    for i in range(len(mutated)):
        if (random.random() <= rate):
            mutated[i] = mutated[i] * random.uniform(-amount, amount)

    return mutated

def run_generation(players, population_size, rate, amount):

    for player in players:
        player.score = evaluate_fitness(player.weights)
 
    best = max(players, key=lambda p: p.score)

    new_players = []
    for _ in range(population_size):
        parent_a, parent_b = select_parents(players)
        child_weights = crossover(parent_a, parent_b)
        child_weights = mutate(child_weights, rate, amount)
        new_players.append(Player(weights=child_weights, score=0))
 
    players.clear()
    players.extend(new_players)
 
    return best

def train(n_generations, population_size):
    players = create_population(population_size, WEIGHTS_COUNT)
    best_overall = None
 
    for generation in range(n_generations):
        best_this_gen = run_generation(players, population_size, rate=0.1, amount=0.3)
        print(f"generation {generation}: best score = {best_this_gen.score:.1f}")

        if best_overall is None or best_this_gen.score > best_overall.score:
            best_overall = best_this_gen

    return best_overall
