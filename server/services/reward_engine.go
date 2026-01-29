package services

import (
	"context"
	"time"

	"buddy-server/database"
	"buddy-server/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// RewardEventType defines reward triggers
type RewardEventType string

const (
	EventGoalCompleted RewardEventType = "goal_completed"
	EventXPGranted     RewardEventType = "xp_granted"
	EventStudySessionLogged RewardEventType = "study_session_logged"
	EventStreakUpdated      RewardEventType = "streak_updated"
)

// RewardEvent describes an event that may yield rewards
type RewardEvent struct {
	Type   RewardEventType
	UserID primitive.ObjectID
	Meta   map[string]interface{}
	Now    time.Time
}

// RewardDelta represents changes to apply to a user's stats plus optional badge grants
type RewardDelta struct {
	XP     int
	Gems   int
	Tokens int

	// Badge names (canonical) to grant if criteria met
	BadgesToGrant []string
}

// RewardEngine evaluates events and returns rewards
type RewardEngine struct {
	db *database.DB
}

func NewRewardEngine(db *database.DB) *RewardEngine {
	return &RewardEngine{db: db}
}

func (e *RewardEngine) Evaluate(ev RewardEvent) (RewardDelta, error) {
	switch ev.Type {
	case EventGoalCompleted:
		return e.onGoalCompleted(ev)
	case EventStudySessionLogged:
		return e.onStudySessionLogged(ev)
	case EventStreakUpdated:
		return e.onStreakUpdated(ev)
	default:
		return RewardDelta{}, nil
	}
}

func (e *RewardEngine) onGoalCompleted(ev RewardEvent) (RewardDelta, error) {
	delta := RewardDelta{
		XP:     10,
		Gems:   1,
		Tokens: 0,
	}

	// Priority-based XP (optional)
	if p, ok := ev.Meta["priority"].(string); ok {
		switch p {
		case "high":
			delta.XP = 20
		case "medium":
			delta.XP = 10
		case "low":
			delta.XP = 5
		}
	}

	// Badge: first completed goal
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	goals := e.db.Collection("goals")
	count, err := goals.CountDocuments(ctx, bson.M{"user_id": ev.UserID, "completed": true})
	if err == nil && count == 1 {
		delta.BadgesToGrant = append(delta.BadgesToGrant, "First Goal")
	}

	// Badge: 10 completed goals
	if err == nil && count == 10 {
		delta.BadgesToGrant = append(delta.BadgesToGrant, "Goal Machine")
	}

	return delta, nil
}

func (e *RewardEngine) onStudySessionLogged(ev RewardEvent) (RewardDelta, error) {
	// Meta: duration_minutes (int/float64)
	minutes := 0
	switch v := ev.Meta["duration_minutes"].(type) {
	case int:
		minutes = v
	case int64:
		minutes = int(v)
	case float64:
		minutes = int(v)
	}

	if minutes <= 0 {
		return RewardDelta{}, nil
	}

	// Base XP: 1 XP per minute (cap 240min => 240 XP per session)
	if minutes > 240 {
		minutes = 240
	}

	delta := RewardDelta{
		XP: minutes,
	}

	// Tokens: 1 token per 60 minutes (floor)
	delta.Tokens = minutes / 60

	// Gems: 1 gem if session >= 90 minutes
	if minutes >= 90 {
		delta.Gems = 1
	}

	// Badge: first study session
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	logs := e.db.Collection("activity_logs")
	count, err := logs.CountDocuments(ctx, bson.M{"user_id": ev.UserID, "activity_type": "study"})
	if err == nil && count == 1 {
		delta.BadgesToGrant = append(delta.BadgesToGrant, "First Study Session")
	}

	return delta, nil
}

func (e *RewardEngine) onStreakUpdated(ev RewardEvent) (RewardDelta, error) {
	// Meta: current_streak (int/float64)
	streak := 0
	switch v := ev.Meta["current_streak"].(type) {
	case int:
		streak = v
	case int64:
		streak = int(v)
	case float64:
		streak = int(v)
	}
	if streak <= 0 {
		return RewardDelta{}, nil
	}

	delta := RewardDelta{}
	switch streak {
	case 7:
		delta.Gems = 5
		delta.BadgesToGrant = append(delta.BadgesToGrant, "7-Day Streak")
	case 30:
		delta.Gems = 20
		delta.Tokens = 10
		delta.BadgesToGrant = append(delta.BadgesToGrant, "30-Day Streak")
	}
	return delta, nil
}

// EnsureDefaultBadges seeds badge definitions if missing
func (e *RewardEngine) EnsureDefaultBadges() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	badges := e.db.Collection("badges")

	defaults := []models.Badge{
		{
			Name:        "First Goal",
			Description: "Complete your first goal",
			IconURL:     "",
			Category:    "achievement",
			XPReward:    0,
			Criteria:    map[string]interface{}{"type": "goal_completed", "count": 1},
			CreatedAt:   time.Now(),
		},
		{
			Name:        "Goal Machine",
			Description: "Complete 10 goals",
			IconURL:     "",
			Category:    "achievement",
			XPReward:    0,
			Criteria:    map[string]interface{}{"type": "goal_completed", "count": 10},
			CreatedAt:   time.Now(),
		},
		{
			Name:        "First Study Session",
			Description: "Log your first study session",
			IconURL:     "",
			Category:    "achievement",
			XPReward:    0,
			Criteria:    map[string]interface{}{"type": "study_session_logged", "count": 1},
			CreatedAt:   time.Now(),
		},
		{
			Name:        "7-Day Streak",
			Description: "Maintain a 7-day study streak",
			IconURL:     "",
			Category:    "milestone",
			XPReward:    0,
			Criteria:    map[string]interface{}{"type": "streak", "days": 7},
			CreatedAt:   time.Now(),
		},
		{
			Name:        "30-Day Streak",
			Description: "Maintain a 30-day study streak",
			IconURL:     "",
			Category:    "milestone",
			XPReward:    0,
			Criteria:    map[string]interface{}{"type": "streak", "days": 30},
			CreatedAt:   time.Now(),
		},
	}

	for _, b := range defaults {
		err := badges.FindOne(ctx, bson.M{"name": b.Name}).Err()
		if err == nil {
			continue
		}
		if err != mongo.ErrNoDocuments {
			continue
		}
		// if not found, insert
		_, _ = badges.InsertOne(ctx, b)
	}
	return nil
}

