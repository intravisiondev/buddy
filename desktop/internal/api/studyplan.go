package api

import (
	"fmt"
	"math"
)

// StudyPlanService handles study plan-related API calls
type StudyPlanService struct {
	client *Client
}

// NewStudyPlanService creates a new study plan service
func NewStudyPlanService(client *Client) *StudyPlanService {
	return &StudyPlanService{client: client}
}

// GetMyStudyPlans gets the current user's study plans
func (s *StudyPlanService) GetMyStudyPlans() (interface{}, error) {
	var plans interface{}
	err := s.client.Get("/studyplans", &plans)
	if err != nil {
		return nil, fmt.Errorf("failed to get study plans: %w", err)
	}
	return plans, nil
}

// GetPublicStudyPlans gets public study plans
func (s *StudyPlanService) GetPublicStudyPlans() (interface{}, error) {
	var plans interface{}
	err := s.client.Get("/studyplans/public", &plans)
	if err != nil {
		return nil, fmt.Errorf("failed to get public study plans: %w", err)
	}
	return plans, nil
}

// CreateStudyPlan creates a new study plan
func (s *StudyPlanService) CreateStudyPlan(data map[string]interface{}) (interface{}, error) {
	var plan interface{}
	err := s.client.Post("/studyplans", data, &plan)
	if err != nil {
		return nil, fmt.Errorf("failed to create study plan: %w", err)
	}
	return plan, nil
}

// GetStudyPlanCourses gets courses for a study plan
func (s *StudyPlanService) GetStudyPlanCourses(planID string) (interface{}, error) {
	var courses interface{}
	err := s.client.Get(fmt.Sprintf("/studyplans/%s/courses", planID), &courses)
	if err != nil {
		return nil, fmt.Errorf("failed to get study plan courses: %w", err)
	}
	return courses, nil
}

// AddCourseToStudyPlan adds a course to a study plan
func (s *StudyPlanService) AddCourseToStudyPlan(planID string, data map[string]interface{}) (interface{}, error) {
	var course interface{}
	err := s.client.Post(fmt.Sprintf("/studyplans/%s/courses", planID), data, &course)
	if err != nil {
		return nil, fmt.Errorf("failed to add course to study plan: %w", err)
	}
	return course, nil
}

// GetScheduleBlocks gets schedule blocks for a study plan
func (s *StudyPlanService) GetScheduleBlocks(planID string) (interface{}, error) {
	var blocks interface{}
	err := s.client.Get(fmt.Sprintf("/studyplans/%s/schedule", planID), &blocks)
	if err != nil {
		return nil, fmt.Errorf("failed to get schedule blocks: %w", err)
	}
	return blocks, nil
}

// CreateScheduleBlock creates a schedule block for a study plan
func (s *StudyPlanService) CreateScheduleBlock(planID string, data map[string]interface{}) (interface{}, error) {
	var block interface{}
	err := s.client.Post(fmt.Sprintf("/studyplans/%s/schedule", planID), data, &block)
	if err != nil {
		return nil, fmt.Errorf("failed to create schedule block: %w", err)
	}
	return block, nil
}

// UpdateScheduleBlock updates a schedule block for a study plan (partial update supported by server)
func (s *StudyPlanService) UpdateScheduleBlock(planID, blockID string, data map[string]interface{}) (interface{}, error) {
	var block interface{}
	err := s.client.Put(fmt.Sprintf("/studyplans/%s/schedule/%s", planID, blockID), data, &block)
	if err != nil {
		return nil, fmt.Errorf("failed to update schedule block: %w", err)
	}
	return block, nil
}

// DeleteScheduleBlock deletes a schedule block for a study plan
func (s *StudyPlanService) DeleteScheduleBlock(planID, blockID string) error {
	err := s.client.Delete(fmt.Sprintf("/studyplans/%s/schedule/%s", planID, blockID))
	if err != nil {
		return fmt.Errorf("failed to delete schedule block: %w", err)
	}
	return nil
}

// GetUserSchedule gets all schedule blocks for the user
func (s *StudyPlanService) GetUserSchedule() (interface{}, error) {
	var schedule interface{}
	err := s.client.Get("/schedule", &schedule)
	if err != nil {
		return nil, fmt.Errorf("failed to get user schedule: %w", err)
	}
	return schedule, nil
}

// UpdateStudyPlanProgress updates study plan progress
func (s *StudyPlanService) UpdateStudyPlanProgress(planID string, progress float64) error {
	// Ensure progress is a valid number (not NaN or Inf)
	if planID == "" {
		return fmt.Errorf("plan ID is required")
	}
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
	data := map[string]interface{}{"progress": progress}
	return s.client.Put(fmt.Sprintf("/studyplans/%s/progress", planID), data, nil)
}
