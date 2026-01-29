package backend

import "fmt"

// GenerateReport generates a new performance report
func (a *WailsApp) GenerateReport(reportType string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Report.GenerateReport(reportType)
}

// GetReports gets all reports for the current user
func (a *WailsApp) GetReports() (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Report.GetReports()
}

// GetReport gets a specific report by ID
func (a *WailsApp) GetReport(reportID string) (interface{}, error) {
	if a.authToken == "" {
		return nil, fmt.Errorf("not authenticated")
	}
	return a.api.Report.GetReport(reportID)
}
