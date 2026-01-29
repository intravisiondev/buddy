package api

import "time"

// Assignment represents an assignment
type Assignment struct {
	ID             string    `json:"id"`
	RoomID         string    `json:"room_id"`
	TeacherID     string    `json:"teacher_id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	DueDate        time.Time `json:"due_date"`
	TotalPoints    int       `json:"total_points"`
	AssignmentType string    `json:"assignment_type"` // "homework", "quiz", "project", "exam"
	Subjects       []string  `json:"subjects,omitempty"` // Related syllabus topics/subjects (multiple)
	CreatedAt      string    `json:"created_at"`
	UpdatedAt      string    `json:"updated_at"`
}

// AssignmentService handles assignment API calls
type AssignmentService struct {
	client *Client
}

// NewAssignmentService creates a new assignment service
func NewAssignmentService(client *Client) *AssignmentService {
	return &AssignmentService{client: client}
}

// CreateAssignmentRequest represents an assignment creation request
type CreateAssignmentRequest struct {
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	DueDate        string   `json:"due_date"`        // ISO 8601 format
	TotalPoints    int      `json:"total_points"`
	AssignmentType string   `json:"assignment_type"` // "homework", "quiz", "project", "exam"
	Subjects       []string `json:"subjects,omitempty"` // Related syllabus topics/subjects (multiple)
}

// CreateAssignment creates a new assignment
func (s *AssignmentService) CreateAssignment(roomID string, req CreateAssignmentRequest) (*Assignment, error) {
	var assignment Assignment
	err := s.client.Post("/rooms/"+roomID+"/assignments", req, &assignment)
	return &assignment, err
}

// GetAssignments gets all assignments for a room
func (s *AssignmentService) GetAssignments(roomID string) ([]Assignment, error) {
	var assignments []Assignment
	err := s.client.Get("/rooms/"+roomID+"/assignments", &assignments)
	return assignments, err
}

// GetAssignment gets an assignment by ID
func (s *AssignmentService) GetAssignment(assignmentID string) (*Assignment, error) {
	var assignment Assignment
	err := s.client.Get("/assignments/"+assignmentID, &assignment)
	return &assignment, err
}

// UpdateAssignmentRequest represents an assignment update request
type UpdateAssignmentRequest struct {
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	DueDate        string   `json:"due_date"`        // ISO 8601 format
	TotalPoints    int      `json:"total_points"`
	AssignmentType string   `json:"assignment_type"`
	Subjects       []string `json:"subjects,omitempty"` // Related syllabus topics/subjects (multiple)
}

// UpdateAssignment updates an assignment
func (s *AssignmentService) UpdateAssignment(assignmentID string, req UpdateAssignmentRequest) (*Assignment, error) {
	var assignment Assignment
	err := s.client.Put("/assignments/"+assignmentID, req, &assignment)
	return &assignment, err
}

// DeleteAssignment deletes an assignment
func (s *AssignmentService) DeleteAssignment(assignmentID string) error {
	return s.client.Delete("/assignments/" + assignmentID)
}
