package services

import (
	"buddy-server/models"
	"errors"
	"fmt"
)

// GameTemplateService handles game template definitions and validation
type GameTemplateService struct{}

// NewGameTemplateService creates a new game template service
func NewGameTemplateService() *GameTemplateService {
	return &GameTemplateService{}
}

// GameTemplate represents a game template definition
type GameTemplate struct {
	ID          string
	Name        string
	Description string
	Category    string // "knowledge", "skill", "reflex"
	Engine      string // "phaser", "canvas", "html"
	Multiplayer bool
	Icon        string
	MinQuestions int
	MaxQuestions int
	Complexity   string // "low", "medium", "high"
}

// GetTemplates returns all available game templates
func (s *GameTemplateService) GetTemplates() []GameTemplate {
	return []GameTemplate{
		{
			ID:           "quiz",
			Name:         "Quiz Game",
			Description:  "Multiple choice questions with instant feedback",
			Category:     "knowledge",
			Engine:       "html",
			Multiplayer:  true,
			Icon:         "question-circle",
			MinQuestions: 3,
			MaxQuestions: 20,
			Complexity:   "low",
		},
		{
			ID:           "flashcards",
			Name:         "Flashcards",
			Description:  "Flip cards to reveal answers and test memory",
			Category:     "knowledge",
			Engine:       "html",
			Multiplayer:  false,
			Icon:         "cards",
			MinQuestions: 5,
			MaxQuestions: 50,
			Complexity:   "low",
		},
		{
			ID:           "word-search",
			Name:         "Word Search",
			Description:  "Find hidden words in a letter grid",
			Category:     "skill",
			Engine:       "canvas",
			Multiplayer:  false,
			Icon:         "grid",
			MinQuestions: 5,
			MaxQuestions: 15,
			Complexity:   "medium",
		},
		{
			ID:           "fill-blank",
			Name:         "Fill in the Blank",
			Description:  "Complete sentences with the correct words",
			Category:     "knowledge",
			Engine:       "html",
			Multiplayer:  false,
			Icon:         "edit",
			MinQuestions: 3,
			MaxQuestions: 20,
			Complexity:   "low",
		},
		{
			ID:           "matching",
			Name:         "Matching Game",
			Description:  "Match items to their correct pairs",
			Category:     "skill",
			Engine:       "html",
			Multiplayer:  false,
			Icon:         "link",
			MinQuestions: 4,
			MaxQuestions: 12,
			Complexity:   "medium",
		},
	}
}

// GetTemplate returns a specific template by ID
func (s *GameTemplateService) GetTemplate(templateID string) (*GameTemplate, error) {
	templates := s.GetTemplates()
	for _, t := range templates {
		if t.ID == templateID {
			return &t, nil
		}
	}
	return nil, errors.New("template not found")
}

// ValidateTemplateID checks if a template ID is valid
func (s *GameTemplateService) ValidateTemplateID(templateID string) bool {
	_, err := s.GetTemplate(templateID)
	return err == nil
}

// GetDefaultConfig returns default configuration for a template
func (s *GameTemplateService) GetDefaultConfig(templateID string) (models.GameConfig, error) {
	_, err := s.GetTemplate(templateID)
	if err != nil {
		return models.GameConfig{}, err
	}

	// Default color schemes by template
	colorSchemes := map[string]models.ColorScheme{
		"quiz": {
			Primary:    "#3B82F6",
			Secondary:  "#8B5CF6",
			Accent:     "#10B981",
			Background: "#F9FAFB",
		},
		"flashcards": {
			Primary:    "#8B5CF6",
			Secondary:  "#EC4899",
			Accent:     "#F59E0B",
			Background: "#FFFFFF",
		},
		"word-search": {
			Primary:    "#10B981",
			Secondary:  "#3B82F6",
			Accent:     "#F59E0B",
			Background: "#F3F4F6",
		},
		"fill-blank": {
			Primary:    "#F59E0B",
			Secondary:  "#3B82F6",
			Accent:     "#10B981",
			Background: "#FFFFFF",
		},
		"matching": {
			Primary:    "#EC4899",
			Secondary:  "#8B5CF6",
			Accent:     "#10B981",
			Background: "#F9FAFB",
		},
	}

	colors, exists := colorSchemes[templateID]
	if !exists {
		colors = colorSchemes["quiz"] // Default fallback
	}

	return models.GameConfig{
		Theme:  "default",
		Colors: colors,
		Audio: models.AudioSettings{
			MusicEnabled: false,
			SFXEnabled:   true,
			Volume:       0.7,
		},
	}, nil
}

