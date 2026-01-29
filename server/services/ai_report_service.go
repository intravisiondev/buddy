package services

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"buddy-server/database"
	"buddy-server/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// AIReportService handles AI-powered report generation
type AIReportService struct {
	db                  *database.DB
	geminiService       *GeminiService
	activityQueryService *ActivityQueryService
	productivityService *ProductivityService
}

// NewAIReportService creates a new AI report service
func NewAIReportService(db *database.DB, geminiService *GeminiService, activityQueryService *ActivityQueryService, productivityService *ProductivityService) *AIReportService {
	return &AIReportService{
		db:                  db,
		geminiService:       geminiService,
		activityQueryService: activityQueryService,
		productivityService: productivityService,
	}
}

// GenerateStudentReport generates a comprehensive AI-powered performance report
func (s *AIReportService) GenerateStudentReport(userID, reportType string) (*models.StudentReport, error) {
	if s.geminiService == nil {
		return nil, errors.New("AI service not available")
	}

	// Calculate date range based on report type
	endDate := time.Now()
	var startDate time.Time

	switch reportType {
	case "daily":
		startDate = endDate.AddDate(0, 0, -1)
	case "weekly":
		startDate = endDate.AddDate(0, 0, -7)
	case "monthly":
		startDate = endDate.AddDate(0, -1, 0)
	default:
		return nil, errors.New("invalid report type")
	}

	// Collect user data
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Get activities
	activities, err := s.activityQueryService.GetMyActivity(userID, "study", 200)
	if err != nil {
		return nil, err
	}

	// Filter activities by date range
	var periodActivities []models.ActivityLog
	totalStudyHours := 0.0
	totalFocusScore := 0.0
	focusCount := 0

	for _, activity := range activities {
		if activity.CreatedAt.After(startDate) && activity.CreatedAt.Before(endDate) {
			periodActivities = append(periodActivities, activity)
			totalStudyHours += float64(activity.DurationMinutes) / 60.0
			if activity.FocusScore > 0 {
				totalFocusScore += float64(activity.FocusScore)
				focusCount++
			}
		}
	}

	avgFocusScore := 0.0
	if focusCount > 0 {
		avgFocusScore = totalFocusScore / float64(focusCount)
	}

	// Get productivity comments for study plan activities
	var comments []models.StudyPlanComment
	cursor, err := s.db.Collection("study_plan_comments").Find(ctx, bson.M{
		"user_id": userOID,
		"created_at": bson.M{
			"$gte": startDate,
			"$lte": endDate,
		},
	})
	if err == nil {
		cursor.All(ctx, &comments)
		cursor.Close(ctx)
	}

	avgProductivityScore := 0.0
	if len(comments) > 0 {
		totalProd := 0.0
		for _, comment := range comments {
			totalProd += comment.ProductivityScore
		}
		avgProductivityScore = totalProd / float64(len(comments))
	}

	// Get goals
	var goals []models.Goal
	goalsCursor, err := s.db.Collection("goals").Find(ctx, bson.M{
		"user_id": userOID,
		"created_at": bson.M{
			"$gte": startDate,
			"$lte": endDate,
		},
	})
	if err == nil {
		goalsCursor.All(ctx, &goals)
		goalsCursor.Close(ctx)
	}

	goalsCompleted := 0
	for _, goal := range goals {
		if goal.Completed {
			goalsCompleted++
		}
	}

	// Get milestones
	var milestones []models.Milestone
	milestonesCursor, err := s.db.Collection("milestones").Find(ctx, bson.M{
		"user_id": userOID,
	})
	if err == nil {
		milestonesCursor.All(ctx, &milestones)
		milestonesCursor.Close(ctx)
	}

	avgMilestoneProgress := 0.0
	if len(milestones) > 0 {
		totalProg := 0.0
		for _, milestone := range milestones {
			totalProg += milestone.Progress
		}
		avgMilestoneProgress = totalProg / float64(len(milestones))
	}

	// Get study plans
	var studyPlans []models.StudyPlan
	plansCursor, err := s.db.Collection("study_plans").Find(ctx, bson.M{
		"user_id": userOID,
	})
	if err == nil {
		plansCursor.All(ctx, &studyPlans)
		plansCursor.Close(ctx)
	}

	avgPlanProgress := 0.0
	if len(studyPlans) > 0 {
		totalProg := 0.0
		for _, plan := range studyPlans {
			totalProg += plan.Progress
		}
		avgPlanProgress = totalProg / float64(len(studyPlans))
	}

	// Build prompt data
	reportData := map[string]interface{}{
		"start_date":         startDate.Format("2006-01-02"),
		"end_date":           endDate.Format("2006-01-02"),
		"total_hours":        totalStudyHours,
		"session_count":      len(periodActivities),
		"avg_focus":          avgFocusScore,
		"avg_productivity":   avgProductivityScore,
		"goals_completed":    goalsCompleted,
		"goals_total":        len(goals),
		"milestones_progress": avgMilestoneProgress,
		"plan_progress":      avgPlanProgress,
		"activities":         periodActivities,
		"assessments":        comments,
	}

	// Generate AI report
	jsonResponse, err := s.geminiService.GenerateStudentReport(userID, reportData)
	if err != nil {
		return nil, err
	}

	// Clean and parse response
	cleanedResponse := strings.TrimSpace(jsonResponse)
	cleanedResponse = strings.TrimPrefix(cleanedResponse, "```json")
	cleanedResponse = strings.TrimPrefix(cleanedResponse, "```")
	cleanedResponse = strings.TrimSuffix(cleanedResponse, "```")
	cleanedResponse = strings.TrimSpace(cleanedResponse)

	var aiReport struct {
		Summary         string   `json:"summary"`
		Strengths       []string `json:"strengths"`
		WeakAreas       []string `json:"weak_areas"`
		Recommendations []string `json:"recommendations"`
		OverallScore    float64  `json:"overall_score"`
	}

	if err := json.Unmarshal([]byte(cleanedResponse), &aiReport); err != nil {
		return nil, errors.New("failed to parse AI response: " + err.Error())
	}

	// Create report
	report := &models.StudentReport{
		UserID:               userOID,
		ReportType:           reportType,
		StartDate:            startDate,
		EndDate:              endDate,
		Summary:              aiReport.Summary,
		Strengths:            aiReport.Strengths,
		WeakAreas:            aiReport.WeakAreas,
		Recommendations:      aiReport.Recommendations,
		OverallScore:         aiReport.OverallScore,
		TotalStudyHours:      totalStudyHours,
		AvgFocusScore:        avgFocusScore,
		AvgProductivityScore: avgProductivityScore,
		GoalsCompleted:       goalsCompleted,
		MilestonesProgress:   avgMilestoneProgress,
		CreatedAt:            time.Now(),
	}

	// Save to database
	collection := s.db.Collection("student_reports")
	result, err := collection.InsertOne(ctx, report)
	if err != nil {
		return nil, err
	}

	report.ID = result.InsertedID.(primitive.ObjectID)
	return report, nil
}

// GetUserReports retrieves all reports for a user
func (s *AIReportService) GetUserReports(userID string) ([]models.StudentReport, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	collection := s.db.Collection("student_reports")
	cursor, err := collection.Find(ctx, bson.M{"user_id": userOID}, nil)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var reports []models.StudentReport
	if err := cursor.All(ctx, &reports); err != nil {
		return nil, err
	}

	return reports, nil
}

// GetReport retrieves a specific report by ID
func (s *AIReportService) GetReport(reportID, userID string) (*models.StudentReport, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	reportOID, err := primitive.ObjectIDFromHex(reportID)
	if err != nil {
		return nil, errors.New("invalid report ID")
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	var report models.StudentReport
	collection := s.db.Collection("student_reports")
	err = collection.FindOne(ctx, bson.M{
		"_id":     reportOID,
		"user_id": userOID,
	}).Decode(&report)

	if err != nil {
		return nil, err
	}

	return &report, nil
}
