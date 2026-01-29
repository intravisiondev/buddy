package handlers

import (
	"net/http"
	"time"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

// StudyPlanHandler handles study plan endpoints
type StudyPlanHandler struct {
	studyPlanService *services.StudyPlanService
}

// NewStudyPlanHandler creates a new study plan handler
func NewStudyPlanHandler(studyPlanService *services.StudyPlanService) *StudyPlanHandler {
	return &StudyPlanHandler{
		studyPlanService: studyPlanService,
	}
}

// CreateStudyPlanRequest represents a study plan creation request
type CreateStudyPlanRequest struct {
	Name           string  `json:"name" binding:"required"`
	Description    string  `json:"description"`
	StartDate      string  `json:"start_date" binding:"required"`
	EndDate        string  `json:"end_date" binding:"required"`
	DailyGoalHours float64 `json:"daily_goal_hours" binding:"required,min=0"`
	IsChallenge    bool    `json:"is_challenge"`
	IsPublic       bool    `json:"is_public"`
}

// CreateStudyPlan creates a new study plan
func (h *StudyPlanHandler) CreateStudyPlan(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req CreateStudyPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format"})
		return
	}

	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format"})
		return
	}

	plan, err := h.studyPlanService.CreateStudyPlan(
		userID.(string),
		req.Name,
		req.Description,
		startDate,
		endDate,
		req.DailyGoalHours,
		req.IsChallenge,
		req.IsPublic,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, plan)
}

// GetStudyPlans gets all study plans for current user
func (h *StudyPlanHandler) GetStudyPlans(c *gin.Context) {
	userID, _ := c.Get("user_id")

	plans, err := h.studyPlanService.GetStudyPlans(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, plans)
}

// GetPublicStudyPlans gets all public study plans
func (h *StudyPlanHandler) GetPublicStudyPlans(c *gin.Context) {
	plans, err := h.studyPlanService.GetPublicStudyPlans()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, plans)
}

// AddCourseRequest represents a course addition request
type AddCourseRequest struct {
	Subject        string  `json:"subject" binding:"required"`
	HoursAllocated float64 `json:"hours_allocated" binding:"required,min=0"`
}

// AddCourse adds a course to a study plan
func (h *StudyPlanHandler) AddCourse(c *gin.Context) {
	planID := c.Param("id")

	var req AddCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.studyPlanService.AddCourse(planID, req.Subject, req.HoursAllocated)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Course added successfully"})
}

// GetCourses gets courses for a study plan
func (h *StudyPlanHandler) GetCourses(c *gin.Context) {
	planID := c.Param("id")

	courses, err := h.studyPlanService.GetCourses(planID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, courses)
}

// CreateScheduleBlockRequest represents a schedule block creation request
type CreateScheduleBlockRequest struct {
	DayOfWeek int    `json:"day_of_week" binding:"required,min=0,max=6"`
	StartTime string `json:"start_time" binding:"required"` // HH:MM
	EndTime   string `json:"end_time" binding:"required"`   // HH:MM
	Subject   string `json:"subject" binding:"required"`
	Topic     string `json:"topic"`
	BlockType string `json:"block_type"` // "study", "break", "review"
}

// CreateScheduleBlock creates a schedule block for a study plan
func (h *StudyPlanHandler) CreateScheduleBlock(c *gin.Context) {
	planID := c.Param("id")

	var req CreateScheduleBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	block, err := h.studyPlanService.CreateScheduleBlock(
		planID,
		req.DayOfWeek,
		req.StartTime,
		req.EndTime,
		req.Subject,
		req.Topic,
		req.BlockType,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, block)
}

// GetScheduleBlocks gets schedule blocks for a study plan
func (h *StudyPlanHandler) GetScheduleBlocks(c *gin.Context) {
	planID := c.Param("id")

	blocks, err := h.studyPlanService.GetScheduleBlocks(planID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, blocks)
}

// GetUserSchedule gets all schedule blocks for current user
func (h *StudyPlanHandler) GetUserSchedule(c *gin.Context) {
	userID, _ := c.Get("user_id")

	blocks, err := h.studyPlanService.GetUserSchedule(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, blocks)
}

// UpdateScheduleBlock updates a schedule block for a study plan
func (h *StudyPlanHandler) UpdateScheduleBlock(c *gin.Context) {
	planID := c.Param("id")
	blockID := c.Param("block_id")

	var data map[string]interface{}
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	block, err := h.studyPlanService.UpdateScheduleBlock(planID, blockID, data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, block)
}

// UpdateStudyPlanProgressRequest represents a progress update
type UpdateStudyPlanProgressRequest struct {
	Progress float64 `json:"progress" binding:"required,min=0,max=100"`
}

// UpdateStudyPlanProgress updates study plan progress
func (h *StudyPlanHandler) UpdateStudyPlanProgress(c *gin.Context) {
	planID := c.Param("id")

	var req UpdateStudyPlanProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.studyPlanService.UpdateStudyPlanProgress(planID, req.Progress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Progress updated successfully"})
}
