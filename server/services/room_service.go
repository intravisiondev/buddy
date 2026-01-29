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

// RoomService handles room-related operations
type RoomService struct {
	db                *database.DB
	studyPlanService  *StudyPlanService
	goalService       *GoalService
	assignmentService *AssignmentService
	roomAIService     *RoomAIService
}

// NewRoomService creates a new room service
func NewRoomService(db *database.DB, rewardService *RewardService) *RoomService {
	return &RoomService{
		db:                db,
		studyPlanService: NewStudyPlanService(db),
		goalService:       NewGoalService(db, rewardService),
		assignmentService: nil, // Will be set after creation
	}
}

// SetAssignmentService sets the assignment service (to avoid circular dependency)
func (s *RoomService) SetAssignmentService(assignmentService *AssignmentService) {
	s.assignmentService = assignmentService
}

// CreateRoomParams contains all parameters for creating a room
type CreateRoomParams struct {
	Name            string
	Subject         string
	Description     string
	OwnerID         string
	IsPrivate       bool
	MaxMembers      int
	TeacherName     string
	TeacherBio      string
	Schedule        []models.WeeklySchedule
	StartDate       *time.Time
	EndDate         *time.Time
	RegistrationEnd *time.Time
	Syllabus        *models.Syllabus
}

// CreateRoom creates a new room (basic version for backward compatibility)
func (s *RoomService) CreateRoom(name, subject, description, ownerID string, isPrivate bool, maxMembers int) (*models.Room, error) {
	return s.CreateRoomExtended(CreateRoomParams{
		Name:        name,
		Subject:     subject,
		Description: description,
		OwnerID:     ownerID,
		IsPrivate:   isPrivate,
		MaxMembers:  maxMembers,
	})
}

// CreateRoomExtended creates a new room with all extended fields
func (s *RoomService) CreateRoomExtended(params CreateRoomParams) (*models.Room, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(params.OwnerID)
	if err != nil {
		return nil, errors.New("invalid owner ID")
	}

	room := &models.Room{
		Name:             params.Name,
		Subject:          params.Subject,
		Description:      params.Description,
		OwnerID:          objectID,
		IsPrivate:        params.IsPrivate,
		MaxMembers:       params.MaxMembers,
		IsLive:           false,
		TeacherName:      params.TeacherName,
		TeacherBio:       params.TeacherBio,
		Schedule:         params.Schedule,
		StartDate:        params.StartDate,
		EndDate:          params.EndDate,
		RegistrationEnd:  params.RegistrationEnd,
		Syllabus:         params.Syllabus,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	collection := s.db.Collection("rooms")
	result, err := collection.InsertOne(ctx, room)
	if err != nil {
		return nil, err
	}

	room.ID = result.InsertedID.(primitive.ObjectID)

	// Add owner as member
	_ = s.JoinRoom(room.ID.Hex(), params.OwnerID, "owner")

	return room, nil
}

// UpdateRoomSyllabus updates the syllabus of a room (only by owner)
func (s *RoomService) UpdateRoomSyllabus(roomID, ownerID string, syllabus *models.Syllabus) (*models.Room, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	ownerObjectID, err := primitive.ObjectIDFromHex(ownerID)
	if err != nil {
		return nil, errors.New("invalid owner ID")
	}

	// Verify ownership - use raw BSON to avoid decode errors
	collection := s.db.Collection("rooms")
	var roomRaw bson.M
	err = collection.FindOne(ctx, bson.M{"_id": roomObjectID, "owner_id": ownerObjectID}).Decode(&roomRaw)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("room not found or you are not the owner")
		}
		return nil, err
	}

	// Update syllabus
	_, err = collection.UpdateOne(
		ctx,
		bson.M{"_id": roomObjectID},
		bson.M{"$set": bson.M{"syllabus": syllabus, "updated_at": time.Now()}},
	)
	if err != nil {
		return nil, err
	}

	// Fetch updated room with flexible decode
	err = collection.FindOne(ctx, bson.M{"_id": roomObjectID}).Decode(&roomRaw)
	if err != nil {
		return nil, err
	}
	
	// Handle syllabus field if it's a string (shouldn't happen after update, but just in case)
	if syllabusRaw, ok := roomRaw["syllabus"]; ok {
		if _, ok := syllabusRaw.(string); ok {
			delete(roomRaw, "syllabus")
		}
	}
	
	// Decode the room
	var room models.Room
	bsonBytes, _ := bson.Marshal(roomRaw)
	bson.Unmarshal(bsonBytes, &room)
	
	// Set syllabus if we decoded it
	if syllabus != nil {
		room.Syllabus = syllabus
	}

	// Sync to all student members' study plans in background
	go func() {
		_ = s.SyncRoomToAllStudentStudyPlans(roomID, &room)
	}()

	return &room, nil
}

