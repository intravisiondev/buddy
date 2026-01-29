package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"buddy-desktop/backend"
	"buddy-desktop/internal/api"
)

// App struct - wraps backend WailsApp
type App struct {
	backend *backend.WailsApp
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		backend: backend.NewWailsApp(),
	}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.backend.Startup(ctx)
	
	// Try to restore saved session
	go func() {
		time.Sleep(500 * time.Millisecond) // Wait for context to be ready
		restored := a.backend.RestoreSession()
		if restored {
			log.Println("✓ Session restored from previous login")
		}
	}()
}

// domReady is called when the frontend dom is ready
func (a *App) domReady(ctx context.Context) {
	// Frontend DOM is ready
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	a.backend.Shutdown(ctx)
}

// Login authenticates a user
func (a *App) Login(email, password string) (*backend.AuthResponse, error) {
	return a.backend.Login(email, password)
}

// SignUp registers a new user
func (a *App) SignUp(email, password, name string, age int, role string) (*backend.AuthResponse, error) {
	return a.backend.SignUp(email, password, name, age, role)
}

// Logout logs out the current user
func (a *App) Logout() error {
	return a.backend.Logout()
}

// GetCurrentUser gets the current authenticated user
func (a *App) GetCurrentUser() (interface{}, error) {
	return a.backend.GetCurrentUser()
}

// IsAuthenticated checks if user is authenticated
func (a *App) IsAuthenticated() bool {
	return a.backend.IsAuthenticated()
}

// GetRooms gets all rooms with optional subject filter
func (a *App) GetRooms(subject string) (interface{}, error) {
	return a.backend.GetRooms(subject)
}

// GetMyRooms gets rooms created by current user (for teachers)
func (a *App) GetMyRooms(subject string) (interface{}, error) {
	return a.backend.GetMyRooms(subject)
}

// GetRoom gets a room by ID
func (a *App) GetRoom(roomID string) (interface{}, error) {
	return a.backend.GetRoom(roomID)
}

// CreateRoom creates a new room
func (a *App) CreateRoom(name, subject, description string, syllabus interface{}, isPrivate bool, maxMembers int) (interface{}, error) {
	var syllabusPtr *api.Syllabus
	if syllabus != nil {
		// Convert interface{} to *api.Syllabus
		if s, ok := syllabus.(map[string]interface{}); ok {
			syllabusPtr = &api.Syllabus{}
			if desc, ok := s["description"].(string); ok {
				syllabusPtr.Description = desc
			}
			if items, ok := s["items"].([]interface{}); ok {
				for _, item := range items {
					if itemMap, ok := item.(map[string]interface{}); ok {
						syllabusItem := api.SyllabusItem{}
						if title, ok := itemMap["title"].(string); ok {
							syllabusItem.Title = title
						}
						if desc, ok := itemMap["description"].(string); ok {
							syllabusItem.Description = desc
						}
						if order, ok := itemMap["order"].(float64); ok {
							syllabusItem.Order = int(order)
						}
						syllabusPtr.Items = append(syllabusPtr.Items, syllabusItem)
					}
				}
			}
		}
	}
	return a.backend.CreateRoom(name, subject, description, syllabusPtr, isPrivate, maxMembers)
}

// GenerateSyllabusFromFile generates a syllabus from file content using AI
func (a *App) GenerateSyllabusFromFile(fileContent, subject, courseName string) (interface{}, error) {
	return a.backend.GenerateSyllabusFromFile(fileContent, subject, courseName)
}

// GenerateSyllabusFromTopics generates a syllabus from topics list using AI
func (a *App) GenerateSyllabusFromTopics(topics []string, subject, courseName string) (interface{}, error) {
	return a.backend.GenerateSyllabusFromTopics(topics, subject, courseName)
}

func (a *App) GenerateAssessmentQuestions(subject, notes string, durationMinutes int) (interface{}, error) {
	return a.backend.GenerateAssessmentQuestions(subject, notes, durationMinutes)
}

func (a *App) CompleteAssessment(data map[string]interface{}) (interface{}, error) {
	return a.backend.CompleteAssessment(data)
}

