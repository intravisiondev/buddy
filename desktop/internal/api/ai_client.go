package api

// AIClientService handles AI chat API calls
type AIClientService struct {
	client *Client
}

// NewAIClientService creates a new AI client service
func NewAIClientService(client *Client) *AIClientService {
	return &AIClientService{client: client}
}

// Chat sends a chat message to AI
func (s *AIClientService) Chat(message, context string) (interface{}, error) {
	payload := map[string]interface{}{
		"message": message,
		"context": context,
	}
	var out interface{}
	err := s.client.Post("/ai/chat", payload, &out)
	return out, err
}

// ExplainTopic asks AI to explain a topic
func (s *AIClientService) ExplainTopic(topic, subject, level string) (interface{}, error) {
	payload := map[string]interface{}{
		"topic":   topic,
		"subject": subject,
		"level":   level,
	}
	var out interface{}
	err := s.client.Post("/ai/explain", payload, &out)
	return out, err
}

// AnswerQuestion asks AI to answer a question
func (s *AIClientService) AnswerQuestion(question, subject, context string) (interface{}, error) {
	payload := map[string]interface{}{
		"question": question,
		"subject":  subject,
		"context":  context,
	}
	var out interface{}
	err := s.client.Post("/ai/answer", payload, &out)
	return out, err
}
