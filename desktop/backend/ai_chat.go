package backend

import "fmt"

// Chat sends a message to AI and gets a response
func (a *WailsApp) Chat(message, context string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.AIClient.Chat(message, context)
}

// ExplainTopic asks AI to explain a topic
func (a *WailsApp) ExplainTopic(topic, subject, level string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.AIClient.ExplainTopic(topic, subject, level)
}

// AnswerQuestion asks AI to answer a question
func (a *WailsApp) AnswerQuestion(question, subject, context string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.AIClient.AnswerQuestion(question, subject, context)
}
