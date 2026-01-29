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

type ActivityQueryService struct {
	db *database.DB
}

func NewActivityQueryService(db *database.DB) *ActivityQueryService {
	return &ActivityQueryService{db: db}
}

func (s *ActivityQueryService) GetMyActivity(userID string, activityType string, limit int64) ([]models.ActivityLog, error) {
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}
	if limit <= 0 || limit > 200 {
		limit = 20
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"user_id": oid}
	if activityType != "" {
		filter["activity_type"] = activityType
	}

	cur, err := s.db.Collection("activity_logs").Find(
		ctx,
		filter,
		options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}).SetLimit(limit),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []models.ActivityLog
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

