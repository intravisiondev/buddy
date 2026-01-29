package backend

import "fmt"

func (a *WailsApp) GetLeaderboard(period string, limit int) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Leaderboard.GetLeaderboard(period, limit)
}

func (a *WailsApp) GetMyBadges() (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Leaderboard.GetMyBadges()
}

