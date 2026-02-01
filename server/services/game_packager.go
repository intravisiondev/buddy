package services

import (
	"archive/zip"
	"buddy-server/models"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"
)

// GamePackager handles game bundle creation and distribution
type GamePackager struct {
	uploadDir    string
	bundleSecret string
}

// NewGamePackager creates a new game packager
func NewGamePackager(uploadDir string) *GamePackager {
	// Load secret from env, fallback to default (should be in .env)
	secret := os.Getenv("BUNDLE_SECRET")
	if secret == "" {
		secret = "buddy-default-bundle-secret-change-in-production"
	}
	
	return &GamePackager{
		uploadDir:    uploadDir,
		bundleSecret: secret,
	}
}

// GameManifest represents the manifest.json file in a game bundle
type GameManifest struct {
	ID          string   `json:"id"`
	Version     string   `json:"version"`
	Template    string   `json:"template"`
	Hash        string   `json:"hash"`
	Signature   string   `json:"signature"`
	Entrypoint  string   `json:"entrypoint"`
	Permissions []string `json:"permissions"`
	Resources   []string `json:"resources"`
	CreatedAt   string   `json:"created_at"`
}

// GameBundle represents a packaged game
type GameBundle struct {
	Path      string
	Hash      string
	Signature string
	Manifest  GameManifest
}

// CreateBundle creates a ZIP bundle for a game
func (p *GamePackager) CreateBundle(game *models.AIGame) (*GameBundle, error) {
	if game.ID.IsZero() {
		return nil, errors.New("game must have an ID")
	}

	gameID := game.ID.Hex()
	gameDir := filepath.Join(p.uploadDir, "games", gameID)
	
	// Create game directory if it doesn't exist
	if err := os.MkdirAll(gameDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create game directory: %w", err)
	}

	// Generate game files based on template
	if err := p.generateGameFiles(game, gameDir); err != nil {
		return nil, fmt.Errorf("failed to generate game files: %w", err)
	}

	// Create ZIP archive
	zipPath := filepath.Join(gameDir, fmt.Sprintf("game-%s.zip", gameID))
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create zip file: %w", err)
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	// Add files to ZIP
	filesToAdd := []string{"index.html", "game.js", "content.json", "manifest.json", "styles.css"}
	for _, filename := range filesToAdd {
		sourcePath := filepath.Join(gameDir, filename)
		if _, err := os.Stat(sourcePath); os.IsNotExist(err) {
			continue
		}

		if err := p.addFileToZip(zipWriter, sourcePath, filename); err != nil {
			return nil, fmt.Errorf("failed to add %s to zip: %w", filename, err)
		}
	}

	zipWriter.Close()
	zipFile.Close()

	// Calculate hash
	hash, err := p.calculateFileHash(zipPath)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate hash: %w", err)
	}

	// Calculate HMAC signature
	signature := p.signBundle(zipPath)

	// Load and update manifest with hash and signature
	manifestPath := filepath.Join(gameDir, "manifest.json")
	manifestData, err := os.ReadFile(manifestPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read manifest: %w", err)
	}

	var manifest GameManifest
	if err := json.Unmarshal(manifestData, &manifest); err != nil {
		return nil, fmt.Errorf("failed to parse manifest: %w", err)
	}
	manifest.Hash = hash
	manifest.Signature = signature

	// Save updated manifest
	manifestData, _ = json.MarshalIndent(manifest, "", "  ")
	os.WriteFile(manifestPath, manifestData, 0644)

	return &GameBundle{
		Path:      zipPath,
		Hash:      hash,
		Signature: signature,
		Manifest:  manifest,
	}, nil
}

