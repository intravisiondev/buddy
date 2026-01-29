package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"buddy-server/models"
	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

// RoomHandler handles room-related endpoints
type RoomHandler struct {
	roomService *services.RoomService
}

// NewRoomHandler creates a new room handler
func NewRoomHandler(roomService *services.RoomService) *RoomHandler {
	return &RoomHandler{
		roomService: roomService,
	}
}

// WeeklyScheduleRequest represents a weekly schedule entry
type WeeklyScheduleRequest struct {
	Day       string `json:"day"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

// CreateRoomRequest represents a room creation request
type CreateRoomRequest struct {
	Name            string                  `json:"name" binding:"required"`
	Subject         string                  `json:"subject" binding:"required"`
	Description     string                  `json:"description"`
	IsPrivate       bool                    `json:"is_private"`
	MaxMembers      int                     `json:"max_members" binding:"required,min=1"`
	TeacherBio      string                  `json:"teacher_bio"`
	Schedule        []WeeklyScheduleRequest `json:"schedule"`
	StartDate       string                  `json:"start_date"`       // ISO 8601 format
	EndDate         string                  `json:"end_date"`         // ISO 8601 format
	RegistrationEnd string                  `json:"registration_end"` // ISO 8601 format
	Syllabus        *models.Syllabus        `json:"syllabus"`         // Structured syllabus
}

// CreateRoom creates a new room
func (h *RoomHandler) CreateRoom(c *gin.Context) {
	userID, _ := c.Get("user_id")
	
	var req CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user info for teacher name
	// (Assuming we have user service or can fetch from context)
	// For now, we'll accept teacher_bio from request

	// Parse dates if provided
	var startDate, endDate, registrationEnd *time.Time
	if req.StartDate != "" {
		if t, err := time.Parse(time.RFC3339, req.StartDate); err == nil {
			startDate = &t
		}
	}
	if req.EndDate != "" {
		if t, err := time.Parse(time.RFC3339, req.EndDate); err == nil {
			endDate = &t
		}
	}
	if req.RegistrationEnd != "" {
		if t, err := time.Parse(time.RFC3339, req.RegistrationEnd); err == nil {
			registrationEnd = &t
		}
	}

	// Convert schedule
	var schedule []models.WeeklySchedule
	for _, s := range req.Schedule {
		schedule = append(schedule, models.WeeklySchedule{
			Day:       s.Day,
			StartTime: s.StartTime,
			EndTime:   s.EndTime,
		})
	}

	room, err := h.roomService.CreateRoomExtended(services.CreateRoomParams{
		Name:            req.Name,
		Subject:         req.Subject,
		Description:     req.Description,
		OwnerID:         userID.(string),
		IsPrivate:       req.IsPrivate,
		MaxMembers:      req.MaxMembers,
		TeacherBio:      req.TeacherBio,
		Schedule:        schedule,
		StartDate:       startDate,
		EndDate:         endDate,
		RegistrationEnd: registrationEnd,
		Syllabus:        req.Syllabus,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, room)
}

// GetRooms gets all rooms (public rooms for students, all rooms for teachers)
func (h *RoomHandler) GetRooms(c *gin.Context) {
	subject := c.Query("subject")
	ownerID := c.Query("owner_id") // For teacher: filter by their own rooms
	
	var isPrivate *bool
	if privateStr := c.Query("is_private"); privateStr != "" {
		val := privateStr == "true"
		isPrivate = &val
	}

	// If owner_id specified, get rooms by owner
	if ownerID != "" {
		rooms, err := h.roomService.GetRoomsByOwner(ownerID, subject, 100)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, rooms)
		return
	}

	// Otherwise get all public rooms
	rooms, err := h.roomService.GetRooms(subject, isPrivate, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rooms)
}

// GetMyRooms gets rooms created by the current user (for teachers)
func (h *RoomHandler) GetMyRooms(c *gin.Context) {
	userID, _ := c.Get("user_id")
	subject := c.Query("subject")

	rooms, err := h.roomService.GetRoomsByOwner(userID.(string), subject, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rooms)
}

// GetRoom gets a room by ID
func (h *RoomHandler) GetRoom(c *gin.Context) {
	roomID := c.Param("id")
	
	room, err := h.roomService.GetRoom(roomID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	c.JSON(http.StatusOK, room)
}

// UpdateRoomExamDatesRequest represents a request to update room exam dates
type UpdateRoomExamDatesRequest struct {
	ExamDates []models.ExamDate `json:"exam_dates" binding:"required"`
}

// UpdateRoomExamDates updates the exam dates of a room (only by owner)
func (h *RoomHandler) UpdateRoomExamDates(c *gin.Context) {
	roomID := c.Param("id")
	userID, _ := c.Get("user_id")

	var req UpdateRoomExamDatesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	room, err := h.roomService.UpdateRoomExamDates(roomID, userID.(string), req.ExamDates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, room)
}

// JoinRoom joins a room
func (h *RoomHandler) JoinRoom(c *gin.Context) {
	roomID := c.Param("id")
	userID, _ := c.Get("user_id")

	err := h.roomService.JoinRoom(roomID, userID.(string), "member")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Joined room successfully"})
}

// UpdateRoomSyllabusRequest represents a request to update room syllabus
type UpdateRoomSyllabusRequest struct {
	Syllabus *models.Syllabus `json:"syllabus" binding:"required"`
}

// UpdateRoomSyllabus updates the syllabus of a room (only by owner)
func (h *RoomHandler) UpdateRoomSyllabus(c *gin.Context) {
	roomID := c.Param("id")
	userID, _ := c.Get("user_id")

	// Read raw JSON to handle syllabus field flexibly
	var rawBody map[string]interface{}
	if err := c.ShouldBindJSON(&rawBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format: " + err.Error()})
		return
	}

	// Extract and decode syllabus field
	var syllabus *models.Syllabus
	if syllabusRaw, ok := rawBody["syllabus"]; ok {
		// If syllabus is a string (legacy), ignore it
		if _, ok := syllabusRaw.(string); ok {
			syllabus = &models.Syllabus{Items: []models.SyllabusItem{}}
		} else {
			// Try to decode as structured syllabus
			syllabusBytes, err := json.Marshal(syllabusRaw)
			if err == nil {
				var s models.Syllabus
				if err := json.Unmarshal(syllabusBytes, &s); err == nil {
					syllabus = &s
				}
			}
		}
	}

	// Ensure items is not nil
	if syllabus == nil {
		syllabus = &models.Syllabus{Items: []models.SyllabusItem{}}
	} else if syllabus.Items == nil {
		syllabus.Items = []models.SyllabusItem{}
	}

	room, err := h.roomService.UpdateRoomSyllabus(roomID, userID.(string), syllabus)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, room)
}

// GetRoomMembers gets members of a room with user details
func (h *RoomHandler) GetRoomMembers(c *gin.Context) {
	roomID := c.Param("id")

	members, err := h.roomService.GetRoomMembers(roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, members)
}

// CheckMembership checks if current user is a member of a room
func (h *RoomHandler) CheckMembership(c *gin.Context) {
	roomID := c.Param("id")
	userID, _ := c.Get("user_id")

	isMember, err := h.roomService.IsMember(roomID, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"is_member": isMember})
}

// SendMessageRequest represents a message sending request
type SendMessageRequest struct {
	Content     string `json:"content" binding:"required"`
	MessageType string `json:"message_type"`
	FileURL     string `json:"file_url"`
}

// SendMessage sends a message to a room
func (h *RoomHandler) SendMessage(c *gin.Context) {
	roomID := c.Param("id")
	userID, _ := c.Get("user_id")

	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.MessageType == "" {
		req.MessageType = "text"
	}

	message, err := h.roomService.SendMessage(
		roomID,
		userID.(string),
		req.Content,
		req.MessageType,
		req.FileURL,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, message)
}

// GetMessages gets messages from a room
func (h *RoomHandler) GetMessages(c *gin.Context) {
	roomID := c.Param("id")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	messages, err := h.roomService.GetMessages(roomID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messages)
}

// TrainRoomAI trains the room's AI with selected resources
func (h *RoomHandler) TrainRoomAI(c *gin.Context) {
	roomID := c.Param("id")
	
	var req struct {
		ResourceIDs []string `json:"resource_ids" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	context, err := h.roomService.TrainRoomAI(roomID, req.ResourceIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, context)
}

// ChatWithRoomAI sends a message to the room's AI
func (h *RoomHandler) ChatWithRoomAI(c *gin.Context) {
	roomID := c.Param("id")
	
	var req struct {
		Message string `json:"message" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	response, err := h.roomService.ChatWithRoomAI(roomID, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"response": response})
}

// GetRoomAIStatus gets the AI training status for a room
func (h *RoomHandler) GetRoomAIStatus(c *gin.Context) {
	roomID := c.Param("id")
	
	status, err := h.roomService.GetRoomAIStatus(roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, status)
}
