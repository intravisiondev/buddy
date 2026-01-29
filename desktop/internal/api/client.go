package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"buddy-desktop/internal/config"
)

// Client represents the API client
type Client struct {
	baseURL    string
	httpClient *http.Client
	authToken  string
}

// NewClient creates a new API client
func NewClient() *Client {
	cfg := config.Load()
	return &Client{
		baseURL: cfg.APIBaseURL,
		httpClient: &http.Client{
			Timeout: time.Duration(cfg.APITimeout) * time.Second,
		},
	}
}

// SetAuthToken sets the authentication token
func (c *Client) SetAuthToken(token string) {
	c.authToken = token
}

// Get makes a GET request
func (c *Client) Get(endpoint string, response interface{}) error {
	return c.request(http.MethodGet, endpoint, nil, response)
}

// Post makes a POST request
func (c *Client) Post(endpoint string, body interface{}, response interface{}) error {
	return c.request(http.MethodPost, endpoint, body, response)
}

// Put makes a PUT request
func (c *Client) Put(endpoint string, body interface{}, response interface{}) error {
	return c.request(http.MethodPut, endpoint, body, response)
}

// Delete makes a DELETE request
func (c *Client) Delete(endpoint string) error {
	return c.request(http.MethodDelete, endpoint, nil, nil)
}

// request performs an HTTP request
func (c *Client) request(method, endpoint string, body interface{}, response interface{}) error {
	url := fmt.Sprintf("%s%s", c.baseURL, endpoint)

	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	if c.authToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.authToken))
	}

	// Perform request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to perform request: %w", err)
	}
	defer resp.Body.Close()

	// Check status code
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API error: %s - %s", resp.Status, string(bodyBytes))
	}

	// Parse response if needed
	if response != nil {
		if err := json.NewDecoder(resp.Body).Decode(response); err != nil {
			return fmt.Errorf("failed to decode response: %w", err)
		}
	}

	return nil
}

// UploadFile uploads a file using multipart/form-data
func (c *Client) UploadFile(endpoint, filePath string, response interface{}) error {
	url := fmt.Sprintf("%s%s", c.baseURL, endpoint)

	// Open file
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	// Create multipart form
	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)

	// Add file field
	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return fmt.Errorf("failed to create form file: %w", err)
	}

	_, err = io.Copy(part, file)
	if err != nil {
		return fmt.Errorf("failed to copy file: %w", err)
	}

	writer.Close()

	// Create request
	req, err := http.NewRequest(http.MethodPost, url, &requestBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if c.authToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.authToken))
	}

	// Perform request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to perform request: %w", err)
	}
	defer resp.Body.Close()

	// Check status code
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API error: %s - %s", resp.Status, string(bodyBytes))
	}

	// Parse response if needed
	if response != nil {
		if err := json.NewDecoder(resp.Body).Decode(response); err != nil {
			return fmt.Errorf("failed to decode response: %w", err)
		}
	}

	return nil
}
