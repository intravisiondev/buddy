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

// ProductivityService handles productivity scoring and AI assessments
type ProductivityService struct {
	db            *database.DB
	geminiService *GeminiService
}

// NewProductivityService creates a new productivity service
func NewProductivityService(db *database.DB, geminiService *GeminiService) *ProductivityService {
	return &ProductivityService{
		db:            db,
		geminiService: geminiService,
	}
}

// GenerateAssessmentQuestions generates AI questions for a study session
func (s *ProductivityService) GenerateAssessmentQuestions(subject, notes string, durationMinutes int) ([]models.AIQuestion, error) {
	if s.geminiService == nil {
		return nil, errors.New("AI service not available")
	}

	jsonResponse, err := s.geminiService.GenerateStudyAssessmentQuestions(subject, notes, durationMinutes)
	if err != nil {
		return nil, err
	}

	// Clean the response - remove markdown code blocks if present
	cleanedResponse := strings.TrimSpace(jsonResponse)
	cleanedResponse = strings.TrimPrefix(cleanedResponse, "```json")
	cleanedResponse = strings.TrimPrefix(cleanedResponse, "```")
	cleanedResponse = strings.TrimSuffix(cleanedResponse, "```")
	cleanedResponse = strings.TrimSpace(cleanedResponse)

	// Parse JSON response
	var response struct {
		Questions []models.AIQuestion `json:"questions"`
	}

	if err := json.Unmarshal([]byte(cleanedResponse), &response); err != nil {
		return nil, errors.New("failed to parse AI response: " + err.Error())
	}

	return response.Questions, nil
}

// CalculateProductivityScore calculates weighted productivity score
// Formula: AI answers (60%) + focus score (20%) + duration efficiency (10%) + break efficiency (10%)
func (s *ProductivityService) CalculateProductivityScore(
	focusScore float64,
	correctAnswers int,
	totalQuestions int,
	durationMinutes int,
	breakCount int,
	totalBreakSeconds int,
) float64 {
	// AI Assessment Score (60%)
	aiScore := 0.0
	if totalQuestions > 0 {
		aiScore = (float64(correctAnswers) / float64(totalQuestions)) * 60.0
	}

	// Focus Score (20%)
	focusContribution := (focusScore / 100.0) * 20.0

	// Duration Efficiency (10%)
	// Assume optimal session is 60-90 minutes
	durationEfficiency := 1.0
	if durationMinutes < 30 {
		durationEfficiency = float64(durationMinutes) / 30.0
	} else if durationMinutes > 120 {
		durationEfficiency = 0.8 // Slightly lower for very long sessions
	}
	durationContribution := durationEfficiency * 10.0

	// Break Efficiency (10%)
	// Optimal: 5-10 minute breaks per hour
	breakEfficiency := 1.0
	if durationMinutes > 0 {
		totalSessionSeconds := durationMinutes * 60
		breakRatio := float64(totalBreakSeconds) / float64(totalSessionSeconds)
		optimalBreakRatio := 0.1 // 10% of session time

		if breakRatio <= optimalBreakRatio {
			breakEfficiency = 1.0
		} else {
			// Penalize excessive breaks
			breakEfficiency = 1.0 - ((breakRatio - optimalBreakRatio) * 2)
			if breakEfficiency < 0 {
				breakEfficiency = 0
			}
		}
	}
	breakContribution := breakEfficiency * 10.0

	totalScore := aiScore + focusContribution + durationContribution + breakContribution

	// Clamp to 0-100
	if totalScore < 0 {
		totalScore = 0
	} else if totalScore > 100 {
		totalScore = 100
	}

	return totalScore
}

// SaveStudyPlanComment saves an AI assessment comment
func (s *ProductivityService) SaveStudyPlanComment(
	userID, studyPlanID, activityLogID string,
	questions []models.AIQuestion,
	studentAnswers []string,
	correctAnswers int,
	productivityScore float64,
	aiAnalysis string,
) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	planOID, err := primitive.ObjectIDFromHex(studyPlanID)
	if err != nil {
		return errors.New("invalid study plan ID")
	}

	activityOID, err := primitive.ObjectIDFromHex(activityLogID)
	if err != nil {
		return errors.New("invalid activity log ID")
	}

	comment := &models.StudyPlanComment{
		UserID:            userOID,
		StudyPlanID:       planOID,
		ActivityLogID:     activityOID,
		Questions:         questions,
		StudentAnswers:    studentAnswers,
		CorrectAnswers:    correctAnswers,
		TotalQuestions:    len(questions),
		ProductivityScore: productivityScore,
		AIAnalysis:        aiAnalysis,
		CreatedAt:         time.Now(),
	}

	collection := s.db.Collection("study_plan_comments")
	_, err = collection.InsertOne(ctx, comment)
	return err
}

// GetStudyPlanComments retrieves AI assessment comments for a study plan
func (s *ProductivityService) GetStudyPlanComments(userID, studyPlanID string) ([]models.StudyPlanComment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	planOID, err := primitive.ObjectIDFromHex(studyPlanID)
	if err != nil {
		return nil, errors.New("invalid study plan ID")
	}

	collection := s.db.Collection("study_plan_comments")
	cursor, err := collection.Find(ctx, bson.M{
		"user_id":       userOID,
		"study_plan_id": planOID,
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var comments []models.StudyPlanComment
	if err := cursor.All(ctx, &comments); err != nil {
		return nil, err
	}

	return comments, nil
}
