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

// GoalSuggestionService handles AI-powered goal suggestions
type GoalSuggestionService struct {
	db                   *database.DB
	geminiService        *GeminiService
	activityQueryService *ActivityQueryService
	productivityService  *ProductivityService
}

// NewGoalSuggestionService creates a new goal suggestion service
func NewGoalSuggestionService(db *database.DB, geminiService *GeminiService, activityQueryService *ActivityQueryService, productivityService *ProductivityService) *GoalSuggestionService {
	return &GoalSuggestionService{
		db:                   db,
		geminiService:        geminiService,
		activityQueryService: activityQueryService,
		productivityService:  productivityService,
	}
}

// GenerateDailyGoalSuggestions generates AI-powered daily goal suggestions
func (s *GoalSuggestionService) GenerateDailyGoalSuggestions(userID string) ([]models.GoalSuggestion, error) {
	if s.geminiService == nil {
		return nil, errors.New("AI service not available")
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Get recent activities (last 7 days)
	activities, err := s.activityQueryService.GetMyActivity(userID, "study", 50)
	if err != nil {
		activities = []models.ActivityLog{} // Continue with empty if error
	}

	// Get current goals
	var currentGoals []models.Goal
	goalsCursor, err := s.db.Collection("goals").Find(ctx, bson.M{
		"user_id":   userOID,
		"completed": false,
	})
	if err == nil {
		goalsCursor.All(ctx, &currentGoals)
		goalsCursor.Close(ctx)
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

	// Get upcoming milestones
	var milestones []models.Milestone
	milestonesCursor, err := s.db.Collection("milestones").Find(ctx, bson.M{
		"user_id":   userOID,
		"completed": false,
	})
	if err == nil {
		milestonesCursor.All(ctx, &milestones)
		milestonesCursor.Close(ctx)
	}

	// Get productivity comments for insights
	var comments []models.StudyPlanComment
	commentsCursor, err := s.db.Collection("study_plan_comments").Find(ctx, bson.M{
		"user_id": userOID,
	})
	if err == nil {
		commentsCursor.All(ctx, &comments)
		commentsCursor.Close(ctx)
	}

	// Analyze productivity patterns
	var strengths []string
	var weakAreas []string

	if len(comments) > 0 {
		totalProd := 0.0
		for _, comment := range comments {
			totalProd += comment.ProductivityScore
		}
		avgProd := totalProd / float64(len(comments))

		if avgProd >= 70 {
			strengths = append(strengths, "High productivity scores")
		} else if avgProd < 50 {
			weakAreas = append(weakAreas, "Low productivity in recent sessions")
		}
	}

	// Build user context data
	userData := map[string]interface{}{
		"recent_activities": activities,
		"current_goals":     currentGoals,
		"milestones":        milestones,
		"plan_progress":     studyPlans,
		"strengths":         strengths,
		"weak_areas":        weakAreas,
	}

	// Generate suggestions with AI
	jsonResponse, err := s.geminiService.GenerateDailyGoalSuggestions(userData)
	if err != nil {
		return nil, err
	}

	// Parse AI response
	cleanedResponse := strings.TrimSpace(jsonResponse)
	cleanedResponse = strings.TrimPrefix(cleanedResponse, "```json")
	cleanedResponse = strings.TrimPrefix(cleanedResponse, "```")
	cleanedResponse = strings.TrimSuffix(cleanedResponse, "```")
	cleanedResponse = strings.TrimSpace(cleanedResponse)

	var aiResponse struct {
		Suggestions []struct {
			Title       string `json:"title"`
			Description string `json:"description"`
			Subject     string `json:"subject"`
			Priority    string `json:"priority"`
			Reasoning   string `json:"reasoning"`
		} `json:"suggestions"`
	}

	if err := json.Unmarshal([]byte(cleanedResponse), &aiResponse); err != nil {
		return nil, errors.New("failed to parse AI response: " + err.Error())
	}

	// Save suggestions to database
	var suggestions []models.GoalSuggestion
	collection := s.db.Collection("goal_suggestions")

	for _, aiSugg := range aiResponse.Suggestions {
		suggestion := models.GoalSuggestion{
			UserID:      userOID,
			Title:       aiSugg.Title,
			Description: aiSugg.Description,
			Subject:     aiSugg.Subject,
			Priority:    aiSugg.Priority,
			Reasoning:   aiSugg.Reasoning,
			CreatedAt:   time.Now(),
		}

		result, err := collection.InsertOne(ctx, suggestion)
		if err != nil {
			continue // Skip if error
		}

		suggestion.ID = result.InsertedID.(primitive.ObjectID)
		suggestions = append(suggestions, suggestion)
	}

	return suggestions, nil
}

// GetGoalSuggestions retrieves goal suggestions for a user
func (s *GoalSuggestionService) GetGoalSuggestions(userID string) ([]models.GoalSuggestion, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	collection := s.db.Collection("goal_suggestions")
	cursor, err := collection.Find(ctx, bson.M{
		"user_id":     userOID,
		"accepted_at": nil, // Only show unaccepted suggestions
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var suggestions []models.GoalSuggestion
	if err := cursor.All(ctx, &suggestions); err != nil {
		return nil, err
	}

	return suggestions, nil
}

// AcceptGoalSuggestion converts a suggestion into an actual goal
func (s *GoalSuggestionService) AcceptGoalSuggestion(suggestionID, userID string) (*models.Goal, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	suggestionOID, err := primitive.ObjectIDFromHex(suggestionID)
	if err != nil {
		return nil, errors.New("invalid suggestion ID")
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Get suggestion
	var suggestion models.GoalSuggestion
	collection := s.db.Collection("goal_suggestions")
	err = collection.FindOne(ctx, bson.M{
		"_id":     suggestionOID,
		"user_id": userOID,
	}).Decode(&suggestion)
	if err != nil {
		return nil, errors.New("suggestion not found")
	}

	// Create goal from suggestion
	goal := models.Goal{
		UserID:      userOID,
		Title:       suggestion.Title,
		Description: suggestion.Description,
		DueDate:     time.Now().AddDate(0, 0, 1), // Tomorrow by default
		Completed:   false,
		CreatedAt:   time.Now(),
	}

	goalsCollection := s.db.Collection("goals")
	result, err := goalsCollection.InsertOne(ctx, goal)
	if err != nil {
		return nil, err
	}

	goal.ID = result.InsertedID.(primitive.ObjectID)

	// Mark suggestion as accepted
	now := time.Now()
	collection.UpdateOne(ctx, bson.M{"_id": suggestionOID}, bson.M{
		"$set": bson.M{"accepted_at": now},
	})

	return &goal, nil
}

// GenerateAndCreateDailyGoals generates AI daily suggestions and creates tickable Goals for today
func (s *GoalSuggestionService) GenerateAndCreateDailyGoals(userID string) ([]models.Goal, error) {
	suggestions, err := s.GenerateDailyGoalSuggestions(userID)
	if err != nil {
		return nil, err
	}

	userOID, _ := primitive.ObjectIDFromHex(userID)
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	goalsCol := s.db.Collection("goals")
	suggCol := s.db.Collection("goal_suggestions")
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var created []models.Goal
	for _, sug := range suggestions {
		g := models.Goal{
			UserID:      userOID,
			Title:       sug.Title,
			Description: sug.Description,
			Subject:     sug.Subject,
			Priority:    sug.Priority,
			DueDate:     startOfDay,
			Completed:   false,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		res, err := goalsCol.InsertOne(ctx, g)
		if err != nil {
			continue
		}
		g.ID = res.InsertedID.(primitive.ObjectID)
		created = append(created, g)

		_, _ = suggCol.UpdateOne(ctx, bson.M{"_id": sug.ID}, bson.M{
			"$set": bson.M{"accepted_at": now},
		})
	}
	return created, nil
}

// DismissGoalSuggestion dismisses a suggestion
func (s *GoalSuggestionService) DismissGoalSuggestion(suggestionID, userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	suggestionOID, err := primitive.ObjectIDFromHex(suggestionID)
	if err != nil {
		return errors.New("invalid suggestion ID")
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	collection := s.db.Collection("goal_suggestions")
	result, err := collection.DeleteOne(ctx, bson.M{
		"_id":     suggestionOID,
		"user_id": userOID,
	})

	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("suggestion not found")
	}

	return nil
}
