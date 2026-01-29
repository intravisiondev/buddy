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

type BadgeService struct {
	db *database.DB
}

func NewBadgeService(db *database.DB) *BadgeService {
	return &BadgeService{db: db}
}

// GetMyBadges returns earned badges with badge metadata
func (s *BadgeService) GetMyBadges(userID string) ([]bson.M, error) {
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userBadges := s.db.Collection("user_badges")

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"user_id": oid}}},
		{{Key: "$sort", Value: bson.D{{Key: "earned_at", Value: -1}}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "badges",
			"localField":   "badge_id",
			"foreignField": "_id",
			"as":           "badge",
		}}},
		{{Key: "$unwind", Value: bson.M{"path": "$badge", "preserveNullAndEmptyArrays": true}}},
		{{Key: "$project", Value: bson.M{
			"id":        "$_id",
			"earned_at": "$earned_at",
			"badge": bson.M{
				"id":          "$badge._id",
				"name":        "$badge.name",
				"description": "$badge.description",
				"icon_url":    "$badge.icon_url",
				"category":    "$badge.category",
				"xp_reward":   "$badge.xp_reward",
			},
		}}},
	}

	cur, err := userBadges.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []bson.M
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// AwardBadge grants a badge by name (idempotent) and increments badges_earned best-effort
func (s *BadgeService) AwardBadge(userID string, badgeName string) error {
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// find badge
	var badge models.Badge
	if err := s.db.Collection("badges").FindOne(ctx, bson.M{"name": badgeName}).Decode(&badge); err != nil {
		return err
	}

	// upsert user badge
	_, _ = s.db.Collection("user_badges").UpdateOne(ctx,
		bson.M{"user_id": oid, "badge_id": badge.ID},
		bson.M{"$setOnInsert": bson.M{"user_id": oid, "badge_id": badge.ID, "earned_at": time.Now()}},
		options.Update().SetUpsert(true),
	)

	// increment stat
	_, _ = s.db.Collection("user_stats").UpdateOne(ctx, bson.M{"user_id": oid}, bson.M{"$inc": bson.M{"badges_earned": 1}})
	return nil
}

