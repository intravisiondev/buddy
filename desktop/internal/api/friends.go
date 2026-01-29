package api

// FriendService handles friend requests and friends list
type FriendService struct {
	client *Client
}

func NewFriendService(client *Client) *FriendService {
	return &FriendService{client: client}
}

func (s *FriendService) SendFriendRequest(toUserID string) error {
	body := map[string]interface{}{"to_user_id": toUserID}
	return s.client.Post("/friends/requests", body, nil)
}

func (s *FriendService) GetIncomingRequests() (interface{}, error) {
	var out interface{}
	if err := s.client.Get("/friends/requests/incoming", &out); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *FriendService) AcceptRequest(id string) error {
	return s.client.Post("/friends/requests/"+id+"/accept", nil, nil)
}

func (s *FriendService) RejectRequest(id string) error {
	return s.client.Post("/friends/requests/"+id+"/reject", nil, nil)
}

func (s *FriendService) GetFriends() (interface{}, error) {
	var out interface{}
	if err := s.client.Get("/friends", &out); err != nil {
		return nil, err
	}
	return out, nil
}

