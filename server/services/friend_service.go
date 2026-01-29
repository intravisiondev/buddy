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

type FriendService struct {
	db *database.DB
}

func NewFriendService(db *database.DB) *FriendService {
	return &FriendService{db: db}
}

// SendRequest creates a pending friend request (idempotent)
func (s *FriendService) SendRequest(fromUserID, toUserID string) error {
	if fromUserID == toUserID {
		return errors.New("cannot friend yourself")
	}

	fromOID, err := primitive.ObjectIDFromHex(fromUserID)
	if err != nil {
		return errors.New("invalid from user ID")
	}
	toOID, err := primitive.ObjectIDFromHex(toUserID)
	if err != nil {
		return errors.New("invalid to user ID")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	col := s.db.Collection("friend_requests")

	// If already friends (stored as accepted request in either direction), prevent duplicates
	existingFilter := bson.M{
		"$or": []bson.M{
			{"from_user_id": fromOID, "to_user_id": toOID, "status": "accepted"},
			{"from_user_id": toOID, "to_user_id": fromOID, "status": "accepted"},
		},
	}
	if err := col.FindOne(ctx, existingFilter).Err(); err == nil {
		return errors.New("already friends")
	}

	// Upsert pending request
	filter := bson.M{
		"from_user_id": fromOID,
		"to_user_id":   toOID,
		"status":       "pending",
	}
	update := bson.M{
		"$setOnInsert": bson.M{
			"from_user_id": fromOID,
			"to_user_id":   toOID,
			"status":       "pending",
			"created_at":   time.Now(),
		},
		"$set": bson.M{"updated_at": time.Now()},
	}
	_, err = col.UpdateOne(ctx, filter, update, options.Update().SetUpsert(true))
	return err
}

func (s *FriendService) Respond(requestID, userID, action string) error {
	reqOID, err := primitive.ObjectIDFromHex(requestID)
	if err != nil {
		return errors.New("invalid request ID")
	}
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	status := "rejected"
	if action == "accept" {
		status = "accepted"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	col := s.db.Collection("friend_requests")
	// Only receiver can respond to a pending request
	res, err := col.UpdateOne(ctx,
		bson.M{"_id": reqOID, "to_user_id": userOID, "status": "pending"},
		bson.M{"$set": bson.M{"status": status, "updated_at": time.Now()}},
	)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return errors.New("request not found or not authorized")
	}
	return nil
}

// GetIncomingPending lists pending requests to current user
func (s *FriendService) GetIncomingPending(userID string) ([]models.FriendRequest, error) {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	col := s.db.Collection("friend_requests")
	cur, err := col.Find(ctx, bson.M{"to_user_id": userOID, "status": "pending"}, options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var out []models.FriendRequest
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// GetFriends returns accepted friends as user IDs for current user
func (s *FriendService) GetFriends(userID string) ([]string, error) {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	col := s.db.Collection("friend_requests")
	cur, err := col.Find(ctx, bson.M{
		"status": "accepted",
		"$or": []bson.M{
			{"from_user_id": userOID},
			{"to_user_id": userOID},
		},
	})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var reqs []models.FriendRequest
	if err := cur.All(ctx, &reqs); err != nil {
		return nil, err
	}

	out := make([]string, 0, len(reqs))
	for _, r := range reqs {
		if r.FromUserID == userOID {
			out = append(out, r.ToUserID.Hex())
		} else {
			out = append(out, r.FromUserID.Hex())
		}
	}
	return out, nil
}

// AreFriends returns whether users are friends
func (s *FriendService) AreFriends(userA, userB string) (bool, error) {
	a, err := primitive.ObjectIDFromHex(userA)
	if err != nil {
		return false, errors.New("invalid user ID")
	}
	b, err := primitive.ObjectIDFromHex(userB)
	if err != nil {
		return false, errors.New("invalid user ID")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	col := s.db.Collection("friend_requests")
	filter := bson.M{
		"status": "accepted",
		"$or": []bson.M{
			{"from_user_id": a, "to_user_id": b},
			{"from_user_id": b, "to_user_id": a},
		},
	}
	err = col.FindOne(ctx, filter).Err()
	if err == nil {
		return true, nil
	}
	if err == mongo.ErrNoDocuments {
		return false, nil
	}
	return false, err
}

