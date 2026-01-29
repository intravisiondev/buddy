package backend

import (
	"buddy-desktop/internal/api"
	"fmt"
)

// UploadFile uploads a file for a room
func (a *WailsApp) UploadFile(roomID, filePath string) (map[string]interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Resource.UploadFile(roomID, filePath)
}

// CreateResource creates a new resource
func (a *WailsApp) CreateResource(roomID string, resource api.Resource) (*api.Resource, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Resource.CreateResource(roomID, resource)
}

// GetResources gets all resources for a room
func (a *WailsApp) GetResources(roomID, uploaderType, category string) ([]api.Resource, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Resource.GetResources(roomID, uploaderType, category)
}

// DeleteResource deletes a resource
func (a *WailsApp) DeleteResource(resourceID string) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.Resource.DeleteResource(resourceID)
}

// ShareResource shares a resource with specific users
func (a *WailsApp) ShareResource(resourceID string, sharedWith []string, isPublic bool) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.Resource.ShareResource(resourceID, sharedWith, isPublic)
}
