package services

import (
	"context"
	"errors"
	"time"

	"buddy-server/database"
	"buddy-server/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// AssignmentService handles assignment-related operations
type AssignmentService struct {
	db          *database.DB
	roomService *RoomService
}

// NewAssignmentService creates a new assignment service
func NewAssignmentService(db *database.DB, roomService *RoomService) *AssignmentService {
	return &AssignmentService{db: db, roomService: roomService}
}

// CreateAssignment creates a new assignment
func (s *AssignmentService) CreateAssignment(roomID, teacherID, title, description string, dueDate time.Time, totalPoints int, assignmentType string, subjects []string) (*models.Assignment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	teacherObjectID, err := primitive.ObjectIDFromHex(teacherID)
	if err != nil {
		return nil, errors.New("invalid teacher ID")
	}

	assignment := &models.Assignment{
		RoomID:         roomObjectID,
		TeacherID:      teacherObjectID,
		Title:          title,
		Description:    description,
		DueDate:        dueDate,
		TotalPoints:    totalPoints,
		AssignmentType: assignmentType,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	collection := s.db.Collection("assignments")
	result, err := collection.InsertOne(ctx, assignment)
	if err != nil {
		return nil, err
	}

	assignment.ID = result.InsertedID.(primitive.ObjectID)
	
	// If roomService is available, sync to all student members' study plans
	if s.roomService != nil {
		go func() {
			room, err := s.roomService.GetRoom(roomID)
			if err == nil {
				_ = s.roomService.SyncRoomToAllStudentStudyPlans(roomID, room)
			}
		}()
	}
	
	return assignment, nil
}

// GetAssignments gets all assignments for a room
func (s *AssignmentService) GetAssignments(roomID string) ([]models.Assignment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	collection := s.db.Collection("assignments")
	cursor, err := collection.Find(ctx, bson.M{"room_id": roomObjectID}, options.Find().SetSort(bson.D{{Key: "due_date", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var assignments []models.Assignment
	if err = cursor.All(ctx, &assignments); err != nil {
		return nil, err
	}

	return assignments, nil
}

// GetAssignment gets an assignment by ID
func (s *AssignmentService) GetAssignment(assignmentID string) (*models.Assignment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(assignmentID)
	if err != nil {
		return nil, errors.New("invalid assignment ID")
	}

	collection := s.db.Collection("assignments")
	var assignment models.Assignment
	err = collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&assignment)
	if err != nil {
		return nil, err
	}

	return &assignment, nil
}

// UpdateAssignment updates an assignment
func (s *AssignmentService) UpdateAssignment(assignmentID, teacherID string, title, description string, dueDate time.Time, totalPoints int, assignmentType string, subjects []string) (*models.Assignment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	assignmentObjectID, err := primitive.ObjectIDFromHex(assignmentID)
	if err != nil {
		return nil, errors.New("invalid assignment ID")
	}

	teacherObjectID, err := primitive.ObjectIDFromHex(teacherID)
	if err != nil {
		return nil, errors.New("invalid teacher ID")
	}

	// Verify ownership
	var assignment models.Assignment
	collection := s.db.Collection("assignments")
	err = collection.FindOne(ctx, bson.M{"_id": assignmentObjectID, "teacher_id": teacherObjectID}).Decode(&assignment)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("assignment not found or you are not the owner")
		}
		return nil, err
	}

	// Update assignment
	update := bson.M{"$set": bson.M{
		"title":           title,
		"description":     description,
		"due_date":        dueDate,
		"total_points":    totalPoints,
		"assignment_type": assignmentType,
		"subjects":        subjects,
		"updated_at":      time.Now(),
	}}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": assignmentObjectID}, update)
	if err != nil {
		return nil, err
	}

	// Fetch updated assignment
	err = collection.FindOne(ctx, bson.M{"_id": assignmentObjectID}).Decode(&assignment)
	if err != nil {
		return nil, err
	}

	return &assignment, nil
}

// DeleteAssignment deletes an assignment
func (s *AssignmentService) DeleteAssignment(assignmentID, teacherID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	assignmentObjectID, err := primitive.ObjectIDFromHex(assignmentID)
	if err != nil {
		return errors.New("invalid assignment ID")
	}

	teacherObjectID, err := primitive.ObjectIDFromHex(teacherID)
	if err != nil {
		return errors.New("invalid teacher ID")
	}

	// Verify ownership and delete
	collection := s.db.Collection("assignments")
	result, err := collection.DeleteOne(ctx, bson.M{"_id": assignmentObjectID, "teacher_id": teacherObjectID})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("assignment not found or you are not the owner")
	}

	return nil
}
