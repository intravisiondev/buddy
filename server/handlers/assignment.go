package handlers

import (
	"net/http"
	"time"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

// AssignmentHandler handles assignment-related endpoints
type AssignmentHandler struct {
	assignmentService *services.AssignmentService
}

// NewAssignmentHandler creates a new assignment handler
func NewAssignmentHandler(assignmentService *services.AssignmentService) *AssignmentHandler {
	return &AssignmentHandler{
		assignmentService: assignmentService,
	}
}

// CreateAssignmentRequest represents an assignment creation request
type CreateAssignmentRequest struct {
	Title          string   `json:"title" binding:"required"`
	Description    string   `json:"description"`
	DueDate        string   `json:"due_date" binding:"required"` // ISO 8601 format
	TotalPoints    int      `json:"total_points"`
	AssignmentType string   `json:"assignment_type" binding:"required"` // "homework", "quiz", "project", "exam"
	Subjects       []string `json:"subjects,omitempty"` // Related syllabus topics/subjects (multiple)
}

// CreateAssignment creates a new assignment
func (h *AssignmentHandler) CreateAssignment(c *gin.Context) {
	roomID := c.Param("id")
	teacherID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	if userRole != "teacher" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only teachers can create assignments"})
		return
	}

	var req CreateAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse due date
	dueDate, err := time.Parse(time.RFC3339, req.DueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due date format. Use ISO 8601 format (e.g., 2024-01-15T14:00:00Z)"})
		return
	}

	assignment, err := h.assignmentService.CreateAssignment(
		roomID,
		teacherID.(string),
		req.Title,
		req.Description,
		dueDate,
		req.TotalPoints,
		req.AssignmentType,
		req.Subjects,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, assignment)
}

// GetAssignments gets all assignments for a room
func (h *AssignmentHandler) GetAssignments(c *gin.Context) {
	roomID := c.Param("id")

	assignments, err := h.assignmentService.GetAssignments(roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignments)
}

// GetAssignment gets an assignment by ID
func (h *AssignmentHandler) GetAssignment(c *gin.Context) {
	assignmentID := c.Param("assignment_id")

	assignment, err := h.assignmentService.GetAssignment(assignmentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assignment not found"})
		return
	}

	c.JSON(http.StatusOK, assignment)
}

// UpdateAssignmentRequest represents an assignment update request
type UpdateAssignmentRequest struct {
	Title          string   `json:"title" binding:"required"`
	Description    string   `json:"description"`
	DueDate        string   `json:"due_date" binding:"required"` // ISO 8601 format
	TotalPoints    int      `json:"total_points"`
	AssignmentType string   `json:"assignment_type" binding:"required"`
	Subjects       []string `json:"subjects,omitempty"` // Related syllabus topics/subjects (multiple)
}

// UpdateAssignment updates an assignment
func (h *AssignmentHandler) UpdateAssignment(c *gin.Context) {
	assignmentID := c.Param("assignment_id")
	teacherID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	if userRole != "teacher" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only teachers can update assignments"})
		return
	}

	var req UpdateAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse due date
	dueDate, err := time.Parse(time.RFC3339, req.DueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due date format. Use ISO 8601 format"})
		return
	}

	assignment, err := h.assignmentService.UpdateAssignment(
		assignmentID,
		teacherID.(string),
		req.Title,
		req.Description,
		dueDate,
		req.TotalPoints,
		req.AssignmentType,
		req.Subjects,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignment)
}

// DeleteAssignment deletes an assignment
func (h *AssignmentHandler) DeleteAssignment(c *gin.Context) {
	assignmentID := c.Param("assignment_id")
	teacherID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	if userRole != "teacher" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only teachers can delete assignments"})
		return
	}

	err := h.assignmentService.DeleteAssignment(assignmentID, teacherID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Assignment deleted successfully"})
}
