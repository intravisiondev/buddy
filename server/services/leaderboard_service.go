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

type LeaderboardService struct {
	db *database.DB
}

func NewLeaderboardService(db *database.DB) *LeaderboardService {
	return &LeaderboardService{db: db}
}

// GetLeaderboard returns leaderboard entries ranked by total XP or weekly XP.
// Only students are included. Start from users so all students appear; XP from user_stats.
func (s *LeaderboardService) GetLeaderboard(period string, limit int64) ([]models.LeaderboardEntry, error) {
	if limit <= 0 || limit > 200 {
		limit = 10
	}

	sortField := "total_xp"
	if period == "weekly" {
		sortField = "weekly_xp"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	usersCol := s.db.Collection("users")

	// Start from users (role=student) -> lookup user_stats & profiles -> addFields XP -> sort -> limit -> project
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"role": "student"}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "user_stats",
			"localField":   "_id",
			"foreignField": "user_id",
			"as":           "stats",
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "profiles",
			"localField":   "_id",
			"foreignField": "user_id",
			"as":           "prof",
		}}},
		{{Key: "$addFields", Value: bson.M{
			"stats0":   bson.M{"$arrayElemAt": bson.A{"$stats", 0}},
			"prof0":    bson.M{"$arrayElemAt": bson.A{"$prof", 0}},
		}}},
		{{Key: "$addFields", Value: bson.M{
			"total_xp":  bson.M{"$ifNull": bson.A{"$stats0.total_xp", 0}},
			"weekly_xp": bson.M{"$ifNull": bson.A{"$stats0.weekly_xp", 0}},
			"level":     bson.M{"$ifNull": bson.A{"$stats0.level", 1}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: sortField, Value: -1}}}},
		{{Key: "$limit", Value: limit}},
		{{Key: "$project", Value: bson.M{
			"user_id":    "$_id",
			"name":       "$name",
			"avatar_url": "$prof0.avatar_url",
			"total_xp":   1,
			"weekly_xp":  1,
			"level":      1,
		}}},
	}

	cur, err := usersCol.Aggregate(ctx, pipeline, options.Aggregate())
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var entries []models.LeaderboardEntry
	if err := cur.All(ctx, &entries); err != nil {
		return nil, err
	}

	for i := range entries {
		entries[i].Rank = i + 1
	}
	return entries, nil
}

// GetMyWallet returns gems/tokens/badges_earned for current user
func (s *LeaderboardService) GetMyWallet(userID string) (bson.M, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	statsCol := s.db.Collection("user_stats")
	var out bson.M
	if err := statsCol.FindOne(ctx, bson.M{"user_id": oid}).Decode(&out); err != nil {
		return nil, err
	}
	return out, nil
}

