package handlers

import (
	"net/http"

	"buddy-server/services"

	"github.com/gin-gonic/gin"
)

// ReportHandler handles report-related endpoints
type ReportHandler struct {
	reportService *services.AIReportService
}

// NewReportHandler creates a new report handler
func NewReportHandler(reportService *services.AIReportService) *ReportHandler {
	return &ReportHandler{
		reportService: reportService,
	}
}

// GenerateReportRequest represents a report generation request
type GenerateReportRequest struct {
	ReportType string `json:"report_type" binding:"required,oneof=daily weekly monthly"`
}

// GenerateReport generates a new AI-powered performance report
func (h *ReportHandler) GenerateReport(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req GenerateReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if h.reportService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Report service not available"})
		return
	}

	report, err := h.reportService.GenerateStudentReport(userID.(string), req.ReportType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, report)
}

// GetReports gets all reports for the current user
func (h *ReportHandler) GetReports(c *gin.Context) {
	userID, _ := c.Get("user_id")

	if h.reportService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Report service not available"})
		return
	}

	reports, err := h.reportService.GetUserReports(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// GetReport gets a specific report by ID
func (h *ReportHandler) GetReport(c *gin.Context) {
	reportID := c.Param("id")
	userID, _ := c.Get("user_id")

	if h.reportService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Report service not available"})
		return
	}

	report, err := h.reportService.GetReport(reportID, userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, report)
}
