package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

// ResourceHandler handles resource-related endpoints
type ResourceHandler struct {
	resourceService *services.ResourceService
}

// NewResourceHandler creates a new resource handler
func NewResourceHandler(resourceService *services.ResourceService) *ResourceHandler {
	return &ResourceHandler{
		resourceService: resourceService,
	}
}

// CreateResourceRequest represents a resource creation request
type CreateResourceRequest struct {
	Name        string   `json:"name" binding:"required"`
	Description string   `json:"description"`
	Category    string   `json:"category" binding:"required"` // "video", "notes", "assignment", "book", "other"
	Subject     string   `json:"subject"`                     // Legacy: single subject (deprecated)
	Subjects    []string `json:"subjects,omitempty"`           // Related syllabus topics/subjects (multiple)
	FileURL     string   `json:"file_url" binding:"required"` // URL of uploaded file
	FileType    string   `json:"file_type" binding:"required"` // MIME type
	FileSize    int64    `json:"file_size"`
}

// CreateResource creates a new resource
func (h *ResourceHandler) CreateResource(c *gin.Context) {
	roomID := c.Param("id")
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	uploaderType := "student"
	if userRole == "teacher" {
		uploaderType = "teacher"
	}

	var req CreateResourceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Use Subjects if provided, otherwise fall back to Subject (legacy)
	subjects := req.Subjects
	if len(subjects) == 0 && req.Subject != "" {
		subjects = []string{req.Subject}
	}

	resource, err := h.resourceService.CreateResource(
		roomID,
		userID.(string),
		req.Name,
		req.Description,
		req.FileURL,
		req.FileType,
		req.FileSize,
		req.Category,
		req.Subject, // Legacy support
		subjects,    // New: multiple subjects
		uploaderType,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resource)
}

// GetResources gets all resources for a room
func (h *ResourceHandler) GetResources(c *gin.Context) {
	roomID := c.Param("id")
	uploaderType := c.Query("uploader_type") // "teacher" or "student"
	category := c.DefaultQuery("category", "all")
	userID, _ := c.Get("user_id")

	var userIDStr *string
	if userID != nil {
		uid := userID.(string)
		userIDStr = &uid
	}

	resources, err := h.resourceService.GetResources(roomID, uploaderType, category, userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resources)
}

// GetResource gets a single resource by ID
func (h *ResourceHandler) GetResource(c *gin.Context) {
	resourceID := c.Param("resource_id")

	resource, err := h.resourceService.GetResource(resourceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resource not found"})
		return
	}

	c.JSON(http.StatusOK, resource)
}

// DeleteResource deletes a resource
func (h *ResourceHandler) DeleteResource(c *gin.Context) {
	resourceID := c.Param("resource_id")
	userID, _ := c.Get("user_id")

	err := h.resourceService.DeleteResource(resourceID, userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resource deleted successfully"})
}

// ShareResourceRequest represents a resource sharing request
type ShareResourceRequest struct {
	SharedWith []string `json:"shared_with"` // Array of user IDs
	IsPublic   bool     `json:"is_public"`
}

// ShareResource shares a student resource with specific users
func (h *ResourceHandler) ShareResource(c *gin.Context) {
	resourceID := c.Param("resource_id")
	userID, _ := c.Get("user_id")

	var req ShareResourceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.resourceService.ShareResource(resourceID, userID.(string), req.SharedWith, req.IsPublic)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resource shared successfully"})
}

// UploadFile handles file upload
func (h *ResourceHandler) UploadFile(c *gin.Context) {
	roomID := c.Param("id")

	// Get file from form
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Create uploads directory if it doesn't exist
	uploadDir := filepath.Join("uploads", "rooms", roomID)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("%d_%s", file.Size, file.Filename)
	filename = strings.ReplaceAll(filename, " ", "_")
	filePath := filepath.Join(uploadDir, filename)

	// Save file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Return file URL (relative path)
	fileURL := fmt.Sprintf("/uploads/rooms/%s/%s", roomID, filename)

	c.JSON(http.StatusOK, gin.H{
		"file_url":  fileURL,
		"file_name": file.Filename,
		"file_size": file.Size,
		"file_type": file.Header.Get("Content-Type"),
	})
}
