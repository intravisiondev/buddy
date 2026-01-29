package handlers

import (
	"net/http"
	"time"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

// SmartPlanHandler handles smart study plan endpoints
type SmartPlanHandler struct {
	smartPlanService *services.SmartPlanService
}

// NewSmartPlanHandler creates a new smart plan handler
func NewSmartPlanHandler(smartPlanService *services.SmartPlanService) *SmartPlanHandler {
	return &SmartPlanHandler{
		smartPlanService: smartPlanService,
	}
}

// GenerateSmartPlanRequest represents the request to generate a smart plan
type GenerateSmartPlanRequest struct {
	Subject     string  `json:"subject" binding:"required"`
	Goals       string  `json:"goals" binding:"required"`
	Description string  `json:"description" binding:"required"`
	WeeklyHours float64 `json:"weekly_hours" binding:"required,min=1"`
	StartDate   string  `json:"start_date" binding:"required"`
	EndDate     string  `json:"end_date" binding:"required"`
}

// GenerateSmartPlan generates a smart study plan using AI
func (h *SmartPlanHandler) GenerateSmartPlan(c *gin.Context) {
	var req GenerateSmartPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	plan, err := h.smartPlanService.GenerateSmartPlan(
		req.Subject,
		req.Goals,
		req.Description,
		req.WeeklyHours,
		req.StartDate,
		req.EndDate,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, plan)
}

// CreateSmartPlanRequest represents the request to create a smart plan
type CreateSmartPlanRequest struct {
	Name           string                              `json:"name" binding:"required"`
	Description    string                              `json:"description"`
	Subject        string                              `json:"subject" binding:"required"`
	StartDate      string                              `json:"start_date" binding:"required"`
	EndDate        string                              `json:"end_date" binding:"required"`
	ScheduleBlocks []services.ScheduleBlockPreview     `json:"schedule_blocks"`
	Milestones     []services.MilestonePreview         `json:"milestones"`
}

// CreateSmartPlan creates a study plan from AI-generated data
func (h *SmartPlanHandler) CreateSmartPlan(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	var req CreateSmartPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse dates
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_date format"})
		return
	}

	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_date format"})
		return
	}

	// Create the plan
	planData := services.GeneratedPlanResponse{
		Name:           req.Name,
		Description:    req.Description,
		ScheduleBlocks: req.ScheduleBlocks,
		Milestones:     req.Milestones,
	}

	studyPlan, err := h.smartPlanService.CreateSmartPlan(userID.(string), planData, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, studyPlan)
}