// generateGameFiles creates the HTML, JS, and JSON files for the game
func (p *GamePackager) generateGameFiles(game *models.AIGame, outputDir string) error {
	// Generate content.json
	contentData, err := json.MarshalIndent(map[string]interface{}{
		"questions": game.Questions,
		"scenarios": game.Scenarios,
		"puzzles":   game.Puzzles,
		"config":    game.Config,
		"ruleset":   game.Ruleset,
	}, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(outputDir, "content.json"), contentData, 0644); err != nil {
		return err
	}

	// Generate manifest.json
	manifest := GameManifest{
		ID:          game.ID.Hex(),
		Version:     game.Version,
		Template:    game.Template,
		Entrypoint:  "index.html",
		Permissions: []string{"websocket"},
		Resources:   []string{},
		CreatedAt:   game.CreatedAt.Format(time.RFC3339),
	}
	manifestData, _ := json.MarshalIndent(manifest, "", "  ")
	if err := os.WriteFile(filepath.Join(outputDir, "manifest.json"), manifestData, 0644); err != nil {
		return err
	}

	// Generate index.html
	html := p.generateHTML(game)
	if err := os.WriteFile(filepath.Join(outputDir, "index.html"), []byte(html), 0644); err != nil {
		return err
	}

	// Generate game.js
	js := p.generateGameScript(game)
	if err := os.WriteFile(filepath.Join(outputDir, "game.js"), []byte(js), 0644); err != nil {
		return err
	}

	// Generate styles.css
	css := p.generateStyles(game)
	if err := os.WriteFile(filepath.Join(outputDir, "styles.css"), []byte(css), 0644); err != nil {
		return err
	}

	return nil
}

