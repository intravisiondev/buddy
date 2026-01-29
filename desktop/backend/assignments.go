package backend

import (
	"buddy-desktop/internal/api"
	"fmt"
	"time"
)

// CreateAssignment creates a new assignment
func (a *WailsApp) CreateAssignment(roomID string, title, description string, dueDate time.Time, totalPoints int, assignmentType string, subjects []string) (*api.Assignment, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	
	req := api.CreateAssignmentRequest{
		Title:          title,
		Description:    description,
		DueDate:        dueDate.Format(time.RFC3339),
		TotalPoints:    totalPoints,
		AssignmentType: assignmentType,
		Subjects:       subjects,
	}
	
	return a.api.Assignment.CreateAssignment(roomID, req)
}

// GetAssignments gets all assignments for a room
func (a *WailsApp) GetAssignments(roomID string) ([]api.Assignment, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Assignment.GetAssignments(roomID)
}

// GetAssignment gets an assignment by ID
func (a *WailsApp) GetAssignment(assignmentID string) (*api.Assignment, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Assignment.GetAssignment(assignmentID)
}

// UpdateAssignment updates an assignment
func (a *WailsApp) UpdateAssignment(assignmentID string, title, description string, dueDate time.Time, totalPoints int, assignmentType string, subjects []string) (*api.Assignment, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	
	req := api.UpdateAssignmentRequest{
		Title:          title,
		Description:    description,
		DueDate:        dueDate.Format(time.RFC3339),
		TotalPoints:    totalPoints,
		AssignmentType: assignmentType,
		Subjects:       subjects,
	}
	
	return a.api.Assignment.UpdateAssignment(assignmentID, req)
}

// DeleteAssignment deletes an assignment
func (a *WailsApp) DeleteAssignment(assignmentID string) error {
	if a.authToken == "" {
		return fmt.Errorf("not authenticated")
	}
	return a.api.Assignment.DeleteAssignment(assignmentID)
}

// UpdateRoomExamDates updates the exam dates of a room
func (a *WailsApp) UpdateRoomExamDates(roomID string, examDates []api.ExamDate) (*api.Room, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Room.UpdateRoomExamDates(roomID, examDates)
}
