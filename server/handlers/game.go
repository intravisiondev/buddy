package handlers

import (
	"net/http"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

// GameHandler handles game-related endpoints
type GameHandler struct {
	gameService *services.GameService
}

// NewGameHandler creates a new game handler
func NewGameHandler(gameService *services.GameService) *GameHandler {
	return &GameHandler{
		gameService: gameService,
	}
}

// GenerateGameRequest represents a game generation request
type GenerateGameRequest struct {
	GameType      string `json:"game_type" binding:"required,oneof=quiz flashcards fill_blank matching"`
	Subject       string `json:"subject" binding:"required"`
	Difficulty    string `json:"difficulty" binding:"required,oneof=easy medium hard"`
	QuestionCount int    `json:"question_count" binding:"required,min=3,max=20"`
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

	game, err := h.gameService.GenerateGame(
		roomID,
		userID.(string),
		req.GameType,
		req.Subject,
		req.Difficulty,
		req.QuestionCount,
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
