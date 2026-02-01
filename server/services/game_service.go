package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
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
	db              *database.DB
	geminiService   *GeminiService
	templateService *GameTemplateService
	packagerService *GamePackager
}

// NewGameService creates a new game service
func NewGameService(db *database.DB, geminiService *GeminiService, templateService *GameTemplateService, packager *GamePackager) *GameService {
	return &GameService{
		db:              db,
		geminiService:   geminiService,
		templateService: templateService,
		packagerService: packager,
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

	if cleanedResponse == "" {
		return nil, errors.New("AI returned empty response; try fewer questions or check API key/limits")
	}

	var aiResponse struct {
		Questions []models.GameQuestion `json:"questions"`
	}

	if err := json.Unmarshal([]byte(cleanedResponse), &aiResponse); err != nil {
		snippetLen := 120
		if len(cleanedResponse) < snippetLen {
			snippetLen = len(cleanedResponse)
		}
		snippet := cleanedResponse
		if len(cleanedResponse) > snippetLen {
			snippet = "..." + cleanedResponse[len(cleanedResponse)-snippetLen:]
		}
		return nil, fmt.Errorf("failed to parse AI response: %v (response length: %d chars, end: %q)", err, len(cleanedResponse), snippet)
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

// GetBundlePath returns the path to a game's bundle
func (s *GameService) GetBundlePath(gameID string) string {
	if s.packagerService != nil {
		return s.packagerService.GetBundlePath(gameID)
	}
	return ""
}

// EnsureBundle returns the bundle path, (re)creating the bundle so template/CSS updates apply to existing games
func (s *GameService) EnsureBundle(gameID string) (bundlePath string, err error) {
	game, err := s.GetGame(gameID)
	if err != nil {
		return "", err
	}
	if s.packagerService == nil {
		return "", errors.New("game packager not available")
	}
	// Her istekte yeniden oluştur: böylece şablon/CSS güncellemeleri mevcut oyunlara yansır
	bundle, err := s.packagerService.CreateBundle(game)
	if err != nil {
		return "", fmt.Errorf("failed to create bundle: %w", err)
	}
	return bundle.Path, nil
}

// StartGameSession creates a new game session with nonce for replay protection
func (s *GameService) StartGameSession(gameID, studentID string) (*models.GameSession, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	gameOID, err := primitive.ObjectIDFromHex(gameID)
	if err != nil {
		return nil, errors.New("invalid game ID")
	}

	studentOID, err := primitive.ObjectIDFromHex(studentID)
	if err != nil {
		return nil, errors.New("invalid student ID")
	}

	// Generate nonce
	nonce, err := generateNonce()
	if err != nil {
		return nil, err
	}

	session := &models.GameSession{
		GameID:    gameOID,
		StudentID: studentOID,
		Nonce:     nonce,
		StartedAt: time.Now(),
		ExpiresAt: time.Now().Add(1 * time.Hour),
		Completed: false,
	}

	collection := s.db.Collection("game_sessions")
	result, err := collection.InsertOne(ctx, session)
	if err != nil {
		return nil, err
	}

	session.ID = result.InsertedID.(primitive.ObjectID)
	return session, nil
}

// PlayGameWithSession plays a game with session validation
func (s *GameService) PlayGameWithSession(gameID string, answers []string, timeSpent int, sessionNonce string) (*models.GameResult, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Validate session
	sessionCollection := s.db.Collection("game_sessions")
	var session models.GameSession
	err := sessionCollection.FindOne(ctx, bson.M{
		"nonce":      sessionNonce,
		"completed":  false,
		"expires_at": bson.M{"$gt": time.Now()},
	}).Decode(&session)
	if err != nil {
		return nil, errors.New("invalid or expired session")
	}

	// Mark session as completed
	_, err = sessionCollection.UpdateOne(ctx, bson.M{"_id": session.ID}, bson.M{
		"$set": bson.M{"completed": true},
	})
	if err != nil {
		return nil, errors.New("session already used")
	}

	// Get game
	gameOID, _ := primitive.ObjectIDFromHex(gameID)
	var game models.AIGame
	gameCollection := s.db.Collection("ai_games")
	if err := gameCollection.FindOne(ctx, bson.M{"_id": gameOID}).Decode(&game); err != nil {
		return nil, errors.New("game not found")
	}

	// Server-authoritative scoring
	correctAnswers := 0
	for i, answer := range answers {
		if i < len(game.Questions) && answer == game.Questions[i].CorrectAnswer {
			correctAnswers++
		}
	}

	score := 0
	if len(game.Questions) > 0 {
		score = int(float64(correctAnswers) / float64(len(game.Questions)) * 100)
	}
	
	passingScore := game.Ruleset.PassingScore
	if passingScore == 0 {
		passingScore = 70
	}
	passed := score >= passingScore

	// Validate time spent
	minTime := len(game.Questions) * 5
	maxTime := game.Ruleset.TimeLimit * len(game.Questions)
	if maxTime == 0 {
		maxTime = 3600
	}
	
	if timeSpent < minTime {
		return nil, errors.New("time spent too short")
	}
	if timeSpent > maxTime {
		return nil, errors.New("time spent exceeds limit")
	}

	// Rate limiting
	if err := s.checkRateLimit(session.StudentID.Hex(), gameID); err != nil {
		return nil, err
	}

	// Save result
	result := &models.GameResult{
		GameID:         gameOID,
		StudentID:      session.StudentID,
		Score:          score,
		CorrectAnswers: correctAnswers,
		TotalQuestions: len(game.Questions),
		TimeSpent:      timeSpent,
		Passed:         passed,
		CreatedAt:      time.Now(),
	}

	resultCollection := s.db.Collection("game_results")
	insertResult, err := resultCollection.InsertOne(ctx, result)
	if err != nil {
		return nil, err
	}

	result.ID = insertResult.InsertedID.(primitive.ObjectID)

	// Update game stats
	gameCollection.UpdateOne(ctx, bson.M{"_id": gameOID}, bson.M{
		"$inc": bson.M{"play_count": 1},
		"$set": bson.M{"updated_at": time.Now()},
	})

	return result, nil
}

// checkRateLimit enforces rate limiting
func (s *GameService) checkRateLimit(studentID, gameID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	studentOID, _ := primitive.ObjectIDFromHex(studentID)
	gameOID, _ := primitive.ObjectIDFromHex(gameID)

	oneHourAgo := time.Now().Add(-1 * time.Hour)
	collection := s.db.Collection("game_results")
	count, err := collection.CountDocuments(ctx, bson.M{
		"student_id": studentOID,
		"game_id":    gameOID,
		"created_at": bson.M{"$gte": oneHourAgo},
	})

	if err != nil {
		return err
	}

	if count >= 10 {
		return errors.New("rate limit exceeded: max 10 submissions per hour")
	}

	return nil
}

// generateNonce generates a cryptographically secure nonce
func generateNonce() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// CreateGameWithTemplate creates a game using a specific template
func (s *GameService) CreateGameWithTemplate(roomID, teacherID, templateID, subject, difficulty string, questionCount int) (*models.AIGame, error) {
	if s.geminiService == nil {
		return nil, errors.New("AI service not available")
	}

	if s.templateService == nil {
		return nil, errors.New("template service not available")
	}

	// Validate template
	template, err := s.templateService.GetTemplate(templateID)
	if err != nil {
		return nil, err
	}

	// Validate question count
	if err := s.templateService.ValidateQuestionCount(templateID, questionCount); err != nil {
		return nil, err
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

	// Get room context for AI
	var room models.Room
	roomCollection := s.db.Collection("rooms")
	err = roomCollection.FindOne(ctx, bson.M{"_id": roomOID}).Decode(&room)
	
	syllabusStr := ""
	if err == nil && room.Syllabus != nil {
		syllabusStr = room.Name + " Course\n"
	}

	// Generate content with AI
	jsonResponse, err := s.geminiService.GenerateGameQuestions(templateID, subject, difficulty, questionCount, syllabusStr)
	if err != nil {
		return nil, err
	}

	// Parse AI response
	cleanedResponse := strings.TrimSpace(jsonResponse)
	cleanedResponse = strings.TrimPrefix(cleanedResponse, "```json")
	cleanedResponse = strings.TrimPrefix(cleanedResponse, "```")
	cleanedResponse = strings.TrimSuffix(cleanedResponse, "```")
	cleanedResponse = strings.TrimSpace(cleanedResponse)

	if cleanedResponse == "" {
		return nil, errors.New("AI returned empty response; try fewer questions or check API key/limits")
	}

	var aiResponse struct {
		Questions []models.GameQuestion `json:"questions"`
	}

	if err := json.Unmarshal([]byte(cleanedResponse), &aiResponse); err != nil {
		snippetLen := 120
		if len(cleanedResponse) < snippetLen {
			snippetLen = len(cleanedResponse)
		}
		snippet := cleanedResponse
		if len(cleanedResponse) > snippetLen {
			snippet = "..." + cleanedResponse[len(cleanedResponse)-snippetLen:]
		}
		return nil, fmt.Errorf("failed to parse AI response: %v (response length: %d chars, end: %q)", err, len(cleanedResponse), snippet)
	}

	// Get default config and ruleset
	config, _ := s.templateService.GetDefaultConfig(templateID)
	ruleset, _ := s.templateService.GetDefaultRuleset(templateID, difficulty)

	// Create game
	game := &models.AIGame{
		RoomID:      roomOID,
		TeacherID:   teacherOID,
		Title:       fmt.Sprintf("%s - %s", subject, template.Name),
		Description: fmt.Sprintf("AI-generated %s game for %s", template.Name, subject),
		Template:    templateID,
		Version:     "1.0.0",
		Subject:     subject,
		Difficulty:  difficulty,
		Questions:   aiResponse.Questions,
		Config:      config,
		Ruleset:     ruleset,
		MaxPlayers:  1,
		Matchmaking: false,
		PlayCount:   0,
		AvgScore:    0,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Insert into database
	collection := s.db.Collection("ai_games")
	result, err := collection.InsertOne(ctx, game)
	if err != nil {
		return nil, err
	}

	game.ID = result.InsertedID.(primitive.ObjectID)

	// Generate and package bundle
	if s.packagerService != nil {
		bundle, err := s.packagerService.CreateBundle(game)
		if err == nil {
			// Update game with bundle info
			game.BundlePath = bundle.Path
			game.BundleHash = bundle.Hash
			
			collection.UpdateOne(ctx, bson.M{"_id": game.ID}, bson.M{
				"$set": bson.M{
					"bundle_path": bundle.Path,
					"bundle_hash": bundle.Hash,
				},
			})
		}
	}

	return game, nil
}

