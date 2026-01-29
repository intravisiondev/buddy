package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// StudyPlan represents a study plan
type StudyPlan struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID         primitive.ObjectID `json:"user_id" bson:"user_id"`
	Name           string             `json:"name" bson:"name"`
	Description    string             `json:"description" bson:"description"`
	StartDate      time.Time          `json:"start_date" bson:"start_date"`
	EndDate        time.Time          `json:"end_date" bson:"end_date"`
	DailyGoalHours float64            `json:"daily_goal_hours" bson:"daily_goal_hours"`
	IsChallenge    bool               `json:"is_challenge" bson:"is_challenge"`
	IsPublic       bool               `json:"is_public" bson:"is_public"`
	Progress       float64            `json:"progress" bson:"progress"`
	CreatedAt      time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at" bson:"updated_at"`
}

// Course represents a course in a study plan
type Course struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	StudyPlanID    primitive.ObjectID `json:"study_plan_id" bson:"study_plan_id"`
	Subject        string             `json:"subject" bson:"subject"`
	HoursAllocated float64            `json:"hours_allocated" bson:"hours_allocated"`
	HoursCompleted float64            `json:"hours_completed" bson:"hours_completed"`
	CreatedAt      time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at" bson:"updated_at"`
}

// ScheduleBlock represents a scheduled study block
type ScheduleBlock struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	StudyPlanID  primitive.ObjectID `json:"study_plan_id" bson:"study_plan_id"`
	DayOfWeek    int                `json:"day_of_week" bson:"day_of_week"` // 0=Sunday, 6=Saturday
	StartTime    string             `json:"start_time" bson:"start_time"`   // HH:MM format
	EndTime      string             `json:"end_time" bson:"end_time"`       // HH:MM format
	Subject      string             `json:"subject" bson:"subject"`
	Topic        string             `json:"topic" bson:"topic"`
	BlockType    string             `json:"block_type" bson:"block_type"` // "study", "break", "review"
	CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
}

// StudyPlanParticipant represents a participant in a challenge
type StudyPlanParticipant struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	StudyPlanID  primitive.ObjectID `json:"study_plan_id" bson:"study_plan_id"`
	UserID       primitive.ObjectID `json:"user_id" bson:"user_id"`
	Progress     float64            `json:"progress" bson:"progress"`
	JoinedAt     time.Time          `json:"joined_at" bson:"joined_at"`
}

// Milestone represents a progress milestone
type Milestone struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID      primitive.ObjectID `json:"user_id" bson:"user_id"`
	StudyPlanID *primitive.ObjectID `json:"study_plan_id,omitempty" bson:"study_plan_id,omitempty"`
	Title       string             `json:"title" bson:"title"`
	Description string             `json:"description,omitempty" bson:"description,omitempty"`
	TargetDate  time.Time          `json:"target_date" bson:"target_date"`
	Progress    float64            `json:"progress" bson:"progress"` // 0-100
	Completed   bool               `json:"completed" bson:"completed"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	CompletedAt *time.Time         `json:"completed_at,omitempty" bson:"completed_at,omitempty"`
}

// StudySession represents a completed study session
type StudySession struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID      primitive.ObjectID `json:"user_id" bson:"user_id"`
	StudyPlanID *primitive.ObjectID `json:"study_plan_id,omitempty" bson:"study_plan_id,omitempty"`
	Subject     string             `json:"subject" bson:"subject"`
	Topic       string             `json:"topic,omitempty" bson:"topic,omitempty"`
	Duration    int                `json:"duration" bson:"duration"` // minutes
	StartTime   time.Time          `json:"start_time" bson:"start_time"`
	EndTime     time.Time          `json:"end_time" bson:"end_time"`
	Notes       string             `json:"notes,omitempty" bson:"notes,omitempty"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
}
