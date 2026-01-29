package backend

import (
	"buddy-desktop/internal/api"
	"fmt"
)

// GenerateSmartStudyPlan generates a smart study plan using AI
func (a *WailsApp) GenerateSmartStudyPlan(data map[string]interface{}) (*api.GeneratedPlanResponse, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}

	req := api.GenerateSmartPlanRequest{
		Subject:     getStringFromMap(data, "subject"),
		Goals:       getStringFromMap(data, "goals"),
		Description: getStringFromMap(data, "description"),
		WeeklyHours: getFloat64FromMap(data, "weekly_hours"),
		StartDate:   getStringFromMap(data, "start_date"),
		EndDate:     getStringFromMap(data, "end_date"),
	}

	return a.api.SmartPlan.GenerateSmartPlan(req)
}

// CreateSmartStudyPlan creates a study plan from AI-generated data
func (a *WailsApp) CreateSmartStudyPlan(data map[string]interface{}) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}

	// Extract schedule blocks
	var scheduleBlocks []api.ScheduleBlockPreview
	if blocks, ok := data["schedule_blocks"].([]interface{}); ok {
		for _, block := range blocks {
			if blockMap, ok := block.(map[string]interface{}); ok {
				scheduleBlocks = append(scheduleBlocks, api.ScheduleBlockPreview{
					DayOfWeek: int(getFloat64FromMap(blockMap, "day_of_week")),
					StartTime: getStringFromMap(blockMap, "start_time"),
					EndTime:   getStringFromMap(blockMap, "end_time"),
					Subject:   getStringFromMap(blockMap, "subject"),
					Topic:     getStringFromMap(blockMap, "topic"),
					BlockType: getStringFromMap(blockMap, "block_type"),
				})
			}
		}
	}

	// Extract milestones
	var milestones []api.MilestonePreview
	if miles, ok := data["milestones"].([]interface{}); ok {
		for _, milestone := range miles {
			if milestoneMap, ok := milestone.(map[string]interface{}); ok {
				milestones = append(milestones, api.MilestonePreview{
					Title:       getStringFromMap(milestoneMap, "title"),
					Description: getStringFromMap(milestoneMap, "description"),
					TargetDate:  getStringFromMap(milestoneMap, "target_date"),
					Progress:    getFloat64FromMap(milestoneMap, "progress"),
				})
			}
		}
	}

	req := api.CreateSmartPlanRequest{
		Name:           getStringFromMap(data, "name"),
		Description:    getStringFromMap(data, "description"),
		Subject:        getStringFromMap(data, "subject"),
		StartDate:      getStringFromMap(data, "start_date"),
		EndDate:        getStringFromMap(data, "end_date"),
		ScheduleBlocks: scheduleBlocks,
		Milestones:     milestones,
	}

	return a.api.SmartPlan.CreateSmartPlan(req)
}

// Helper functions
func getStringFromMap(m map[string]interface{}, key string) string {
	if val, ok := m[key].(string); ok {
		return val
	}
	return ""
}

func getFloat64FromMap(m map[string]interface{}, key string) float64 {
	if val, ok := m[key].(float64); ok {
		return val
	}
	if val, ok := m[key].(int); ok {
		return float64(val)
	}
	return 0
}
