package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Assignment represents a teacher assignment
type Assignment struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	RoomID         primitive.ObjectID `json:"room_id" bson:"room_id"`
	TeacherID      primitive.ObjectID `json:"teacher_id" bson:"teacher_id"`
	Title          string             `json:"title" bson:"title"`
	Description    string             `json:"description" bson:"description"`
	DueDate        time.Time          `json:"due_date" bson:"due_date"`
	TotalPoints    int                `json:"total_points" bson:"total_points"`
	AssignmentType string             `json:"assignment_type" bson:"assignment_type"` // "homework", "quiz", "project", "exam"
	Subjects       []string           `json:"subjects,omitempty" bson:"subjects,omitempty"` // Related syllabus topics/subjects (multiple)
	CreatedAt      time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at" bson:"updated_at"`
}

// Submission represents a student submission
type Submission struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	AssignmentID primitive.ObjectID `json:"assignment_id" bson:"assignment_id"`
	StudentID    primitive.ObjectID `json:"student_id" bson:"student_id"`
	Content      string             `json:"content" bson:"content"`
	FileURL      string             `json:"file_url,omitempty" bson:"file_url,omitempty"`
	Status       string             `json:"status" bson:"status"` // "pending", "submitted", "graded"
	Score        int                `json:"score" bson:"score"`
	Feedback     string             `json:"feedback" bson:"feedback"`
	GradedBy     primitive.ObjectID `json:"graded_by,omitempty" bson:"graded_by,omitempty"`
	SubmittedAt  time.Time          `json:"submitted_at" bson:"submitted_at"`
	GradedAt     time.Time          `json:"graded_at,omitempty" bson:"graded_at,omitempty"`
}
