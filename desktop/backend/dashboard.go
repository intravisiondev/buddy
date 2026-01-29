package backend

import (
	"fmt"
)

// DashboardStats represents the user's dashboard statistics
type DashboardStats struct {
	StudyStreak int     `json:"study_streak"`
	TotalXP     int     `json:"total_xp"`
	WeeklyRank  int     `json:"weekly_rank"`
	TodayHours  float64 `json:"today_hours"`
	Level       int     `json:"level"`
	WeeklyXP    int     `json:"weekly_xp"`
	Gems        int     `json:"gems"`
	Tokens      int     `json:"tokens"`
	BadgesEarned int    `json:"badges_earned"`
}

// Goal represents a daily goal
type Goal struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
	Subject   string `json:"subject"`
}

// StudyPlan represents a study plan
type StudyPlan struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Progress int    `json:"progress"`
	DueDate  string `json:"due_date"`
}

// Challenge represents a live challenge
type Challenge struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Participants int    `json:"participants"`
	EndsIn       string `json:"ends_in"`
	Reward       string `json:"reward"`
}

// GetDashboardStats gets the user's dashboard statistics
func (a *WailsApp) GetDashboardStats() (*DashboardStats, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}

	// Get user stats from API
	stats, err := a.api.User.GetMyStats()
	if err != nil {
		return nil, err
	}

	// Convert to DashboardStats
	dashboardStats := &DashboardStats{
		StudyStreak: getIntFieldWithFallback(stats, "study_streak", "current_streak"),
		TotalXP:     getIntField(stats, "total_xp"),
		WeeklyRank:  getIntField(stats, "weekly_rank"),
		TodayHours:  getFloatField(stats, "today_hours"),
		Level:       getIntField(stats, "level"),
		WeeklyXP:    getIntField(stats, "weekly_xp"),
		Gems:        getIntField(stats, "gems"),
		Tokens:      getIntField(stats, "tokens"),
		BadgesEarned: getIntField(stats, "badges_earned"),
	}

	return dashboardStats, nil
}

// GetTodayGoals gets today's goals for the user (Now using real API)
func (a *WailsApp) GetTodayGoals() ([]Goal, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}

	// Get goals from real API
	goalsData, err := a.api.Goal.GetTodayGoals()
	if err != nil {
		return nil, err
	}

	// Convert to Goal slice
	result := make([]Goal, 0)
	for _, g := range goalsData {
		goal := Goal{
			ID:        g.ID,
			Title:     g.Title,
			Completed: g.Completed,
			Subject:   g.Subject,
		}
		result = append(result, goal)
	}

	return result, nil
}

// ToggleGoalComplete toggles a goal's completion status (Now using real API)
func (a *WailsApp) ToggleGoalComplete(goalID string) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}

	// Call real API
	err := a.api.Goal.ToggleGoalComplete(goalID)
	if err != nil {
		return err
	}

	// Emit event for UI update
	a.EmitEvent("goal-toggled", map[string]interface{}{
		"goal_id": goalID,
	})

	return nil
}

// GenerateDailyGoals creates AI-generated daily goals for today (tickable)
func (a *WailsApp) GenerateDailyGoals() (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Goal.GenerateDailyGoals()
}

// GetMyStudyPlans gets the user's active study plans (Raw data for frontend)
func (a *WailsApp) GetMyStudyPlans() (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}

	// Return raw study plans data
	return a.api.StudyPlan.GetMyStudyPlans()
}

// GetActiveChallenges gets current live challenges
func (a *WailsApp) GetActiveChallenges() ([]Challenge, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}

	// TODO: Implement API call when challenges endpoint is ready
	// For now, return mock data
	return []Challenge{
		{ID: "1", Title: "Speed Math Challenge", Participants: 24, EndsIn: "2h 30m", Reward: "100 XP"},
		{ID: "2", Title: "Science Quiz Master", Participants: 18, EndsIn: "5h 15m", Reward: "150 XP"},
	}, nil
}

// Helper functions to safely extract fields from interface{} maps
func getIntField(m interface{}, field string) int {
	if mMap, ok := m.(map[string]interface{}); ok {
		if val, exists := mMap[field]; exists {
			switch v := val.(type) {
			case int:
				return v
			case float64:
				return int(v)
			case int64:
				return int(v)
			}
		}
	}
	return 0
}

func getIntFieldWithFallback(m interface{}, field string, fallback string) int {
	v := getIntField(m, field)
	if v != 0 {
		return v
	}
	return getIntField(m, fallback)
}

func getFloatField(m interface{}, field string) float64 {
	if mMap, ok := m.(map[string]interface{}); ok {
		if val, exists := mMap[field]; exists {
			switch v := val.(type) {
			case float64:
				return v
			case int:
				return float64(v)
			case int64:
				return float64(v)
			}
		}
	}
	return 0.0
}

func getStringField(m map[string]interface{}, field string) string {
	if val, exists := m[field]; exists {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}