// generateHTML creates the HTML file
func (p *GamePackager) generateHTML(game *models.AIGame) string {
	// Strict CSP policy (frame-ancestors is header-only, not valid in meta - game loads in iframe)
	csp := "default-src 'self'; " +
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
		"style-src 'self' 'unsafe-inline'; " +
		"img-src 'self' data: blob:; " +
		"font-src 'self' data: https://fonts.gstatic.com; " +
		"connect-src 'self' ws://localhost:8080 wss://localhost:8080 http://localhost:8080; " +
		"base-uri 'self'; " +
		"form-action 'none'; " +
		"object-src 'none';"

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="%s">
    <title>%s</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="game-container">
        <div id="game-header">
            <div class="header-top">
                <h1 id="game-title">%s</h1>
                <div id="question-counter" class="question-counter">1 / 10</div>
            </div>
            <div id="game-stats">
                <div class="stat-item">
                    <span class="stat-icon">⭐</span>
                    <span id="score">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">⏱️</span>
                    <span id="timer">0:00</span>
                </div>
                <div class="stat-item" id="lives-container">
                    <span id="lives">❤️❤️❤️</span>
                </div>
            </div>
        </div>
        <div id="progress-container">
            <div id="progress-bar">
                <div id="progress-fill"></div>
            </div>
        </div>
        <div id="game-content"></div>
    </div>
    <script src="game.js"></script>
</body>
</html>`, csp, game.Title, game.Title)
}

// generateGameScript creates the JavaScript file
func (p *GamePackager) generateGameScript(game *models.AIGame) string {
	template := game.Template
	if template == "" {
		template = game.GameType
	}

	// JavaScript content without backtick issues
	jsContent := fmt.Sprintf(`// Buddy Game Engine - %s
let gameState = {
    score: 0,
    currentQuestion: 0,
    lives: 3,
    startTime: null,
    content: null,
    config: null,
    ruleset: null,
    answered: false
};

async function loadGameContent() {
    const response = await fetch('content.json');
    const data = await response.json();
    gameState.content = data;
    gameState.config = data.config;
    gameState.ruleset = data.ruleset;
    return data;
}

async function initGame() {
    const content = await loadGameContent();
    gameState.startTime = Date.now();
    gameState.lives = gameState.ruleset.lives_count || 3;
    
    if (gameState.config && gameState.config.colors) {
        document.documentElement.style.setProperty('--primary-color', gameState.config.colors.primary);
        document.documentElement.style.setProperty('--secondary-color', gameState.config.colors.secondary);
        document.documentElement.style.setProperty('--accent-color', gameState.config.colors.accent);
        document.documentElement.style.setProperty('--bg-color', gameState.config.colors.background);
    }
    
    renderGame();
}

function renderGame() {
    const container = document.getElementById('game-content');
    const template = '%s';
    
    switch(template) {
        case 'quiz':
            renderQuiz(container);
            break;
        case 'flashcards':
            renderFlashcards(container);
            break;
        case 'word-search':
            renderWordSearch(container);
            break;
        case 'fill-blank':
        case 'fill_blank':
            renderFillBlank(container);
            break;
        case 'matching':
            renderMatching(container);
            break;
        default:
            renderQuiz(container);
    }
    
    updateStats();
    startTimer();
}

function renderQuiz(container) {
    if (!gameState.content.questions || gameState.currentQuestion >= gameState.content.questions.length) {
        endGame();
        return;
    }
    
    const question = gameState.content.questions[gameState.currentQuestion];
    const total = gameState.content.questions.length;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    const optionsHTML = question.options ? question.options.map((opt, i) =>
        '<button class="option-btn" data-answer="' + opt.replace(/"/g, '&quot;') + '" onclick="selectAnswer(this, \'' + opt.replace(/'/g, "\\'").replace(/"/g, '&quot;') + '\')"><span class="option-letter">' + letters[i] + '</span><span class="option-text">' + opt + '</span></button>'
    ).join('') : '';
    
    document.getElementById('question-counter').textContent = (gameState.currentQuestion + 1) + ' / ' + total;
    
    container.innerHTML = '<div class="question-card animate-in"><div class="question-number">Question ' + (gameState.currentQuestion + 1) + '</div><h2 class="question-text">' + question.question + '</h2><div class="options">' + optionsHTML + '</div><div class="feedback-area" id="feedback"></div></div>';
}

function renderFlashcards(container) {
    if (!gameState.content.questions || gameState.currentQuestion >= gameState.content.questions.length) {
        endGame();
        return;
    }
    
    const card = gameState.content.questions[gameState.currentQuestion];
    const total = gameState.content.questions.length;
    document.getElementById('question-counter').textContent = (gameState.currentQuestion + 1) + ' / ' + total;
    
    container.innerHTML = '<div class="question-card animate-in">' +
        '<div class="question-number">Card ' + (gameState.currentQuestion + 1) + ' of ' + total + '</div>' +
        '<p style="text-align:center;color:var(--text-light);margin-bottom:16px;">Tap the card to flip</p>' +
        '<div class="flashcard" onclick="this.classList.toggle(\'flipped\')">' +
            '<div class="flashcard-front"><p>' + card.question + '</p></div>' +
            '<div class="flashcard-back"><p>' + card.correct_answer + '</p></div>' +
        '</div>' +
        '<button class="next-btn" onclick="nextCard()">Next Card →</button>' +
    '</div>';
}

function renderWordSearch(container) {
    container.innerHTML = '<div class="word-search-grid" id="ws-grid"></div><div class="word-list" id="ws-words"></div>';
}

function renderFillBlank(container) {
    if (!gameState.content.questions || gameState.currentQuestion >= gameState.content.questions.length) {
        endGame();
        return;
    }
    
    const question = gameState.content.questions[gameState.currentQuestion];
    const total = gameState.content.questions.length;
    document.getElementById('question-counter').textContent = (gameState.currentQuestion + 1) + ' / ' + total;
    
    container.innerHTML = '<div class="question-card animate-in">' +
        '<div class="question-number">Question ' + (gameState.currentQuestion + 1) + '</div>' +
        '<p class="question-text">' + question.question + '</p>' +
        '<input type="text" id="answer-input" class="answer-input" placeholder="Type your answer here..." autocomplete="off">' +
        '<button class="submit-btn" onclick="checkFillBlankAnswer()">Submit Answer</button>' +
        '<div class="feedback-area" id="feedback"></div>' +
    '</div>';
    
    document.getElementById('answer-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') checkFillBlankAnswer();
    });
}

function renderMatching(container) {
    container.innerHTML = '<p>Matching game coming soon...</p>';
}

