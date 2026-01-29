package api

import "fmt"

// UserService handles user-related API calls
type UserService struct {
	client *Client
}

// NewUserService creates a new user service
func NewUserService(client *Client) *UserService {
	return &UserService{client: client}
}

// GetMyStats gets the current user's statistics
func (s *UserService) GetMyStats() (interface{}, error) {
	var stats interface{}
	err := s.client.Get("/users/me/stats", &stats)
	if err != nil {
		return nil, fmt.Errorf("failed to get user stats: %w", err)
	}
	return stats, nil
}

// GetMyProfile gets the current user's profile
func (s *UserService) GetMyProfile() (interface{}, error) {
	var profile interface{}
	err := s.client.Get("/users/me/profile", &profile)
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile: %w", err)
	}
	return profile, nil
}

// UpdateMyProfile updates the current user's profile
func (s *UserService) UpdateMyProfile(data map[string]interface{}) (interface{}, error) {
	var profile interface{}
	err := s.client.Put("/users/me/profile", data, &profile)
	if err != nil {
		return nil, fmt.Errorf("failed to update user profile: %w", err)
	}
	return profile, nil
}

// AddXP adds XP to the current user
func (s *UserService) AddXP(amount int) (interface{}, error) {
	var result interface{}
	err := s.client.Post("/users/me/xp", map[string]interface{}{"amount": amount}, &result)
	if err != nil {
		return nil, fmt.Errorf("failed to add XP: %w", err)
	}
	return result, nil
}

// GetProfile gets a user's public profile by ID
func (s *UserService) GetProfile(userID string) (interface{}, error) {
	var profile interface{}
	err := s.client.Get(fmt.Sprintf("/users/%s/profile", userID), &profile)
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile: %w", err)
	}
	return profile, nil
}

// GetUserStats gets a user's stats by ID
func (s *UserService) GetUserStats(userID string) (interface{}, error) {
	var stats interface{}
	err := s.client.Get(fmt.Sprintf("/users/%s/stats", userID), &stats)
	if err != nil {
		return nil, fmt.Errorf("failed to get user stats: %w", err)
	}
	return stats, nil
}

// GetChildren gets all children for the current parent user
func (s *UserService) GetChildren() ([]interface{}, error) {
	var children []interface{}
	err := s.client.Get("/users/me/children", &children)
	if err != nil {
		return nil, fmt.Errorf("failed to get children: %w", err)
	}
	return children, nil
}

// CreateChildRequest represents a request to create a child account
type CreateChildRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Age      int    `json:"age"`
}

// CreateChild creates a new student account linked to the current parent
func (s *UserService) CreateChild(req CreateChildRequest) (interface{}, error) {
	var child interface{}
	err := s.client.Post("/users/me/children", req, &child)
	if err != nil {
		return nil, fmt.Errorf("failed to create child: %w", err)
	}
	return child, nil
}
