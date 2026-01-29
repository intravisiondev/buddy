package backend

import "fmt"

func (a *WailsApp) SendFriendRequest(toUserID string) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.Friends.SendFriendRequest(toUserID)
}

func (a *WailsApp) GetIncomingFriendRequests() (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Friends.GetIncomingRequests()
}

func (a *WailsApp) AcceptFriendRequest(id string) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.Friends.AcceptRequest(id)
}

func (a *WailsApp) RejectFriendRequest(id string) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.Friends.RejectRequest(id)
}

func (a *WailsApp) GetFriends() (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Friends.GetFriends()
}

