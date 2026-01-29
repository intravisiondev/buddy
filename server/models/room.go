package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// WeeklySchedule represents a weekly class schedule
type WeeklySchedule struct {
	Day       string `json:"day" bson:"day"`             // "Monday", "Tuesday", etc.
	StartTime string `json:"start_time" bson:"start_time"` // "14:00"
	EndTime   string `json:"end_time" bson:"end_time"`     // "16:00"
}

// SyllabusItem represents a topic/subject in the course syllabus
type SyllabusItem struct {
	Title       string `json:"title" bson:"title"`             // Topic title
	Description string `json:"description" bson:"description"` // Topic description
	Order       int    `json:"order" bson:"order"`             // Display order
}

// Syllabus represents the course syllabus structure
type Syllabus struct {
	Description string        `json:"description,omitempty" bson:"description,omitempty"` // Overall course description
	Items       []SyllabusItem `json:"items,omitempty" bson:"items,omitempty"`            // List of topics/subjects
}

// ExamDate represents an exam date for a course
type ExamDate struct {
	Title       string    `json:"title" bson:"title"`             // Exam title (e.g., "Midterm Exam", "Final Exam")
	Date        time.Time `json:"date" bson:"date"`               // Exam date and time
	Description string    `json:"description,omitempty" bson:"description,omitempty"` // Additional details
	Subject     string    `json:"subject,omitempty" bson:"subject,omitempty"`          // Related syllabus topic/subject
}

// Room represents a study room or classroom
type Room struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name           string             `json:"name" bson:"name"`
	Subject        string             `json:"subject" bson:"subject"`
	Description    string             `json:"description" bson:"description"`
	OwnerID        primitive.ObjectID `json:"owner_id" bson:"owner_id"`
	IsPrivate      bool               `json:"is_private" bson:"is_private"`
	MaxMembers     int                `json:"max_members" bson:"max_members"`
	IsLive         bool               `json:"is_live" bson:"is_live"`
	
	// Extended fields for course information
	TeacherName      string            `json:"teacher_name,omitempty" bson:"teacher_name,omitempty"`
	TeacherBio       string            `json:"teacher_bio,omitempty" bson:"teacher_bio,omitempty"`
	Schedule         []WeeklySchedule  `json:"schedule,omitempty" bson:"schedule,omitempty"`
	StartDate        *time.Time        `json:"start_date,omitempty" bson:"start_date,omitempty"`
	EndDate          *time.Time        `json:"end_date,omitempty" bson:"end_date,omitempty"`
	RegistrationEnd  *time.Time        `json:"registration_end,omitempty" bson:"registration_end,omitempty"`
	Syllabus         *Syllabus         `json:"syllabus,omitempty" bson:"syllabus,omitempty"`           // Structured syllabus with topics
	ExamDates        []ExamDate        `json:"exam_dates,omitempty" bson:"exam_dates,omitempty"`      // Exam dates for the course
	
	CreatedAt      time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at" bson:"updated_at"`
}

// RoomMember represents a member of a room
type RoomMember struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	RoomID    primitive.ObjectID `json:"room_id" bson:"room_id"`
	UserID    primitive.ObjectID `json:"user_id" bson:"user_id"`
	Role      string             `json:"role" bson:"role"` // "member", "moderator", "owner"
	IsActive  bool               `json:"is_active" bson:"is_active"`
	JoinedAt  time.Time          `json:"joined_at" bson:"joined_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}

// Message represents a chat message
type Message struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	RoomID      primitive.ObjectID `json:"room_id" bson:"room_id"`
	UserID      primitive.ObjectID `json:"user_id" bson:"user_id"`
	Content     string             `json:"content" bson:"content"`
	MessageType string             `json:"message_type" bson:"message_type"` // "text", "file", "image", "link"
	FileURL     string             `json:"file_url,omitempty" bson:"file_url,omitempty"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
}
