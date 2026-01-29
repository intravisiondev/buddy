package services

import (
	"context"
	"errors"
	"time"

	"buddy-server/database"
	"buddy-server/models"

	"golang.org/x/crypto/bcrypt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// UserService handles user-related operations
type UserService struct {
	db *database.DB
}

// NewUserService creates a new user service
func NewUserService(db *database.DB) *UserService {
	return &UserService{db: db}
}

// GetProfile gets a user's profile, creating one if it doesn't exist
func (s *UserService) GetProfile(userID string) (*models.Profile, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	collection := s.db.Collection("profiles")
	var profile models.Profile
	err = collection.FindOne(ctx, bson.M{"user_id": objectID}).Decode(&profile)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Profile doesn't exist, create a new one
			now := time.Now()
			profile = models.Profile{
				UserID:    objectID,
				Bio:       "",
				AvatarURL: "",
				Grade:     "",
				School:    "",
				Interests: []string{},
				CreatedAt: now,
				UpdatedAt: now,
			}
			result, err := collection.InsertOne(ctx, profile)
			if err != nil {
				return nil, err
			}
			profile.ID = result.InsertedID.(primitive.ObjectID)
			return &profile, nil
		}
		return nil, err
	}

	return &profile, nil
}

// UpdateProfile updates a user's profile
func (s *UserService) UpdateProfile(userID string, updates map[string]interface{}) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	updates["updated_at"] = time.Now()

	collection := s.db.Collection("profiles")
	_, err = collection.UpdateOne(
		ctx,
		bson.M{"user_id": objectID},
		bson.M{"$set": updates},
	)

	return err
}

// GetUserStats gets a user's statistics
func (s *UserService) GetUserStats(userID string) (*models.UserStats, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	collection := s.db.Collection("user_stats")
	var stats models.UserStats
	err = collection.FindOne(ctx, bson.M{"user_id": objectID}).Decode(&stats)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("stats not found")
		}
		return nil, err
	}

	return &stats, nil
}

// AddXP adds experience points to a user
func (s *UserService) AddXP(userID string, xp int) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	collection := s.db.Collection("user_stats")
	
	// Get current stats
	var stats models.UserStats
	err = collection.FindOne(ctx, bson.M{"user_id": objectID}).Decode(&stats)
	if err != nil {
		return err
	}

	// Calculate new level (simple: level = totalXP / 100)
	newTotalXP := stats.TotalXP + xp
	newLevel := (newTotalXP / 100) + 1

	// Update stats
	_, err = collection.UpdateOne(
		ctx,
		bson.M{"user_id": objectID},
		bson.M{
			"$set": bson.M{
				"total_xp":  newTotalXP,
				"level":     newLevel,
				"weekly_xp": stats.WeeklyXP + xp,
				"updated_at": time.Now(),
			},
		},
	)

	return err
}

// UpdateStreak updates a user's study streak
func (s *UserService) UpdateStreak(userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	collection := s.db.Collection("user_stats")
	
	var stats models.UserStats
	err = collection.FindOne(ctx, bson.M{"user_id": objectID}).Decode(&stats)
	if err != nil {
		return err
	}

	now := time.Now()
	yesterday := now.AddDate(0, 0, -1)

	// Check if last study was yesterday
	if stats.LastStudyDate.Format("2006-01-02") == yesterday.Format("2006-01-02") {
		// Continue streak
		stats.CurrentStreak++
		if stats.CurrentStreak > stats.LongestStreak {
			stats.LongestStreak = stats.CurrentStreak
		}
	} else if stats.LastStudyDate.Format("2006-01-02") != now.Format("2006-01-02") {
		// Reset streak
		stats.CurrentStreak = 1
	}

	stats.LastStudyDate = now
	stats.UpdatedAt = now

	_, err = collection.UpdateOne(
		ctx,
		bson.M{"user_id": objectID},
		bson.M{"$set": stats},
	)

	return err
}

// AddStudyTime adds study time to user's total
func (s *UserService) AddStudyTime(userID string, hours float64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	collection := s.db.Collection("user_stats")
	_, err = collection.UpdateOne(
		ctx,
		bson.M{"user_id": objectID},
		bson.M{
			"$inc": bson.M{"total_study_hours": hours},
			"$set": bson.M{"updated_at": time.Now()},
		},
	)

	return err
}

// SearchUsers searches users by name
func (s *UserService) SearchUsers(query string, limit int) ([]models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := s.db.Collection("users")
	
	filter := bson.M{
		"name": bson.M{"$regex": query, "$options": "i"},
	}

	cursor, err := collection.Find(ctx, filter, options.Find().SetLimit(int64(limit)))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err = cursor.All(ctx, &users); err != nil {
		return nil, err
	}

	return users, nil
}

// GetChildren gets all children (students) for a parent
func (s *UserService) GetChildren(parentID string) ([]models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	parentObjectID, err := primitive.ObjectIDFromHex(parentID)
	if err != nil {
		return nil, errors.New("invalid parent ID")
	}

	collection := s.db.Collection("users")
	cursor, err := collection.Find(ctx, bson.M{
		"parent_id": parentObjectID,
		"role":      "student",
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var children []models.User
	if err = cursor.All(ctx, &children); err != nil {
		return nil, err
	}

	return children, nil
}

// CreateChild creates a new student account linked to a parent
func (s *UserService) CreateChild(parentID, email, password, name string, age int) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	parentObjectID, err := primitive.ObjectIDFromHex(parentID)
	if err != nil {
		return nil, errors.New("invalid parent ID")
	}

	// Check if user exists
	collection := s.db.Collection("users")
	var existingUser models.User
	err = collection.FindOne(ctx, bson.M{"email": email}).Decode(&existingUser)
	if err == nil {
		return nil, errors.New("user already exists")
	}
	if err != mongo.ErrNoDocuments {
		return nil, err
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create student user
	user := &models.User{
		Email:     email,
		Password:  string(hashedPassword),
		Name:      name,
		Age:       age,
		Role:      "student",
		ParentID:  &parentObjectID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	result, err := collection.InsertOne(ctx, user)
	if err != nil {
		return nil, err
	}

	user.ID = result.InsertedID.(primitive.ObjectID)

	// Create user stats
	statsCollection := s.db.Collection("user_stats")
	stats := &models.UserStats{
		UserID:        user.ID,
		TotalXP:       0,
		Level:         1,
		Gems:          0,
		Tokens:        0,
		BadgesEarned:  0,
		CurrentStreak: 0,
		LongestStreak: 0,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	_, err = statsCollection.InsertOne(ctx, stats)
	if err != nil {
		// Log error but don't fail user creation
		// TODO: Add logging
	}

	return user, nil
}
