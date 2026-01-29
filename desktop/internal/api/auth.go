package api

// AuthService handles authentication API calls
type AuthService struct {
	client *Client
}

// NewAuthService creates a new auth service
func NewAuthService(client *Client) *AuthService {
	return &AuthService{client: client}
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse represents a login response
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// SignUpRequest represents a sign up request
type SignUpRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Age      int    `json:"age"`
	Role     string `json:"role"` // "student", "parent", "teacher"
}

// User represents a user
type User struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Age   int    `json:"age"`
	Role  string `json:"role"`
}

// Login performs user login
func (s *AuthService) Login(req LoginRequest) (*LoginResponse, error) {
	var resp LoginResponse
	err := s.client.Post("/auth/login", req, &resp)
	if err != nil {
		return nil, err
	}
	// Set auth token after successful login
	s.client.SetAuthToken(resp.Token)
	return &resp, nil
}

// SignUp performs user registration
func (s *AuthService) SignUp(req SignUpRequest) (*LoginResponse, error) {
	var resp LoginResponse
	err := s.client.Post("/auth/signup", req, &resp)
	if err != nil {
		return nil, err
	}
	// Set auth token after successful signup
	s.client.SetAuthToken(resp.Token)
	return &resp, nil
}

// Logout performs user logout
func (s *AuthService) Logout() error {
	err := s.client.Post("/auth/logout", nil, nil)
	if err != nil {
		return err
	}
	s.client.SetAuthToken("")
	return nil
}

// GetCurrentUser gets the current authenticated user
func (s *AuthService) GetCurrentUser() (*User, error) {
	var user User
	err := s.client.Get("/auth/me", &user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}