func (a *App) GenerateReport(reportType string) (interface{}, error) {
	return a.backend.GenerateReport(reportType)
}

func (a *App) GetReports() (interface{}, error) {
	return a.backend.GetReports()
}

func (a *App) GetReport(reportID string) (interface{}, error) {
	return a.backend.GetReport(reportID)
}

func (a *App) Chat(message, context string) (interface{}, error) {
	return a.backend.Chat(message, context)
}

func (a *App) ExplainTopic(topic, subject, level string) (interface{}, error) {
	return a.backend.ExplainTopic(topic, subject, level)
}

func (a *App) AnswerQuestion(question, subject, context string) (interface{}, error) {
	return a.backend.AnswerQuestion(question, subject, context)
}

// JoinRoom joins a room
func (a *App) JoinRoom(roomID string) error {
	return a.backend.JoinRoom(roomID)
}

// SendMessage sends a message to a room
func (a *App) SendMessage(roomID, content string) (interface{}, error) {
	return a.backend.SendMessage(roomID, content)
}

// GetMessages gets messages from a room
func (a *App) GetMessages(roomID string) (interface{}, error) {
	return a.backend.GetMessages(roomID)
}

// GetRoomMembers gets members of a room
func (a *App) GetRoomMembers(roomID string) (interface{}, error) {
	return a.backend.GetRoomMembers(roomID)
}

// UpdateRoomSyllabus updates the syllabus of a room
func (a *App) UpdateRoomSyllabus(roomID string, syllabus interface{}) (interface{}, error) {
	var syllabusPtr *api.Syllabus
	if syllabus != nil {
		// Convert interface{} to *api.Syllabus
		if s, ok := syllabus.(map[string]interface{}); ok {
			syllabusPtr = &api.Syllabus{}
			if desc, ok := s["description"].(string); ok {
				syllabusPtr.Description = desc
			}
			if items, ok := s["items"].([]interface{}); ok {
				syllabusPtr.Items = []api.SyllabusItem{}
				for _, item := range items {
					if itemMap, ok := item.(map[string]interface{}); ok {
						syllabusItem := api.SyllabusItem{}
						if title, ok := itemMap["title"].(string); ok {
							syllabusItem.Title = title
						}
						if desc, ok := itemMap["description"].(string); ok {
							syllabusItem.Description = desc
						}
						if order, ok := itemMap["order"].(float64); ok {
							syllabusItem.Order = int(order)
						} else if orderInt, ok := itemMap["order"].(int); ok {
							syllabusItem.Order = orderInt
						}
						syllabusPtr.Items = append(syllabusPtr.Items, syllabusItem)
					}
				}
			} else {
				// If items is not provided, initialize empty array
				syllabusPtr.Items = []api.SyllabusItem{}
			}
		} else {
			// If syllabus is not a map, create empty syllabus
			syllabusPtr = &api.Syllabus{Items: []api.SyllabusItem{}}
		}
	} else {
		// If syllabus is nil, create empty syllabus
		syllabusPtr = &api.Syllabus{Items: []api.SyllabusItem{}}
	}
	
	result, err := a.backend.UpdateRoomSyllabus(roomID, syllabusPtr)
	if err != nil {
		log.Println("UpdateRoomSyllabus error:", err)
		return nil, err
	}
	
	log.Printf("UpdateRoomSyllabus result: %+v\n", result)
	return result, nil
}

// ============= Resource Methods =============

// UploadFile uploads a file for a room
func (a *App) UploadFile(roomID, filePath string) (interface{}, error) {
	return a.backend.UploadFile(roomID, filePath)
}

// CreateResource creates a new resource
func (a *App) CreateResource(roomID string, resource map[string]interface{}) (interface{}, error) {
	// Convert map to api.Resource
	res := api.Resource{
		Name:        resource["name"].(string),
		Description: resource["description"].(string),
		Category:    resource["category"].(string),
		FileURL:     resource["file_url"].(string),
		FileType:    resource["file_type"].(string),
		FileSize:    int64(resource["file_size"].(float64)),
	}
	
	// Handle legacy subject field
	if subject, ok := resource["subject"].(string); ok && subject != "" {
		res.Subject = subject
	}
	
	// Handle new subjects array
	if subjects, ok := resource["subjects"].([]interface{}); ok {
		for _, s := range subjects {
			if str, ok := s.(string); ok {
				res.Subjects = append(res.Subjects, str)
			}
		}
	} else if subjectsArray, ok := resource["subjects"].([]string); ok {
		res.Subjects = subjectsArray
	}
	
	return a.backend.CreateResource(roomID, res)
}

