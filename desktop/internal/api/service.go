package api

// Service aggregates all API services
type Service struct {
	Auth       *AuthService
	Room       *RoomService
	User       *UserService
	StudyPlan  *StudyPlanService
	Resource   *ResourceService
	Assignment *AssignmentService
	Goal       *GoalService
	Leaderboard *LeaderboardService
	Activity   *ActivityService
	Friends    *FriendService
	AI         *AIService
	Report     *ReportService
	AIClient   *AIClientService
	SmartPlan  *SmartPlanService
}

// NewService creates a new service with all API services
func NewService() *Service {
	client := NewClient()
	return &Service{
		Auth:       NewAuthService(client),
		Room:       NewRoomService(client),
		User:       NewUserService(client),
		StudyPlan:  NewStudyPlanService(client),
		Resource:   NewResourceService(client),
		Assignment: NewAssignmentService(client),
		Goal:       NewGoalService(client),
		Leaderboard: NewLeaderboardService(client),
		Activity:   NewActivityService(client),
		Friends:    NewFriendService(client),
		AI:         NewAIService(client),
		Report:     NewReportService(client),
		AIClient:   NewAIClientService(client),
		SmartPlan:  NewSmartPlanService(client),
	}
}

// SetToken sets the auth token for all services
func (s *Service) SetToken(token string) {
	// The client is shared, so setting on one service sets for all
	s.Auth.client.SetAuthToken(token)
}
