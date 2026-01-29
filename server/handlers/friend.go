package handlers

import (
	"net/http"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

type FriendHandler struct {
	friendService *services.FriendService
}

func NewFriendHandler(svc *services.FriendService) *FriendHandler {
	return &FriendHandler{friendService: svc}
}

type SendFriendRequestBody struct {
	ToUserID string `json:"to_user_id" binding:"required"`
}

func (h *FriendHandler) SendRequest(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var req SendFriendRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.friendService.SendRequest(userID.(string), req.ToUserID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Friend request sent"})
}

func (h *FriendHandler) Accept(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id := c.Param("id")
	if err := h.friendService.Respond(id, userID.(string), "accept"); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Friend request accepted"})
}

func (h *FriendHandler) Reject(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id := c.Param("id")
	if err := h.friendService.Respond(id, userID.(string), "reject"); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Friend request rejected"})
}

func (h *FriendHandler) ListIncoming(c *gin.Context) {
	userID, _ := c.Get("user_id")
	out, err := h.friendService.GetIncomingPending(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, out)
}

func (h *FriendHandler) ListFriends(c *gin.Context) {
	userID, _ := c.Get("user_id")
	out, err := h.friendService.GetFriends(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"friends": out})
}