// GetResources gets all resources for a room
func (a *App) GetResources(roomID, uploaderType, category string) (interface{}, error) {
	return a.backend.GetResources(roomID, uploaderType, category)
}

// DeleteResource deletes a resource
func (a *App) DeleteResource(resourceID string) error {
	return a.backend.DeleteResource(resourceID)
}

// ShareResource shares a resource with specific users
func (a *App) ShareResource(resourceID string, sharedWith []string, isPublic bool) error {
	return a.backend.ShareResource(resourceID, sharedWith, isPublic)
}

// ============= Assignment Methods =============

// CreateAssignment creates a new assignment
func (a *App) CreateAssignment(roomID string, title, description string, dueDate interface{}, totalPoints int, assignmentType string, subjects interface{}) (interface{}, error) {
	var dueDateTime time.Time
	var err error
	
	// Handle different date formats from frontend
	switch v := dueDate.(type) {
	case string:
		// Try parsing ISO 8601 format
		dueDateTime, err = time.Parse(time.RFC3339, v)
		if err != nil {
			// Try parsing as RFC3339Nano
			dueDateTime, err = time.Parse(time.RFC3339Nano, v)
		}
		if err != nil {
			return nil, fmt.Errorf("invalid date format: %v", err)
		}
	case float64:
		// JavaScript timestamp (milliseconds)
		dueDateTime = time.Unix(0, int64(v)*int64(time.Millisecond))
	case int64:
		// Unix timestamp (seconds or milliseconds)
		if v > 1e10 {
			// Milliseconds
			dueDateTime = time.Unix(0, v*int64(time.Millisecond))
		} else {
			// Seconds
			dueDateTime = time.Unix(v, 0)
		}
	default:
		return nil, fmt.Errorf("invalid date type: %T", dueDate)
	}
	
	if err != nil {
		return nil, fmt.Errorf("failed to parse date: %v", err)
	}
	
	// Convert subjects from interface{} to []string
	var subjectsList []string
	if subjects != nil {
		if subjectsArray, ok := subjects.([]interface{}); ok {
			for _, s := range subjectsArray {
				if str, ok := s.(string); ok {
					subjectsList = append(subjectsList, str)
				}
			}
		} else if subjectsArray, ok := subjects.([]string); ok {
			subjectsList = subjectsArray
		}
	}
	
	return a.backend.CreateAssignment(roomID, title, description, dueDateTime, totalPoints, assignmentType, subjectsList)
}

// GetAssignments gets all assignments for a room
func (a *App) GetAssignments(roomID string) (interface{}, error) {
	return a.backend.GetAssignments(roomID)
}

// GetAssignment gets an assignment by ID
func (a *App) GetAssignment(assignmentID string) (interface{}, error) {
	return a.backend.GetAssignment(assignmentID)
}

// UpdateAssignment updates an assignment
func (a *App) UpdateAssignment(assignmentID string, title, description string, dueDate interface{}, totalPoints int, assignmentType string, subjects interface{}) (interface{}, error) {
	var dueDateTime time.Time
	var err error
	
	// Handle different date formats from frontend
	switch v := dueDate.(type) {
	case string:
		dueDateTime, err = time.Parse(time.RFC3339, v)
		if err != nil {
			dueDateTime, err = time.Parse(time.RFC3339Nano, v)
		}
		if err != nil {
			return nil, fmt.Errorf("invalid date format: %v", err)
		}
	case float64:
		dueDateTime = time.Unix(0, int64(v)*int64(time.Millisecond))
	case int64:
		if v > 1e10 {
			dueDateTime = time.Unix(0, v*int64(time.Millisecond))
		} else {
			dueDateTime = time.Unix(v, 0)
		}
	case time.Time:
		dueDateTime = v
	default:
		return nil, fmt.Errorf("invalid date type: %T", dueDate)
	}
	
	if err != nil {
		return nil, fmt.Errorf("failed to parse date: %v", err)
	}
	
	// Convert subjects from interface{} to []string
	var subjectsList []string
	if subjects != nil {
		if subjectsArray, ok := subjects.([]interface{}); ok {
			for _, s := range subjectsArray {
				if str, ok := s.(string); ok {
					subjectsList = append(subjectsList, str)
				}
			}
		} else if subjectsArray, ok := subjects.([]string); ok {
			subjectsList = subjectsArray
		}
	}
	
	return a.backend.UpdateAssignment(assignmentID, title, description, dueDateTime, totalPoints, assignmentType, subjectsList)
}

