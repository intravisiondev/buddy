package api

// ReportService handles report-related API calls
type ReportService struct {
	client *Client
}

// NewReportService creates a new report service
func NewReportService(client *Client) *ReportService {
	return &ReportService{client: client}
}

// GenerateReport generates a new performance report
func (s *ReportService) GenerateReport(reportType string) (interface{}, error) {
	payload := map[string]interface{}{
		"report_type": reportType,
	}
	var out interface{}
	err := s.client.Post("/reports/generate", payload, &out)
	return out, err
}

// GetReports gets all reports for the current user
func (s *ReportService) GetReports() (interface{}, error) {
	var out interface{}
	err := s.client.Get("/reports", &out)
	return out, err
}

// GetReport gets a specific report by ID
func (s *ReportService) GetReport(reportID string) (interface{}, error) {
	var out interface{}
	err := s.client.Get("/reports/"+reportID, &out)
	return out, err
}
