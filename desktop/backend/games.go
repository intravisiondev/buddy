package backend

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
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

// DownloadGameBundle downloads a game bundle, extracts it, and returns the URL to load the game in an iframe
func (a *WailsApp) DownloadGameBundle(gameID string) (string, error) {
	if a.authToken == "" {
		return "", fmt.Errorf("not authenticated")
	}

	// Download bundle
	bundleData, err := a.api.Game.DownloadBundle(gameID)
	if err != nil {
		return "", err
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	gamesDir := filepath.Join(homeDir, ".buddy", "games", gameID)
	extractedDir := filepath.Join(gamesDir, "extracted")
	if err := os.MkdirAll(extractedDir, 0755); err != nil {
		return "", err
	}

	// Save zip temporarily
	bundlePath := filepath.Join(gamesDir, fmt.Sprintf("game-%s.zip", gameID))
	if err := os.WriteFile(bundlePath, bundleData, 0644); err != nil {
		return "", err
	}

	// Extract zip to extracted/
	f, err := os.Open(bundlePath)
	if err != nil {
		return "", fmt.Errorf("open zip: %w", err)
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		return "", err
	}
	reader, err := zip.NewReader(f, info.Size())
	if err != nil {
		return "", fmt.Errorf("read zip: %w", err)
	}
	for _, f := range reader.File {
		name := filepath.Join(extractedDir, filepath.Clean(f.Name))
		rel, err := filepath.Rel(extractedDir, name)
		if err != nil || strings.Contains(rel, "..") {
			continue // skip path traversal
		}
		if f.FileInfo().IsDir() {
			os.MkdirAll(name, 0755)
			continue
		}
		if err := os.MkdirAll(filepath.Dir(name), 0755); err != nil {
			return "", err
		}
		out, err := os.OpenFile(name, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			return "", err
		}
		rc, err := f.Open()
		if err != nil {
			out.Close()
			return "", err
		}
		_, err = io.Copy(out, rc)
		out.Close()
		rc.Close()
		if err != nil {
			return "", err
		}
	}

	// Return URL for local game server (iframe can load this; file:// is blocked by WebView)
	return GameServerURL() + "/game/" + gameID + "/", nil
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
