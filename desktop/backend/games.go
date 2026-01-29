package backend

import (
	"fmt"
	"os"
	"path/filepath"
)

// ============= Game Functions =============

// GetGameTemplates returns all available game templates
func (a *WailsApp) GetGameTemplates() (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Game.GetTemplates()
}

// GetGameTemplate returns a specific game template
func (a *WailsApp) GetGameTemplate(templateID string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Game.GetTemplate(templateID)
}

// GenerateGame generates a new AI-powered game
func (a *WailsApp) GenerateGame(roomID string, gameType, subject, difficulty string, questionCount int) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Game.GenerateGame(roomID, gameType, subject, difficulty, questionCount)
}

// GetRoomGames returns all games for a room
func (a *WailsApp) GetRoomGames(roomID string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Game.GetRoomGames(roomID)
}

// GetGame returns a specific game
func (a *WailsApp) GetGame(gameID string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Game.GetGame(gameID)
}

// DownloadGameBundle downloads a game bundle and returns the local path
func (a *WailsApp) DownloadGameBundle(gameID string) (string, error) {
	if a.authToken == "" {
		return "", fmt.Errorf("not authenticated")
	}

	// Download bundle
	bundleData, err := a.api.Game.DownloadBundle(gameID)
	if err != nil {
		return "", err
	}

	// Create local games directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	
	gamesDir := filepath.Join(homeDir, ".buddy", "games", gameID)
	if err := os.MkdirAll(gamesDir, 0755); err != nil {
		return "", err
	}

	// Save bundle
	bundlePath := filepath.Join(gamesDir, fmt.Sprintf("game-%s.zip", gameID))
	if err := os.WriteFile(bundlePath, bundleData, 0644); err != nil {
		return "", err
	}

	// Return path to bundle (frontend will handle extraction/rendering)
	return bundlePath, nil
}

// PlayGame submits game answers
func (a *WailsApp) PlayGame(gameID string, answers []string, timeSpent int) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Game.PlayGame(gameID, answers, timeSpent)
}

// GetGameResults returns student's results for a game
func (a *WailsApp) GetGameResults(gameID string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Game.GetGameResults(gameID)
}
