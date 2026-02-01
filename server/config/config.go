package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds application configuration
type Config struct {
	Port           string
	Env            string
	MongoURI       string
	JWTSecret      string
	GeminiAPIKey   string
	AllowedOrigins []string
}

// Load loads configuration from environment variables
func Load() *Config {
	// Load .env file if exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Prefer MONGO_URI_DIRECT when DNS/SRV lookup fails (e.g. "lookup _mongodb._tcp... i/o timeout")
	mongoURI := getEnv("MONGO_URI_DIRECT", "")
	if mongoURI == "" {
		mongoURI = getEnv("MONGO_URI", "mongodb://localhost:27017/buddy")
	}
	return &Config{
		Port:           getEnv("PORT", "8080"),
		Env:            getEnv("ENV", "development"),
		MongoURI:       mongoURI,
		JWTSecret:      getEnv("JWT_SECRET", "default-secret-change-in-production"),
		GeminiAPIKey:   getEnv("GEMINI_API_KEY", ""),
		AllowedOrigins: strings.Split(getEnv("ALLOWED_ORIGINS", "http://localhost:34115,http://localhost:5173"), ","),
	}
}

// getEnv gets an environment variable or returns default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
