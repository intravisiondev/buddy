package config

import (
	"os"
)

// Config holds application configuration
type Config struct {
	APIBaseURL string
	APITimeout int
	Env        string
}

// Load loads configuration from environment variables
func Load() *Config {
	apiBaseURL := os.Getenv("BUDDY_API_URL")
	if apiBaseURL == "" {
		apiBaseURL = "http://localhost:8080/api" // Default API URL
	}

	env := os.Getenv("BUDDY_ENV")
	if env == "" {
		env = "development"
	}

	return &Config{
		APIBaseURL: apiBaseURL,
		APITimeout: 30, // seconds
		Env:        env,
	}
}
