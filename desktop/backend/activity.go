package backend

import "fmt"

// LogStudySession logs a study session to server and emits an event to refresh stats/badges
func (a *WailsApp) LogStudySession(subject string, durationMinutes int) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	if err := a.api.Activity.LogStudySession(subject, durationMinutes); err != nil {
		return err
	}
	a.EmitEvent("activity:studySessionLogged", map[string]interface{}{
		"subject":          subject,
		"duration_minutes": durationMinutes,
	})
	return nil
}

// GetMyActivity returns recent activity logs
func (a *WailsApp) GetMyActivity(activityType string, limit int) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Activity.GetMyActivity(activityType, limit)
}

// StartStudySession starts a new active study session
func (a *WailsApp) StartStudySession(studyPlanID, subject string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Activity.StartStudySession(studyPlanID, subject)
}

// GetActiveStudySession gets the active study session for the current user
func (a *WailsApp) GetActiveStudySession() (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Activity.GetActiveStudySession()
}

// PauseStudySession starts a break for the active study session
func (a *WailsApp) PauseStudySession() error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.Activity.PauseStudySession()
}

// ResumeStudySession ends the current break
func (a *WailsApp) ResumeStudySession() error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.Activity.ResumeStudySession()
}

// SetIdleStatus sets the idle status of the active study session
func (a *WailsApp) SetIdleStatus(isIdle bool) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.Activity.SetIdleStatus(isIdle)
}

// StopStudySession stops the active study session and creates an ActivityLog
func (a *WailsApp) StopStudySession(notes string, focusScore int) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	result, err := a.api.Activity.StopStudySession(notes, focusScore)
	if err != nil {
		return nil, err
	}
	a.EmitEvent("activity:studySessionLogged", result)
	return result, nil
}
