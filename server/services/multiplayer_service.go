package services

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"sync"
	"time"

	"buddy-server/database"
	"buddy-server/models"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// MultiplayerService handles real-time multiplayer game sessions
type MultiplayerService struct {
	db       *database.DB
	matches  map[string]*ActiveMatch // matchID -> ActiveMatch
	matchMux sync.RWMutex
}

// ActiveMatch represents a live match session
type ActiveMatch struct {
	Session    *models.MatchSession
	Players    map[string]*PlayerConnection // userID -> connection
	Broadcast  chan *Message
	Register   chan *PlayerConnection
	Unregister chan *PlayerConnection
	Done       chan bool
}

// PlayerConnection represents a player's WebSocket connection
type PlayerConnection struct {
	UserID    string
	Conn      *websocket.Conn
	Send      chan []byte
	MatchID   string
	service   *MultiplayerService
}

// Message represents a WebSocket message
type Message struct {
	Type    string                 `json:"type"`
	From    string                 `json:"from,omitempty"`
	To      string                 `json:"to,omitempty"`
	Data    map[string]interface{} `json:"data"`
	SentAt  time.Time              `json:"sent_at"`
}

// NewMultiplayerService creates a new multiplayer service
func NewMultiplayerService(db *database.DB) *MultiplayerService {
	return &MultiplayerService{
		db:      db,
		matches: make(map[string]*ActiveMatch),
	}
}

// CreateMatch creates a new match session
func (s *MultiplayerService) CreateMatch(gameID, roomID, userID string, config models.MatchConfig) (*models.MatchSession, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	gameOID, err := primitive.ObjectIDFromHex(gameID)
	if err != nil {
		return nil, errors.New("invalid game ID")
	}

	roomOID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	_, err = primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Create match session
	match := &models.MatchSession{
		GameID:    gameOID,
		RoomID:    roomOID,
		Players:   []models.MatchPlayer{},
		State:     "lobby",
		Config:    config,
		Results:   nil,
		StartedAt: time.Now(),
	}

	// Insert into database
	collection := s.db.Collection("match_sessions")
	result, err := collection.InsertOne(ctx, match)
	if err != nil {
		return nil, err
	}

	match.ID = result.InsertedID.(primitive.ObjectID)

	// Create active match
	activeMatch := &ActiveMatch{
		Session:    match,
		Players:    make(map[string]*PlayerConnection),
		Broadcast:  make(chan *Message, 256),
		Register:   make(chan *PlayerConnection),
		Unregister: make(chan *PlayerConnection),
		Done:       make(chan bool),
	}

	s.matchMux.Lock()
	s.matches[match.ID.Hex()] = activeMatch
	s.matchMux.Unlock()

	// Start match coordinator
	go s.runMatch(activeMatch)

	// Auto-join creator
	if err := s.JoinMatch(match.ID.Hex(), userID, "Creator", ""); err != nil {
		log.Printf("Failed to auto-join creator: %v", err)
	}

	return match, nil
}

// JoinMatch adds a player to an existing match
func (s *MultiplayerService) JoinMatch(matchID, userID, name, avatar string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	matchOID, err := primitive.ObjectIDFromHex(matchID)
	if err != nil {
		return errors.New("invalid match ID")
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return errors.New("invalid user ID")
	}

	// Get match from database
	collection := s.db.Collection("match_sessions")
	var match models.MatchSession
	if err := collection.FindOne(ctx, bson.M{"_id": matchOID}).Decode(&match); err != nil {
		return errors.New("match not found")
	}

	// Check if match is joinable
	if match.State != "lobby" {
		return errors.New("match already started")
	}

	if len(match.Players) >= match.Config.MaxPlayers {
		return errors.New("match is full")
	}

	// Check if already joined
	for _, p := range match.Players {
		if p.UserID == userOID {
			return errors.New("already in match")
		}
	}

	// Add player
	player := models.MatchPlayer{
		UserID:   userOID,
		Name:     name,
		Avatar:   avatar,
		Score:    0,
		Rank:     0,
		Events:   []models.PlayerEvent{},
		JoinedAt: time.Now(),
	}

	_, err = collection.UpdateOne(ctx, bson.M{"_id": matchOID}, bson.M{
		"$push": bson.M{"players": player},
	})

	return err
}

// GetMatch retrieves a match session
func (s *MultiplayerService) GetMatch(matchID string) (*models.MatchSession, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	matchOID, err := primitive.ObjectIDFromHex(matchID)
	if err != nil {
		return nil, errors.New("invalid match ID")
	}

	var match models.MatchSession
	collection := s.db.Collection("match_sessions")
	if err := collection.FindOne(ctx, bson.M{"_id": matchOID}).Decode(&match); err != nil {
		return nil, errors.New("match not found")
	}

	return &match, nil
}