// DeleteAssignment deletes an assignment
func (a *App) DeleteAssignment(assignmentID string) error {
	return a.backend.DeleteAssignment(assignmentID)
}

// UpdateRoomExamDates updates the exam dates of a room
func (a *App) UpdateRoomExamDates(roomID string, examDates interface{}) (interface{}, error) {
	// Convert interface{} to []api.ExamDate
	var examDatesList []api.ExamDate
	if examDates != nil {
		if dates, ok := examDates.([]interface{}); ok {
			for _, date := range dates {
				if dateMap, ok := date.(map[string]interface{}); ok {
					examDate := api.ExamDate{}
					if title, ok := dateMap["title"].(string); ok {
						examDate.Title = title
					}
					if dateStr, ok := dateMap["date"].(string); ok {
						if t, err := time.Parse(time.RFC3339, dateStr); err == nil {
							examDate.Date = t
						}
					}
					if desc, ok := dateMap["description"].(string); ok {
						examDate.Description = desc
					}
					if subject, ok := dateMap["subject"].(string); ok {
						examDate.Subject = subject
					}
					examDatesList = append(examDatesList, examDate)
				}
			}
		}
	}
	return a.backend.UpdateRoomExamDates(roomID, examDatesList)
}

// ============= Profile & Settings =============

// GetMyProfile gets the current user's profile
func (a *App) GetMyProfile() (interface{}, error) {
	return a.backend.GetMyProfile()
}

// UpdateMyProfile updates the current user's profile
func (a *App) UpdateMyProfile(data map[string]interface{}) (interface{}, error) {
	return a.backend.UpdateMyProfile(data)
}

// GetUserProfile gets another user's profile by ID
func (a *App) GetUserProfile(userID string) (interface{}, error) {
	return a.backend.GetUserProfile(userID)
}

// GetUserStats gets another user's stats by ID
func (a *App) GetUserStats(userID string) (interface{}, error) {
	return a.backend.GetUserStats(userID)
}

// GetChildren gets all children for the current parent user
func (a *App) GetChildren() (interface{}, error) {
	return a.backend.GetChildren()
}

// CreateChild creates a new student account linked to the current parent
func (a *App) CreateChild(email, password, name string, age int) (interface{}, error) {
	return a.backend.CreateChild(email, password, name, age)
}

// Greet returns a greeting (example method)
func (a *App) Greet(name string) string {
	return "Hello " + name + ", welcome to Buddy!"
}

// ============= Dashboard Methods =============

// GetDashboardStats gets the user's dashboard statistics
func (a *App) GetDashboardStats() (*backend.DashboardStats, error) {
	return a.backend.GetDashboardStats()
}

// ============= Goals & Milestones =============

// CreateGoal creates a new goal
func (a *App) CreateGoal(data map[string]interface{}) (interface{}, error) {
	return a.backend.CreateGoal(data)
}

// GetTodayGoals gets today's goals for the user (Updated for new API)
func (a *App) GetTodayGoals() (interface{}, error) {
	return a.backend.GetTodayGoals()
}

// GenerateDailyGoals creates AI-generated daily goals for today (tickable)
func (a *App) GenerateDailyGoals() (interface{}, error) {
	return a.backend.GenerateDailyGoals()
}

// GetGoals gets all goals with filters
func (a *App) GetGoals(completed *bool, studyPlanID *string) (interface{}, error) {
	return a.backend.GetGoals(completed, studyPlanID)
}

