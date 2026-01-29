package api

// AIService handles AI-related API calls
type AIService struct {
	client *Client
}

// NewAIService creates a new AI service
func NewAIService(client *Client) *AIService {
	return &AIService{client: client}
}

// GenerateSyllabusFromFile generates a syllabus from file content
func (s *AIService) GenerateSyllabusFromFile(fileContent, subject, courseName string) (interface{}, error) {
	payload := map[string]interface{}{
		"file_content": fileContent,
		"subject":      subject,
		"course_name":  courseName,
	}
	var out interface{}
	err := s.client.Post("/ai/syllabus/from-file", payload, &out)
	return out, err
}

// GenerateSyllabusFromTopics generates a syllabus from topics
func (s *AIService) GenerateSyllabusFromTopics(topics []string, subject, courseName string) (interface{}, error) {
	payload := map[string]interface{}{
		"topics":      topics,
		"subject":     subject,
		"course_name": courseName,
	}
	var out interface{}
	err := s.client.Post("/ai/syllabus/from-topics", payload, &out)
	return out, err
}

// GenerateAssessmentQuestions generates AI questions for study assessment
func (s *AIService) GenerateAssessmentQuestions(subject, notes string, durationMinutes int) (interface{}, error) {
	payload := map[string]interface{}{
		"subject":          subject,
		"notes":            notes,
		"duration_minutes": durationMinutes,
	}
	var out interface{}
	err := s.client.Post("/study-session/assess", payload, &out)
	return out, err
}

// CompleteAssessment submits AI assessment answers
func (s *AIService) CompleteAssessment(data map[string]interface{}) (interface{}, error) {
	var out interface{}
	err := s.client.Post("/study-session/complete-assessment", data, &out)
	return out, err
}