function selectAnswer(btn, answer) {
    if (gameState.answered) return;
    gameState.answered = true;
    
    const question = gameState.content.questions[gameState.currentQuestion];
    const isCorrect = answer === question.correct_answer;
    const allBtns = document.querySelectorAll('.option-btn');
    
    allBtns.forEach(b => {
        b.disabled = true;
        if (b.dataset.answer === question.correct_answer) {
            b.classList.add('correct');
        } else if (b === btn && !isCorrect) {
            b.classList.add('wrong');
        }
    });
    
    const feedback = document.getElementById('feedback');
    if (isCorrect) {
        gameState.score += question.points || 10;
        if (gameState.ruleset.bonus_points && gameState.ruleset.bonus_points.speed_bonus) {
            const timeElapsed = (Date.now() - gameState.startTime) / 1000;
            if (timeElapsed < 10) {
                gameState.score += gameState.ruleset.bonus_points.speed_bonus;
            }
        }
        feedback.innerHTML = '<div class="feedback correct-feedback"><span class="feedback-icon">✅</span><span>Correct!</span></div>';
        if (question.explanation) {
            feedback.innerHTML += '<div class="explanation">' + question.explanation + '</div>';
        }
    } else {
        gameState.lives--;
        if (gameState.ruleset.penalties && gameState.ruleset.penalties.wrong_answer) {
            gameState.score += gameState.ruleset.penalties.wrong_answer;
        }
        feedback.innerHTML = '<div class="feedback wrong-feedback"><span class="feedback-icon">❌</span><span>Incorrect! The answer is: ' + question.correct_answer + '</span></div>';
        if (question.explanation) {
            feedback.innerHTML += '<div class="explanation">' + question.explanation + '</div>';
        }
        updateLives();
    }
    
    sendScoreUpdate();
    
    setTimeout(() => {
        if (gameState.lives <= 0) {
            endGame();
            return;
        }
        gameState.currentQuestion++;
        gameState.answered = false;
        renderGame();
    }, 2000);
}

function updateLives() {
    const hearts = '❤️'.repeat(gameState.lives) + '🖤'.repeat(Math.max(0, 3 - gameState.lives));
    document.getElementById('lives').textContent = hearts;
    document.getElementById('lives-container').classList.add('shake');
    setTimeout(() => document.getElementById('lives-container').classList.remove('shake'), 500);
}

function nextCard() {
    gameState.currentQuestion++;
    gameState.score += 5;
    sendScoreUpdate();
    renderGame();
}

function checkFillBlankAnswer() {
    if (gameState.answered) return;
    
    const input = document.getElementById('answer-input');
    const answer = input.value.trim().toLowerCase();
    const question = gameState.content.questions[gameState.currentQuestion];
    const isCorrect = answer === question.correct_answer.toLowerCase();
    
    gameState.answered = true;
    input.disabled = true;
    
    const feedback = document.getElementById('feedback');
    if (isCorrect) {
        gameState.score += question.points || 10;
        input.style.borderColor = 'var(--success-color)';
        input.style.background = '#ECFDF5';
        feedback.innerHTML = '<div class="feedback correct-feedback"><span class="feedback-icon">✅</span><span>Correct!</span></div>';
    } else {
        gameState.lives--;
        input.style.borderColor = 'var(--error-color)';
        input.style.background = '#FEF2F2';
        feedback.innerHTML = '<div class="feedback wrong-feedback"><span class="feedback-icon">❌</span><span>Incorrect! The answer is: ' + question.correct_answer + '</span></div>';
        updateLives();
    }
    
    if (question.explanation) {
        feedback.innerHTML += '<div class="explanation">' + question.explanation + '</div>';
    }
    
    sendScoreUpdate();
    
    setTimeout(() => {
        if (gameState.lives <= 0) {
            endGame();
            return;
        }
        gameState.currentQuestion++;
        gameState.answered = false;
        renderGame();
    }, 2000);
}

function updateStats() {
    const scoreEl = document.getElementById('score');
    const oldScore = parseInt(scoreEl.textContent) || 0;
    if (gameState.score !== oldScore) {
        scoreEl.classList.add('score-pop');
        setTimeout(() => scoreEl.classList.remove('score-pop'), 300);
    }
    scoreEl.textContent = gameState.score;
    
    const hearts = '❤️'.repeat(gameState.lives) + '🖤'.repeat(Math.max(0, 3 - gameState.lives));
    document.getElementById('lives').textContent = hearts;
    
    const progress = ((gameState.currentQuestion) / (gameState.content.questions.length || 1)) * 100;
    document.getElementById('progress-fill').style.width = progress + '%%';
}

