package services

import (
	"buddy-server/models"
	"os"
	"path/filepath"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestCreateBundle(t *testing.T) {
	// Setup test directory
	testDir := "./test_uploads"
	defer os.RemoveAll(testDir)

	packager := NewGamePackager(testDir)

	game := &models.AIGame{
		ID:       primitive.NewObjectID(),
		Title:    "Test Game",
		Template: "quiz",
		Questions: []models.GameQuestion{
			{Question: "Q1", CorrectAnswer: "A1", Points: 10},
			{Question: "Q2", CorrectAnswer: "A2", Points: 10},
		},
		Config: models.GameConfig{
			Theme: "default",
			Colors: models.ColorScheme{
				Primary:   "#3B82F6",
				Secondary: "#8B5CF6",
			},
		},
		Ruleset: models.GameRuleset{
			TimeLimit:    30,
			PassingScore: 70,
		},
		Version:   "1.0.0",
		CreatedAt: time.Now(),
	}

	bundle, err := packager.CreateBundle(game)
	if err != nil {
		t.Fatalf("CreateBundle failed: %v", err)
	}

	if bundle.Hash == "" {
		t.Error("Bundle hash should not be empty")
	}
	if bundle.Signature == "" {
		t.Error("Bundle signature should not be empty")
	}

	// Verify file exists
	if _, err := os.Stat(bundle.Path); os.IsNotExist(err) {
		t.Errorf("Bundle file does not exist at %s", bundle.Path)
	}

	// Verify manifest
	if bundle.Manifest.ID != game.ID.Hex() {
		t.Errorf("Expected manifest ID %s, got %s", game.ID.Hex(), bundle.Manifest.ID)
	}
	if bundle.Manifest.Template != "quiz" {
		t.Errorf("Expected template 'quiz', got %s", bundle.Manifest.Template)
	}
	if bundle.Manifest.Entrypoint != "index.html" {
		t.Errorf("Expected entrypoint 'index.html', got %s", bundle.Manifest.Entrypoint)
	}
}

func TestBundleIntegrity(t *testing.T) {
	testDir := "./test_uploads"
	defer os.RemoveAll(testDir)

	packager := NewGamePackager(testDir)

	game := &models.AIGame{
		ID:       primitive.NewObjectID(),
		Title:    "Test Game",
		Template: "quiz",
		Questions: []models.GameQuestion{
			{Question: "Q1", CorrectAnswer: "A1", Points: 10},
		},
		Config:    models.GameConfig{},
		Ruleset:   models.GameRuleset{TimeLimit: 30},
		Version:   "1.0.0",
		CreatedAt: time.Now(),
	}

	bundle, err := packager.CreateBundle(game)
	if err != nil {
		t.Fatalf("CreateBundle failed: %v", err)
	}

	// Verify bundle with correct hash and signature
	if !packager.VerifyBundle(bundle.Path, bundle.Hash, bundle.Signature) {
		t.Error("Bundle verification should pass for untampered bundle")
	}

	// Tamper with file
	os.WriteFile(bundle.Path, []byte("tampered content"), 0644)

	// Verify should fail
	if packager.VerifyBundle(bundle.Path, bundle.Hash, bundle.Signature) {
		t.Error("Bundle verification should fail for tampered bundle")
	}
}

func TestGetBundlePath(t *testing.T) {
	packager := NewGamePackager("./uploads")
	gameID := "507f1f77bcf86cd799439011"

	expectedPath := filepath.Join("./uploads", "games", gameID, "game-"+gameID+".zip")
	actualPath := packager.GetBundlePath(gameID)

	if actualPath != expectedPath {
		t.Errorf("Expected path %s, got %s", expectedPath, actualPath)
	}
}

func TestBundleExists(t *testing.T) {
	testDir := "./test_uploads"
	defer os.RemoveAll(testDir)

	packager := NewGamePackager(testDir)
	gameID := "507f1f77bcf86cd799439011"

	// Should not exist initially
	if packager.BundleExists(gameID) {
		t.Error("Bundle should not exist initially")
	}

	// Create bundle
	game := &models.AIGame{
		ID:        primitive.NewObjectID(),
		Title:     "Test",
		Template:  "quiz",
		Questions: []models.GameQuestion{{Question: "Q1", CorrectAnswer: "A1", Points: 10}},
		Config:    models.GameConfig{},
		Ruleset:   models.GameRuleset{},
		Version:   "1.0.0",
		CreatedAt: time.Now(),
	}

	bundle, _ := packager.CreateBundle(game)

	// Should exist now
	if !packager.BundleExists(game.ID.Hex()) {
		t.Error("Bundle should exist after creation")
	}

	// Verify path matches
	if bundle.Path != packager.GetBundlePath(game.ID.Hex()) {
		t.Error("Bundle path mismatch")
	}
}

func TestSignBundle(t *testing.T) {
	packager := NewGamePackager("./test")

	// Create test file
	testFile := "./test_bundle.txt"
	content := []byte("test content for signing")
	os.WriteFile(testFile, content, 0644)
	defer os.Remove(testFile)

	// Sign
	signature1 := packager.signBundle(testFile)
	if signature1 == "" {
		t.Error("Signature should not be empty")
	}

	// Sign again - should be deterministic
	signature2 := packager.signBundle(testFile)
	if signature1 != signature2 {
		t.Error("Signature should be deterministic")
	}

	// Modify file
	os.WriteFile(testFile, []byte("modified content"), 0644)
	signature3 := packager.signBundle(testFile)
	
	if signature1 == signature3 {
		t.Error("Signature should change when content changes")
	}
}
