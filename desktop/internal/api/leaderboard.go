package api

import (
	"fmt"
)

// LeaderboardEntry matches server/models.LeaderboardEntry plus extra wallet fields if needed later
type LeaderboardEntry struct {
	UserID    string `json:"user_id"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
	TotalXP   int    `json:"total_xp"`
	WeeklyXP  int    `json:"weekly_xp"`
	Level     int    `json:"level"`
	Rank      int    `json:"rank"`
}

type LeaderboardService struct {
	client *Client
}

func NewLeaderboardService(client *Client) *LeaderboardService {
	return &LeaderboardService{client: client}
}

func (s *LeaderboardService) GetLeaderboard(period string, limit int) ([]LeaderboardEntry, error) {
	if period == "" {
		period = "all"
	}
	if limit <= 0 {
		limit = 50
	}
	var out []LeaderboardEntry
	path := fmt.Sprintf("/leaderboard?period=%s&limit=%d", period, limit)
	if err := s.client.Get(path, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// GetMyBadges returns earned badges with metadata (raw map for flexibility)
func (s *LeaderboardService) GetMyBadges() (interface{}, error) {
	var out interface{}
	if err := s.client.Get("/badges/my", &out); err != nil {
		return nil, err
	}
	return out, nil
}

