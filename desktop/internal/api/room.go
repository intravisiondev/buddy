package api

import "time"

// WeeklySchedule represents a weekly class schedule
type WeeklySchedule struct {
	Day       string `json:"day"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

// RoomService handles room API calls
type RoomService struct {
	client *Client
}

// NewRoomService creates a new room service
func NewRoomService(client *Client) *RoomService {
	return &RoomService{client: client}
}

// Room represents a room
type Room struct {
	ID              string           `json:"id"`
	Name            string           `json:"name"`
	Subject         string           `json:"subject"`
	Description     string           `json:"description"`
	OwnerID         string           `json:"owner_id"`
	IsPrivate       bool             `json:"is_private"`
	MaxMembers      int              `json:"max_members"`
	IsLive          bool             `json:"is_live"`
	TeacherName     string           `json:"teacher_name,omitempty"`
	TeacherBio      string           `json:"teacher_bio,omitempty"`
	Schedule        []WeeklySchedule `json:"schedule,omitempty"`
	StartDate       *time.Time       `json:"start_date,omitempty"`
	EndDate         *time.Time       `json:"end_date,omitempty"`
	RegistrationEnd *time.Time       `json:"registration_end,omitempty"`
	Syllabus        *Syllabus        `json:"syllabus,omitempty"`
	ExamDates       []ExamDate       `json:"exam_dates,omitempty"`
	CreatedAt       string           `json:"created_at"`
	UpdatedAt       string           `json:"updated_at"`
}

// Message represents a chat message
type Message struct {
	ID          string `json:"id"`
	RoomID      string `json:"room_id"`
	UserID      string `json:"user_id"`
	Content     string `json:"content"`
	MessageType string `json:"message_type"`
	FileURL     string `json:"file_url,omitempty"`
	CreatedAt   string `json:"created_at"`
}

// SyllabusItem represents a topic in the syllabus
type SyllabusItem struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Order       int    `json:"order"`
}

// Syllabus represents the course syllabus structure
type Syllabus struct {
	Description string         `json:"description,omitempty"`
	Items       []SyllabusItem `json:"items,omitempty"`
}

// ExamDate represents an exam date for a course
type ExamDate struct {
	Title       string    `json:"title"`
	Date        time.Time `json:"date"`
	Description string    `json:"description,omitempty"`
	Subject     string    `json:"subject,omitempty"`
}

// CreateRoomRequest represents a room creation request
type CreateRoomRequest struct {
	Name        string    `json:"name"`
	Subject     string    `json:"subject"`
	Description string    `json:"description"`
	IsPrivate   bool      `json:"is_private"`
	MaxMembers  int       `json:"max_members"`
	TeacherBio  string    `json:"teacher_bio,omitempty"`
	Syllabus    *Syllabus `json:"syllabus,omitempty"`
}

// GetRooms gets all rooms with optional filters
func (s *RoomService) GetRooms(subject string, ownerID string) ([]Room, error) {
	var rooms []Room
	query := ""
	if subject != "" {
		query += "?subject=" + subject
	}
	if ownerID != "" {
		if query == "" {
			query += "?owner_id=" + ownerID
		} else {
			query += "&owner_id=" + ownerID
		}
	}
	err := s.client.Get("/rooms"+query, &rooms)
	return rooms, err
}

// GetMyRooms gets rooms created by the current user (for teachers)
func (s *RoomService) GetMyRooms(subject string) ([]Room, error) {
	var rooms []Room
	query := ""
	if subject != "" {
		query = "?subject=" + subject
	}
	err := s.client.Get("/rooms/my"+query, &rooms)
	return rooms, err
}

// GetRoom gets a room by ID
func (s *RoomService) GetRoom(roomID string) (*Room, error) {
	var room Room
	err := s.client.Get("/rooms/"+roomID, &room)
	return &room, err
}

// CreateRoom creates a new room
func (s *RoomService) CreateRoom(req CreateRoomRequest) (*Room, error) {
	var room Room
	err := s.client.Post("/rooms", req, &room)
	return &room, err
}

// JoinRoom joins a room
func (s *RoomService) JoinRoom(roomID string) error {
	return s.client.Post("/rooms/"+roomID+"/join", nil, nil)
}

// SendMessage sends a message to a room
func (s *RoomService) SendMessage(roomID, content string) (*Message, error) {
	var message Message
	req := map[string]string{
		"content":      content,
		"message_type": "text",
	}
	err := s.client.Post("/rooms/"+roomID+"/messages", req, &message)
	return &message, err
}

// GetMessages gets messages from a room
func (s *RoomService) GetMessages(roomID string) ([]Message, error) {
	var messages []Message
	err := s.client.Get("/rooms/"+roomID+"/messages", &messages)
	return messages, err
}

// GetRoomMembers gets members of a room
func (s *RoomService) GetRoomMembers(roomID string) (interface{}, error) {
	var members interface{}
	err := s.client.Get("/rooms/"+roomID+"/members", &members)
	return members, err
}

// UpdateRoomSyllabusRequest represents the request body for updating syllabus
type UpdateRoomSyllabusRequest struct {
	Syllabus *Syllabus `json:"syllabus"`
}

// UpdateRoomSyllabus updates the syllabus of a room
func (s *RoomService) UpdateRoomSyllabus(roomID string, syllabus *Syllabus) (*Room, error) {
	var room Room
	// Ensure items is not nil
	if syllabus != nil && syllabus.Items == nil {
		syllabus.Items = []SyllabusItem{}
	}
	// Server expects {syllabus: {...}} format
	requestBody := UpdateRoomSyllabusRequest{
		Syllabus: syllabus,
	}
	err := s.client.Put("/rooms/"+roomID+"/syllabus", requestBody, &room)
	return &room, err
}

// UpdateRoomExamDatesRequest represents the request body for updating exam dates
type UpdateRoomExamDatesRequest struct {
	ExamDates []ExamDate `json:"exam_dates"`
}

// UpdateRoomExamDates updates the exam dates of a room
func (s *RoomService) UpdateRoomExamDates(roomID string, examDates []ExamDate) (*Room, error) {
	var room Room
	requestBody := UpdateRoomExamDatesRequest{
		ExamDates: examDates,
	}
	err := s.client.Put("/rooms/"+roomID+"/exam-dates", requestBody, &room)
	return &room, err
}

// GetRoomAIStatus gets the AI training status for a room
func (s *RoomService) GetRoomAIStatus(roomID string) (map[string]interface{}, error) {
	var status map[string]interface{}
	err := s.client.Get("/rooms/"+roomID+"/ai/status", &status)
	return status, err
}

// TrainRoomAIRequest represents the request to train room AI
type TrainRoomAIRequest struct {
	ResourceIDs []string `json:"resource_ids"`
}

// TrainRoomAI trains the room AI with selected resources
func (s *RoomService) TrainRoomAI(roomID string, resourceIDs []string) error {
	req := TrainRoomAIRequest{
		ResourceIDs: resourceIDs,
	}
	return s.client.Post("/rooms/"+roomID+"/ai/train", req, nil)
}

// ChatWithRoomAIRequest represents a message to the room AI
type ChatWithRoomAIRequest struct {
	Message string `json:"message"`
}

// ChatWithRoomAI sends a message to the room's AI coach
func (s *RoomService) ChatWithRoomAI(roomID string, message string) (map[string]interface{}, error) {
	var response map[string]interface{}
	req := ChatWithRoomAIRequest{
		Message: message,
	}
	err := s.client.Post("/rooms/"+roomID+"/ai/chat", req, &response)
	return response, err
}