let timerInterval;
function startTimer() {
    if (gameState.ruleset.time_limit > 0) {
        let timeLeft = gameState.ruleset.time_limit;
        timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft %% 60;
            document.getElementById('timer').textContent = 'Time: ' + minutes + ':' + seconds.toString().padStart(2, '0');
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                endGame();
            }
        }, 1000);
    }
}

function sendScoreUpdate() {
    window.parent.postMessage({
        type: 'GAME_SCORE',
        score: gameState.score,
        lives: gameState.lives,
        currentQuestion: gameState.currentQuestion
    }, '*');
}

function endGame() {
    clearInterval(timerInterval);
    const totalTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    const totalQuestions = gameState.content.questions.length;
    const accuracy = totalQuestions > 0 ? Math.round((gameState.currentQuestion / totalQuestions) * 100) : 0;
    const passed = gameState.score >= (gameState.ruleset.passing_score || 70);
    
    window.parent.postMessage({
        type: 'GAME_END',
        score: gameState.score,
        totalTime: totalTime,
        passed: passed,
        questionsAnswered: gameState.currentQuestion
    }, '*');
    
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime %% 60;
    const container = document.getElementById('game-content');
    
    const stars = gameState.score >= 100 ? '⭐⭐⭐' : (gameState.score >= 50 ? '⭐⭐' : (gameState.score > 0 ? '⭐' : ''));
    const resultClass = passed ? 'result-passed' : 'result-failed';
    const emoji = passed ? '🎉' : '💪';
    const title = passed ? 'Great Job!' : 'Keep Practicing!';
    const subtitle = passed ? 'You passed the quiz!' : 'You can do better next time!';
    
    container.innerHTML = '<div class="game-over animate-in ' + resultClass + '">' +
        '<div class="result-emoji">' + emoji + '</div>' +
        '<h2 class="result-title">' + title + '</h2>' +
        '<p class="result-subtitle">' + subtitle + '</p>' +
        '<div class="stars-container">' + stars + '</div>' +
        '<div class="stats-grid">' +
            '<div class="stat-box"><div class="stat-value">' + gameState.score + '</div><div class="stat-label">Score</div></div>' +
            '<div class="stat-box"><div class="stat-value">' + minutes + ':' + seconds.toString().padStart(2, '0') + '</div><div class="stat-label">Time</div></div>' +
            '<div class="stat-box"><div class="stat-value">' + gameState.currentQuestion + '/' + totalQuestions + '</div><div class="stat-label">Questions</div></div>' +
            '<div class="stat-box"><div class="stat-value">' + accuracy + '%%</div><div class="stat-label">Progress</div></div>' +
        '</div>' +
    '</div>';
}

window.addEventListener('load', initGame);
`, template, template)

	return jsContent
}

// generateStyles creates the CSS for the game
func (p *GamePackager) generateStyles(game *models.AIGame) string {
	return `/* Buddy Game Styles - Modern & Beautiful */
:root {
    --primary-color: #6366F1;
    --primary-light: #818CF8;
    --primary-dark: #4F46E5;
    --secondary-color: #8B5CF6;
    --accent-color: #10B981;
    --accent-light: #34D399;
    --bg-color: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --card-bg: rgba(255, 255, 255, 0.95);
    --text-color: #1F2937;
    --text-light: #6B7280;
    --error-color: #EF4444;
    --success-color: #10B981;
    --warning-color: #F59E0B;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: var(--bg-color);
    color: #1F2937;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px;
}

#game-container {
    width: 100%;
    max-width: 700px;
    background: var(--card-bg);
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    backdrop-filter: blur(10px);
}

#game-header {
    padding: 24px 28px;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    color: white;
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

#game-title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.5px;
}

.question-counter {
    background: rgba(255,255,255,0.2);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
}

#game-stats {
    display: flex;
    gap: 24px;
    font-size: 15px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.15);
    padding: 8px 14px;
    border-radius: 12px;
    transition: transform 0.2s;
}

.stat-icon {
    font-size: 16px;
}

#progress-container {
    padding: 0 28px;
    background: white;
    padding-top: 16px;
}

