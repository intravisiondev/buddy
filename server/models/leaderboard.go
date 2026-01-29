package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Badge represents an achievement badge
type Badge struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name        string             `json:"name" bson:"name"`
	Description string             `json:"description" bson:"description"`
	IconURL     string             `json:"icon_url" bson:"icon_url"`
	Category    string             `json:"category" bson:"category"` // "achievement", "milestone", "special"
	XPReward    int                `json:"xp_reward" bson:"xp_reward"`
	Criteria    map[string]interface{} `json:"criteria" bson:"criteria"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
}

// UserBadge represents a badge earned by a user
type UserBadge struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID    primitive.ObjectID `json:"user_id" bson:"user_id"`
	BadgeID   primitive.ObjectID `json:"badge_id" bson:"badge_id"`
	EarnedAt  time.Time          `json:"earned_at" bson:"earned_at"`
}

// LeaderboardEntry represents a user's position in leaderboard
type LeaderboardEntry struct {
	UserID    primitive.ObjectID `json:"user_id" bson:"user_id"`
	Name      string             `json:"name" bson:"name"`
	AvatarURL string             `json:"avatar_url" bson:"avatar_url"`
	TotalXP   int                `json:"total_xp" bson:"total_xp"`
	WeeklyXP  int                `json:"weekly_xp" bson:"weekly_xp"`
	Level     int                `json:"level" bson:"level"`
	Rank      int                `json:"rank" bson:"rank"`
}
