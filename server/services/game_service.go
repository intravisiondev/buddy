package services

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"buddy-server/database"
	"buddy-server/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// GameService handles educational game creation and playing
type GameService struct {
	db            *database.DB
	geminiService *GeminiService
}

// NewGameService creates a new game service
func NewGameService(db *database.DB, geminiService *GeminiService) *GameService {
	return &GameService{
		db:            db,
		geminiService: geminiService,
	}
}

// GenerateGame creates a new AI-generated game
func (s *GameService) GenerateGame(roomID, teacherID, gameType, subject, difficulty string, questionCount int) (*models.AIGame, error) {
	if s.geminiService == nil {
		return nil, errors.New("AI service not available")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	roomOID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	teacherOID, err := primitive.ObjectIDFromHex(teacherID)
	if err != nil {
		return nil, errors.New("invalid teacher ID")
	}

	// Get room's syllabus for context
	var room models.Room
	roomCollection := s.db.Collection("rooms")
	err = roomCollection.FindOne(ctx, bson.M{"_id": roomOID}).Decode(&room)
	
	syllabusStr := ""
	if err == nil && room.Syllabus != nil {
		syllabusStr = room.Name + " Course\n"
		// Use room name as subject context
	}

	// Generate questions with AI
	jsonResponse, err := s.geminiService.GenerateGameQuestions(gameType, subject, difficulty, questionCount, syllabusStr)
	if err != nil {
		return nil, err
	}

	// Parse AI response
	cleanedResponse := strings.TrimSpace(jsonResponse)
	cleanedResponse = strings.TrimPrefix(cleanedResponse, "```json")
	cleanedResponse = strings.TrimPrefix(cleanedResponse, "```")
	cleanedResponse = strings.TrimSuffix(cleanedResponse, "```")
	cleanedResponse = strings.TrimSpace(cleanedResponse)

	var aiResponse struct {
		Questions []models.GameQuestion `json:"questions"`
	}

	if err := json.Unmarshal([]byte(cleanedResponse), &aiResponse); err != nil {
		return nil, errors.New("failed to parse AI response: " + err.Error())
	}

	// Create game
	game := &models.AIGame{
		RoomID:       roomOID,
		TeacherID:    teacherOID,
		Title:        subject + " " + strings.Title(gameType),
		GameType:     gameType,
		Subject:      subject,
		Difficulty:   difficulty,
		Questions:    aiResponse.Questions,
		TimeLimit:    30, // Default 30 seconds per question
		PassingScore: 70, // Default 70%
		CreatedAt:    time.Now(),
	}

	collection := s.db.Collection("ai_games")
	result, err := collection.InsertOne(ctx, game)
	if err != nil {
		return nil, err
	}

	game.ID = result.InsertedID.(primitive.ObjectID)
	return game, nil
}

// GetRoomGames retrieves all games for a room
func (s *GameService) GetRoomGames(roomID string) ([]models.AIGame, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomOID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	collection := s.db.Collection("ai_games")
	cursor, err := collection.Find(ctx, bson.M{"room_id": roomOID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var games []models.AIGame
	if err := cursor.All(ctx, &games); err != nil {
		return nil, err
	}

	return games, nil
}

// GetGame retrieves a specific game
func (s *GameService) GetGame(gameID string) (*models.AIGame, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	gameOID, err := primitive.ObjectIDFromHex(gameID)
	if err != nil {
		return nil, errors.New("invalid game ID")
	}

	var game models.AIGame
	collection := s.db.Collection("ai_games")
	err = collection.FindOne(ctx, bson.M{"_id": gameOID}).Decode(&game)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("game not found")
		}
		return nil, err
	}

	return &game, nil
}

// PlayGame submits game answers and calculates score
func (s *GameService) PlayGame(gameID, studentID string, answers []string, timeSpent int) (*models.GameResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	game, err := s.GetGame(gameID)
	if err != nil {
		return nil, err
	}

	studentOID, err := primitive.ObjectIDFromHex(studentID)
	if err != nil {
		return nil, errors.New("invalid student ID")
	}

	// Calculate score
	correctAnswers := 0
	for i, answer := range answers {
		if i < len(game.Questions) && answer == game.Questions[i].CorrectAnswer {
			correctAnswers++
		}
	}

	totalQuestions := len(game.Questions)
	score := 0
	if totalQuestions > 0 {
		score = (correctAnswers * 100) / totalQuestions
	}

	passed := score >= game.PassingScore

	// Save result
	result := &models.GameResult{
		GameID:         game.ID,
		StudentID:      studentOID,
		Score:          score,
		CorrectAnswers: correctAnswers,
		TotalQuestions: totalQuestions,
		TimeSpent:      timeSpent,
		Passed:         passed,
		CreatedAt:      time.Now(),
	}

	collection := s.db.Collection("game_results")
	insertResult, err := collection.InsertOne(ctx, result)
	if err != nil {
		return nil, err
	}

	result.ID = insertResult.InsertedID.(primitive.ObjectID)
	return result, nil
}

// GetStudentGameResults retrieves a student's results for a specific game
func (s *GameService) GetStudentGameResults(gameID, studentID string) ([]models.GameResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	gameOID, err := primitive.ObjectIDFromHex(gameID)
	if err != nil {
		return nil, errors.New("invalid game ID")
	}

	studentOID, err := primitive.ObjectIDFromHex(studentID)
	if err != nil {
		return nil, errors.New("invalid student ID")
	}

	collection := s.db.Collection("game_results")
	cursor, err := collection.Find(ctx, bson.M{
		"game_id":    gameOID,
		"student_id": studentOID,
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []models.GameResult
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	return results, nil
}
