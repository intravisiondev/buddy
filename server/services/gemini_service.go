package services

import (
	"context"
	"fmt"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// GeminiService handles AI interactions with Google Gemini
type GeminiService struct {
	client *genai.Client
	model  *genai.GenerativeModel
}

// NewGeminiService creates a new Gemini service
func NewGeminiService(apiKey string) (*GeminiService, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("Gemini API key is required")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, err
	}

	// Use Gemini 3 Flash preview model
	// Official model ID (Gemini API): gemini-3-flash-preview
	model := client.GenerativeModel("gemini-3-flash-preview")
	model.SetTemperature(0.7)
	model.SetTopP(0.95)
	model.SetTopK(40)
	model.SetMaxOutputTokens(2048)

	return &GeminiService{
		client: client,
		model:  model,
	}, nil
}

// Chat sends a chat message and gets a response
func (s *GeminiService) Chat(message string, contextStr string) (string, error) {
	ctx := context.Background()

	prompt := message
	if contextStr != "" {
		prompt = fmt.Sprintf("Context: %s\n\nQuestion: %s", contextStr, message)
	}

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// ExplainTopic generates an explanation for a topic
func (s *GeminiService) ExplainTopic(topic, subject, level string) (string, error) {
	ctx := context.Background()

	prompt := fmt.Sprintf(
		"Explain the topic '%s' in %s for a %s level student. "+
			"Provide a clear, concise explanation with examples.",
		topic, subject, level,
	)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// AnswerQuestion answers a specific question
func (s *GeminiService) AnswerQuestion(question, subject, contextStr string) (string, error) {
	ctx := context.Background()

	prompt := fmt.Sprintf(
		"Subject: %s\nContext: %s\n\nQuestion: %s\n\n"+
			"Provide a detailed answer with step-by-step explanation if applicable.",
		subject, contextStr, question,
	)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// GenerateQuestions generates practice questions
func (s *GeminiService) GenerateQuestions(topic, subject, difficulty string, count int) (string, error) {
	ctx := context.Background()

	prompt := fmt.Sprintf(
		"Generate %d %s difficulty practice questions about '%s' in %s. "+
			"Format each question clearly with the question number.",
		count, difficulty, topic, subject,
	)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// SummarizeContent summarizes content
func (s *GeminiService) SummarizeContent(content string, maxLength int) (string, error) {
	ctx := context.Background()

	prompt := fmt.Sprintf(
		"Summarize the following content in approximately %d words. "+
			"Focus on the key points and main concepts:\n\n%s",
		maxLength, content,
	)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// GetStudyRecommendations generates study recommendations
func (s *GeminiService) GetStudyRecommendations(subjects []string, userLevel int, availableHours float64) (string, error) {
	ctx := context.Background()

	prompt := fmt.Sprintf(
		"Create personalized study recommendations for a student at level %d "+
			"who has %.1f hours available per week. Subjects to focus on: %v. "+
			"Provide a structured study plan with priorities and time allocation.",
		userLevel, availableHours, subjects,
	)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// GenerateSyllabusFromFile generates a structured syllabus from file content
func (s *GeminiService) GenerateSyllabusFromFile(fileContent, subject, courseName string) (string, error) {
	ctx := context.Background()

	prompt := fmt.Sprintf(
		"You are an expert curriculum designer. Analyze the following course material and create a structured syllabus.\n\n"+
			"Course: %s\nSubject: %s\n\n"+
			"Course Material:\n%s\n\n"+
			"Generate a JSON response with this exact structure:\n"+
			`{"description": "Overall course description", "items": [{"title": "Topic 1", "description": "Description", "order": 1}, ...]}`+
			"\n\nReturn ONLY valid JSON, no markdown formatting, no code blocks.",
		courseName, subject, fileContent,
	)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// GenerateSyllabusFromTopics generates a structured syllabus from a list of topics
func (s *GeminiService) GenerateSyllabusFromTopics(topics []string, subject, courseName string) (string, error) {
	ctx := context.Background()

	topicsStr := ""
	for i, topic := range topics {
		topicsStr += fmt.Sprintf("%d. %s\n", i+1, topic)
	}

	prompt := fmt.Sprintf(
		"You are an expert curriculum designer. Create a structured syllabus from the following topics.\n\n"+
			"Course: %s\nSubject: %s\n\n"+
			"Topics:\n%s\n\n"+
			"Generate a JSON response with this exact structure:\n"+
			`{"description": "Overall course description", "items": [{"title": "Topic 1", "description": "Detailed description", "order": 1}, ...]}`+
			"\n\nReturn ONLY valid JSON, no markdown formatting, no code blocks.",
		courseName, subject, topicsStr,
	)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// GenerateStudyAssessmentQuestions generates AI questions to assess study session effectiveness
func (s *GeminiService) GenerateStudyAssessmentQuestions(subject, notes string, durationMinutes int) (string, error) {
	ctx := context.Background()

	prompt := fmt.Sprintf(
		"You are an educational assessment expert. Generate 3-5 questions to assess if a student effectively studied the topic.\n\n"+
			"Subject: %s\n"+
			"Study Duration: %d minutes\n"+
			"Student Notes: %s\n\n"+
			"Generate questions that test understanding and retention. Include a mix of:\n"+
			"- Multiple choice questions (provide 4 options)\n"+
			"- Short answer questions\n\n"+
			"Return response in this EXACT JSON format:\n"+
			`{"questions": [{"question": "...", "question_type": "multiple_choice", "options": ["A", "B", "C", "D"], "correct_answer": "A"}, ...]}`,
		subject, durationMinutes, notes,
	)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// GenerateStudentReport generates a comprehensive performance report
func (s *GeminiService) GenerateStudentReport(userID string, reportData map[string]interface{}) (string, error) {
	ctx := context.Background()

	prompt := fmt.Sprintf(
		"You are an expert educational advisor analyzing student performance data.\n\n"+
			"Student Data (Period: %v to %v):\n"+
			"- Total Study Hours: %.1f\n"+
			"- Sessions Completed: %d\n"+
			"- Average Focus Score: %.1f%%\n"+
			"- Average Productivity Score: %.1f%%\n"+
			"- Goals: %d/%d completed\n"+
			"- Milestones Progress: %.1f%%\n"+
			"- Study Plan Progress: %.1f%%\n\n"+
			"Activity Details:\n%v\n\n"+
			"AI Assessment Results:\n%v\n\n"+
			"Using critical thinking, analyze:\n"+
			"1. What patterns indicate effective learning?\n"+
			"2. What obstacles might be preventing progress?\n"+
			"3. Are study habits sustainable?\n"+
			"4. What specific changes would have maximum impact?\n\n"+
			"Generate report in this EXACT JSON format:\n"+
			`{"summary": "2-3 sentence overview", "strengths": ["...", "..."], "weak_areas": ["...", "..."], "recommendations": ["...", "..."], "overall_score": 85}`,
		reportData["start_date"], reportData["end_date"],
		reportData["total_hours"], reportData["session_count"],
		reportData["avg_focus"], reportData["avg_productivity"],
		reportData["goals_completed"], reportData["goals_total"],
		reportData["milestones_progress"], reportData["plan_progress"],
		reportData["activities"], reportData["assessments"],
	)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// GenerateDailyGoalSuggestions generates personalized daily goal recommendations
func (s *GeminiService) GenerateDailyGoalSuggestions(userData map[string]interface{}) (string, error) {
	ctx := context.Background()

	prompt := fmt.Sprintf(
		"You are an AI learning coach. Generate 3-5 personalized daily goal suggestions for a student.\n\n"+
			"Student Context:\n"+
			"- Recent Activities: %v\n"+
			"- Current Goals: %v\n"+
			"- Upcoming Milestones: %v\n"+
			"- Study Plan Progress: %v\n"+
			"- Strengths: %v\n"+
			"- Weak Areas: %v\n\n"+
			"Critical thinking: What goals would maximize learning efficiency today?\n\n"+
			"Generate goals in this EXACT JSON format:\n"+
			`{"suggestions": [{"title": "...", "description": "...", "subject": "...", "priority": "high", "reasoning": "..."}, ...]}`,
		userData["recent_activities"], userData["current_goals"],
		userData["milestones"], userData["plan_progress"],
		userData["strengths"], userData["weak_areas"],
	)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// GenerateStudyPlanWithSchedule generates a complete study plan with schedule and milestones
func (s *GeminiService) GenerateStudyPlanWithSchedule(goals []string, availableHours float64, subjects []string, preferences string) (string, error) {
	ctx := context.Background()

	prompt := fmt.Sprintf(
		"You are an expert study planner. Create a comprehensive study plan.\n\n"+
			"Goals: %v\n"+
			"Available Hours/Week: %.1f\n"+
			"Subjects: %v\n"+
			"Preferences: %s\n\n"+
			"Generate a study plan with weekly schedule and milestones.\n\n"+
			"Return in this EXACT JSON format:\n"+
			`{"schedule_blocks": [{"day_of_week": 1, "start_time": "09:00", "end_time": "11:00", "subject": "...", "topic": "...", "block_type": "study"}], "milestones": [{"title": "...", "description": "...", "target_date": "2024-03-15", "progress": 0}]}`,
		goals, availableHours, subjects, preferences,
	)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// GenerateSmartStudyPlan generates a complete study plan based on user description
func (s *GeminiService) GenerateSmartStudyPlan(subject, goals, description string, weeklyHours float64, startDate, endDate string) (string, error) {
	ctx := context.Background()

	prompt := fmt.Sprintf(
		"Create a study plan in valid JSON format.\n\n"+
			"Inputs:\n"+
			"- Subject: %s\n"+
			"- Goals: %s\n"+
			"- Description: %s\n"+
			"- Weekly Hours: %.1f\n"+
			"- Duration: %s to %s\n\n"+
			"Rules:\n"+
			"1. Create 5-7 weekly schedule blocks (distribute across weekdays)\n"+
			"2. Create 4-5 milestones evenly spread across duration\n"+
			"3. day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday\n"+
			"4. Times in HH:MM format (e.g., 09:00, 14:30)\n"+
			"5. block_type must be: study, review, or practice\n"+
			"6. target_date format: YYYY-MM-DD\n\n"+
			"Return ONLY this JSON structure (no markdown, no code blocks, no extra text):\n"+
			`{`+"\n"+
			`"name": "Study Plan Title",`+"\n"+
			`"description": "Brief plan overview",`+"\n"+
			`"schedule_blocks": [`+"\n"+
			`  {"day_of_week": 1, "start_time": "09:00", "end_time": "10:30", "subject": "%s", "topic": "Introduction", "block_type": "study"},`+"\n"+
			`  {"day_of_week": 3, "start_time": "14:00", "end_time": "15:30", "subject": "%s", "topic": "Practice", "block_type": "practice"}`+"\n"+
			`],`+"\n"+
			`"milestones": [`+"\n"+
			`  {"title": "Milestone 1", "description": "Complete basics", "target_date": "2026-02-10", "progress": 0},`+"\n"+
			`  {"title": "Milestone 2", "description": "Advanced topics", "target_date": "2026-02-20", "progress": 0}`+"\n"+
			`]`+"\n"+
			`}`,
		subject, goals, description, weeklyHours, startDate, endDate, subject, subject,
	)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// GenerateRoomAIResponse generates a response based on room's training content
func (s *GeminiService) GenerateRoomAIResponse(message, roomContext, syllabus string) (string, error) {
	ctx := context.Background()

	prompt := fmt.Sprintf(
		"You are a helpful AI teaching assistant for a specific course. Answer ONLY based on the provided course content.\n\n"+
			"Course Content:\n%s\n\n"+
			"Syllabus:\n%s\n\n"+
			"IMPORTANT: Only answer questions related to this course content. If the question is outside the scope, politely redirect to course material.\n\n"+
			"Student Question: %s\n\n"+
			"Provide a helpful, accurate answer based on the course content.",
		roomContext, syllabus, message,
	)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// GenerateGameQuestions generates questions for educational games
func (s *GeminiService) GenerateGameQuestions(gameType, subject, difficulty string, count int, syllabus string) (string, error) {
	ctx := context.Background()

	var promptTemplate string
	switch gameType {
	case "quiz":
		promptTemplate = "Generate %d multiple choice quiz questions about %s at %s difficulty level. Syllabus: %s\n\n" +
			`Return in JSON format: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "B", "explanation": "...", "points": 10}]}`
	case "flashcards":
		promptTemplate = "Generate %d flashcard pairs (question/answer) about %s at %s difficulty level. Syllabus: %s\n\n" +
			`Return in JSON format: {"questions": [{"question": "Front of card", "correct_answer": "Back of card", "explanation": "...", "points": 5}]}`
	case "fill_blank":
		promptTemplate = "Generate %d fill-in-the-blank questions about %s at %s difficulty level. Syllabus: %s\n\n" +
			`Return in JSON format: {"questions": [{"question": "The ____ is...", "correct_answer": "answer", "explanation": "...", "points": 10}]}`
	case "matching":
		promptTemplate = "Generate %d matching pairs about %s at %s difficulty level. Syllabus: %s\n\n" +
			`Return in JSON format: {"questions": [{"question": "Item A", "correct_answer": "Match for A", "points": 10}]}`
	default:
		return "", fmt.Errorf("unsupported game type: %s", gameType)
	}

	prompt := fmt.Sprintf(promptTemplate, count, subject, difficulty, syllabus)

	resp, err := s.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response generated")
	}

	return fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0]), nil
}

// Close closes the Gemini client
func (s *GeminiService) Close() error {
	return s.client.Close()
}
