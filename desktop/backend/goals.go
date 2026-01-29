package backend

import (
	"fmt"
)

// CreateGoal creates a new goal
func (a *WailsApp) CreateGoal(data map[string]interface{}) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Goal.CreateGoal(data)
}

// GetGoals gets all goals with filters
func (a *WailsApp) GetGoals(completed *bool, studyPlanID *string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Goal.GetGoals(completed, studyPlanID)
}

// DeleteGoal deletes a goal
func (a *WailsApp) DeleteGoal(goalID string) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.Goal.DeleteGoal(goalID)
}

// GetMilestones gets milestones
func (a *WailsApp) GetMilestones(studyPlanID *string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Goal.GetMilestones(studyPlanID)
}

// CreateMilestone creates a new milestone
func (a *WailsApp) CreateMilestone(data map[string]interface{}) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Goal.CreateMilestone(data)
}

// UpdateMilestoneProgress updates milestone progress
func (a *WailsApp) UpdateMilestoneProgress(milestoneID string, progress float64) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.Goal.UpdateMilestoneProgress(milestoneID, progress)
}

// GetUserSchedule gets user's full schedule
func (a *WailsApp) GetUserSchedule() (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.StudyPlan.GetUserSchedule()
}

// UpdateStudyPlanProgress updates study plan progress
func (a *WailsApp) UpdateStudyPlanProgress(planID string, progress float64) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.StudyPlan.UpdateStudyPlanProgress(planID, progress)
}
