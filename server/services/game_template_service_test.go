package services

import (
	"testing"
)

func TestGetTemplates(t *testing.T) {
	service := NewGameTemplateService()
	templates := service.GetTemplates()

	if len(templates) < 5 {
		t.Errorf("Expected at least 5 templates, got %d", len(templates))
	}

	// Check required templates exist
	requiredTemplates := []string{"quiz", "flashcards", "word-search", "fill-blank", "matching"}
	foundTemplates := make(map[string]bool)
	
	for _, template := range templates {
		foundTemplates[template.ID] = true
	}

	for _, required := range requiredTemplates {
		if !foundTemplates[required] {
			t.Errorf("Required template %s not found", required)
		}
	}
}

func TestGetTemplate(t *testing.T) {
	service := NewGameTemplateService()

	// Test valid template
	template, err := service.GetTemplate("quiz")
	if err != nil {
		t.Errorf("Expected no error for valid template, got %v", err)
	}
	if template.ID != "quiz" {
		t.Errorf("Expected template ID 'quiz', got %s", template.ID)
	}
	if template.Name == "" {
		t.Error("Template name should not be empty")
	}

	// Test invalid template
	_, err = service.GetTemplate("invalid-template")
	if err == nil {
		t.Error("Expected error for invalid template")
	}
}

func TestValidateTemplateID(t *testing.T) {
	service := NewGameTemplateService()

	tests := []struct {
		templateID string
		expected   bool
	}{
		{"quiz", true},
		{"flashcards", true},
		{"word-search", true},
		{"invalid", false},
		{"", false},
	}

	for _, test := range tests {
		result := service.ValidateTemplateID(test.templateID)
		if result != test.expected {
			t.Errorf("ValidateTemplateID(%s) = %v, expected %v", test.templateID, result, test.expected)
		}
	}
}

func TestValidateQuestionCount(t *testing.T) {
	service := NewGameTemplateService()

	tests := []struct {
		templateID string
		count      int
		shouldFail bool
	}{
		{"quiz", 10, false},     // Valid
		{"quiz", 3, false},      // Min boundary
		{"quiz", 20, false},     // Max boundary
		{"quiz", 2, true},       // Too few
		{"quiz", 21, true},      // Too many
		{"flashcards", 5, false}, // Valid
		{"flashcards", 4, true},  // Too few
	}

	for _, test := range tests {
		err := service.ValidateQuestionCount(test.templateID, test.count)
		if test.shouldFail && err == nil {
			t.Errorf("Expected error for %s with count %d", test.templateID, test.count)
		}
		if !test.shouldFail && err != nil {
			t.Errorf("Unexpected error for %s with count %d: %v", test.templateID, test.count, err)
		}
	}
}

func TestGetDefaultConfig(t *testing.T) {
	service := NewGameTemplateService()

	config, err := service.GetDefaultConfig("quiz")
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if config.Colors.Primary == "" {
		t.Error("Primary color should not be empty")
	}
	if config.Audio.Volume <= 0 || config.Audio.Volume > 1 {
		t.Errorf("Audio volume should be between 0 and 1, got %f", config.Audio.Volume)
	}

	// Test invalid template
	_, err = service.GetDefaultConfig("invalid")
	if err == nil {
		t.Error("Expected error for invalid template")
	}
}

func TestGetDefaultRuleset(t *testing.T) {
	service := NewGameTemplateService()

	tests := []struct {
		templateID     string
		difficulty     string
		expectedTime   int
		expectedLives  int
		expectedPassing int
	}{
		{"quiz", "easy", 60, 3, 70},
		{"quiz", "medium", 30, 3, 70},
		{"quiz", "hard", 15, 3, 70},
		{"flashcards", "medium", 0, 0, 70}, // No time limit
	}

	for _, test := range tests {
		ruleset, err := service.GetDefaultRuleset(test.templateID, test.difficulty)
		if err != nil {
			t.Errorf("Unexpected error for %s/%s: %v", test.templateID, test.difficulty, err)
			continue
		}

		if ruleset.TimeLimit != test.expectedTime {
			t.Errorf("Expected time limit %d for %s/%s, got %d",
				test.expectedTime, test.templateID, test.difficulty, ruleset.TimeLimit)
		}
		if ruleset.LivesCount != test.expectedLives {
			t.Errorf("Expected lives %d for %s, got %d",
				test.expectedLives, test.templateID, ruleset.LivesCount)
		}
		if ruleset.PassingScore != test.expectedPassing {
			t.Errorf("Expected passing score %d, got %d",
				test.expectedPassing, ruleset.PassingScore)
		}
	}
}

func TestGenerateTemplateMetadata(t *testing.T) {
	service := NewGameTemplateService()

	metadata, err := service.GenerateTemplateMetadata("quiz", "Math", "medium", 10)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if metadata["template"] != "quiz" {
		t.Errorf("Expected template 'quiz', got %v", metadata["template"])
	}
	if metadata["name"] != "Quiz Game" {
		t.Errorf("Expected name 'Quiz Game', got %v", metadata["name"])
	}

	// Test invalid question count
	_, err = service.GenerateTemplateMetadata("quiz", "Math", "medium", 100)
	if err == nil {
		t.Error("Expected error for invalid question count")
	}
}