// ToggleGoalComplete toggles a goal's completion status
func (a *App) ToggleGoalComplete(goalID string) error {
	return a.backend.ToggleGoalComplete(goalID)
}

// DeleteGoal deletes a goal
func (a *App) DeleteGoal(goalID string) error {
	return a.backend.DeleteGoal(goalID)
}

// GetMilestones gets milestones
func (a *App) GetMilestones(studyPlanID *string) (interface{}, error) {
	return a.backend.GetMilestones(studyPlanID)
}

// CreateMilestone creates a new milestone
func (a *App) CreateMilestone(data map[string]interface{}) (interface{}, error) {
	return a.backend.CreateMilestone(data)
}

// UpdateMilestoneProgress updates milestone progress
func (a *App) UpdateMilestoneProgress(milestoneID string, progress float64) error {
	return a.backend.UpdateMilestoneProgress(milestoneID, progress)
}

// ============= Study Plans & Schedule =============

// GetMyStudyPlans gets the user's active study plans
func (a *App) GetMyStudyPlans() (interface{}, error) {
	return a.backend.GetMyStudyPlans()
}

// CreateStudyPlan creates a new study plan
func (a *App) CreateStudyPlan(data map[string]interface{}) (interface{}, error) {
	return a.backend.CreateStudyPlan(data)
}

// AddCourseToStudyPlan adds a course to a study plan
func (a *App) AddCourseToStudyPlan(planID string, data map[string]interface{}) (interface{}, error) {
	return a.backend.AddCourseToStudyPlan(planID, data)
}

// GetStudyPlanCourses gets courses for a study plan
func (a *App) GetStudyPlanCourses(planID string) (interface{}, error) {
	return a.backend.GetStudyPlanCourses(planID)
}

// GetScheduleBlocks gets schedule blocks for a study plan
func (a *App) GetScheduleBlocks(planID string) (interface{}, error) {
	return a.backend.GetScheduleBlocks(planID)
}

// CreateScheduleBlock creates a schedule block for a study plan
func (a *App) CreateScheduleBlock(planID string, data map[string]interface{}) (interface{}, error) {
	return a.backend.CreateScheduleBlock(planID, data)
}

// UpdateScheduleBlock updates a schedule block for a study plan
func (a *App) UpdateScheduleBlock(planID, blockID string, data map[string]interface{}) (interface{}, error) {
	return a.backend.UpdateScheduleBlock(planID, blockID, data)
}

// DeleteScheduleBlock deletes a schedule block for a study plan
func (a *App) DeleteScheduleBlock(planID, blockID string) error {
	return a.backend.DeleteScheduleBlock(planID, blockID)
}

// GetUserSchedule gets user's full schedule
func (a *App) GetUserSchedule() (interface{}, error) {
	return a.backend.GetUserSchedule()
}

// UpdateStudyPlanProgress updates study plan progress
func (a *App) UpdateStudyPlanProgress(planID string, progress float64) error {
	return a.backend.UpdateStudyPlanProgress(planID, progress)
}

// SaveTextToDownloads writes content to a file in the user's Downloads folder and returns the saved path.
func (a *App) SaveTextToDownloads(filename, content string) (string, error) {
	return a.backend.SaveTextToDownloads(filename, content)
}

// OpenFileDialog opens a file dialog and returns the selected file path
func (a *App) OpenFileDialog() (string, error) {
	ctx := a.backend.GetContext()
	return a.backend.OpenFileDialog(ctx)
}

// GetActiveChallenges gets current live challenges
func (a *App) GetActiveChallenges() ([]backend.Challenge, error) {
	return a.backend.GetActiveChallenges()
}

// ============= Leaderboard =============

func (a *App) GetLeaderboard(period string, limit int) (interface{}, error) {
	return a.backend.GetLeaderboard(period, limit)
}

func (a *App) GetMyBadges() (interface{}, error) {
	return a.backend.GetMyBadges()
}

// ============= Activity =============

func (a *App) LogStudySession(subject string, durationMinutes int) error {
	return a.backend.LogStudySession(subject, durationMinutes)
}

