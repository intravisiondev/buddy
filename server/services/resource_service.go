package services

import (
	"context"
	"errors"
	"time"

	"buddy-server/database"
	"buddy-server/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ResourceService handles resource-related operations
type ResourceService struct {
	db *database.DB
}

// NewResourceService creates a new resource service
func NewResourceService(db *database.DB) *ResourceService {
	return &ResourceService{db: db}
}

// CreateResource creates a new resource
func (s *ResourceService) CreateResource(
	roomID, uploaderID, name, description, fileURL, fileType string,
	fileSize int64, category, subject string, subjects []string, uploaderType string,
) (*models.Resource, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	uploaderObjectID, err := primitive.ObjectIDFromHex(uploaderID)
	if err != nil {
		return nil, errors.New("invalid uploader ID")
	}

	resource := &models.Resource{
		RoomID:       roomObjectID,
		UploaderID:   uploaderObjectID,
		UploaderType: uploaderType, // "teacher" or "student"
		Name:         name,
		Description:  description,
		FileURL:      fileURL,
		FileType:     fileType,
		FileSize:     fileSize,
		Category:     category, // "video", "notes", "assignment", "book", "other"
		Subject:      subject,  // Legacy: single subject (deprecated)
		Subjects:     subjects,  // Related syllabus topics/subjects (multiple)
		IsPublic:     uploaderType == "teacher", // Teacher resources are always public in room
		SharedWith:   []primitive.ObjectID{},
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	collection := s.db.Collection("resources")
	result, err := collection.InsertOne(ctx, resource)
	if err != nil {
		return nil, err
	}

	resource.ID = result.InsertedID.(primitive.ObjectID)
	return resource, nil
}

// GetResources gets all resources for a room, filtered by uploader type
func (s *ResourceService) GetResources(roomID, uploaderType, category string, userID *string) ([]models.Resource, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	filter := bson.M{"room_id": roomObjectID}

	// Filter by uploader type (teacher or student)
	if uploaderType != "" {
		filter["uploader_type"] = uploaderType
	}

	// Filter by category
	if category != "" && category != "all" {
		filter["category"] = category
	}

	// For student resources, filter based on visibility
	if uploaderType == "student" && userID != nil {
		userObjectID, err := primitive.ObjectIDFromHex(*userID)
		if err == nil {
			// Show resources that are:
			// 1. Owned by the user
			// 2. Shared with the user (in shared_with array)
			// 3. Public (is_public = true)
			filter["$or"] = []bson.M{
				{"uploader_id": userObjectID},
				{"shared_with": userObjectID},
				{"is_public": true},
			}
		}
	}

	collection := s.db.Collection("resources")
	cursor, err := collection.Find(
		ctx,
		filter,
		options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var resources []models.Resource
	if err = cursor.All(ctx, &resources); err != nil {
		return nil, err
	}

	return resources, nil
}

// GetResource gets a single resource by ID
func (s *ResourceService) GetResource(resourceID string) (*models.Resource, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(resourceID)
	if err != nil {
		return nil, errors.New("invalid resource ID")
	}

	collection := s.db.Collection("resources")
	var resource models.Resource
	err = collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&resource)
	if err != nil {
		return nil, err
	}

	return &resource, nil
}

// DeleteResource deletes a resource (only by uploader)
func (s *ResourceService) DeleteResource(resourceID, userID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	resourceObjectID, err := primitive.ObjectIDFromHex(resourceID)
	if err != nil {
		return errors.New("invalid resource ID")
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	collection := s.db.Collection("resources")
	result, err := collection.DeleteOne(ctx, bson.M{
		"_id":        resourceObjectID,
		"uploader_id": userObjectID,
	})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("resource not found or you don't have permission")
	}

	return nil
}

// ShareResource shares a student resource with specific users
func (s *ResourceService) ShareResource(resourceID, uploaderID string, sharedWith []string, isPublic bool) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	resourceObjectID, err := primitive.ObjectIDFromHex(resourceID)
	if err != nil {
		return errors.New("invalid resource ID")
	}

	uploaderObjectID, err := primitive.ObjectIDFromHex(uploaderID)
	if err != nil {
		return errors.New("invalid uploader ID")
	}

	// Convert sharedWith IDs to ObjectIDs
	var sharedWithObjectIDs []primitive.ObjectID
	for _, userID := range sharedWith {
		objectID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			sharedWithObjectIDs = append(sharedWithObjectIDs, objectID)
		}
	}

	collection := s.db.Collection("resources")
	_, err = collection.UpdateOne(
		ctx,
		bson.M{
			"_id":        resourceObjectID,
			"uploader_id": uploaderObjectID,
			"uploader_type": "student", // Only student resources can be shared
		},
		bson.M{
			"$set": bson.M{
				"shared_with": sharedWithObjectIDs,
				"is_public":   isPublic,
				"updated_at":  time.Now(),
			},
		},
	)

	if err != nil {
		return err
	}

	return nil
}
