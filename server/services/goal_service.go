package services

import (
	"context"
	"errors"
	"time"

	"buddy-server/database"
	"buddy-server/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GoalService handles goal-related operations
type GoalService struct {
	db *database.DB
	rewardService *RewardService
}

// NewGoalService creates a new goal service
func NewGoalService(db *database.DB, rewardService *RewardService) *GoalService {
	return &GoalService{db: db, rewardService: rewardService}
}

// CreateGoal creates a new goal
func (s *GoalService) CreateGoal(userID, title, description, subject string, dueDate time.Time, priority string, studyPlanID *string) (*models.Goal, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	goal := &models.Goal{
		UserID:      userObjectID,
		Title:       title,
		Description: description,
		Subject:     subject,
		DueDate:     dueDate,
		Completed:   false,
		Priority:    priority,
		CreatedAt:   time.Now(),
	}

	// Add study plan ID if provided
	if studyPlanID != nil && *studyPlanID != "" {
		planObjectID, err := primitive.ObjectIDFromHex(*studyPlanID)
		if err == nil {
			goal.StudyPlanID = &planObjectID
		}
	}

	collection := s.db.Collection("goals")
	result, err := collection.InsertOne(ctx, goal)
	if err != nil {
		return nil, err
	}

	goal.ID = result.InsertedID.(primitive.ObjectID)
	return goal, nil
}

// GetTodayGoals gets all goals for today for a user
func (s *GoalService) GetTodayGoals(userID string) ([]models.Goal, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Get start and end of today
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	filter := bson.M{
		"user_id": userObjectID,
		"due_date": bson.M{
			"$gte": startOfDay,
			"$lt":  endOfDay,
		},
	}

	collection := s.db.Collection("goals")
	cursor, err := collection.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "priority", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var goals []models.Goal
	if err = cursor.All(ctx, &goals); err != nil {
		return nil, err
	}

	return goals, nil
}

// GetGoals gets goals for a user with optional filters
func (s *GoalService) GetGoals(userID string, completed *bool, studyPlanID *string) ([]models.Goal, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	filter := bson.M{"user_id": userObjectID}

	if completed != nil {
		filter["completed"] = *completed
	}

	if studyPlanID != nil && *studyPlanID != "" {
		planObjectID, err := primitive.ObjectIDFromHex(*studyPlanID)
		if err == nil {
			filter["study_plan_id"] = planObjectID
		}
	}

	collection := s.db.Collection("goals")
	cursor, err := collection.Find(
		ctx,
		filter,
		options.Find().SetSort(bson.D{{Key: "due_date", Value: 1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var goals []models.Goal
	if err = cursor.All(ctx, &goals); err != nil {
		return nil, err
	}

	return goals, nil
}

// ToggleGoalComplete toggles a goal's completion status
func (s *GoalService) ToggleGoalComplete(goalID, userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	goalObjectID, err := primitive.ObjectIDFromHex(goalID)
	if err != nil {
		return errors.New("invalid goal ID")
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	// Find the goal
	collection := s.db.Collection("goals")
	var goal models.Goal
	err = collection.FindOne(ctx, bson.M{"_id": goalObjectID, "user_id": userObjectID}).Decode(&goal)
	if err != nil {
		return errors.New("goal not found")
	}

	// Toggle completion
	newCompleted := !goal.Completed
	update := bson.M{
		"$set": bson.M{
			"completed": newCompleted,
		},
	}

	if newCompleted {
		now := time.Now()
		update["$set"].(bson.M)["completed_at"] = now
	} else {
		update["$unset"] = bson.M{"completed_at": ""}
	}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": goalObjectID}, update)
	if err != nil {
		return err
	}

	// Apply rewards only when transitioning to completed
	if newCompleted && s.rewardService != nil {
		_, _ = s.rewardService.ApplyEvent(userID, EventGoalCompleted, map[string]interface{}{
			"priority": goal.Priority,
		})
	}

	return nil
}

// DeleteGoal deletes a goal
func (s *GoalService) DeleteGoal(goalID, userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	goalObjectID, err := primitive.ObjectIDFromHex(goalID)
	if err != nil {
		return errors.New("invalid goal ID")
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	collection := s.db.Collection("goals")
	result, err := collection.DeleteOne(ctx, bson.M{
		"_id":     goalObjectID,
		"user_id": userObjectID,
	})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("goal not found")
	}

	return nil
}

// GetMilestones gets milestones for a user
func (s *GoalService) GetMilestones(userID string, studyPlanID *string) ([]models.Milestone, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	filter := bson.M{"user_id": userObjectID}

	if studyPlanID != nil && *studyPlanID != "" {
		planObjectID, err := primitive.ObjectIDFromHex(*studyPlanID)
		if err == nil {
			filter["study_plan_id"] = planObjectID
		}
	}

	collection := s.db.Collection("milestones")
	cursor, err := collection.Find(
		ctx,
		filter,
		options.Find().SetSort(bson.D{{Key: "target_date", Value: 1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var milestones []models.Milestone
	if err = cursor.All(ctx, &milestones); err != nil {
		return nil, err
	}

	return milestones, nil
}

// CreateMilestone creates a new milestone
func (s *GoalService) CreateMilestone(userID, title, description string, targetDate time.Time, studyPlanID *string) (*models.Milestone, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	milestone := &models.Milestone{
		UserID:      userObjectID,
		Title:       title,
		Description: description,
		TargetDate:  targetDate,
		Progress:    0,
		Completed:   false,
		CreatedAt:   time.Now(),
	}

	if studyPlanID != nil && *studyPlanID != "" {
		planObjectID, err := primitive.ObjectIDFromHex(*studyPlanID)
		if err == nil {
			milestone.StudyPlanID = &planObjectID
		}
	}

	collection := s.db.Collection("milestones")
	result, err := collection.InsertOne(ctx, milestone)
	if err != nil {
		return nil, err
	}

	milestone.ID = result.InsertedID.(primitive.ObjectID)
	return milestone, nil
}

// UpdateMilestoneProgress updates milestone progress
func (s *GoalService) UpdateMilestoneProgress(milestoneID, userID string, progress float64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	milestoneObjectID, err := primitive.ObjectIDFromHex(milestoneID)
	if err != nil {
		return errors.New("invalid milestone ID")
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	update := bson.M{
		"$set": bson.M{
			"progress": progress,
		},
	}

	if progress >= 100 {
		now := time.Now()
		update["$set"].(bson.M)["completed"] = true
		update["$set"].(bson.M)["completed_at"] = now
	}

	collection := s.db.Collection("milestones")
	_, err = collection.UpdateOne(
		ctx,
		bson.M{"_id": milestoneObjectID, "user_id": userObjectID},
		update,
	)

	return err
}
