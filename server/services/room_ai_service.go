package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"buddy-server/database"
	"buddy-server/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// RoomAIService handles AI features for study rooms
type RoomAIService struct {
	db            *database.DB
	geminiService *GeminiService
}

// NewRoomAIService creates a new room AI service
func NewRoomAIService(db *database.DB, geminiService *GeminiService) *RoomAIService {
	return &RoomAIService{
		db:            db,
		geminiService: geminiService,
	}
}

// TrainRoomAI trains the AI with room resources
func (s *RoomAIService) TrainRoomAI(roomID string, resourceIDs []string) (*models.RoomAIContext, error) {
	if s.geminiService == nil {
		return nil, errors.New("AI service not available")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	roomOID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	// Convert resource IDs to ObjectIDs
	var resourceOIDs []primitive.ObjectID
	for _, id := range resourceIDs {
		oid, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			continue
		}
		resourceOIDs = append(resourceOIDs, oid)
	}

	// Fetch resources
	resourcesCollection := s.db.Collection("resources")
	cursor, err := resourcesCollection.Find(ctx, bson.M{
		"_id": bson.M{"$in": resourceOIDs},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var resources []models.Resource
	if err := cursor.All(ctx, &resources); err != nil {
		return nil, err
	}

	// Extract training content
	var trainingContent strings.Builder
	for _, resource := range resources {
		trainingContent.WriteString("Resource: ")
		trainingContent.WriteString(resource.Name)
		trainingContent.WriteString("\n")
		
		if resource.Description != "" {
			trainingContent.WriteString("Description: ")
			trainingContent.WriteString(resource.Description)
			trainingContent.WriteString("\n")
		}
		
		if resource.FileType != "" {
			trainingContent.WriteString("File Type: ")
			trainingContent.WriteString(resource.FileType)
			trainingContent.WriteString("\n")
		}
		
		// For text files, include content
		// For other types, include metadata only
		trainingContent.WriteString("\n---\n\n")
	}

	// Get room's syllabus if exists
	var room models.Room
	roomCollection := s.db.Collection("rooms")
	err = roomCollection.FindOne(ctx, bson.M{"_id": roomOID}).Decode(&room)
	if err != nil && err != mongo.ErrNoDocuments {
		return nil, err
	}

	// Create or update RoomAIContext
	aiContext := &models.RoomAIContext{
		RoomID:             roomOID,
		TrainedResourceIDs: resourceOIDs,
		TrainingContent:    trainingContent.String(),
		Syllabus:           room.Syllabus,
		MessageCount:       0,
		LastTrainedAt:      time.Now(),
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	collection := s.db.Collection("room_ai_contexts")
	
	// Check if context already exists
	var existing models.RoomAIContext
	err = collection.FindOne(ctx, bson.M{"room_id": roomOID}).Decode(&existing)
	
	if err == mongo.ErrNoDocuments {
		// Create new
		result, err := collection.InsertOne(ctx, aiContext)
		if err != nil {
			return nil, err
		}
		aiContext.ID = result.InsertedID.(primitive.ObjectID)
	} else if err == nil {
		// Update existing
		aiContext.ID = existing.ID
		aiContext.CreatedAt = existing.CreatedAt
		aiContext.MessageCount = existing.MessageCount
		
		_, err = collection.UpdateOne(ctx, bson.M{"_id": existing.ID}, bson.M{
			"$set": aiContext,
		})
		if err != nil {
			return nil, err
		}
	} else {
		return nil, err
	}

	return aiContext, nil
}

// ChatWithRoomAI sends a message to the room's AI
func (s *RoomAIService) ChatWithRoomAI(roomID, message string) (string, error) {
	if s.geminiService == nil {
		return "", errors.New("AI service not available")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	roomOID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return "", errors.New("invalid room ID")
	}

	// Get room AI context
	var aiContext models.RoomAIContext
	collection := s.db.Collection("room_ai_contexts")
	err = collection.FindOne(ctx, bson.M{"room_id": roomOID}).Decode(&aiContext)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return "", errors.New("room AI not trained yet")
		}
		return "", err
	}

	// Build syllabus string
	syllabusStr := ""
	if aiContext.Syllabus != nil {
		syllabusStr = "Course Syllabus\n"
		// Syllabus structure may vary, use available fields
	}

	// Generate AI response
	response, err := s.geminiService.GenerateRoomAIResponse(
		message,
		aiContext.TrainingContent,
		syllabusStr,
	)
	if err != nil {
		return "", err
	}

	// Update message count
	collection.UpdateOne(ctx, bson.M{"_id": aiContext.ID}, bson.M{
		"$inc": bson.M{"message_count": 1},
		"$set": bson.M{"updated_at": time.Now()},
	})

	return response, nil
}

// GetRoomAIStatus checks if room AI is trained and ready
func (s *RoomAIService) GetRoomAIStatus(roomID string) (map[string]interface{}, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomOID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	var aiContext models.RoomAIContext
	collection := s.db.Collection("room_ai_contexts")
	err = collection.FindOne(ctx, bson.M{"room_id": roomOID}).Decode(&aiContext)
	
	if err == mongo.ErrNoDocuments {
		return map[string]interface{}{
			"trained":          false,
			"resource_count":   0,
			"message_count":    0,
		}, nil
	}
	
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"trained":          true,
		"resource_count":   len(aiContext.TrainedResourceIDs),
		"message_count":    aiContext.MessageCount,
		"last_trained_at":  aiContext.LastTrainedAt,
	}, nil
}
