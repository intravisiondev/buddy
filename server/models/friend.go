package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// FriendRequest represents a friend request between two users
type FriendRequest struct {
	ID         primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	FromUserID primitive.ObjectID `json:"from_user_id" bson:"from_user_id"`
	ToUserID   primitive.ObjectID `json:"to_user_id" bson:"to_user_id"`
	Status     string             `json:"status" bson:"status"` // "pending", "accepted", "rejected"
	CreatedAt  time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt  time.Time          `json:"updated_at" bson:"updated_at"`
}

