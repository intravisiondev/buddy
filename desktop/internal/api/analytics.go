package api

import (
	"fmt"
	"io"
)

// AnalyticsService handles analytics API calls
type AnalyticsService struct {
	client *Client
}

// NewAnalyticsService creates a new analytics service
func NewAnalyticsService(client *Client) *AnalyticsService {
	return &AnalyticsService{client: client}
}

// GetGameStats returns statistics for a specific game
func (s *AnalyticsService) GetGameStats(gameID string) (interface{}, error) {
	var stats interface{}
	path := fmt.Sprintf("/games/%s/stats", gameID)
	if err := s.client.Get(path, &stats); err != nil {
		return nil, err
	}
	return stats, nil
}

// GetRoomAnalytics returns analytics for all games in a room
func (s *AnalyticsService) GetRoomAnalytics(roomID string) (interface{}, error) {
	var analytics interface{}
	path := fmt.Sprintf("/rooms/%s/analytics", roomID)
	if err := s.client.Get(path, &analytics); err != nil {
		return nil, err
	}
	return analytics, nil
}

// ExportCSV exports analytics as CSV
func (s *AnalyticsService) ExportCSV(roomID string) ([]byte, error) {
	path := fmt.Sprintf("/rooms/%s/analytics/export", roomID)
	
	// Use raw HTTP for file download
	fullURL := s.client.baseURL + path
	resp, err := s.client.httpClient.Get(fullURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("failed to export CSV: status %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}
