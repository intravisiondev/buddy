package handlers

import (
	"fmt"
	"net/http"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

// GameHandler handles game-related endpoints
type GameHandler struct {
	gameService     *services.GameService
	templateService *services.GameTemplateService
}

// NewGameHandler creates a new game handler
func NewGameHandler(gameService *services.GameService, templateService *services.GameTemplateService) *GameHandler {
	return &GameHandler{
		gameService:     gameService,
		templateService: templateService,
	}
}

// GenerateGameRequest represents a game generation request
type GenerateGameRequest struct {
	GameType      string `json:"game_type" binding:"required,oneof=quiz flashcards fill_blank fill-blank matching"`
	Subject       string `json:"subject" binding:"required"`
	Difficulty    string `json:"difficulty" binding:"required,oneof=easy medium hard"`
	QuestionCount int    `json:"question_count" binding:"min=3,max=20"` // 0 = use default 10
}

// GenerateGame generates a new AI-powered game
func (h *GameHandler) GenerateGame(c *gin.Context) {
	roomID := c.Param("id")
	userID, _ := c.Get("user_id")

	var req GenerateGameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if h.gameService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Game service not available"})
		return
	}

	questionCount := req.QuestionCount
	if questionCount < 3 || questionCount > 20 {
		questionCount = 10
	}

	gameType := req.GameType
	if gameType == "fill-blank" {
		gameType = "fill_blank"
	}

	game, err := h.gameService.GenerateGame(
		roomID,
		userID.(string),
		gameType,
		req.Subject,
		req.Difficulty,
		questionCount,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, game)
}

// GetRoomGames gets all games for a room
func (h *GameHandler) GetRoomGames(c *gin.Context) {
	roomID := c.Param("id")

	if h.gameService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Game service not available"})
		return
	}

	games, err := h.gameService.GetRoomGames(roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, games)
}

// GetGame gets a specific game
func (h *GameHandler) GetGame(c *gin.Context) {
	gameID := c.Param("game_id")

	if h.gameService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Game service not available"})
		return
	}

	game, err := h.gameService.GetGame(gameID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, game)
}

// PlayGameRequest represents game play submission
type PlayGameRequest struct {
	Answers   []string `json:"answers" binding:"required"`
	TimeSpent int      `json:"time_spent" binding:"required,min=0"`
}

// PlayGame submits game answers
func (h *GameHandler) PlayGame(c *gin.Context) {
	gameID := c.Param("game_id")
	userID, _ := c.Get("user_id")

	var req PlayGameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if h.gameService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Game service not available"})
		return
	}

	result, err := h.gameService.PlayGame(gameID, userID.(string), req.Answers, req.TimeSpent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, result)
}

// GetGameResults gets student's results for a game
func (h *GameHandler) GetGameResults(c *gin.Context) {
	gameID := c.Param("game_id")
	userID, _ := c.Get("user_id")

	if h.gameService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Game service not available"})
		return
	}

	results, err := h.gameService.GetStudentGameResults(gameID, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

// GetTemplates returns all available game templates
func (h *GameHandler) GetTemplates(c *gin.Context) {
	if h.templateService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Template service not available"})
		return
	}

	templates := h.templateService.GetTemplates()
	c.JSON(http.StatusOK, templates)
}

// GetTemplate returns a specific template
func (h *GameHandler) GetTemplate(c *gin.Context) {
	templateID := c.Param("template_id")

	if h.templateService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Template service not available"})
		return
	}

	template, err := h.templateService.GetTemplate(templateID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, template)
}

// DownloadBundle serves the game bundle ZIP file, creating the bundle on-demand if missing
func (h *GameHandler) DownloadBundle(c *gin.Context) {
	gameID := c.Param("game_id")

	if h.gameService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Game service not available"})
		return
	}

	bundlePath, err := h.gameService.EnsureBundle(gameID)
	if err != nil {
		if err.Error() == "game not found" || err.Error() == "invalid game ID" {
			c.JSON(http.StatusNotFound, gin.H{"error": "game not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.FileAttachment(bundlePath, fmt.Sprintf("game-%s.zip", gameID))
}
