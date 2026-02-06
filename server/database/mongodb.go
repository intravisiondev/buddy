package database

import (
	"context"
	"crypto/tls"
	"log"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// DB holds the database connection
type DB struct {
	Client   *mongo.Client
	Database *mongo.Database
}

// Connect establishes a connection to MongoDB
func Connect(uri string) *DB {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Client options: longer timeouts and explicit TLS for Atlas (avoids "tls: internal error")
	clientOptions := options.Client().ApplyURI(uri).
		SetServerSelectionTimeout(25 * time.Second).
		SetConnectTimeout(15 * time.Second)

	// ✅ TLS sadece Atlas / SRV connection için
	// - mongodb+srv:// genelde Atlas
	// - ya da uri içinde .mongodb.net geçiyorsa Atlas
	isAtlas := strings.HasPrefix(uri, "mongodb+srv://") || strings.Contains(uri, "mongodb.net")
	if isAtlas {
		clientOptions.SetTLSConfig(&tls.Config{MinVersion: tls.VersionTLS12})
	}
	// Connect to MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}

	// Ping the database
	if err = client.Ping(ctx, nil); err != nil {
		log.Fatal("Failed to ping MongoDB:", err)
	}

	log.Println("✓ Connected to MongoDB")

	// Get database name from URI (default: buddy)
	// Extract database name from connection string if provided
	dbName := "buddy"

	return &DB{
		Client:   client,
		Database: client.Database(dbName),
	}
}

// Close closes the database connection
func (db *DB) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return db.Client.Disconnect(ctx)
}

// Collection returns a collection by name
func (db *DB) Collection(name string) *mongo.Collection {
	return db.Database.Collection(name)
}
