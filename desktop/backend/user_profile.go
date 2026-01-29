package backend

import (
	"buddy-desktop/internal/api"
	"fmt"
)

// GetMyProfile gets the current user's profile (bio, avatar, grade, school, interests)
func (a *WailsApp) GetMyProfile() (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.User.GetMyProfile()
}

// UpdateMyProfile updates the current user's profile, then emits an event with refreshed profile
func (a *WailsApp) UpdateMyProfile(data map[string]interface{}) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}

	resp, err := a.api.User.UpdateMyProfile(data)
	if err != nil {
		return nil, err
	}

	// Refresh profile and notify frontend (best-effort)
	if profile, err2 := a.api.User.GetMyProfile(); err2 == nil {
		a.EmitEvent("user:profileUpdated", profile)
	}

	return resp, nil
}

// GetChildren gets all children for the current parent user
func (a *WailsApp) GetChildren() ([]interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.User.GetChildren()
}

// CreateChild creates a new student account linked to the current parent
func (a *WailsApp) CreateChild(email, password, name string, age int) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	req := api.CreateChildRequest{
		Email:    email,
		Password: password,
		Name:     name,
		Age:      age,
	}
	return a.api.User.CreateChild(req)
}
