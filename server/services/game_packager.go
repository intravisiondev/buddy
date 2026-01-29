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
	Path     string
	Hash     string
	Manifest GameManifest
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
		Path:     zipPath,
		Hash:     hash,
		Manifest: manifest,
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
	// Strict CSP policy
	csp := "default-src 'self'; " +
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
		"style-src 'self' 'unsafe-inline'; " +
		"img-src 'self' data: blob:; " +
		"font-src 'self' data:; " +
		"connect-src 'self' ws://localhost:8080 wss://localhost:8080 http://localhost:8080; " +
		"frame-ancestors 'none'; " +
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
            <h1 id="game-title">%s</h1>
            <div id="game-stats">
                <span id="score">Score: 0</span>
                <span id="timer">Time: 0:00</span>
                <span id="lives">Lives: 3</span>
            </div>
        </div>
        <div id="game-content"></div>
        <div id="game-footer">
            <div id="progress-bar">
                <div id="progress-fill"></div>
            </div>
        </div>
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
    ruleset: null
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
    const optionsHTML = question.options ? question.options.map((opt, i) =>
        '<button class="option-btn" onclick="selectAnswer(\'' + opt + '\')">' + opt + '</button>'
    ).join('') : '';
    
    container.innerHTML = '<div class="question-card"><h2 class="question-text">' + question.question + '</h2><div class="options">' + optionsHTML + '</div></div>';
}

function renderFlashcards(container) {
    if (!gameState.content.questions || gameState.currentQuestion >= gameState.content.questions.length) {
        endGame();
        return;
    }
    
    const card = gameState.content.questions[gameState.currentQuestion];
    container.innerHTML = '<div class="flashcard" onclick="this.classList.toggle(\'flipped\')"><div class="flashcard-front"><p>' + card.question + '</p></div><div class="flashcard-back"><p>' + card.correct_answer + '</p></div></div><button class="next-btn" onclick="nextCard()">Next Card</button>';
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
    container.innerHTML = '<div class="question-card"><p class="question-text">' + question.question + '</p><input type="text" id="answer-input" class="answer-input" placeholder="Type your answer"><button onclick="checkFillBlankAnswer()">Submit</button></div>';
}

function renderMatching(container) {
    container.innerHTML = '<p>Matching game coming soon...</p>';
}

function selectAnswer(answer) {
    const question = gameState.content.questions[gameState.currentQuestion];
    const isCorrect = answer === question.correct_answer;
    
    if (isCorrect) {
        gameState.score += question.points || 10;
        if (gameState.ruleset.bonus_points && gameState.ruleset.bonus_points.speed_bonus) {
            const timeElapsed = (Date.now() - gameState.startTime) / 1000;
            if (timeElapsed < 10) {
                gameState.score += gameState.ruleset.bonus_points.speed_bonus;
            }
        }
    } else {
        gameState.lives--;
        if (gameState.ruleset.penalties && gameState.ruleset.penalties.wrong_answer) {
            gameState.score += gameState.ruleset.penalties.wrong_answer;
        }
    }
    
    sendScoreUpdate();
    
    if (gameState.lives <= 0) {
        endGame();
        return;
    }
    
    gameState.currentQuestion++;
    renderGame();
}

function nextCard() {
    gameState.currentQuestion++;
    gameState.score += 5;
    sendScoreUpdate();
    renderGame();
}

function checkFillBlankAnswer() {
    const input = document.getElementById('answer-input');
    const answer = input.value.trim().toLowerCase();
    const question = gameState.content.questions[gameState.currentQuestion];
    const isCorrect = answer === question.correct_answer.toLowerCase();
    
    selectAnswer(isCorrect ? question.correct_answer : answer);
}

function updateStats() {
    document.getElementById('score').textContent = 'Score: ' + gameState.score;
    document.getElementById('lives').textContent = 'Lives: ' + gameState.lives;
    
    const progress = ((gameState.currentQuestion + 1) / (gameState.content.questions.length || 1)) * 100;
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
    const emoji = passed ? '🎉' : '😔';
    const message = passed ? 'Congratulations!' : 'Try Again!';
    const container = document.getElementById('game-content');
    
    container.innerHTML = '<div class="game-over"><h2>' + emoji + ' ' + message + '</h2><p>Final Score: ' + gameState.score + '</p><p>Time: ' + minutes + ':' + seconds.toString().padStart(2, '0') + '</p><p>Questions: ' + gameState.currentQuestion + '/' + gameState.content.questions.length + '</p></div>';
}

window.addEventListener('load', initGame);
`, template, template)

	return jsContent
}

// generateStyles creates the CSS for the game
func (p *GamePackager) generateStyles(game *models.AIGame) string {
	return `/* Buddy Game Styles */
:root {
    --primary-color: #3B82F6;
    --secondary-color: #8B5CF6;
    --accent-color: #10B981;
    --bg-color: #F9FAFB;
    --text-color: #1F2937;
    --error-color: #EF4444;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: var(--bg-color);
    color: var(--text-color);
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

#game-container {
    width: 100%;
    max-width: 800px;
    height: 90vh;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

#game-header {
    padding: 20px;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
}

#game-title {
    font-size: 24px;
    margin-bottom: 10px;
}

#game-stats {
    display: flex;
    gap: 20px;
    font-size: 14px;
}

#game-content {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
}

#game-footer {
    padding: 20px;
    background: #f3f4f6;
}

#progress-bar {
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
}

#progress-fill {
    height: 100%;
    background: var(--accent-color);
    transition: width 0.3s ease;
}

.question-card {
    background: white;
    border-radius: 12px;
    padding: 30px;
}

.question-text {
    font-size: 20px;
    margin-bottom: 30px;
    line-height: 1.6;
}

.options {
    display: grid;
    gap: 15px;
}

.option-btn {
    padding: 15px 20px;
    font-size: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
}

.option-btn:hover {
    border-color: var(--primary-color);
    background: #eff6ff;
    transform: translateX(5px);
}

.flashcard {
    width: 100%;
    height: 400px;
    position: relative;
    cursor: pointer;
    margin-bottom: 20px;
    transform-style: preserve-3d;
    transition: transform 0.6s;
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
    border-radius: 12px;
    padding: 40px;
    font-size: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.flashcard-front {
    background: var(--primary-color);
    color: white;
}

.flashcard-back {
    background: var(--secondary-color);
    color: white;
    transform: rotateY(180deg);
}

.next-btn,
button {
    width: 100%;
    padding: 15px;
    font-size: 16px;
    background: var(--accent-color);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
    margin-top: 10px;
}

.next-btn:hover,
button:hover {
    background: #059669;
}

.answer-input {
    width: 100%;
    padding: 15px;
    font-size: 18px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 20px;
}

.answer-input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.game-over {
    text-align: center;
    padding: 40px;
}

.game-over h2 {
    font-size: 36px;
    margin-bottom: 20px;
}

.game-over p {
    font-size: 20px;
    margin: 10px 0;
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
