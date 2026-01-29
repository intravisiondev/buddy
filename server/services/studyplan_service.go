package services

import (
	"context"
	"errors"
	"time"

	"buddy-server/database"
	"buddy-server/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// StudyPlanService handles study plan operations
type StudyPlanService struct {
	db *database.DB
}

// NewStudyPlanService creates a new study plan service
func NewStudyPlanService(db *database.DB) *StudyPlanService {
	return &StudyPlanService{db: db}
}

// CreateStudyPlan creates a new study plan
func (s *StudyPlanService) CreateStudyPlan(userID, name, description string, startDate, endDate time.Time, dailyGoalHours float64, isChallenge, isPublic bool) (*models.StudyPlan, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	plan := &models.StudyPlan{
		UserID:         objectID,
		Name:           name,
		Description:    description,
		StartDate:      startDate,
		EndDate:        endDate,
		DailyGoalHours: dailyGoalHours,
		IsChallenge:    isChallenge,
		IsPublic:       isPublic,
		Progress:       0,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	collection := s.db.Collection("study_plans")
	result, err := collection.InsertOne(ctx, plan)
	if err != nil {
		return nil, err
	}

	plan.ID = result.InsertedID.(primitive.ObjectID)
	return plan, nil
}

// GetStudyPlans gets all study plans for a user
func (s *StudyPlanService) GetStudyPlans(userID string) ([]models.StudyPlan, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	collection := s.db.Collection("study_plans")
	cursor, err := collection.Find(ctx, bson.M{"user_id": objectID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var plans []models.StudyPlan
	if err = cursor.All(ctx, &plans); err != nil {
		return nil, err
	}

	return plans, nil
}

// GetPublicStudyPlans gets all public study plans (challenges)
func (s *StudyPlanService) GetPublicStudyPlans() ([]models.StudyPlan, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := s.db.Collection("study_plans")
	cursor, err := collection.Find(ctx, bson.M{"is_public": true, "is_challenge": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var plans []models.StudyPlan
	if err = cursor.All(ctx, &plans); err != nil {
		return nil, err
	}

	return plans, nil
}

// AddCourse adds a course to a study plan
func (s *StudyPlanService) AddCourse(planID, subject string, hoursAllocated float64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	planObjectID, err := primitive.ObjectIDFromHex(planID)
	if err != nil {
		return errors.New("invalid plan ID")
	}

	course := &models.Course{
		StudyPlanID:    planObjectID,
		Subject:        subject,
		HoursAllocated: hoursAllocated,
		HoursCompleted: 0,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	collection := s.db.Collection("courses")
	_, err = collection.InsertOne(ctx, course)
	return err
}

// GetCourses gets courses for a study plan
func (s *StudyPlanService) GetCourses(planID string) ([]models.Course, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	planObjectID, err := primitive.ObjectIDFromHex(planID)
	if err != nil {
		return nil, errors.New("invalid plan ID")
	}

	collection := s.db.Collection("courses")
	cursor, err := collection.Find(ctx, bson.M{"study_plan_id": planObjectID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var courses []models.Course
	if err = cursor.All(ctx, &courses); err != nil {
		return nil, err
	}

	return courses, nil
}

// CreateScheduleBlock creates a schedule block
func (s *StudyPlanService) CreateScheduleBlock(planID string, dayOfWeek int, startTime, endTime, subject, topic, blockType string) (*models.ScheduleBlock, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	planObjectID, err := primitive.ObjectIDFromHex(planID)
	if err != nil {
		return nil, errors.New("invalid plan ID")
	}

	block := &models.ScheduleBlock{
		StudyPlanID: planObjectID,
		DayOfWeek:   dayOfWeek,
		StartTime:   startTime,
		EndTime:     endTime,
		Subject:     subject,
		Topic:       topic,
		BlockType:   blockType,
		CreatedAt:   time.Now(),
	}

	collection := s.db.Collection("schedule_blocks")
	result, err := collection.InsertOne(ctx, block)
	if err != nil {
		return nil, err
	}

	block.ID = result.InsertedID.(primitive.ObjectID)
	return block, nil
}

// GetScheduleBlocks gets schedule blocks for a study plan
func (s *StudyPlanService) GetScheduleBlocks(planID string) ([]models.ScheduleBlock, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	planObjectID, err := primitive.ObjectIDFromHex(planID)
	if err != nil {
		return nil, errors.New("invalid plan ID")
	}

	collection := s.db.Collection("schedule_blocks")
	cursor, err := collection.Find(
		ctx,
		bson.M{"study_plan_id": planObjectID},
		// Sort by day of week and start time
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var blocks []models.ScheduleBlock
	if err = cursor.All(ctx, &blocks); err != nil {
		return nil, err
	}

	return blocks, nil
}

// UpdateScheduleBlock updates a schedule block
func (s *StudyPlanService) UpdateScheduleBlock(planID, blockID string, data map[string]interface{}) (*models.ScheduleBlock, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	planObjectID, err := primitive.ObjectIDFromHex(planID)
	if err != nil {
		return nil, errors.New("invalid plan ID")
	}

	blockObjectID, err := primitive.ObjectIDFromHex(blockID)
	if err != nil {
		return nil, errors.New("invalid block ID")
	}

	// Verify block belongs to plan
	collection := s.db.Collection("schedule_blocks")
	var existing models.ScheduleBlock
	err = collection.FindOne(ctx, bson.M{
		"_id":          blockObjectID,
		"study_plan_id": planObjectID,
	}).Decode(&existing)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("schedule block not found")
		}
		return nil, err
	}

	// Build update document
	update := bson.M{}
	if dayOfWeek, ok := data["day_of_week"]; ok {
		if d, ok := dayOfWeek.(float64); ok {
			update["day_of_week"] = int(d)
		} else if d, ok := dayOfWeek.(int); ok {
			update["day_of_week"] = d
		}
	}
	if startTime, ok := data["start_time"]; ok {
		if s, ok := startTime.(string); ok {
			update["start_time"] = s
		}
	}
	if endTime, ok := data["end_time"]; ok {
		if e, ok := endTime.(string); ok {
			update["end_time"] = e
		}
	}
	if subject, ok := data["subject"]; ok {
		if s, ok := subject.(string); ok {
			update["subject"] = s
		}
	}
	if topic, ok := data["topic"]; ok {
		if t, ok := topic.(string); ok {
			update["topic"] = t
		}
	}
	if blockType, ok := data["block_type"]; ok {
		if b, ok := blockType.(string); ok {
			update["block_type"] = b
		}
	}

	if len(update) == 0 {
		return &existing, nil // No updates
	}

	// Update block
	_, err = collection.UpdateOne(
		ctx,
		bson.M{"_id": blockObjectID},
		bson.M{"$set": update},
	)
	if err != nil {
		return nil, err
	}

	// Fetch updated block
	var updated models.ScheduleBlock
	err = collection.FindOne(ctx, bson.M{"_id": blockObjectID}).Decode(&updated)
	if err != nil {
		return nil, err
	}

	return &updated, nil
}

// GetUserSchedule gets all schedule blocks for a user across all plans
func (s *StudyPlanService) GetUserSchedule(userID string) ([]models.ScheduleBlock, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// First get user's study plans
	plansCollection := s.db.Collection("study_plans")
	cursor, err := plansCollection.Find(ctx, bson.M{"user_id": userObjectID})
	if err != nil {
		return nil, err
	}

	var plans []models.StudyPlan
	if err = cursor.All(ctx, &plans); err != nil {
		return nil, err
	}
	cursor.Close(ctx)

	// Get plan IDs
	var planIDs []primitive.ObjectID
	for _, plan := range plans {
		planIDs = append(planIDs, plan.ID)
	}

	if len(planIDs) == 0 {
		return []models.ScheduleBlock{}, nil
	}

	// Get all schedule blocks for these plans
	blocksCollection := s.db.Collection("schedule_blocks")
	cursor, err = blocksCollection.Find(ctx, bson.M{
		"study_plan_id": bson.M{"$in": planIDs},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var blocks []models.ScheduleBlock
	if err = cursor.All(ctx, &blocks); err != nil {
		return nil, err
	}

	return blocks, nil
}

// UpdateStudyPlanProgress updates the progress of a study plan
func (s *StudyPlanService) UpdateStudyPlanProgress(planID string, progress float64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	planObjectID, err := primitive.ObjectIDFromHex(planID)
	if err != nil {
		return errors.New("invalid plan ID")
	}

	collection := s.db.Collection("study_plans")
	_, err = collection.UpdateOne(
		ctx,
		bson.M{"_id": planObjectID},
		bson.M{"$set": bson.M{
			"progress":   progress,
			"updated_at": time.Now(),
		}},
	)

	return err
}
