package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

// AnalyticsHandler handles game analytics endpoints
type AnalyticsHandler struct {
	analyticsService *services.GameAnalyticsService
}

// NewAnalyticsHandler creates a new analytics handler
func NewAnalyticsHandler(analyticsService *services.GameAnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{
		analyticsService: analyticsService,
	}
}

// GetGameStats returns statistics for a specific game
func (h *AnalyticsHandler) GetGameStats(c *gin.Context) {
	gameID := c.Param("game_id")

	stats, err := h.analyticsService.GetGameStats(gameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetRoomAnalytics returns analytics for all games in a room
func (h *AnalyticsHandler) GetRoomAnalytics(c *gin.Context) {
	roomID := c.Param("id")

	analytics, err := h.analyticsService.GetRoomGameAnalytics(roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

// ExportCSV exports game analytics as CSV
func (h *AnalyticsHandler) ExportCSV(c *gin.Context) {
	roomID := c.Param("id")

	analytics, err := h.analyticsService.GetRoomGameAnalytics(roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Generate CSV
	csv := h.generateCSV(analytics)

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=game-analytics-%s.csv", roomID))
	c.String(http.StatusOK, csv)
}

// generateCSV converts analytics to CSV format
func (h *AnalyticsHandler) generateCSV(analytics *services.RoomGameAnalytics) string {
	var sb strings.Builder

	// Header
	sb.WriteString("Room ID,Total Games,Total Plays,Active Students,Avg Engagement\n")
	sb.WriteString(fmt.Sprintf("%s,%d,%d,%d,%.2f\n",
		analytics.RoomID,
		analytics.TotalGames,
		analytics.TotalPlays,
		analytics.ActiveStudents,
		analytics.AvgEngagement,
	))

	sb.WriteString("\n")
	sb.WriteString("Game ID,Title,Plays,Avg Score,Pass Rate\n")

	for _, game := range analytics.TopGames {
		sb.WriteString(fmt.Sprintf("%s,%s,%d,%.2f,%.2f\n",
			game.GameID,
			game.Title,
			game.Plays,
			game.AvgScore,
			game.PassRate,
		))
	}

	return sb.String()
}
