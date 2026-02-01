package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// MatchSession represents a multiplayer game session
type MatchSession struct {
	ID     primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	GameID primitive.ObjectID `json:"game_id" bson:"game_id"`
	RoomID primitive.ObjectID `json:"room_id" bson:"room_id"`

	Players []MatchPlayer `json:"players" bson:"players"`
	State   string        `json:"state" bson:"state"` // "lobby", "countdown", "active", "paused", "completed"

	Config  MatchConfig   `json:"config" bson:"config"`
	Results *MatchResult  `json:"results,omitempty" bson:"results,omitempty"`

	StartedAt   time.Time  `json:"started_at" bson:"started_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty" bson:"completed_at,omitempty"`
}

// MatchPlayer represents a player in a match
type MatchPlayer struct {
	UserID   primitive.ObjectID `json:"user_id" bson:"user_id"`
	Name     string             `json:"name" bson:"name"`
	Avatar   string             `json:"avatar,omitempty" bson:"avatar,omitempty"`
	Score    int                `json:"score" bson:"score"`
	Rank     int                `json:"rank" bson:"rank"`
	Events   []PlayerEvent      `json:"events" bson:"events"`
	JoinedAt time.Time          `json:"joined_at" bson:"joined_at"`
	LeftAt   *time.Time         `json:"left_at,omitempty" bson:"left_at,omitempty"`
}

// MatchConfig represents match configuration
type MatchConfig struct {
	Mode       string `json:"mode" bson:"mode"` // "competitive", "cooperative", "time_trial"
	Duration   int    `json:"duration" bson:"duration"` // seconds
	MaxPlayers int    `json:"max_players" bson:"max_players"`
	Private    bool   `json:"private" bson:"private"`
}

// MatchResult represents the outcome of a match
type MatchResult struct {
	Winner   *primitive.ObjectID    `json:"winner,omitempty" bson:"winner,omitempty"`
	Rankings []PlayerRanking        `json:"rankings" bson:"rankings"`
	Stats    map[string]interface{} `json:"stats,omitempty" bson:"stats,omitempty"`
}

// PlayerRanking represents a player's final ranking
type PlayerRanking struct {
	UserID       primitive.ObjectID `json:"user_id" bson:"user_id"`
	Rank         int                `json:"rank" bson:"rank"`
	Score        int                `json:"score" bson:"score"`
	Accuracy     float64            `json:"accuracy" bson:"accuracy"`
	TotalAnswers int                `json:"total_answers" bson:"total_answers"`
	CorrectAnswers int              `json:"correct_answers" bson:"correct_answers"`
}

// PlayerEvent represents an action during gameplay
type PlayerEvent struct {
	Type      string                 `json:"type" bson:"type"` // "answer", "powerup", "collision", "disconnect"
	Data      map[string]interface{} `json:"data" bson:"data"`
	Timestamp time.Time              `json:"timestamp" bson:"timestamp"`
}

// MatchInvite represents an invitation to join a private match
type MatchInvite struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	MatchID   primitive.ObjectID `json:"match_id" bson:"match_id"`
	FromUser  primitive.ObjectID `json:"from_user" bson:"from_user"`
	ToUser    primitive.ObjectID `json:"to_user" bson:"to_user"`
	Status    string             `json:"status" bson:"status"` // "pending", "accepted", "declined", "expired"
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	ExpiresAt time.Time          `json:"expires_at" bson:"expires_at"`
}