// GetRooms gets all rooms with optional filters
func (s *RoomService) GetRooms(subject string, isPrivate *bool, limit int) ([]models.Room, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}
	if subject != "" {
		filter["subject"] = subject
	}
	if isPrivate != nil {
		filter["is_private"] = *isPrivate
	}

	collection := s.db.Collection("rooms")
	cursor, err := collection.Find(ctx, filter, options.Find().SetLimit(int64(limit)))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	// Decode rooms manually to handle legacy string syllabus
	var rooms []models.Room
	for cursor.Next(ctx) {
		var roomRaw bson.M
		if err := cursor.Decode(&roomRaw); err != nil {
			continue
		}
		
		// Handle syllabus field separately if it's a string (legacy format)
		if syllabusRaw, ok := roomRaw["syllabus"]; ok {
			if _, ok := syllabusRaw.(string); ok {
				// Legacy string format - remove it so it doesn't cause decode error
				delete(roomRaw, "syllabus")
			}
		}
		
		// Decode the room
		var room models.Room
		bsonBytes, _ := bson.Marshal(roomRaw)
		bson.Unmarshal(bsonBytes, &room)
		
		rooms = append(rooms, room)
	}

	return rooms, nil
}

// GetRoomsByOwner gets all rooms created by a specific owner (teacher)
func (s *RoomService) GetRoomsByOwner(ownerID, subject string, limit int) ([]models.Room, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	ownerObjectID, err := primitive.ObjectIDFromHex(ownerID)
	if err != nil {
		return nil, errors.New("invalid owner ID")
	}

	filter := bson.M{"owner_id": ownerObjectID}
	if subject != "" {
		filter["subject"] = subject
	}

	collection := s.db.Collection("rooms")
	cursor, err := collection.Find(ctx, filter, options.Find().SetLimit(int64(limit)).SetSort(bson.D{{Key: "created_at", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	// Decode rooms manually to handle legacy string syllabus
	var rooms []models.Room
	for cursor.Next(ctx) {
		var roomRaw bson.M
		if err := cursor.Decode(&roomRaw); err != nil {
			continue
		}
		
		// Handle syllabus field separately if it's a string (legacy format)
		if syllabusRaw, ok := roomRaw["syllabus"]; ok {
			if _, ok := syllabusRaw.(string); ok {
				// Legacy string format - remove it so it doesn't cause decode error
				delete(roomRaw, "syllabus")
			}
		}
		
		// Decode the room
		var room models.Room
		bsonBytes, _ := bson.Marshal(roomRaw)
		bson.Unmarshal(bsonBytes, &room)
		
		rooms = append(rooms, room)
	}

	return rooms, nil
}

// GetRoom gets a room by ID
func (s *RoomService) GetRoom(roomID string) (*models.Room, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	collection := s.db.Collection("rooms")
	var roomRaw bson.M
	err = collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&roomRaw)
	if err != nil {
		return nil, err
	}
	
	// Handle syllabus field separately
	var syllabus *models.Syllabus
	if syllabusRaw, ok := roomRaw["syllabus"]; ok {
		if _, ok := syllabusRaw.(string); ok {
			// Legacy string format - set to nil
			syllabus = nil
			delete(roomRaw, "syllabus")
		} else if syllabusMap, ok := syllabusRaw.(bson.M); ok {
			// Structured format - decode it
			syllabusBytes, _ := bson.Marshal(syllabusMap)
			var s models.Syllabus
			if err := bson.Unmarshal(syllabusBytes, &s); err == nil {
				syllabus = &s
			}
		}
	}
	
	// Decode the room
	var room models.Room
	bsonBytes, _ := bson.Marshal(roomRaw)
	bson.Unmarshal(bsonBytes, &room)
	
	// Set syllabus if we decoded it
	if syllabus != nil {
		room.Syllabus = syllabus
	}

	return &room, nil
}

// UpdateRoomExamDates updates the exam dates of a room
func (s *RoomService) UpdateRoomExamDates(roomID, ownerID string, examDates []models.ExamDate) (*models.Room, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	ownerObjectID, err := primitive.ObjectIDFromHex(ownerID)
	if err != nil {
		return nil, errors.New("invalid owner ID")
	}

	// Verify ownership
	var room models.Room
	collection := s.db.Collection("rooms")
	err = collection.FindOne(ctx, bson.M{"_id": roomObjectID, "owner_id": ownerObjectID}).Decode(&room)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("room not found or you are not the owner")
		}
		return nil, err
	}

	// Update exam dates
	_, err = collection.UpdateOne(
		ctx,
		bson.M{"_id": roomObjectID},
		bson.M{"$set": bson.M{"exam_dates": examDates, "updated_at": time.Now()}},
	)
	if err != nil {
		return nil, err
	}

	// Fetch updated room
	err = collection.FindOne(ctx, bson.M{"_id": roomObjectID}).Decode(&room)
	if err != nil {
		return nil, err
	}

	// Sync to all student members' study plans in background
	go func() {
		_ = s.SyncRoomToAllStudentStudyPlans(roomID, &room)
	}()

	return &room, nil
}

// JoinRoom adds a user to a room
func (s *RoomService) JoinRoom(roomID, userID, role string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return errors.New("invalid room ID")
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	// Check if already a member
	membersCollection := s.db.Collection("room_members")
	var existing models.RoomMember
	err = membersCollection.FindOne(ctx, bson.M{
		"room_id": roomObjectID,
		"user_id": userObjectID,
	}).Decode(&existing)

	if err == nil {
		// Already a member, just update to active
		_, _ = membersCollection.UpdateOne(
			ctx,
			bson.M{"_id": existing.ID},
			bson.M{"$set": bson.M{"is_active": true, "updated_at": time.Now()}},
		)
		return nil
	}

	member := &models.RoomMember{
		RoomID:    roomObjectID,
		UserID:    userObjectID,
		Role:      role,
		IsActive:  true,
		JoinedAt:  time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = membersCollection.InsertOne(ctx, member)
	if err != nil {
		return err
	}

	// If user is a student, sync room data to their study plan
	if role == "member" {
		// Get room details
		room, err := s.GetRoom(roomID)
		if err == nil {
			// Sync room data to student's study plan in background (best effort)
			go func() {
				_ = s.SyncRoomToStudentStudyPlan(roomID, userID, room)
			}()
		}
	}

	return nil
}

// SyncRoomToAllStudentStudyPlans syncs room data to all student members' study plans
func (s *RoomService) SyncRoomToAllStudentStudyPlans(roomID string, room *models.Room) error {
	// Get all active student members
	members, err := s.GetRoomMembers(roomID)
	if err != nil {
		return err
	}

	// Sync to each student's study plan
	for _, member := range members {
		if member.Role == "member" {
			// Convert user_id to string
			userIDStr := ""
			if userIDObj, ok := member.UserID.(primitive.ObjectID); ok {
				userIDStr = userIDObj.Hex()
			} else if userIDStr, ok = member.UserID.(string); !ok {
				continue
			}

			_ = s.SyncRoomToStudentStudyPlan(roomID, userIDStr, room)
		}
	}

	return nil
}

// SyncRoomToStudentStudyPlan syncs room syllabus, exam dates, and assignments to a student's study plan
func (s *RoomService) SyncRoomToStudentStudyPlan(roomID, studentID string, room *models.Room) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	studentObjectID, err := primitive.ObjectIDFromHex(studentID)
	if err != nil {
		return errors.New("invalid student ID")
	}

	// Get or create a study plan for this room
	studyPlans, err := s.studyPlanService.GetStudyPlans(studentID)
	if err != nil {
		return err
	}

	var studyPlan *models.StudyPlan
	planName := room.Name + " - Study Plan"
	
	// Find existing plan for this room or create a new one
	for _, plan := range studyPlans {
		if plan.Name == planName {
			studyPlan = &plan
			break
		}
	}

	if studyPlan == nil {
		// Create a new study plan for this room
		startDate := time.Now()
		endDate := startDate.AddDate(0, 6, 0) // 6 months default
		if room.EndDate != nil {
			endDate = *room.EndDate
		} else if room.StartDate != nil {
			endDate = room.StartDate.AddDate(0, 6, 0)
		}

		newPlan, err := s.studyPlanService.CreateStudyPlan(
			studentID,
			planName,
			room.Description,
			startDate,
			endDate,
			2.0, // Default 2 hours per day
			false,
			false,
		)
		if err != nil {
			return err
		}
		studyPlan = newPlan
	}

	planID := studyPlan.ID.Hex()

	// Sync syllabus items as milestones
	if room.Syllabus != nil && len(room.Syllabus.Items) > 0 {
		for _, item := range room.Syllabus.Items {
			// Check if milestone already exists
			milestonesCollection := s.db.Collection("milestones")
			var existing models.Milestone
			err = milestonesCollection.FindOne(ctx, bson.M{
				"user_id":       studentObjectID,
				"study_plan_id": studyPlan.ID,
				"title":         item.Title,
			}).Decode(&existing)

			if err == mongo.ErrNoDocuments {
				// Create milestone for syllabus item
				targetDate := time.Now().AddDate(0, 0, item.Order*7) // 1 week per order
				_, _ = s.goalService.CreateMilestone(
					studentID,
					item.Title,
					item.Description,
					targetDate,
					&planID,
				)
			}
		}
	}

	// Sync exam dates as milestones
	if len(room.ExamDates) > 0 {
		for _, examDate := range room.ExamDates {
			// Check if milestone already exists
			milestonesCollection := s.db.Collection("milestones")
			var existing models.Milestone
			err = milestonesCollection.FindOne(ctx, bson.M{
				"user_id":       studentObjectID,
				"study_plan_id": studyPlan.ID,
				"title":         examDate.Title,
				"target_date":  examDate.Date,
			}).Decode(&existing)

			if err == mongo.ErrNoDocuments {
				// Create milestone for exam date
				_, _ = s.goalService.CreateMilestone(
					studentID,
					examDate.Title,
					examDate.Description,
					examDate.Date,
					&planID,
				)
			}
		}
	}

	// Sync assignments as milestones
	if s.assignmentService == nil {
		return errors.New("assignment service not initialized")
	}
	assignments, err := s.assignmentService.GetAssignments(roomID)
	if err == nil {
		for _, assignment := range assignments {
			// Check if milestone already exists
			milestonesCollection := s.db.Collection("milestones")
			var existing models.Milestone
			err = milestonesCollection.FindOne(ctx, bson.M{
				"user_id":       studentObjectID,
				"study_plan_id": studyPlan.ID,
				"title":         assignment.Title,
				"target_date":  assignment.DueDate,
			}).Decode(&existing)

			if err == mongo.ErrNoDocuments {
				// Create milestone for assignment
				_, _ = s.goalService.CreateMilestone(
					studentID,
					assignment.Title,
					assignment.Description,
					assignment.DueDate,
					&planID,
				)
			}
		}
	}

	return nil
}

// RoomMemberWithUser contains room member info with user details
type RoomMemberWithUser struct {
	UserID    any       `bson:"user_id" json:"user_id"`
	UserName  string    `bson:"user_name" json:"user_name"`
	UserEmail string    `bson:"user_email" json:"user_email"`
	Role      string    `bson:"role" json:"role"`
	IsActive  bool      `bson:"is_active" json:"is_active"`
	JoinedAt  time.Time `bson:"joined_at" json:"joined_at"`
}

// GetRoomMembers gets all members of a room with user details
func (s *RoomService) GetRoomMembers(roomID string) ([]RoomMemberWithUser, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	// Aggregate to join with users collection
	membersCollection := s.db.Collection("room_members")
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"room_id": roomObjectID, "is_active": true}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "user_id",
			"foreignField": "_id",
			"as":           "user",
		}}},
		{{Key: "$unwind", Value: "$user"}},
		{{Key: "$project", Value: bson.M{
			"user_id":    "$user_id",
			"user_name":  "$user.name",
			"user_email": "$user.email",
			"role":       1,
			"is_active":  1,
			"joined_at":  1,
		}}},
	}

	cursor, err := membersCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var members []RoomMemberWithUser
	if err = cursor.All(ctx, &members); err != nil {
		return nil, err
	}

	// Convert ObjectIDs to strings
	for i := range members {
		if oid, ok := members[i].UserID.(primitive.ObjectID); ok {
			members[i].UserID = oid.Hex()
		} else if userIDStr, ok := members[i].UserID.(string); ok {
			members[i].UserID = userIDStr
		}
	}

	return members, nil
}

