package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Resource represents a file resource
type Resource struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	RoomID      primitive.ObjectID `json:"room_id" bson:"room_id"`
	UploaderID  primitive.ObjectID `json:"uploader_id" bson:"uploader_id"`
	UploaderType string            `json:"uploader_type" bson:"uploader_type"` // "teacher" or "student"
	Name        string             `json:"name" bson:"name"`
	Description string             `json:"description" bson:"description"`
	FileURL     string             `json:"file_url" bson:"file_url"`
	FileType    string             `json:"file_type" bson:"file_type"` // MIME type
	FileSize    int64              `json:"file_size" bson:"file_size"`
	Category    string             `json:"category" bson:"category"` // "video", "notes", "assignment", "book", "other"
	Subject     string             `json:"subject,omitempty" bson:"subject,omitempty"` // Legacy: single subject (deprecated)
	Subjects    []string            `json:"subjects,omitempty" bson:"subjects,omitempty"` // Related syllabus topics/subjects (multiple)
	IsPublic    bool               `json:"is_public" bson:"is_public"` // For student resources: shareable with others
	SharedWith  []primitive.ObjectID `json:"shared_with,omitempty" bson:"shared_with,omitempty"` // For student resources: specific users
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
}
