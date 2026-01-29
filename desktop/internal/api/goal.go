package api

import (
	"encoding/json"
	"fmt"
	"math"
)

// Goal represents a goal model
type Goal struct {
	ID          string `json:"id"`
	UserID      string `json:"user_id"`
	StudyPlanID string `json:"study_plan_id,omitempty"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	Subject     string `json:"subject,omitempty"`
	DueDate     string `json:"due_date"`
	Completed   bool   `json:"completed"`
	Priority    string `json:"priority,omitempty"`
	CreatedAt   string `json:"created_at"`
	CompletedAt string `json:"completed_at,omitempty"`
}

// Milestone represents a milestone model
type Milestone struct {
	ID          string  `json:"id"`
	UserID      string  `json:"user_id"`
	StudyPlanID string  `json:"study_plan_id,omitempty"`
	Title       string  `json:"title"`
	Description string  `json:"description,omitempty"`
	TargetDate  string  `json:"target_date"`
	Progress    float64 `json:"progress"`
	Completed   bool    `json:"completed"`
	CreatedAt   string  `json:"created_at"`
	CompletedAt string  `json:"completed_at,omitempty"`
}

// GoalService handles goal API calls
type GoalService struct {
	client *Client
}

// NewGoalService creates a new goal service
func NewGoalService(client *Client) *GoalService {
	return &GoalService{client: client}
}

// CreateGoal creates a new goal
func (s *GoalService) CreateGoal(goal map[string]interface{}) (*Goal, error) {
	var result Goal
	err := s.client.Post("/goals", goal, &result)
	return &result, err
}

// GetTodayGoals gets today's goals
func (s *GoalService) GetTodayGoals() ([]Goal, error) {
	var goals []Goal
	err := s.client.Get("/goals/today", &goals)
	return goals, err
}

// GenerateDailyGoals creates AI-generated daily goals for today (tickable)
func (s *GoalService) GenerateDailyGoals() ([]Goal, error) {
	var goals []Goal
	err := s.client.Post("/goals/daily/generate", nil, &goals)
	return goals, err
}

// GetGoals gets all goals with filters
func (s *GoalService) GetGoals(completed *bool, studyPlanID *string) ([]Goal, error) {
	var goals []Goal
	query := ""
	if completed != nil {
		if *completed {
			query += "?completed=true"
		} else {
			query += "?completed=false"
		}
	}
	if studyPlanID != nil && *studyPlanID != "" {
		if query == "" {
			query += "?study_plan_id=" + *studyPlanID
		} else {
			query += "&study_plan_id=" + *studyPlanID
		}
	}
	err := s.client.Get("/goals"+query, &goals)
	return goals, err
}

// ToggleGoalComplete toggles goal completion
func (s *GoalService) ToggleGoalComplete(goalID string) error {
	return s.client.Post("/goals/"+goalID+"/toggle", nil, nil)
}

// DeleteGoal deletes a goal
func (s *GoalService) DeleteGoal(goalID string) error {
	return s.client.Delete("/goals/" + goalID)
}

// GetMilestones gets milestones
func (s *GoalService) GetMilestones(studyPlanID *string) ([]Milestone, error) {
	var milestones []Milestone
	query := ""
	if studyPlanID != nil && *studyPlanID != "" {
		query = "?study_plan_id=" + *studyPlanID
	}
	err := s.client.Get("/milestones"+query, &milestones)
	return milestones, err
}

// CreateMilestone creates a new milestone
func (s *GoalService) CreateMilestone(milestone map[string]interface{}) (*Milestone, error) {
	var result Milestone
	err := s.client.Post("/milestones", milestone, &result)
	return &result, err
}

// UpdateMilestoneProgress updates milestone progress
func (s *GoalService) UpdateMilestoneProgress(milestoneID string, progress float64) error {
	// Validate progress is not NaN or Inf
	if math.IsNaN(progress) || math.IsInf(progress, 0) {
		return fmt.Errorf("invalid progress value: %f", progress)
	}
	// Clamp progress to valid range
	if progress < 0 {
		progress = 0
	} else if progress > 100 {
		progress = 100
	}
	// Ensure progress is always sent, even if 0
	// Use a struct to ensure the field is always present in JSON
	type UpdateProgressRequest struct {
		Progress float64 `json:"progress"`
	}
	req := UpdateProgressRequest{
		Progress: progress,
	}
	
	// Debug: Marshal to check JSON output
	jsonData, _ := json.Marshal(req)
	fmt.Printf("DEBUG: Sending milestone progress update - milestoneID: %s, progress: %f, JSON: %s\n", milestoneID, progress, string(jsonData))
	
	return s.client.Put("/milestones/"+milestoneID+"/progress", req, nil)
}
