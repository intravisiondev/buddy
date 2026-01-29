package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Goal represents a user goal
type Goal struct {
	ID          primitive.ObjectID  `json:"id" bson:"_id,omitempty"`
	UserID      primitive.ObjectID  `json:"user_id" bson:"user_id"`
	StudyPlanID *primitive.ObjectID `json:"study_plan_id,omitempty" bson:"study_plan_id,omitempty"`
	Title       string              `json:"title" bson:"title"`
	Description string              `json:"description,omitempty" bson:"description,omitempty"`
	Subject     string              `json:"subject,omitempty" bson:"subject,omitempty"`
	DueDate     time.Time           `json:"due_date" bson:"due_date"`
	Completed   bool                `json:"completed" bson:"completed"`
	Priority    string              `json:"priority,omitempty" bson:"priority,omitempty"` // "high", "medium", "low"
	CreatedAt   time.Time           `json:"created_at" bson:"created_at"`
	CompletedAt *time.Time          `json:"completed_at,omitempty" bson:"completed_at,omitempty"`
	UpdatedAt   time.Time           `json:"updated_at,omitempty" bson:"updated_at,omitempty"`
}

// ActivityLog represents a user activity
type ActivityLog struct {
	ID              primitive.ObjectID  `json:"id" bson:"_id,omitempty"`
	UserID          primitive.ObjectID  `json:"user_id" bson:"user_id"`
	StudyPlanID     *primitive.ObjectID `json:"study_plan_id,omitempty" bson:"study_plan_id,omitempty"`
	ActivityType    string              `json:"activity_type" bson:"activity_type"` // "study", "assignment", "quiz", "game"
	Description     string              `json:"description" bson:"description"`
	Subject         string              `json:"subject" bson:"subject"`
	DurationMinutes int                 `json:"duration_minutes" bson:"duration_minutes"`
	XPEarned        int                 `json:"xp_earned" bson:"xp_earned"`
	Notes           string              `json:"notes,omitempty" bson:"notes,omitempty"`
	FocusScore      int                 `json:"focus_score,omitempty" bson:"focus_score,omitempty"` // 0-100
	Breaks          []Break             `json:"breaks,omitempty" bson:"breaks,omitempty"`
	CreatedAt       time.Time           `json:"created_at" bson:"created_at"`
}

// Break represents a break during a study session
type Break struct {
	StartTime       time.Time  `json:"start_time" bson:"start_time"`
	EndTime         *time.Time `json:"end_time,omitempty" bson:"end_time,omitempty"`
	DurationSeconds int        `json:"duration_seconds" bson:"duration_seconds"`
}

// ActiveStudySession represents an ongoing study session
type ActiveStudySession struct {
	ID               primitive.ObjectID  `json:"id" bson:"_id,omitempty"`
	UserID           primitive.ObjectID  `json:"user_id" bson:"user_id"`
	StudyPlanID      *primitive.ObjectID `json:"study_plan_id,omitempty" bson:"study_plan_id,omitempty"`
	Subject          string              `json:"subject" bson:"subject"`
	StartTime        time.Time           `json:"start_time" bson:"start_time"`
	LastActiveTime   time.Time           `json:"last_active_time" bson:"last_active_time"`
	IsIdle           bool                `json:"is_idle" bson:"is_idle"`
	TotalStudySeconds int               `json:"total_study_seconds" bson:"total_study_seconds"`
	Breaks           []Break             `json:"breaks" bson:"breaks"`
	CreatedAt        time.Time           `json:"created_at" bson:"created_at"`
	UpdatedAt        time.Time           `json:"updated_at" bson:"updated_at"`
}
