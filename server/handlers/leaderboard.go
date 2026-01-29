package handlers

import (
	"net/http"
	"strconv"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

type LeaderboardHandler struct {
	leaderboardService *services.LeaderboardService
}

func NewLeaderboardHandler(svc *services.LeaderboardService) *LeaderboardHandler {
	return &LeaderboardHandler{leaderboardService: svc}
}

// GetLeaderboard returns leaderboard entries
// Query: period=weekly|all, limit=1..200
func (h *LeaderboardHandler) GetLeaderboard(c *gin.Context) {
	period := c.DefaultQuery("period", "all")
	limitStr := c.DefaultQuery("limit", "50")
	limit64, _ := strconv.ParseInt(limitStr, 10, 64)

	entries, err := h.leaderboardService.GetLeaderboard(period, limit64)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, entries)
}

