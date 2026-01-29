package backend

import (
	"buddy-desktop/internal/api"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// AuthResponse represents authentication response
type AuthResponse struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

// Login authenticates a user
func (a *WailsApp) Login(email, password string) (*AuthResponse, error) {
	resp, err := a.api.Auth.Login(api.LoginRequest{
		Email:    email,
		Password: password,
	})
	if err != nil {
		return nil, err
	}

	a.authToken = resp.Token
	a.api.SetToken(resp.Token)
	a.currentUser = &resp.User

	// Save token to persistent storage for auto-login
	a.saveAuthToken(resp.Token)
	a.saveUserData(&resp.User)

	// Emit login event
	a.EmitEvent("auth:login", resp.User)

	return &AuthResponse{
		Token: resp.Token,
		User:  resp.User,
	}, nil
}

// SignUp registers a new user
func (a *WailsApp) SignUp(email, password, name string, age int, role string) (*AuthResponse, error) {
	resp, err := a.api.Auth.SignUp(api.SignUpRequest{
		Email:    email,
		Password: password,
		Name:     name,
		Age:      age,
		Role:     role,
	})
	if err != nil {
		return nil, err
	}

	a.authToken = resp.Token
	a.api.SetToken(resp.Token)
	a.currentUser = &resp.User

	// Save token to persistent storage for auto-login
	a.saveAuthToken(resp.Token)
	a.saveUserData(&resp.User)

	// Emit signup event
	a.EmitEvent("auth:signup", resp.User)

	return &AuthResponse{
		Token: resp.Token,
		User:  resp.User,
	}, nil
}

// Logout logs out the current user
func (a *WailsApp) Logout() error {
	if a.ctx != nil {
		runtime.LogInfo(a.ctx, fmt.Sprintf("[auth] Logout called (token present=%v)", a.authToken != ""))
	}
	err := a.api.Auth.Logout()
	a.authToken = ""
	a.currentUser = nil
	a.api.SetToken("")

	// Clear saved auth data
	a.clearAuthToken()
	a.clearUserData()

	// Emit logout event
	a.EmitEvent("auth:logout", nil)

	return err
}

// GetCurrentUser gets the current authenticated user
func (a *WailsApp) GetCurrentUser() (*api.User, error) {
	if a.currentUser != nil {
		return a.currentUser, nil
	}
	return a.api.Auth.GetCurrentUser()
}

// IsAuthenticated checks if user is authenticated
func (a *WailsApp) IsAuthenticated() bool {
	return a.authToken != "" && a.currentUser != nil
}

// getConfigDir returns the config directory path
func (a *WailsApp) getConfigDir() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return ".buddy"
	}
	return filepath.Join(homeDir, ".buddy")
}

// saveAuthToken saves the auth token to disk
func (a *WailsApp) saveAuthToken(token string) error {
	configDir := a.getConfigDir()
	if err := os.MkdirAll(configDir, 0700); err != nil {
		return err
	}
	
	tokenFile := filepath.Join(configDir, "token.txt")
	return os.WriteFile(tokenFile, []byte(token), 0600)
}

// loadAuthToken loads the saved auth token
func (a *WailsApp) loadAuthToken() (string, error) {
	tokenFile := filepath.Join(a.getConfigDir(), "token.txt")
	data, err := os.ReadFile(tokenFile)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// clearAuthToken removes the saved auth token
func (a *WailsApp) clearAuthToken() error {
	tokenFile := filepath.Join(a.getConfigDir(), "token.txt")
	return os.Remove(tokenFile)
}

// saveUserData saves user data to disk
func (a *WailsApp) saveUserData(user *api.User) error {
	configDir := a.getConfigDir()
	if err := os.MkdirAll(configDir, 0700); err != nil {
		return err
	}
	
	userFile := filepath.Join(configDir, "user.json")
	data, err := json.Marshal(user)
	if err != nil {
		return err
	}
	return os.WriteFile(userFile, data, 0600)
}

// loadUserData loads saved user data
func (a *WailsApp) loadUserData() (*api.User, error) {
	userFile := filepath.Join(a.getConfigDir(), "user.json")
	data, err := os.ReadFile(userFile)
	if err != nil {
		return nil, err
	}
	
	var user api.User
	if err := json.Unmarshal(data, &user); err != nil {
		return nil, err
	}
	return &user, nil
}

// clearUserData removes saved user data
func (a *WailsApp) clearUserData() error {
	userFile := filepath.Join(a.getConfigDir(), "user.json")
	return os.Remove(userFile)
}

// RestoreSession attempts to restore a saved session on startup
func (a *WailsApp) RestoreSession() bool {
	token, err := a.loadAuthToken()
	if err != nil {
		return false
	}
	
	user, err := a.loadUserData()
	if err != nil {
		return false
	}
	
	// Set the token and try to verify it's still valid
	a.authToken = token
	a.api.SetToken(token)
	a.currentUser = user
	
	// Verify token is still valid by fetching current user
	_, err = a.api.Auth.GetCurrentUser()
	if err != nil {
		// Token is invalid, clear everything
		a.authToken = ""
		a.currentUser = nil
		a.api.SetToken("")
		a.clearAuthToken()
		a.clearUserData()
		return false
	}
	
	// Emit login event for frontend
	a.EmitEvent("auth:login", user)
	
	return true
}