// GetDefaultRuleset returns default ruleset for a template
func (s *GameTemplateService) GetDefaultRuleset(templateID string, difficulty string) (models.GameRuleset, error) {
	_, err := s.GetTemplate(templateID)
	if err != nil {
		return models.GameRuleset{}, err
	}

	// Base ruleset
	ruleset := models.GameRuleset{
		LivesCount:   3,
		PassingScore: 70,
		BonusPoints: map[string]int{
			"speed_bonus":  10,
			"streak_bonus": 5,
		},
		Penalties: map[string]int{
			"wrong_answer": -5,
		},
	}

	// Adjust time limit based on difficulty
	switch difficulty {
	case "easy":
		ruleset.TimeLimit = 60 // 60 seconds per question
	case "medium":
		ruleset.TimeLimit = 30 // 30 seconds per question
	case "hard":
		ruleset.TimeLimit = 15 // 15 seconds per question
	default:
		ruleset.TimeLimit = 30
	}

	// Template-specific adjustments
	switch templateID {
	case "quiz":
		ruleset.PowerUps = []models.PowerUp{
			{Type: "hint", Duration: 0, Description: "Eliminate 2 wrong answers"},
			{Type: "time_freeze", Duration: 10, Description: "Freeze the timer for 10 seconds"},
		}
	case "flashcards":
		ruleset.TimeLimit = 0 // No time limit for flashcards
		ruleset.LivesCount = 0 // No lives for flashcards
	case "word-search":
		ruleset.TimeLimit = 300 // 5 minutes total
		ruleset.PowerUps = []models.PowerUp{
			{Type: "reveal_letter", Duration: 0, Description: "Reveal one letter in a word"},
			{Type: "highlight_word", Duration: 5, Description: "Highlight a word for 5 seconds"},
		}
	}

	return ruleset, nil
}

// ValidateQuestionCount checks if question count is valid for template
func (s *GameTemplateService) ValidateQuestionCount(templateID string, count int) error {
	template, err := s.GetTemplate(templateID)
	if err != nil {
		return err
	}

	if count < template.MinQuestions {
		return fmt.Errorf("minimum %d questions required for %s", template.MinQuestions, template.Name)
	}
	if count > template.MaxQuestions {
		return fmt.Errorf("maximum %d questions allowed for %s", template.MaxQuestions, template.Name)
	}

	return nil
}

// GenerateTemplateMetadata creates initial game metadata from template
func (s *GameTemplateService) GenerateTemplateMetadata(templateID, subject, difficulty string, questionCount int) (map[string]interface{}, error) {
	template, err := s.GetTemplate(templateID)
	if err != nil {
		return nil, err
	}

	if err := s.ValidateQuestionCount(templateID, questionCount); err != nil {
		return nil, err
	}

	config, err := s.GetDefaultConfig(templateID)
	if err != nil {
		return nil, err
	}

	ruleset, err := s.GetDefaultRuleset(templateID, difficulty)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"template":    templateID,
		"name":        template.Name,
		"category":    template.Category,
		"engine":      template.Engine,
		"multiplayer": template.Multiplayer,
		"config":      config,
		"ruleset":     ruleset,
	}, nil
}
