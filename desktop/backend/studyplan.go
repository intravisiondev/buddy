package backend

import (
	"fmt"
)

// CreateStudyPlan creates a new study plan
func (a *WailsApp) CreateStudyPlan(data map[string]interface{}) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.StudyPlan.CreateStudyPlan(data)
}

// AddCourseToStudyPlan adds a course to a study plan
func (a *WailsApp) AddCourseToStudyPlan(planID string, data map[string]interface{}) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.StudyPlan.AddCourseToStudyPlan(planID, data)
}

// GetStudyPlanCourses gets courses for a study plan
func (a *WailsApp) GetStudyPlanCourses(planID string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.StudyPlan.GetStudyPlanCourses(planID)
}

// GetScheduleBlocks gets schedule blocks for a study plan
func (a *WailsApp) GetScheduleBlocks(planID string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.StudyPlan.GetScheduleBlocks(planID)
}

// CreateScheduleBlock creates a schedule block for a study plan
func (a *WailsApp) CreateScheduleBlock(planID string, data map[string]interface{}) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.StudyPlan.CreateScheduleBlock(planID, data)
}

// UpdateScheduleBlock updates a schedule block for a study plan
func (a *WailsApp) UpdateScheduleBlock(planID, blockID string, data map[string]interface{}) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.StudyPlan.UpdateScheduleBlock(planID, blockID, data)
}

// DeleteScheduleBlock deletes a schedule block for a study plan
func (a *WailsApp) DeleteScheduleBlock(planID, blockID string) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.StudyPlan.DeleteScheduleBlock(planID, blockID)
}
