package api

// Resource represents a resource model
type Resource struct {
	ID           string   `json:"id"`
	RoomID       string   `json:"room_id"`
	UploaderID   string   `json:"uploader_id"`
	UploaderType string   `json:"uploader_type"` // "teacher" or "student"
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	FileURL      string   `json:"file_url"`
	FileType     string   `json:"file_type"`
	FileSize     int64    `json:"file_size"`
	Category     string   `json:"category"` // "video", "notes", "assignment", "book", "other"
	Subject      string   `json:"subject,omitempty"` // Legacy: single subject (deprecated)
	Subjects     []string  `json:"subjects,omitempty"` // Related syllabus topics/subjects (multiple)
	IsPublic     bool     `json:"is_public"`
	SharedWith   []string `json:"shared_with,omitempty"`
	CreatedAt    string   `json:"created_at"`
}

// ResourceService handles resource API calls
type ResourceService struct {
	client *Client
}

// NewResourceService creates a new resource service
func NewResourceService(client *Client) *ResourceService {
	return &ResourceService{client: client}
}

// UploadFile uploads a file to the server
func (s *ResourceService) UploadFile(roomID string, filePath string) (map[string]interface{}, error) {
	var result map[string]interface{}
	err := s.client.UploadFile("/rooms/"+roomID+"/resources/upload", filePath, &result)
	return result, err
}

// CreateResource creates a new resource
func (s *ResourceService) CreateResource(roomID string, resource Resource) (*Resource, error) {
	var result Resource
	err := s.client.Post("/rooms/"+roomID+"/resources", resource, &result)
	return &result, err
}

// GetResources gets all resources for a room
func (s *ResourceService) GetResources(roomID, uploaderType, category string) ([]Resource, error) {
	var resources []Resource
	query := "?uploader_type=" + uploaderType
	if category != "" && category != "all" {
		query += "&category=" + category
	}
	err := s.client.Get("/rooms/"+roomID+"/resources"+query, &resources)
	return resources, err
}

// DeleteResource deletes a resource
func (s *ResourceService) DeleteResource(resourceID string) error {
	return s.client.Delete("/resources/" + resourceID)
}

// ShareResource shares a resource with specific users
func (s *ResourceService) ShareResource(resourceID string, sharedWith []string, isPublic bool) error {
	data := map[string]interface{}{
		"shared_with": sharedWith,
		"is_public":   isPublic,
	}
	return s.client.Post("/resources/"+resourceID+"/share", data, nil)
}