func (a *App) GetMyActivity(activityType string, limit int) (interface{}, error) {
	return a.backend.GetMyActivity(activityType, limit)
}

func (a *App) StartStudySession(studyPlanID, subject string) (interface{}, error) {
	return a.backend.StartStudySession(studyPlanID, subject)
}

func (a *App) GetActiveStudySession() (interface{}, error) {
	return a.backend.GetActiveStudySession()
}

func (a *App) PauseStudySession() error {
	return a.backend.PauseStudySession()
}

func (a *App) ResumeStudySession() error {
	return a.backend.ResumeStudySession()
}

func (a *App) SetIdleStatus(isIdle bool) error {
	return a.backend.SetIdleStatus(isIdle)
}

func (a *App) StopStudySession(notes string, focusScore int) (interface{}, error) {
	return a.backend.StopStudySession(notes, focusScore)
}

// ============= Friends =============

func (a *App) SendFriendRequest(toUserID string) error {
	return a.backend.SendFriendRequest(toUserID)
}

func (a *App) GetIncomingFriendRequests() (interface{}, error) {
	return a.backend.GetIncomingFriendRequests()
}

func (a *App) AcceptFriendRequest(id string) error {
	return a.backend.AcceptFriendRequest(id)
}

func (a *App) RejectFriendRequest(id string) error {
	return a.backend.RejectFriendRequest(id)
}

func (a *App) GetFriends() (interface{}, error) {
	return a.backend.GetFriends()
}

// ============= Room AI Coach =============

// GetRoomAIStatus gets the AI training status for a room
func (a *App) GetRoomAIStatus(roomID string) (map[string]interface{}, error) {
	return a.backend.GetRoomAIStatus(roomID)
}

// TrainRoomAI trains the room AI with selected resources
func (a *App) TrainRoomAI(roomID string, resourceIDs []string) error {
	return a.backend.TrainRoomAI(roomID, resourceIDs)
}

// ChatWithRoomAI sends a message to the room's AI coach
func (a *App) ChatWithRoomAI(roomID string, message string) (map[string]interface{}, error) {
	return a.backend.ChatWithRoomAI(roomID, message)
}

// ============= Smart Study Plan =============

// GenerateSmartStudyPlan generates a smart study plan using AI
func (a *App) GenerateSmartStudyPlan(data map[string]interface{}) (interface{}, error) {
	return a.backend.GenerateSmartStudyPlan(data)
}

// CreateSmartStudyPlan creates a study plan from AI-generated data
func (a *App) CreateSmartStudyPlan(data map[string]interface{}) (interface{}, error) {
	return a.backend.CreateSmartStudyPlan(data)
}

// ============= Games =============

// GetGameTemplates returns all available game templates
func (a *App) GetGameTemplates() (interface{}, error) {
	return a.backend.GetGameTemplates()
}

// GetGameTemplate returns a specific game template
func (a *App) GetGameTemplate(templateID string) (interface{}, error) {
	return a.backend.GetGameTemplate(templateID)
}

// GenerateGame generates a new AI-powered game
func (a *App) GenerateGame(roomID string, gameType, subject, difficulty string, questionCount int) (interface{}, error) {
	return a.backend.GenerateGame(roomID, gameType, subject, difficulty, questionCount)
}

// GetRoomGames returns all games for a room
func (a *App) GetRoomGames(roomID string) (interface{}, error) {
	return a.backend.GetRoomGames(roomID)
}

// GetGame returns a specific game
func (a *App) GetGame(gameID string) (interface{}, error) {
	return a.backend.GetGame(gameID)
}

// DownloadGameBundle downloads a game bundle
func (a *App) DownloadGameBundle(gameID string) (string, error) {
	return a.backend.DownloadGameBundle(gameID)
}

// PlayGame submits game answers
func (a *App) PlayGame(gameID string, answers []string, timeSpent int) (interface{}, error) {
	return a.backend.PlayGame(gameID, answers, timeSpent)
}

// GetGameResults returns student's results for a game
func (a *App) GetGameResults(gameID string) (interface{}, error) {
	return a.backend.GetGameResults(gameID)
}
