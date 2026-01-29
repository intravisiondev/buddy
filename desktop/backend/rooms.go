package backend

import (
	"buddy-desktop/internal/api"
	"fmt"
)

// GetRooms gets all rooms with optional filters
func (a *WailsApp) GetRooms(subject string) ([]api.Room, error) {
	return a.api.Room.GetRooms(subject, "")
}

// GetMyRooms gets rooms created by current user (for teachers)
func (a *WailsApp) GetMyRooms(subject string) ([]api.Room, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Room.GetMyRooms(subject)
}

// GetRoom gets a room by ID
func (a *WailsApp) GetRoom(roomID string) (*api.Room, error) {
	return a.api.Room.GetRoom(roomID)
}

// CreateRoom creates a new room
func (a *WailsApp) CreateRoom(name, subject, description string, syllabus *api.Syllabus, isPrivate bool, maxMembers int) (*api.Room, error) {
	room, err := a.api.Room.CreateRoom(api.CreateRoomRequest{
		Name:        name,
		Subject:     subject,
		Description: description,
		IsPrivate:   isPrivate,
		MaxMembers:  maxMembers,
		Syllabus:    syllabus,
	})

	if err == nil {
		// Emit room created event
		a.EmitEvent("room:created", room)
	}

	return room, err
}

// JoinRoom joins a room
func (a *WailsApp) JoinRoom(roomID string) error {
	err := a.api.Room.JoinRoom(roomID)

	if err == nil {
		// Emit room joined event
		a.EmitEvent("room:joined", map[string]string{"roomId": roomID})
	}

	return err
}

// SendMessage sends a message to a room
func (a *WailsApp) SendMessage(roomID, content string) (*api.Message, error) {
	message, err := a.api.Room.SendMessage(roomID, content)

	if err == nil {
		// Emit message sent event
		a.EmitEvent("message:sent", message)
	}

	return message, err
}

// GetMessages gets messages from a room
func (a *WailsApp) GetMessages(roomID string) ([]api.Message, error) {
	return a.api.Room.GetMessages(roomID)
}

// GetRoomMembers gets members of a room
func (a *WailsApp) GetRoomMembers(roomID string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Room.GetRoomMembers(roomID)
}

// UpdateRoomSyllabus updates the syllabus of a room
func (a *WailsApp) UpdateRoomSyllabus(roomID string, syllabus *api.Syllabus) (*api.Room, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Room.UpdateRoomSyllabus(roomID, syllabus)
}

// GetRoomAIStatus gets the AI training status for a room
func (a *WailsApp) GetRoomAIStatus(roomID string) (map[string]interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Room.GetRoomAIStatus(roomID)
}

// TrainRoomAI trains the room AI with selected resources
func (a *WailsApp) TrainRoomAI(roomID string, resourceIDs []string) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.Room.TrainRoomAI(roomID, resourceIDs)
}

// ChatWithRoomAI sends a message to the room's AI coach
func (a *WailsApp) ChatWithRoomAI(roomID string, message string) (map[string]interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Room.ChatWithRoomAI(roomID, message)
}
