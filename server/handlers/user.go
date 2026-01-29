package handlers

import (
	"net/http"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

// UserHandler handles user-related endpoints
type UserHandler struct {
	userService *services.UserService
}

// NewUserHandler creates a new user handler
func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// GetProfile gets user profile
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID := c.Param("id")
	
	profile, err := h.userService.GetProfile(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// GetMyProfile gets current user's profile
func (h *UserHandler) GetMyProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	
	profile, err := h.userService.GetProfile(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateProfileRequest represents a profile update request
type UpdateProfileRequest struct {
	Bio       string   `json:"bio"`
	AvatarURL string   `json:"avatar_url"`
	Grade     string   `json:"grade"`
	School    string   `json:"school"`
	Interests []string `json:"interests"`
}

// UpdateProfile updates user profile
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	
	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.Bio != "" {
		updates["bio"] = req.Bio
	}
	if req.AvatarURL != "" {
		updates["avatar_url"] = req.AvatarURL
	}
	if req.Grade != "" {
		updates["grade"] = req.Grade
	}
	if req.School != "" {
		updates["school"] = req.School
	}
	if len(req.Interests) > 0 {
		updates["interests"] = req.Interests
	}

	err := h.userService.UpdateProfile(userID.(string), updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

// GetUserStats gets user statistics
func (h *UserHandler) GetUserStats(c *gin.Context) {
	userID := c.Param("id")
	
	stats, err := h.userService.GetUserStats(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetMyStats gets current user's statistics
func (h *UserHandler) GetMyStats(c *gin.Context) {
	userID, _ := c.Get("user_id")
	
	stats, err := h.userService.GetUserStats(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// AddXPRequest represents an XP addition request
type AddXPRequest struct {
	XP int `json:"xp" binding:"required,min=1"`
}

// AddXP adds XP to user
func (h *UserHandler) AddXP(c *gin.Context) {
	userID, _ := c.Get("user_id")
	
	var req AddXPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.userService.AddXP(userID.(string), req.XP)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "XP added successfully"})
}

// SearchUsers searches users by name
func (h *UserHandler) SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
		return
	}

	users, err := h.userService.SearchUsers(query, 20)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

// GetChildren gets all children for the current parent user
func (h *UserHandler) GetChildren(c *gin.Context) {
	userID, _ := c.Get("user_id")
	
	children, err := h.userService.GetChildren(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, children)
}

// CreateChildRequest represents a request to create a child account
type CreateChildRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
	Age      int    `json:"age" binding:"required,min=1,max=100"`
}

// CreateChild creates a new student account linked to the current parent
func (h *UserHandler) CreateChild(c *gin.Context) {
	userID, _ := c.Get("user_id")
	
	var req CreateChildRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	child, err := h.userService.CreateChild(userID.(string), req.Email, req.Password, req.Name, req.Age)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, child)
}