// HandleWebSocket handles WebSocket connection for a match
func (s *MultiplayerService) HandleWebSocket(matchID, userID string, conn *websocket.Conn) error {
	s.matchMux.RLock()
	activeMatch, exists := s.matches[matchID]
	s.matchMux.RUnlock()

	if !exists {
		return errors.New("match not found")
	}

	// Create player connection
	player := &PlayerConnection{
		UserID:  userID,
		Conn:    conn,
		Send:    make(chan []byte, 256),
		MatchID: matchID,
		service: s,
	}

	// Register player
	activeMatch.Register <- player

	// Start read/write pumps
	go player.writePump()
	go player.readPump(activeMatch)

	return nil
}

// runMatch coordinates a match session
func (s *MultiplayerService) runMatch(match *ActiveMatch) {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case player := <-match.Register:
			match.Players[player.UserID] = player
			s.broadcastPlayerJoined(match, player.UserID)

		case player := <-match.Unregister:
			if _, ok := match.Players[player.UserID]; ok {
				delete(match.Players, player.UserID)
				close(player.Send)
				s.broadcastPlayerLeft(match, player.UserID)
			}

		case message := <-match.Broadcast:
			s.broadcastMessage(match, message)

		case <-ticker.C:
			// Periodic state sync
			s.syncMatchState(match)

		case <-match.Done:
			s.endMatch(match)
			return
		}
	}
}

// readPump reads messages from WebSocket
func (pc *PlayerConnection) readPump(match *ActiveMatch) {
	defer func() {
		match.Unregister <- pc
		pc.Conn.Close()
	}()

	pc.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	pc.Conn.SetPongHandler(func(string) error {
		pc.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, messageData, err := pc.Conn.ReadMessage()
		if err != nil {
			break
		}

		var msg Message
		if err := json.Unmarshal(messageData, &msg); err != nil {
			continue
		}

		msg.From = pc.UserID
		msg.SentAt = time.Now()

		// Handle message
		pc.service.handlePlayerMessage(match, &msg)
	}
}

// writePump writes messages to WebSocket
func (pc *PlayerConnection) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		pc.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-pc.Send:
			if !ok {
				pc.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			pc.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := pc.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			pc.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := pc.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handlePlayerMessage processes incoming messages
func (s *MultiplayerService) handlePlayerMessage(match *ActiveMatch, msg *Message) {
	switch msg.Type {
	case "player_action":
		// Handle game action (answer, powerup, etc.)
		s.processPlayerAction(match, msg)
	case "chat_message":
		// Broadcast chat message
		match.Broadcast <- msg
	case "ready":
		// Player ready to start
		s.checkMatchStart(match)
	}
}

// processPlayerAction handles player game actions
func (s *MultiplayerService) processPlayerAction(match *ActiveMatch, msg *Message) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Record event
	event := models.PlayerEvent{
		Type:      msg.Data["action"].(string),
		Data:      msg.Data,
		Timestamp: time.Now(),
	}

	// Update player in database
	collection := s.db.Collection("match_sessions")
	_, err := collection.UpdateOne(ctx,
		bson.M{
			"_id":            match.Session.ID,
			"players.user_id": msg.From,
		},
		bson.M{
			"$push": bson.M{"players.$.events": event},
			"$inc":  bson.M{"players.$.score": msg.Data["points"]},
		},
	)

	if err != nil {
		log.Printf("Failed to update player action: %v", err)
		return
	}

	// Broadcast score update
	match.Broadcast <- &Message{
		Type: "score_update",
		From: msg.From,
		Data: map[string]interface{}{
			"user_id": msg.From,
			"score":   msg.Data["points"],
		},
		SentAt: time.Now(),
	}
}

// broadcastMessage sends a message to all players
func (s *MultiplayerService) broadcastMessage(match *ActiveMatch, msg *Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}

	for _, player := range match.Players {
		select {
		case player.Send <- data:
		default:
			close(player.Send)
			delete(match.Players, player.UserID)
		}
	}
}

// broadcastPlayerJoined notifies all players of a new join
func (s *MultiplayerService) broadcastPlayerJoined(match *ActiveMatch, userID string) {
	msg := &Message{
		Type: "player_joined",
		Data: map[string]interface{}{
			"user_id": userID,
		},
		SentAt: time.Now(),
	}
	match.Broadcast <- msg
}

// broadcastPlayerLeft notifies all players of a leave
func (s *MultiplayerService) broadcastPlayerLeft(match *ActiveMatch, userID string) {
	msg := &Message{
		Type: "player_left",
		Data: map[string]interface{}{
			"user_id": userID,
		},
		SentAt: time.Now(),
	}
	match.Broadcast <- msg
}

