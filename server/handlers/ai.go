package handlers

import (
	"encoding/json"
	"net/http"

	"buddy-server/models"
	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

// AIHandler handles AI-related endpoints
type AIHandler struct {
	geminiService *services.GeminiService
}

// NewAIHandler creates a new AI handler
func NewAIHandler(geminiService *services.GeminiService) *AIHandler {
	return &AIHandler{
		geminiService: geminiService,
	}
}

// ChatRequest represents a chat request
type ChatRequest struct {
	Message string `json:"message" binding:"required"`
	Context string `json:"context"`
}

// Chat handles chat requests
func (h *AIHandler) Chat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.geminiService.Chat(req.Message, req.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"response": response})
}

// ExplainRequest represents an explain topic request
type ExplainRequest struct {
	Topic   string `json:"topic" binding:"required"`
	Subject string `json:"subject" binding:"required"`
	Level   string `json:"level" binding:"required"`
}

// ExplainTopic handles topic explanation requests
func (h *AIHandler) ExplainTopic(c *gin.Context) {
	var req ExplainRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	explanation, err := h.geminiService.ExplainTopic(req.Topic, req.Subject, req.Level)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"explanation": explanation})
}

// QuestionRequest represents a question answering request
type QuestionRequest struct {
	Question string `json:"question" binding:"required"`
	Subject  string `json:"subject" binding:"required"`
	Context  string `json:"context"`
}

// AnswerQuestion handles question answering requests
func (h *AIHandler) AnswerQuestion(c *gin.Context) {
	var req QuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	answer, err := h.geminiService.AnswerQuestion(req.Question, req.Subject, req.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"answer": answer})
}

// GenerateQuestionsRequest represents a question generation request
type GenerateQuestionsRequest struct {
	Topic      string `json:"topic" binding:"required"`
	Subject    string `json:"subject" binding:"required"`
	Difficulty string `json:"difficulty" binding:"required"`
	Count      int    `json:"count" binding:"required,min=1,max=20"`
}

// GenerateQuestions handles question generation requests
func (h *AIHandler) GenerateQuestions(c *gin.Context) {
	var req GenerateQuestionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	questions, err := h.geminiService.GenerateQuestions(req.Topic, req.Subject, req.Difficulty, req.Count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"questions": questions})
}

// SummarizeRequest represents a content summarization request
type SummarizeRequest struct {
	Content   string `json:"content" binding:"required"`
	MaxLength int    `json:"max_length" binding:"required,min=50,max=1000"`
}

// Summarize handles content summarization requests
func (h *AIHandler) Summarize(c *gin.Context) {
	var req SummarizeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	summary, err := h.geminiService.SummarizeContent(req.Content, req.MaxLength)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

// GenerateSyllabusFromFileRequest represents a syllabus generation from file request
type GenerateSyllabusFromFileRequest struct {
	FileContent string `json:"file_content" binding:"required"`
	Subject     string `json:"subject" binding:"required"`
	CourseName  string `json:"course_name" binding:"required"`
}

// GenerateSyllabusFromFile handles syllabus generation from file content
func (h *AIHandler) GenerateSyllabusFromFile(c *gin.Context) {
	var req GenerateSyllabusFromFileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	jsonStr, err := h.geminiService.GenerateSyllabusFromFile(req.FileContent, req.Subject, req.CourseName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Parse JSON response
	var syllabus models.Syllabus
	if err := json.Unmarshal([]byte(jsonStr), &syllabus); err != nil {
		// If JSON parsing fails, try to extract JSON from markdown code blocks
		c.JSON(http.StatusOK, gin.H{"syllabus": jsonStr, "raw": true})
		return
	}

	c.JSON(http.StatusOK, gin.H{"syllabus": syllabus})
}

// GenerateSyllabusFromTopicsRequest represents a syllabus generation from topics request
type GenerateSyllabusFromTopicsRequest struct {
	Topics     []string `json:"topics" binding:"required"`
	Subject    string   `json:"subject" binding:"required"`
	CourseName string   `json:"course_name" binding:"required"`
}

// GenerateSyllabusFromTopics handles syllabus generation from topics list
func (h *AIHandler) GenerateSyllabusFromTopics(c *gin.Context) {
	var req GenerateSyllabusFromTopicsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	jsonStr, err := h.geminiService.GenerateSyllabusFromTopics(req.Topics, req.Subject, req.CourseName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Parse JSON response
	var syllabus models.Syllabus
	if err := json.Unmarshal([]byte(jsonStr), &syllabus); err != nil {
		// If JSON parsing fails, return raw response
		c.JSON(http.StatusOK, gin.H{"syllabus": jsonStr, "raw": true})
		return
	}

	c.JSON(http.StatusOK, gin.H{"syllabus": syllabus})
}
