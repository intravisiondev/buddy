package handlers

import (
	"net/http"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// MatchHandler handles multiplayer match endpoints
type MatchHandler struct {
	multiplayerService *services.MultiplayerService
	upgrader           websocket.Upgrader
}

// NewMatchHandler creates a new match handler
func NewMatchHandler(multiplayerService *services.MultiplayerService) *MatchHandler {
	return &MatchHandler{
		multiplayerService: multiplayerService,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// Only allow same-origin or localhost in dev
				origin := r.Header.Get("Origin")
				return origin == "http://localhost:34115" || 
					   origin == "http://localhost:8080" || 
					   origin == "" // Allow same-origin
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
	}
}

// HandleWebSocket handles WebSocket connection for a match
func (h *MatchHandler) HandleWebSocket(c *gin.Context) {
	matchID := c.Param("match_id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "websocket upgrade failed"})
		return
	}

	if err := h.multiplayerService.HandleWebSocket(matchID, userID.(string), conn); err != nil {
		conn.Close()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
}

// CreateMatch creates a new multiplayer match
func (h *MatchHandler) CreateMatch(c *gin.Context) {
	var req struct {
		GameID string `json:"game_id" binding:"required"`
		Config struct {
			Mode       string `json:"mode"`
			MaxPlayers int    `json:"max_players"`
			Private    bool   `json:"private"`
			Duration   int    `json:"duration"`
		} `json:"config"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	roomID := c.Param("id")

	// Get user info for auto-join
	userName, _ := c.Get("user_name")
	userAvatar, _ := c.Get("user_avatar")

	config := services.MatchConfig{
		Mode:       req.Config.Mode,
		MaxPlayers: req.Config.MaxPlayers,
		Private:    req.Config.Private,
		Duration:   req.Config.Duration,
	}

	match, err := h.multiplayerService.CreateMatch(req.GameID, roomID, userID.(string), userName.(string), userAvatar.(string), config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, match)
}

// GetMatch retrieves match details
func (h *MatchHandler) GetMatch(c *gin.Context) {
	matchID := c.Param("match_id")

	match, err := h.multiplayerService.GetMatch(matchID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, match)
}

// JoinMatch adds a player to a match
func (h *MatchHandler) JoinMatch(c *gin.Context) {
	matchID := c.Param("match_id")
	userID, _ := c.Get("user_id")
	userName, _ := c.Get("user_name")
	userAvatar, _ := c.Get("user_avatar")

	name := userName.(string)
	avatar := ""
	if userAvatar != nil {
		avatar = userAvatar.(string)
	}

	if err := h.multiplayerService.JoinMatch(matchID, userID.(string), name, avatar); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "joined successfully"})
}

// GetActiveMatches returns active matches for a room
func (h *MatchHandler) GetActiveMatches(c *gin.Context) {
	roomID := c.Param("id")

	matches, err := h.multiplayerService.GetActiveMatches(roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, matches)
}
