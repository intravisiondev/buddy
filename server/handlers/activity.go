package handlers

import (
	"net/http"
	"strconv"

	"buddy-server/models"
	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

type ActivityHandler struct {
	activityService       *services.ActivityService
	activityQueryService  *services.ActivityQueryService
	productivityService   *services.ProductivityService
}

func NewActivityHandler(svc *services.ActivityService, querySvc *services.ActivityQueryService, prodSvc *services.ProductivityService) *ActivityHandler {
	return &ActivityHandler{
		activityService:      svc,
		activityQueryService: querySvc,
		productivityService:  prodSvc,
	}
}

type LogStudySessionRequest struct {
	Subject         string `json:"subject"`
	DurationMinutes int    `json:"duration_minutes" binding:"required,min=1,max=600"`
}

func (h *ActivityHandler) LogStudySession(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req LogStudySessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.activityService.LogStudySession(userID.(string), req.Subject, req.DurationMinutes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Study session logged"})
}

// GetMyActivity returns recent activity logs for current user
// Query: type=study|quiz|... (optional), limit=1..200 (optional)
func (h *ActivityHandler) GetMyActivity(c *gin.Context) {
	userID, _ := c.Get("user_id")
	t := c.Query("type")
	limitStr := c.DefaultQuery("limit", "20")
	limit, _ := strconv.ParseInt(limitStr, 10, 64)

	out, err := h.activityQueryService.GetMyActivity(userID.(string), t, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, out)
}

// StartStudySessionRequest represents a request to start a study session
type StartStudySessionRequest struct {
	StudyPlanID string `json:"study_plan_id"`
	Subject     string `json:"subject" binding:"required"`
}

// StartStudySession starts a new active study session
func (h *ActivityHandler) StartStudySession(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req StartStudySessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session, err := h.activityService.StartStudySession(userID.(string), req.StudyPlanID, req.Subject)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, session)
}

// GetActiveStudySession gets the active study session for the current user
func (h *ActivityHandler) GetActiveStudySession(c *gin.Context) {
	userID, _ := c.Get("user_id")

	session, err := h.activityService.GetActiveStudySession(userID.(string))
	if err != nil {
		// Service returned an error (not just "no session")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// If session is nil, return 200 OK with null (no active session)
	// This is the expected behavior when there's no active session
	if session == nil {
		c.JSON(http.StatusOK, nil)
		return
	}

	c.JSON(http.StatusOK, session)
}

// PauseStudySession starts a break for the active study session
func (h *ActivityHandler) PauseStudySession(c *gin.Context) {
	userID, _ := c.Get("user_id")

	if err := h.activityService.PauseStudySession(userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Break started"})
}

// ResumeStudySession ends the current break
func (h *ActivityHandler) ResumeStudySession(c *gin.Context) {
	userID, _ := c.Get("user_id")

	if err := h.activityService.ResumeStudySession(userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Break ended"})
}

// SetIdleStatusRequest represents a request to set idle status
type SetIdleStatusRequest struct {
	IsIdle bool `json:"is_idle" binding:"required"`
}

// SetIdleStatus sets the idle status of the active study session
func (h *ActivityHandler) SetIdleStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req SetIdleStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.activityService.SetIdleStatus(userID.(string), req.IsIdle); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Idle status updated"})
}

// StopStudySessionRequest represents a request to stop a study session
type StopStudySessionRequest struct {
	Notes      string `json:"notes"`
	FocusScore int    `json:"focus_score" binding:"min=0,max=100"`
}

// StopStudySession stops the active study session and creates an ActivityLog
func (h *ActivityHandler) StopStudySession(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req StopStudySessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	activityLog, err := h.activityService.StopStudySession(userID.(string), req.Notes, req.FocusScore)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, activityLog)
}

// GenerateAssessmentRequest represents a request to generate AI assessment questions
type GenerateAssessmentRequest struct {
	Subject         string `json:"subject" binding:"required"`
	Notes           string `json:"notes"`
	DurationMinutes int    `json:"duration_minutes" binding:"required,min=1"`
}

// GenerateAssessment generates AI questions for study session assessment
func (h *ActivityHandler) GenerateAssessment(c *gin.Context) {
	var req GenerateAssessmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if h.productivityService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI service not available"})
		return
	}

	questions, err := h.productivityService.GenerateAssessmentQuestions(req.Subject, req.Notes, req.DurationMinutes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"questions": questions})
}

// CompleteAssessmentRequest represents completion of AI assessment
type CompleteAssessmentRequest struct {
	ActivityLogID   string   `json:"activity_log_id" binding:"required"`
	StudyPlanID     string   `json:"study_plan_id" binding:"required"`
	Questions       []models.AIQuestion `json:"questions" binding:"required"`
	StudentAnswers  []string `json:"student_answers" binding:"required"`
	FocusScore      float64  `json:"focus_score" binding:"required,min=0,max=100"`
	DurationMinutes int      `json:"duration_minutes" binding:"required,min=1"`
	BreakCount      int      `json:"break_count"`
	TotalBreakSeconds int    `json:"total_break_seconds"`
}

// CompleteAssessment saves AI assessment results and calculates productivity score
func (h *ActivityHandler) CompleteAssessment(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req CompleteAssessmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if h.productivityService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI service not available"})
		return
	}

	// Count correct answers
	correctAnswers := 0
	for i, answer := range req.StudentAnswers {
		if i < len(req.Questions) && answer == req.Questions[i].CorrectAnswer {
			correctAnswers++
		}
	}

	// Calculate productivity score
	productivityScore := h.productivityService.CalculateProductivityScore(
		req.FocusScore,
		correctAnswers,
		len(req.Questions),
		req.DurationMinutes,
		req.BreakCount,
		req.TotalBreakSeconds,
	)

	// Generate AI analysis (simple for now)
	aiAnalysis := ""
	if correctAnswers == len(req.Questions) {
		aiAnalysis = "Excellent comprehension! All questions answered correctly."
	} else if correctAnswers >= len(req.Questions)*2/3 {
		aiAnalysis = "Good understanding of the material. Consider reviewing missed concepts."
	} else {
		aiAnalysis = "Consider spending more time on this topic for better retention."
	}

	// Save study plan comment
	err := h.productivityService.SaveStudyPlanComment(
		userID.(string),
		req.StudyPlanID,
		req.ActivityLogID,
		req.Questions,
		req.StudentAnswers,
		correctAnswers,
		productivityScore,
		aiAnalysis,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"productivity_score": productivityScore,
		"correct_answers":    correctAnswers,
		"total_questions":    len(req.Questions),
		"ai_analysis":        aiAnalysis,
	})
}