#progress-bar {
    height: 6px;
    background: #E5E7EB;
    border-radius: 3px;
    overflow: hidden;
}

#progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-color), var(--accent-light));
    border-radius: 3px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

#game-content {
    flex: 1;
    padding: 28px;
    overflow-y: auto;
    background: #FFFFFF;
    color: #1F2937;
}

.question-card {
    animation: slideIn 0.4s ease-out;
}

.question-number {
    font-size: 13px;
    color: var(--primary-color);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
}

.question-text {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 28px;
    line-height: 1.5;
    color: #1F2937;
}

.options {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.option-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    font-size: 16px;
    border: 2px solid #E5E7EB;
    border-radius: 14px;
    background: #FFFFFF;
    color: #1F2937;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
}

.option-letter {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #E5E7EB;
    color: #374151;
    border-radius: 10px;
    font-weight: 700;
    transition: all 0.25s;
    flex-shrink: 0;
}

.option-text {
    flex: 1;
    line-height: 1.4;
    color: #1F2937;
}

.option-btn:hover:not(:disabled) {
    border-color: var(--primary-light);
    background: #F5F3FF;
    color: #1F2937;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.option-btn:hover:not(:disabled) .option-text {
    color: #1F2937;
}

.option-btn:hover:not(:disabled) .option-letter {
    background: var(--primary-color);
    color: white;
}

.option-btn:disabled {
    cursor: not-allowed;
    opacity: 0.85;
}

.option-btn.correct {
    border-color: var(--success-color);
    background: #ECFDF5;
    color: #1F2937;
    animation: pulse-success 0.5s;
}

.option-btn.correct .option-text {
    color: #1F2937;
}

.option-btn.correct .option-letter {
    background: var(--success-color);
    color: white;
}

.option-btn.wrong {
    border-color: var(--error-color);
    background: #FEF2F2;
    color: #1F2937;
    animation: shake 0.5s;
}

.option-btn.wrong .option-text {
    color: #1F2937;
}

.option-btn.wrong .option-letter {
    background: var(--error-color);
    color: white;
}

.feedback-area {
    margin-top: 20px;
    min-height: 60px;
}

.feedback {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    border-radius: 12px;
    font-weight: 600;
    animation: fadeIn 0.3s;
}

.correct-feedback {
    background: #ECFDF5;
    color: #065F46;
    border: 1px solid #A7F3D0;
}

.wrong-feedback {
    background: #FEF2F2;
    color: #991B1B;
    border: 1px solid #FECACA;
}

.feedback-icon {
    font-size: 20px;
}

.explanation {
    margin-top: 12px;
    padding: 14px 18px;
    background: #F9FAFB;
    border-radius: 12px;
    font-size: 14px;
    color: var(--text-light);
    line-height: 1.6;
    border-left: 4px solid var(--primary-color);
    animation: fadeIn 0.4s 0.2s both;
}

/* Flashcard Styles */
.flashcard {
    width: 100%;
    height: 320px;
    position: relative;
    cursor: pointer;
    margin-bottom: 20px;
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.flashcard.flipped {
    transform: rotateY(180deg);
}

.flashcard-front,
.flashcard-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    padding: 40px;
    font-size: 22px;
    font-weight: 500;
    text-align: center;
    line-height: 1.5;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.flashcard-front {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    color: white;
}

.flashcard-back {
    background: linear-gradient(135deg, var(--secondary-color), #7C3AED);
    color: white;
    transform: rotateY(180deg);
}

.next-btn, button.submit-btn {
    width: 100%;
    padding: 16px;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.25s;
    margin-top: 16px;
}

.next-btn:hover, button.submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
}

.answer-input {
    width: 100%;
    padding: 16px 20px;
    font-size: 17px;
    border: 2px solid #E5E7EB;
    border-radius: 12px;
    margin-bottom: 12px;
    transition: all 0.25s;
}

.answer-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

/* Game Over Styles */
.game-over {
    text-align: center;
    padding: 40px 20px;
}

.result-emoji {
    font-size: 72px;
    margin-bottom: 16px;
    animation: bounce 1s ease-in-out;
}

.result-title {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 8px;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.result-subtitle {
    font-size: 16px;
    color: var(--text-light);
    margin-bottom: 20px;
}

.stars-container {
    font-size: 36px;
    margin-bottom: 28px;
    animation: fadeIn 0.5s 0.3s both;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    max-width: 400px;
    margin: 0 auto;
}

.stat-box {
    background: #F9FAFB;
    padding: 20px;
    border-radius: 16px;
    animation: fadeIn 0.4s ease-out both;
}

.stat-box:nth-child(1) { animation-delay: 0.1s; }
.stat-box:nth-child(2) { animation-delay: 0.2s; }
.stat-box:nth-child(3) { animation-delay: 0.3s; }
.stat-box:nth-child(4) { animation-delay: 0.4s; }

.stat-value {
    font-size: 28px;
    font-weight: 800;
    color: var(--primary-color);
    margin-bottom: 4px;
}

.stat-label {
    font-size: 13px;
    color: var(--text-light);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.result-passed .stat-value {
    color: var(--success-color);
}

.result-failed .stat-value {
    color: var(--warning-color);
}

/* Animations */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-8px); }
    40%, 80% { transform: translateX(8px); }
}