// IsMember checks if a user is a member of a room
func (s *RoomService) IsMember(roomID, userID string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return false, errors.New("invalid room ID")
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return false, errors.New("invalid user ID")
	}

	collection := s.db.Collection("room_members")
	count, err := collection.CountDocuments(ctx, bson.M{
		"room_id":   roomObjectID,
		"user_id":   userObjectID,
		"is_active": true,
	})

	return count > 0, err
}

// SendMessage sends a message to a room and returns it with user details
func (s *RoomService) SendMessage(roomID, userID, content, messageType, fileURL string) (*MessageWithUser, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	userObjectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	message := &models.Message{
		RoomID:      roomObjectID,
		UserID:      userObjectID,
		Content:     content,
		MessageType: messageType,
		FileURL:     fileURL,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	collection := s.db.Collection("messages")
	result, err := collection.InsertOne(ctx, message)
	if err != nil {
		return nil, err
	}

	message.ID = result.InsertedID.(primitive.ObjectID)

	// Get user name
	var user models.User
	userCollection := s.db.Collection("users")
	err = userCollection.FindOne(ctx, bson.M{"_id": userObjectID}).Decode(&user)
	
	userName := "Unknown User"
	if err == nil {
		userName = user.Name
	}

	return &MessageWithUser{
		ID:          message.ID.Hex(),
		RoomID:      roomID,
		UserID:      userID,
		UserName:    userName,
		Content:     content,
		MessageType: messageType,
		FileURL:     fileURL,
		CreatedAt:   message.CreatedAt,
	}, nil
}

// MessageWithUser contains message info with user details
type MessageWithUser struct {
	ID          any       `bson:"id" json:"id"`
	RoomID      any       `bson:"room_id" json:"room_id"`
	UserID      any       `bson:"user_id" json:"user_id"`
	UserName    string    `bson:"user_name" json:"user_name"`
	Content     string    `bson:"content" json:"content"`
	MessageType string    `bson:"message_type" json:"message_type"`
	FileURL     string    `bson:"file_url" json:"file_url,omitempty"`
	CreatedAt   time.Time `bson:"created_at" json:"created_at"`
}

// GetMessages gets messages from a room with user details
func (s *RoomService) GetMessages(roomID string, limit, offset int) ([]MessageWithUser, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	// Aggregate to join with users collection
	collection := s.db.Collection("messages")
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"room_id": roomObjectID}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "user_id",
			"foreignField": "_id",
			"as":           "user",
		}}},
		{{Key: "$unwind", Value: bson.M{
			"path":                       "$user",
			"preserveNullAndEmptyArrays": true,
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "created_at", Value: 1}}}}, // Ascending order
		{{Key: "$skip", Value: offset}},
		{{Key: "$limit", Value: limit}},
		{{Key: "$project", Value: bson.M{
			"id":           "$_id",
			"room_id":      "$room_id",
			"user_id":      "$user_id",
			"user_name":    bson.M{"$ifNull": bson.A{"$user.name", "Unknown User"}},
			"content":      1,
			"message_type": 1,
			"file_url":     1,
			"created_at":   1,
		}}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var messages []MessageWithUser
	if err = cursor.All(ctx, &messages); err != nil {
		return nil, err
	}

	// Convert ObjectIDs to strings
	for i := range messages {
		if oid, ok := messages[i].ID.(primitive.ObjectID); ok {
			messages[i].ID = oid.Hex()
		}
		if oid, ok := messages[i].RoomID.(primitive.ObjectID); ok {
			messages[i].RoomID = oid.Hex()
		}
		if oid, ok := messages[i].UserID.(primitive.ObjectID); ok {
			messages[i].UserID = oid.Hex()
		}
	}

	return messages, nil
}

// AI-related methods (delegate to RoomAIService)
func (s *RoomService) TrainRoomAI(roomID string, resourceIDs []string) (*models.RoomAIContext, error) {
	if s.roomAIService == nil {
		return nil, errors.New("AI service not available")
	}
	return s.roomAIService.TrainRoomAI(roomID, resourceIDs)
}

func (s *RoomService) ChatWithRoomAI(roomID, message string) (string, error) {
	if s.roomAIService == nil {
		return "", errors.New("AI service not available")
	}
	return s.roomAIService.ChatWithRoomAI(roomID, message)
}

func (s *RoomService) GetRoomAIStatus(roomID string) (map[string]interface{}, error) {
	if s.roomAIService == nil {
		return nil, errors.New("AI service not available")
	}
	return s.roomAIService.GetRoomAIStatus(roomID)
}

// SetRoomAIService sets the room AI service
func (s *RoomService) SetRoomAIService(roomAIService *RoomAIService) {
	s.roomAIService = roomAIService
}
