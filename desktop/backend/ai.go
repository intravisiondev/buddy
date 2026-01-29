package backend

import "fmt"

// GenerateSyllabusFromFile generates a syllabus from file content using AI
func (a *WailsApp) GenerateSyllabusFromFile(fileContent, subject, courseName string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.AI.GenerateSyllabusFromFile(fileContent, subject, courseName)
}

// GenerateSyllabusFromTopics generates a syllabus from topics list using AI
func (a *WailsApp) GenerateSyllabusFromTopics(topics []string, subject, courseName string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.AI.GenerateSyllabusFromTopics(topics, subject, courseName)
}

// GenerateAssessmentQuestions generates AI questions for study assessment
func (a *WailsApp) GenerateAssessmentQuestions(subject, notes string, durationMinutes int) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.AI.GenerateAssessmentQuestions(subject, notes, durationMinutes)
}

// CompleteAssessment submits AI assessment answers and gets productivity score
func (a *WailsApp) CompleteAssessment(data map[string]interface{}) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.AI.CompleteAssessment(data)
}