// syncMatchState sends current match state to all players
func (s *MultiplayerService) syncMatchState(match *ActiveMatch) {
	// Reload from DB to get latest
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var session models.MatchSession
	collection := s.db.Collection("match_sessions")
	if err := collection.FindOne(ctx, bson.M{"_id": match.Session.ID}).Decode(&session); err != nil {
		return
	}

	match.Session = &session

	msg := &Message{
		Type: "state_sync",
		Data: map[string]interface{}{
			"state":   session.State,
			"players": session.Players,
		},
		SentAt: time.Now(),
	}
	match.Broadcast <- msg
}

// checkMatchStart checks if all players are ready and starts the match
func (s *MultiplayerService) checkMatchStart(match *ActiveMatch) {
	// Check if enough players
	if len(match.Players) < match.Session.Config.MaxPlayers {
		return
	}

	// Start match
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := s.db.Collection("match_sessions")
	_, err := collection.UpdateOne(ctx,
		bson.M{"_id": match.Session.ID},
		bson.M{"$set": bson.M{"state": "countdown"}},
	)

	if err != nil {
		log.Printf("Failed to start match: %v", err)
		return
	}

	// Countdown and transition to active
	go func() {
		time.Sleep(3 * time.Second)
		collection.UpdateOne(ctx,
			bson.M{"_id": match.Session.ID},
			bson.M{"$set": bson.M{"state": "active"}},
		)
		s.syncMatchState(match)
	}()
}

// endMatch finalizes a match and saves results
func (s *MultiplayerService) endMatch(match *ActiveMatch) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Calculate rankings
	rankings := s.calculateRankings(match.Session.Players)

	// Determine winner
	var winner *primitive.ObjectID
	if len(rankings) > 0 {
		winner = &rankings[0].UserID
	}

	// Create result
	result := &models.MatchResult{
		Winner:   winner,
		Rankings: rankings,
		Stats:    map[string]interface{}{},
	}

	now := time.Now()
	collection := s.db.Collection("match_sessions")
	_, err := collection.UpdateOne(ctx,
		bson.M{"_id": match.Session.ID},
		bson.M{
			"$set": bson.M{
				"state":        "completed",
				"results":      result,
				"completed_at": now,
			},
		},
	)

	if err != nil {
		log.Printf("Failed to save match result: %v", err)
	}

	// Broadcast final results
	msg := &Message{
		Type: "match_end",
		Data: map[string]interface{}{
			"winner":   winner,
			"rankings": rankings,
		},
		SentAt: time.Now(),
	}
	match.Broadcast <- msg

	// Cleanup
	time.Sleep(5 * time.Second)
	s.matchMux.Lock()
	delete(s.matches, match.Session.ID.Hex())
	s.matchMux.Unlock()

	close(match.Broadcast)
	close(match.Register)
	close(match.Unregister)
}

// calculateRankings calculates player rankings
func (s *MultiplayerService) calculateRankings(players []models.MatchPlayer) []models.PlayerRanking {
	rankings := make([]models.PlayerRanking, len(players))

	for i, p := range players {
		correctAnswers := 0
		totalAnswers := 0

		for _, event := range p.Events {
			if event.Type == "answer" {
				totalAnswers++
				if correct, ok := event.Data["correct"].(bool); ok && correct {
					correctAnswers++
				}
			}
		}

		accuracy := 0.0
		if totalAnswers > 0 {
			accuracy = float64(correctAnswers) / float64(totalAnswers) * 100
		}

		rankings[i] = models.PlayerRanking{
			UserID:         p.UserID,
			Rank:           i + 1,
			Score:          p.Score,
			Accuracy:       accuracy,
			TotalAnswers:   totalAnswers,
			CorrectAnswers: correctAnswers,
		}
	}

	// Sort by score descending
	for i := 0; i < len(rankings); i++ {
		for j := i + 1; j < len(rankings); j++ {
			if rankings[j].Score > rankings[i].Score {
				rankings[i], rankings[j] = rankings[j], rankings[i]
			}
		}
	}

	// Update ranks
	for i := range rankings {
		rankings[i].Rank = i + 1
	}

	return rankings
}

// GetActiveMatches returns all active matches for a room
func (s *MultiplayerService) GetActiveMatches(roomID string) ([]*models.MatchSession, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	roomOID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, errors.New("invalid room ID")
	}

	collection := s.db.Collection("match_sessions")
	cursor, err := collection.Find(ctx, bson.M{
		"room_id": roomOID,
		"state":   bson.M{"$ne": "completed"},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var matches []*models.MatchSession
	if err := cursor.All(ctx, &matches); err != nil {
		return nil, err
	}

	return matches, nil
}
