package services

import (
	"context"
	"errors"
	"time"

	"buddy-server/database"
	"buddy-server/models"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

// JWTClaims represents JWT claims
type JWTClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// AuthService handles authentication logic
type AuthService struct {
	db        *database.DB
	jwtSecret string
}

// NewAuthService creates a new auth service
func NewAuthService(db *database.DB, jwtSecret string) *AuthService {
	return &AuthService{
		db:        db,
		jwtSecret: jwtSecret,
	}
}

// SignUp registers a new user
func (s *AuthService) SignUp(email, password, name string, age int, role string) (*models.User, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check if user exists
	collection := s.db.Collection("users")
	var existingUser models.User
	err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&existingUser)
	if err == nil {
		return nil, "", errors.New("user already exists")
	}
	if err != mongo.ErrNoDocuments {
		return nil, "", err
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	// Create user
	user := &models.User{
		Email:     email,
		Password:  string(hashedPassword),
		Name:      name,
		Age:       age,
		Role:      role,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	result, err := collection.InsertOne(ctx, user)
	if err != nil {
		return nil, "", err
	}

	user.ID = result.InsertedID.(primitive.ObjectID)

	// Create user stats
	statsCollection := s.db.Collection("user_stats")
	stats := &models.UserStats{
		UserID:    user.ID,
		TotalXP:   0,
		Level:     1,
		Gems:      0,
		Tokens:    0,
		BadgesEarned: 0,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	_, _ = statsCollection.InsertOne(ctx, stats)

	// Create profile
	profileCollection := s.db.Collection("profiles")
	profile := &models.Profile{
		UserID:    user.ID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	_, _ = profileCollection.InsertOne(ctx, profile)

	// Generate token
	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

// Login authenticates a user
func (s *AuthService) Login(email, password string) (*models.User, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find user
	collection := s.db.Collection("users")
	var user models.User
	err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, "", errors.New("invalid credentials")
		}
		return nil, "", err
	}

	// Check password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	// Generate token
	token, err := s.GenerateToken(&user)
	if err != nil {
		return nil, "", err
	}

	return &user, token, nil
}

// GenerateToken generates a JWT token
func (s *AuthService) GenerateToken(user *models.User) (string, error) {
	claims := JWTClaims{
		UserID: user.ID.Hex(),
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

// ValidateToken validates a JWT token
func ValidateToken(tokenString, jwtSecret string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// GetUserByID gets a user by ID
func (s *AuthService) GetUserByID(userID string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	collection := s.db.Collection("users")
	var user models.User
	err = collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}
