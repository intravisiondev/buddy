package services

import (
	"context"
	"log"
	"time"

	"buddy-server/database"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// RealtimeService handles real-time messaging using MongoDB Change Streams
type RealtimeService struct {
	db *database.DB
}

// NewRealtimeService creates a new realtime service
func NewRealtimeService(db *database.DB) *RealtimeService {
	return &RealtimeService{db: db}
}

// MessageEvent represents a message event
type MessageEvent struct {
	Type    string      `json:"type"`    // "insert", "update", "delete"
	Message interface{} `json:"message"`
}

// WatchRoomMessages watches for new messages in a room
func (s *RealtimeService) WatchRoomMessages(roomID string, callback func(MessageEvent)) error {
	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return err
	}

	collection := s.db.Collection("messages")
	
	// Create a pipeline to filter for this room
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{
			{Key: "fullDocument.room_id", Value: roomObjectID},
		}}},
	}

	ctx := context.Background()
	changeStream, err := collection.Watch(ctx, pipeline)
	if err != nil {
		return err
	}

	go func() {
		defer changeStream.Close(ctx)
		
		for changeStream.Next(ctx) {
			var event bson.M
			if err := changeStream.Decode(&event); err != nil {
				log.Println("Error decoding change stream event:", err)
				continue
			}

			operationType := event["operationType"].(string)
			
			var messageEvent MessageEvent
			messageEvent.Type = operationType
			
			if fullDocument, ok := event["fullDocument"].(bson.M); ok {
				messageEvent.Message = fullDocument
			}
			
			callback(messageEvent)
		}
	}()

	return nil
}

// WatchRoomPresence watches for user presence changes in a room
func (s *RealtimeService) WatchRoomPresence(roomID string, callback func(interface{})) error {
	roomObjectID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return err
	}

	collection := s.db.Collection("room_members")
	
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.D{
			{Key: "fullDocument.room_id", Value: roomObjectID},
		}}},
	}

	ctx := context.Background()
	changeStream, err := collection.Watch(ctx, pipeline)
	if err != nil {
		return err
	}

	go func() {
		defer changeStream.Close(ctx)
		
		for changeStream.Next(ctx) {
			var event bson.M
			if err := changeStream.Decode(&event); err != nil {
				log.Println("Error decoding change stream event:", err)
				continue
			}
			
			if fullDocument, ok := event["fullDocument"].(bson.M); ok {
				callback(fullDocument)
			}
		}
	}()

	return nil
}

// BroadcastMessage simulates broadcasting a message (for SSE/WebSocket)
type BroadcastMessage struct {
	RoomID  string      `json:"room_id"`
	Type    string      `json:"type"`
	Data    interface{} `json:"data"`
	SentAt  time.Time   `json:"sent_at"`
}

// MessageBroadcaster manages message broadcasting
type MessageBroadcaster struct {
	clients map[string]chan BroadcastMessage
}

// NewMessageBroadcaster creates a new message broadcaster
func NewMessageBroadcaster() *MessageBroadcaster {
	return &MessageBroadcaster{
		clients: make(map[string]chan BroadcastMessage),
	}
}

// Subscribe subscribes a client to room messages
func (mb *MessageBroadcaster) Subscribe(clientID string) chan BroadcastMessage {
	ch := make(chan BroadcastMessage, 10)
	mb.clients[clientID] = ch
	return ch
}

// Unsubscribe unsubscribes a client
func (mb *MessageBroadcaster) Unsubscribe(clientID string) {
	if ch, ok := mb.clients[clientID]; ok {
		close(ch)
		delete(mb.clients, clientID)
	}
}

// Broadcast broadcasts a message to all subscribed clients
func (mb *MessageBroadcaster) Broadcast(msg BroadcastMessage) {
	for _, ch := range mb.clients {
		select {
		case ch <- msg:
		default:
			// Channel full, skip
		}
	}
}