@keyframes pulse-success {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-20px); }
    60% { transform: translateY(-10px); }
}

.animate-in {
    animation: slideIn 0.4s ease-out;
}

.score-pop {
    animation: pulse-success 0.3s;
}

.shake {
    animation: shake 0.5s;
}

/* Responsive */
@media (max-width: 600px) {
    #game-container {
        border-radius: 20px;
    }
    
    #game-header {
        padding: 20px;
    }
    
    #game-title {
        font-size: 18px;
    }
    
    #game-stats {
        gap: 12px;
        font-size: 13px;
    }
    
    .stat-item {
        padding: 6px 10px;
    }
    
    #game-content {
        padding: 20px;
    }
    
    .question-text {
        font-size: 18px;
    }
    
    .option-btn {
        padding: 14px 16px;
        font-size: 15px;
    }
    
    .option-letter {
        width: 32px;
        height: 32px;
        font-size: 14px;
    }
    
    .stats-grid {
        gap: 12px;
    }
    
    .stat-value {
        font-size: 24px;
    }
}
`
}

// addFileToZip adds a file to ZIP archive
func (p *GamePackager) addFileToZip(zipWriter *zip.Writer, sourcePath, zipPath string) error {
	file, err := os.Open(sourcePath)
	if err != nil {
		return err
	}
	defer file.Close()

	writer, err := zipWriter.Create(zipPath)
	if err != nil {
		return err
	}

	_, err = io.Copy(writer, file)
	return err
}

// calculateFileHash calculates SHA-256 hash
func (p *GamePackager) calculateFileHash(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

// GetBundlePath returns the path to a game's bundle
func (p *GamePackager) GetBundlePath(gameID string) string {
	return filepath.Join(p.uploadDir, "games", gameID, fmt.Sprintf("game-%s.zip", gameID))
}

// BundleExists checks if a bundle exists
func (p *GamePackager) BundleExists(gameID string) bool {
	path := p.GetBundlePath(gameID)
	_, err := os.Stat(path)
	return err == nil
}

// signBundle creates HMAC-SHA256 signature for a bundle
func (p *GamePackager) signBundle(filePath string) string {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return ""
	}
	
	h := hmac.New(sha256.New, []byte(p.bundleSecret))
	h.Write(data)
	return hex.EncodeToString(h.Sum(nil))
}

// VerifyBundle verifies bundle integrity
func (p *GamePackager) VerifyBundle(filePath, expectedHash, expectedSignature string) bool {
	// Verify hash
	actualHash, err := p.calculateFileHash(filePath)
	if err != nil || actualHash != expectedHash {
		return false
	}

	// Verify signature
	actualSignature := p.signBundle(filePath)
	return hmac.Equal([]byte(actualSignature), []byte(expectedSignature))
}

// DeleteBundle removes a game bundle
func (p *GamePackager) DeleteBundle(gameID string) error {
	gameDir := filepath.Join(p.uploadDir, "games", gameID)
	return os.RemoveAll(gameDir)
}
