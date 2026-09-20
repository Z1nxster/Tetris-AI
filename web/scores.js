const STORAGE_KEY = "tetris.highscores";
export const MAX_SCORES = 10;

// @returns {Array<{name: string, score: number, lines: number, date: string}>}
export function loadHighScores() {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
        return [];
    }

    try {
        const scores = JSON.parse(rawData);
        // Ensure extracted data is actually an array
        if (!Array.isArray(scores)) {
            return [];
    }

    return scores.sort((a, b) => b.score - a.score);
  } catch (error) {
      console.error('Failed to parse high scores from localStorage:', error);
      return [];
  }
}

export function qualifiesForLeaderboard(score) {
    if (score == 0) return false;
    const scoreBoard = loadHighScores();
    if (scoreBoard.length < MAX_SCORES || score > scoreBoard[MAX_SCORES - 1].score)
        return true;
    return false;
}

export function saveScore(name, score, lines) {
    if (qualifiesForLeaderboard(score)) {
        const scoreBoard = loadHighScores();
        scoreBoard.push({name: name ? name : "Guest", score: score, lines: lines, date: new Date().toISOString()});
        scoreBoard.sort((a, b) => b.score - a.score);
        scoreBoard.splice(MAX_SCORES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scoreBoard));
        return scoreBoard;
    }
}

// @param {name: string, score: number} entry
export function renderLeaderboard(scores, highlightIndex = -1) {
    const listElement = document.getElementById("leaderboard");
    listElement.replaceChildren();
    if (scores.length === 0) {
        const empty = document.createElement("li");
        empty.className = "leaderboard-empty";
        empty.textContent = "No scores yet — play a game.";
        listElement.appendChild(empty);
        return;
    }
    for (let index = 0; index < scores.length; index++) {
        if (scores[index].length === 0) break;
        if (index === highlightIndex) {
            createListElement(scores[index].name, scores[index].score, listElement, true);
            continue;
        } 
        createListElement(scores[index].name, scores[index].score, listElement);
    }
}
function createListElement(name, score, listElement, highlight = false) {
    const listItem = document.createElement('li');
        
    const nameSpan = document.createElement('span');
    nameSpan.className = 'entry-name';
    nameSpan.textContent = name;

    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'entry-score';
    scoreSpan.textContent = score;

    if (highlight) listItem.classList.add('is-current');

    listItem.append(nameSpan, scoreSpan);
    listElement.appendChild(listItem);
}

export function clearHighScores() {
    localStorage.removeItem(STORAGE_KEY);
}
