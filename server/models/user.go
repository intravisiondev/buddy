package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User represents a user account
type User struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Email        string             `json:"email" bson:"email"`
	Password     string             `json:"-" bson:"password"` // Never expose in JSON
	Name         string             `json:"name" bson:"name"`
	Age          int                `json:"age" bson:"age"`
	Role         string             `json:"role" bson:"role"` // "student", "parent", "teacher"
	ParentID     *primitive.ObjectID `json:"parent_id,omitempty" bson:"parent_id,omitempty"` // For students: link to parent
	CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
}

// Profile represents a user profile
type Profile struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID    primitive.ObjectID `json:"user_id" bson:"user_id"`
	Bio       string             `json:"bio" bson:"bio"`
	AvatarURL string             `json:"avatar_url" bson:"avatar_url"`
	Grade     string             `json:"grade" bson:"grade"`
	School    string             `json:"school" bson:"school"`
	Interests []string           `json:"interests" bson:"interests"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}

// UserStats represents user statistics
type UserStats struct {
	ID               primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID           primitive.ObjectID `json:"user_id" bson:"user_id"`
	TotalXP          int                `json:"total_xp" bson:"total_xp"`
	Level            int                `json:"level" bson:"level"`
	CurrentStreak    int                `json:"current_streak" bson:"current_streak"`
	LongestStreak    int                `json:"longest_streak" bson:"longest_streak"`
	LastStudyDate    time.Time          `json:"last_study_date" bson:"last_study_date"`
	TotalStudyHours  float64            `json:"total_study_hours" bson:"total_study_hours"`
	WeeklyXP         int                `json:"weekly_xp" bson:"weekly_xp"`
	Gems             int                `json:"gems" bson:"gems"`
	Tokens           int                `json:"tokens" bson:"tokens"`
	BadgesEarned     int                `json:"badges_earned" bson:"badges_earned"`
	CreatedAt        time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt        time.Time          `json:"updated_at" bson:"updated_at"`
}
