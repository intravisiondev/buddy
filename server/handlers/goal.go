package handlers

import (
	"net/http"
	"time"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

// GoalHandler handles goal-related endpoints
type GoalHandler struct {
	goalService           *services.GoalService
	goalSuggestionService *services.GoalSuggestionService
}

// NewGoalHandler creates a new goal handler
func NewGoalHandler(goalService *services.GoalService, goalSuggestionService *services.GoalSuggestionService) *GoalHandler {
	return &GoalHandler{
		goalService:           goalService,
		goalSuggestionService: goalSuggestionService,
	}
}

// CreateGoalRequest represents a goal creation request
type CreateGoalRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Subject     string `json:"subject"`
	DueDate     string `json:"due_date" binding:"required"` // ISO 8601
	Priority    string `json:"priority"`                     // "high", "medium", "low"
	StudyPlanID string `json:"study_plan_id"`
}

// CreateGoal creates a new goal
func (h *GoalHandler) CreateGoal(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req CreateGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse due date
	dueDate, err := time.Parse(time.RFC3339, req.DueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due date format"})
		return
	}

	var planID *string
	if req.StudyPlanID != "" {
		planID = &req.StudyPlanID
	}

	goal, err := h.goalService.CreateGoal(
		userID.(string),
		req.Title,
		req.Description,
		req.Subject,
		dueDate,
		req.Priority,
		planID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, goal)
}

// GetTodayGoals gets today's goals for the user
func (h *GoalHandler) GetTodayGoals(c *gin.Context) {
	userID, _ := c.Get("user_id")

	goals, err := h.goalService.GetTodayGoals(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, goals)
}

// GetGoals gets goals for the user with filters
func (h *GoalHandler) GetGoals(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var completed *bool
	if completedStr := c.Query("completed"); completedStr != "" {
		val := completedStr == "true"
		completed = &val
	}

	var studyPlanID *string
	if planID := c.Query("study_plan_id"); planID != "" {
		studyPlanID = &planID
	}

	goals, err := h.goalService.GetGoals(userID.(string), completed, studyPlanID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, goals)
}

// ToggleGoalComplete toggles goal completion
func (h *GoalHandler) ToggleGoalComplete(c *gin.Context) {
	goalID := c.Param("id")
	userID, _ := c.Get("user_id")

	err := h.goalService.ToggleGoalComplete(goalID, userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Goal toggled successfully"})
}

// DeleteGoal deletes a goal
func (h *GoalHandler) DeleteGoal(c *gin.Context) {
	goalID := c.Param("id")
	userID, _ := c.Get("user_id")

	err := h.goalService.DeleteGoal(goalID, userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Goal deleted successfully"})
}

// GetMilestones gets milestones for the user
func (h *GoalHandler) GetMilestones(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var studyPlanID *string
	if planID := c.Query("study_plan_id"); planID != "" {
		studyPlanID = &planID
	}

	milestones, err := h.goalService.GetMilestones(userID.(string), studyPlanID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, milestones)
}

// CreateMilestoneRequest represents a milestone creation request
type CreateMilestoneRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	TargetDate  string `json:"target_date" binding:"required"` // ISO 8601
	StudyPlanID string `json:"study_plan_id"`
}

// CreateMilestone creates a new milestone
func (h *GoalHandler) CreateMilestone(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req CreateMilestoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	targetDate, err := time.Parse(time.RFC3339, req.TargetDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target date format"})
		return
	}

	var planID *string
	if req.StudyPlanID != "" {
		planID = &req.StudyPlanID
	}

	milestone, err := h.goalService.CreateMilestone(
		userID.(string),
		req.Title,
		req.Description,
		targetDate,
		planID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, milestone)
}

// UpdateMilestoneProgressRequest represents a milestone progress update
type UpdateMilestoneProgressRequest struct {
	Progress float64 `json:"progress" binding:"min=0,max=100"`
}

// UpdateMilestoneProgress updates milestone progress
func (h *GoalHandler) UpdateMilestoneProgress(c *gin.Context) {
	milestoneID := c.Param("id")
	userID, _ := c.Get("user_id")

	var req UpdateMilestoneProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.goalService.UpdateMilestoneProgress(milestoneID, userID.(string), req.Progress)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Milestone progress updated"})
}

// GenerateGoalSuggestions generates daily AI goal suggestions
func (h *GoalHandler) GenerateGoalSuggestions(c *gin.Context) {
	userID, _ := c.Get("user_id")

	if h.goalSuggestionService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI service not available"})
		return
	}

	suggestions, err := h.goalSuggestionService.GenerateDailyGoalSuggestions(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, suggestions)
}

// GenerateDailyGoals generates AI daily suggestions and creates tickable goals for today
func (h *GoalHandler) GenerateDailyGoals(c *gin.Context) {
	userID, _ := c.Get("user_id")

	if h.goalSuggestionService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI service not available"})
		return
	}

	goals, err := h.goalSuggestionService.GenerateAndCreateDailyGoals(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, goals)
}

// GetGoalSuggestions gets goal suggestions for the current user
func (h *GoalHandler) GetGoalSuggestions(c *gin.Context) {
	userID, _ := c.Get("user_id")

	if h.goalSuggestionService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI service not available"})
		return
	}

	suggestions, err := h.goalSuggestionService.GetGoalSuggestions(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, suggestions)
}

// AcceptGoalSuggestion accepts a goal suggestion and creates a goal
func (h *GoalHandler) AcceptGoalSuggestion(c *gin.Context) {
	suggestionID := c.Param("id")
	userID, _ := c.Get("user_id")

	if h.goalSuggestionService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI service not available"})
		return
	}

	goal, err := h.goalSuggestionService.AcceptGoalSuggestion(suggestionID, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, goal)
}

// DismissGoalSuggestion dismisses a goal suggestion
func (h *GoalHandler) DismissGoalSuggestion(c *gin.Context) {
	suggestionID := c.Param("id")
	userID, _ := c.Get("user_id")

	if h.goalSuggestionService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI service not available"})
		return
	}

	err := h.goalSuggestionService.DismissGoalSuggestion(suggestionID, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "suggestion dismissed"})
}
