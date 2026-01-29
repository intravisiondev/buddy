package backend

import (
	"fmt"
	"os"
	"path/filepath"
)

// ============= Analytics Functions =============

// GetRoomAnalytics returns analytics for a room's games
func (a *WailsApp) GetRoomAnalytics(roomID string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Analytics.GetRoomAnalytics(roomID)
}

// GetGameStats returns statistics for a specific game
func (a *WailsApp) GetGameStats(gameID string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Analytics.GetGameStats(gameID)
}

// ExportAnalyticsCSV exports analytics as CSV file
func (a *WailsApp) ExportAnalyticsCSV(roomID string) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}

	// Download CSV
	csvData, err := a.api.Analytics.ExportCSV(roomID)
	if err != nil {
		return err
	}

	// Save to downloads
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	downloadsDir := filepath.Join(homeDir, "Downloads")
	csvPath := filepath.Join(downloadsDir, fmt.Sprintf("game-analytics-%s.csv", roomID))

	if err := os.WriteFile(csvPath, csvData, 0644); err != nil {
		return err
	}

	return nil
}
