package backend

import "fmt"

func (a *WailsApp) GetUserProfile(userID string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.User.GetProfile(userID)
}

func (a *WailsApp) GetUserStats(userID string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.User.GetUserStats(userID)
}

