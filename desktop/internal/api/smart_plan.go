package api

// SmartPlanService handles smart study plan API calls
type SmartPlanService struct {
	client *Client
}

// NewSmartPlanService creates a new smart plan service
func NewSmartPlanService(client *Client) *SmartPlanService {
	return &SmartPlanService{client: client}
}

// GenerateSmartPlanRequest represents the request to generate a smart plan
type GenerateSmartPlanRequest struct {
	Subject     string  `json:"subject"`
	Goals       string  `json:"goals"`
	Description string  `json:"description"`
	WeeklyHours float64 `json:"weekly_hours"`
	StartDate   string  `json:"start_date"`
	EndDate     string  `json:"end_date"`
}

// ScheduleBlockPreview represents a schedule block preview
type ScheduleBlockPreview struct {
	DayOfWeek int    `json:"day_of_week"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Subject   string `json:"subject"`
	Topic     string `json:"topic"`
	BlockType string `json:"block_type"`
}

// MilestonePreview represents a milestone preview
type MilestonePreview struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	TargetDate  string  `json:"target_date"`
	Progress    float64 `json:"progress"`
}

// GeneratedPlanResponse represents the AI-generated plan
type GeneratedPlanResponse struct {
	Name           string                 `json:"name"`
	Description    string                 `json:"description"`
	ScheduleBlocks []ScheduleBlockPreview `json:"schedule_blocks"`
	Milestones     []MilestonePreview     `json:"milestones"`
}

// CreateSmartPlanRequest represents the request to create a smart plan
type CreateSmartPlanRequest struct {
	Name           string                 `json:"name"`
	Description    string                 `json:"description"`
	Subject        string                 `json:"subject"`
	StartDate      string                 `json:"start_date"`
	EndDate        string                 `json:"end_date"`
	ScheduleBlocks []ScheduleBlockPreview `json:"schedule_blocks"`
	Milestones     []MilestonePreview     `json:"milestones"`
}

// GenerateSmartPlan generates a smart study plan using AI
func (s *SmartPlanService) GenerateSmartPlan(req GenerateSmartPlanRequest) (*GeneratedPlanResponse, error) {
	var response GeneratedPlanResponse
	err := s.client.Post("/smart-plan/generate", req, &response)
	return &response, err
}

// CreateSmartPlan creates a study plan from AI-generated data
func (s *SmartPlanService) CreateSmartPlan(req CreateSmartPlanRequest) (interface{}, error) {
	var result interface{}
	err := s.client.Post("/smart-plan/create", req, &result)
	return result, err
}
