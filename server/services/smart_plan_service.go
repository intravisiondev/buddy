package services

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"buddy-server/database"
	"buddy-server/models"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// SmartPlanService handles AI-powered study plan generation
type SmartPlanService struct {
	db                *database.DB
	geminiService     *GeminiService
	studyPlanService  *StudyPlanService
	goalService       *GoalService
}

// NewSmartPlanService creates a new smart plan service
func NewSmartPlanService(db *database.DB, geminiService *GeminiService, studyPlanService *StudyPlanService, goalService *GoalService) *SmartPlanService {
	return &SmartPlanService{
		db:               db,
		geminiService:    geminiService,
		studyPlanService: studyPlanService,
		goalService:      goalService,
	}
}

// GeneratedPlanResponse represents the AI-generated plan
type GeneratedPlanResponse struct {
	Name           string                 `json:"name"`
	Description    string                 `json:"description"`
	ScheduleBlocks []ScheduleBlockPreview `json:"schedule_blocks"`
	Milestones     []MilestonePreview     `json:"milestones"`
}

// ScheduleBlockPreview represents a schedule block preview
type ScheduleBlockPreview struct {
	DayOfWeek int    `json:"day_of_week"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Subject   string `json:"subject"`
	Topic     string `json:"topic"`
	BlockType string `json:"block_type"`
}

// MilestonePreview represents a milestone preview
type MilestonePreview struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	TargetDate  string  `json:"target_date"`
	Progress    float64 `json:"progress"`
}

// GenerateSmartPlan generates a study plan using AI
func (s *SmartPlanService) GenerateSmartPlan(subject, goals, description string, weeklyHours float64, startDate, endDate string) (*GeneratedPlanResponse, error) {
	if s.geminiService == nil {
		return nil, errors.New("AI service not available")
	}

	// Call Gemini to generate the plan
	response, err := s.geminiService.GenerateSmartStudyPlan(subject, goals, description, weeklyHours, startDate, endDate)
	if err != nil {
		return nil, err
	}

	// Clean up response (remove markdown code blocks if present)
	response = strings.TrimSpace(response)
	
	// Remove markdown code blocks
	if strings.HasPrefix(response, "```") {
		lines := strings.Split(response, "\n")
		if len(lines) > 2 {
			// Remove first line (```json or ```)
			lines = lines[1:]
			// Remove last line (```)
			if strings.HasPrefix(lines[len(lines)-1], "```") {
				lines = lines[:len(lines)-1]
			}
			response = strings.Join(lines, "\n")
		}
	}
	
	response = strings.TrimSpace(response)

	// Log the response for debugging
	if len(response) > 500 {
		println("AI Response (truncated):", response[:500]+"...")
	} else {
		println("AI Response:", response)
	}

	// Parse JSON response
	var planResponse GeneratedPlanResponse
	if err := json.Unmarshal([]byte(response), &planResponse); err != nil {
		return nil, errors.New("failed to parse AI response: " + err.Error() + " | Response: " + response[:min(len(response), 200)])
	}

	// Validate response
	if planResponse.Name == "" {
		return nil, errors.New("AI generated invalid plan: missing name")
	}
	if len(planResponse.ScheduleBlocks) == 0 {
		return nil, errors.New("AI generated invalid plan: no schedule blocks")
	}

	return &planResponse, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// CreateSmartPlan creates a study plan with schedule blocks and milestones
func (s *SmartPlanService) CreateSmartPlan(userID string, plan GeneratedPlanResponse, startDate, endDate time.Time) (*models.StudyPlan, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Create the study plan
	studyPlan := &models.StudyPlan{
		UserID:         userOID,
		Name:           plan.Name,
		Description:    plan.Description,
		StartDate:      startDate,
		EndDate:        endDate,
		DailyGoalHours: 2.0, // Default
		IsChallenge:    false,
		IsPublic:       false,
		Progress:       0,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	collection := s.db.Collection("study_plans")
	result, err := collection.InsertOne(ctx, studyPlan)
	if err != nil {
		return nil, err
	}

	studyPlan.ID = result.InsertedID.(primitive.ObjectID)

	// Create schedule blocks
	scheduleCollection := s.db.Collection("schedule_blocks")
	for _, blockPreview := range plan.ScheduleBlocks {
		block := models.ScheduleBlock{
			StudyPlanID: studyPlan.ID,
			DayOfWeek:   blockPreview.DayOfWeek,
			StartTime:   blockPreview.StartTime,
			EndTime:     blockPreview.EndTime,
			Subject:     blockPreview.Subject,
			Topic:       blockPreview.Topic,
			BlockType:   blockPreview.BlockType,
			CreatedAt:   time.Now(),
		}
		_, err := scheduleCollection.InsertOne(ctx, block)
		if err != nil {
			// Log error but continue
			continue
		}
	}

	// Create milestones
	milestonesCollection := s.db.Collection("milestones")
	for _, milestonePreview := range plan.Milestones {
		targetDate, err := time.Parse("2006-01-02", milestonePreview.TargetDate)
		if err != nil {
			// Try parsing with time component
			targetDate, err = time.Parse(time.RFC3339, milestonePreview.TargetDate)
			if err != nil {
				// Skip invalid dates
				continue
			}
		}

		milestone := models.Milestone{
			UserID:      userOID,
			StudyPlanID: &studyPlan.ID,
			Title:       milestonePreview.Title,
			Description: milestonePreview.Description,
			TargetDate:  targetDate,
			Progress:    0,
			Completed:   false,
			CreatedAt:   time.Now(),
		}

		_, err = milestonesCollection.InsertOne(ctx, milestone)
		if err != nil {
			// Log error but continue
			continue
		}
	}

	return studyPlan, nil
}
