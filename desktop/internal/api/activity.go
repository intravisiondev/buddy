package api

import "fmt"

// ActivityService handles activity-related API calls (study sessions)
type ActivityService struct {
	client *Client
}

func NewActivityService(client *Client) *ActivityService {
	return &ActivityService{client: client}
}

// LogStudySession posts a study session (minutes) to the server
func (s *ActivityService) LogStudySession(subject string, durationMinutes int) error {
	payload := map[string]interface{}{
		"subject":          subject,
		"duration_minutes": durationMinutes,
	}
	return s.client.Post("/users/me/study-session", payload, nil)
}

// GetMyActivity returns recent activity logs
func (s *ActivityService) GetMyActivity(activityType string, limit int) (interface{}, error) {
	path := "/users/me/activity"
	sep := "?"
	if activityType != "" {
		path += sep + "type=" + activityType
		sep = "&"
	}
	if limit > 0 {
		path += sep + "limit=" + fmt.Sprintf("%d", limit)
	}
	var out interface{}
	if err := s.client.Get(path, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// StartStudySession starts a new active study session
func (s *ActivityService) StartStudySession(studyPlanID, subject string) (interface{}, error) {
	payload := map[string]interface{}{
		"subject": subject,
	}
	if studyPlanID != "" {
		payload["study_plan_id"] = studyPlanID
	}
	var out interface{}
	if err := s.client.Post("/users/me/study-session/start", payload, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// GetActiveStudySession gets the active study session for the current user
func (s *ActivityService) GetActiveStudySession() (interface{}, error) {
	var out interface{}
	if err := s.client.Get("/users/me/study-session/active", &out); err != nil {
		return nil, err
	}
	return out, nil
}

// PauseStudySession starts a break for the active study session
func (s *ActivityService) PauseStudySession() error {
	return s.client.Put("/users/me/study-session/pause", nil, nil)
}

// ResumeStudySession ends the current break
func (s *ActivityService) ResumeStudySession() error {
	return s.client.Put("/users/me/study-session/resume", nil, nil)
}

// SetIdleStatus sets the idle status of the active study session
func (s *ActivityService) SetIdleStatus(isIdle bool) error {
	payload := map[string]interface{}{
		"is_idle": isIdle,
	}
	return s.client.Put("/users/me/study-session/idle", payload, nil)
}

// StopStudySession stops the active study session and creates an ActivityLog
func (s *ActivityService) StopStudySession(notes string, focusScore int) (interface{}, error) {
	payload := map[string]interface{}{
		"notes":       notes,
		"focus_score": focusScore,
	}
	var out interface{}
	if err := s.client.Post("/users/me/study-session/stop", payload, &out); err != nil {
		return nil, err
	}
	return out, nil
}
