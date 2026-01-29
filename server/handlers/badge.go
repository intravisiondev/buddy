package handlers

import (
	"net/http"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

type BadgeHandler struct {
	badgeService *services.BadgeService
}

func NewBadgeHandler(svc *services.BadgeService) *BadgeHandler {
	return &BadgeHandler{badgeService: svc}
}

// GetMyBadges returns earned badges for current user
func (h *BadgeHandler) GetMyBadges(c *gin.Context) {
	userID, _ := c.Get("user_id")
	out, err := h.badgeService.GetMyBadges(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, out)
}

