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

// GameAnalyticsService provides analytics for game performance
type GameAnalyticsService struct {
	db *database.DB
}

// NewGameAnalyticsService creates a new game analytics service
func NewGameAnalyticsService(db *database.DB) *GameAnalyticsService {
	return &GameAnalyticsService{db: db}
}

// GameStats represents aggregated statistics for a game
type GameStats struct {
	GameID         string             `json:"game_id"`
	TotalPlays     int                `json:"total_plays"`
	UniqueStudents int                `json:"unique_students"`
	AvgScore       float64            `json:"avg_score"`
	AvgTimeSpent   float64            `json:"avg_time_spent"`
	PassRate       float64            `json:"pass_rate"`
	TopScorers     []StudentScore     `json:"top_scorers"`
	Difficulty     map[string]int     `json:"difficulty"` // Distribution by difficulty
	TimeDistribution map[string]int   `json:"time_distribution"` // Buckets: <1min, 1-3min, 3-5min, >5min
}

// StudentScore represents a student's score entry
type StudentScore struct {
	UserID      string    `json:"user_id"`
	Name        string    `json:"name"`
	Score       int       `json:"score"`
	TimeSpent   int       `json:"time_spent"`
	CompletedAt time.Time `json:"completed_at"`
}

// RoomGameAnalytics represents analytics for all games in a room
type RoomGameAnalytics struct {
	RoomID         string              `json:"room_id"`
	TotalGames     int                 `json:"total_games"`
	TotalPlays     int                 `json:"total_plays"`
	ActiveStudents int                 `json:"active_students"`
	AvgEngagement  float64             `json:"avg_engagement"` // Plays per student
	TopGames       []GamePerformance   `json:"top_games"`
	StudentProgress map[string]StudentGameProgress `json:"student_progress"`
}

// GamePerformance represents performance metrics for a single game
type GamePerformance struct {
	GameID    string  `json:"game_id"`
	Title     string  `json:"title"`
	Plays     int     `json:"plays"`
	AvgScore  float64 `json:"avg_score"`
	PassRate  float64 `json:"pass_rate"`
}

// StudentGameProgress represents a student's progress across games
type StudentGameProgress struct {
	UserID       string  `json:"user_id"`
	Name         string  `json:"name"`
	GamesPlayed  int     `json:"games_played"`
	TotalScore   int     `json:"total_score"`
	AvgScore     float64 `json:"avg_score"`
	BestScore    int     `json:"best_score"`
	Improvement  float64 `json:"improvement"` // % improvement from first to latest
}

// GetGameStats returns detailed statistics for a specific game
func (s *GameAnalyticsService) GetGameStats(gameID string) (*GameStats, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	gameOID, err := primitive.ObjectIDFromHex(gameID)
	if err != nil {
		return nil, errors.New("invalid game ID")
	}

	// Aggregate game results
	collection := s.db.Collection("game_results")
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"game_id": gameOID}}},
		{{Key: "$group", Value: bson.M{
			"_id":              "$game_id",
			"total_plays":      bson.M{"$sum": 1},
			"unique_students":  bson.M{"$addToSet": "$student_id"},
			"avg_score":        bson.M{"$avg": "$score"},
			"avg_time":         bson.M{"$avg": "$time_spent"},
			"passed_count":     bson.M{"$sum": bson.M{"$cond": []interface{}{"$passed", 1, 0}}},
		}}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var result struct {
		TotalPlays      int                      `bson:"total_plays"`
		UniqueStudents  []primitive.ObjectID     `bson:"unique_students"`
		AvgScore        float64                  `bson:"avg_score"`
		AvgTime         float64                  `bson:"avg_time"`
		PassedCount     int                      `bson:"passed_count"`
	}

	if cursor.Next(ctx) {
		if err := cursor.Decode(&result); err != nil {
			return nil, err
		}
	}

	// Calculate pass rate
	passRate := 0.0
	if result.TotalPlays > 0 {
		passRate = float64(result.PassedCount) / float64(result.TotalPlays) * 100
	}

	// Get top scorers
	topScorers, _ := s.getTopScorers(gameOID, 5)

	stats := &GameStats{
		GameID:         gameID,
		TotalPlays:     result.TotalPlays,
		UniqueStudents: len(result.UniqueStudents),
		AvgScore:       result.AvgScore,
		AvgTimeSpent:   result.AvgTime,
		PassRate:       passRate,
		TopScorers:     topScorers,
		Difficulty:     make(map[string]int),
		TimeDistribution: make(map[string]int),
	}

	return stats, nil
}

// getTopScorers returns top N scorers for a game
func (s *GameAnalyticsService) getTopScorers(gameID primitive.ObjectID, limit int) ([]StudentScore, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := s.db.Collection("game_results")
	opts := options.Find()
	opts.SetSort(bson.D{{Key: "score", Value: -1}})
	opts.SetLimit(int64(limit))
	
	cursor, err := collection.Find(ctx, bson.M{"game_id": gameID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []models.GameResult
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	// TODO: Join with users to get names
	scorers := make([]StudentScore, len(results))
	for i, r := range results {
		scorers[i] = StudentScore{
			UserID:      r.StudentID.Hex(),
			Name:        "Student", // TODO: Fetch from users
			Score:       r.Score,
			TimeSpent:   r.TimeSpent,
			CompletedAt: r.CreatedAt,
		}
	}

	return scorers, nil
}

// GetRoomGameAnalytics returns analytics for all games in a room
func (s *GameAnalyticsService) GetRoomGameAnalytics(roomID string) (*RoomGameAnalytics, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	roomOID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	// Get all games in room
	gamesCollection := s.db.Collection("ai_games")
	gamesCursor, err := gamesCollection.Find(ctx, bson.M{"room_id": roomOID})
	if err != nil {
		return nil, err
	}
	defer gamesCursor.Close(ctx)

	var games []models.AIGame
	if err := gamesCursor.All(ctx, &games); err != nil {
		return nil, err
	}

	// Aggregate results for all games
	resultsCollection := s.db.Collection("game_results")
	
	gameIDs := make([]primitive.ObjectID, len(games))
	for i, g := range games {
		gameIDs[i] = g.ID
	}

	totalPlaysCursor, _ := resultsCollection.CountDocuments(ctx, bson.M{
		"game_id": bson.M{"$in": gameIDs},
	})

	// Count unique students
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"game_id": bson.M{"$in": gameIDs}}}},
		{{Key: "$group", Value: bson.M{
			"_id": "$student_id",
		}}},
	}
	uniqueStudentsCursor, _ := resultsCollection.Aggregate(ctx, pipeline)
	var uniqueStudents []bson.M
	uniqueStudentsCursor.All(ctx, &uniqueStudents)

	analytics := &RoomGameAnalytics{
		RoomID:         roomID,
		TotalGames:     len(games),
		TotalPlays:     int(totalPlaysCursor),
		ActiveStudents: len(uniqueStudents),
		AvgEngagement:  0,
		TopGames:       []GamePerformance{},
		StudentProgress: make(map[string]StudentGameProgress),
	}

	if len(uniqueStudents) > 0 {
		analytics.AvgEngagement = float64(analytics.TotalPlays) / float64(len(uniqueStudents))
	}

	return analytics, nil
}
