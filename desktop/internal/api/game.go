package api

import (
	"fmt"
	"io"
)

// GameService handles game-related API calls
type GameService struct {
	client *Client
}

// NewGameService creates a new game service
func NewGameService(client *Client) *GameService {
	return &GameService{client: client}
}

// GameTemplate represents a game template
type GameTemplate struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	Category     string `json:"category"`
	Engine       string `json:"engine"`
	Multiplayer  bool   `json:"multiplayer"`
	Icon         string `json:"icon"`
	MinQuestions int    `json:"min_questions"`
	MaxQuestions int    `json:"max_questions"`
	Complexity   string `json:"complexity"`
}

// GetTemplates returns all available game templates
func (s *GameService) GetTemplates() ([]GameTemplate, error) {
	var templates []GameTemplate
	if err := s.client.Get("/games/templates", &templates); err != nil {
		return nil, err
	}
	return templates, nil
}

// GetTemplate returns a specific template
func (s *GameService) GetTemplate(templateID string) (*GameTemplate, error) {
	var template GameTemplate
	path := fmt.Sprintf("/games/templates/%s", templateID)
	if err := s.client.Get(path, &template); err != nil {
		return nil, err
	}
	return &template, nil
}

// GenerateGameRequest represents a game generation request
type GenerateGameRequest struct {
	GameType      string `json:"game_type"`
	Subject       string `json:"subject"`
	Difficulty    string `json:"difficulty"`
	QuestionCount int    `json:"question_count"`
}

// GenerateGame generates a new game
func (s *GameService) GenerateGame(roomID string, gameType, subject, difficulty string, questionCount int) (interface{}, error) {
	req := GenerateGameRequest{
		GameType:      gameType,
		Subject:       subject,
		Difficulty:    difficulty,
		QuestionCount: questionCount,
	}

	var result interface{}
	path := fmt.Sprintf("/rooms/%s/games", roomID)
	if err := s.client.Post(path, req, &result); err != nil {
		return nil, err
	}
	return result, nil
}

// GetRoomGames returns all games for a room
func (s *GameService) GetRoomGames(roomID string) (interface{}, error) {
	var games interface{}
	path := fmt.Sprintf("/rooms/%s/games", roomID)
	if err := s.client.Get(path, &games); err != nil {
		return nil, err
	}
	return games, nil
}

// GetGame returns a specific game
func (s *GameService) GetGame(gameID string) (interface{}, error) {
	var game interface{}
	path := fmt.Sprintf("/games/%s", gameID)
	if err := s.client.Get(path, &game); err != nil {
		return nil, err
	}
	return game, nil
}

// DownloadBundle downloads a game bundle
func (s *GameService) DownloadBundle(gameID string) ([]byte, error) {
	path := fmt.Sprintf("/games/%s/bundle", gameID)
	fullURL := s.client.baseURL + path
	
	// Create HTTP request manually for file download
	req, err := s.client.httpClient.Get(fullURL)
	if err != nil {
		return nil, err
	}
	defer req.Body.Close()

	if req.StatusCode != 200 {
		return nil, fmt.Errorf("failed to download bundle: status %d", req.StatusCode)
	}

	return io.ReadAll(req.Body)
}

// PlayGameRequest represents a play game request
type PlayGameRequest struct {
	Answers   []string `json:"answers"`
	TimeSpent int      `json:"time_spent"`
}

// PlayGame submits game answers
func (s *GameService) PlayGame(gameID string, answers []string, timeSpent int) (interface{}, error) {
	req := PlayGameRequest{
		Answers:   answers,
		TimeSpent: timeSpent,
	}

	var result interface{}
	path := fmt.Sprintf("/games/%s/play", gameID)
	if err := s.client.Post(path, req, &result); err != nil {
		return nil, err
	}
	return result, nil
}

// GetGameResults returns student's results for a game
func (s *GameService) GetGameResults(gameID string) (interface{}, error) {
	var results interface{}
	path := fmt.Sprintf("/games/%s/results", gameID)
	if err := s.client.Get(path, &results); err != nil {
		return nil, err
	}
	return results, nil
}
