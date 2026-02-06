import { useState, useEffect } from 'react';
import { FileText, Calendar, TrendingUp, Award, AlertCircle, Lightbulb } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { reportService } from '../../services';

interface Report {
  id: string;
  report_type: string;
  start_date: string;
  end_date: string;
  summary: string;
  strengths: string[];
  weak_areas: string[];
  recommendations: string[];
  overall_score: number;
  total_study_hours: number;
  avg_focus_score: number;
  avg_productivity_score: number;
  goals_completed: number;
  milestones_progress: number;
  created_at: string;
}

export default function ReportViewer() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data: any = await reportService.getReports();
      const reportList = Array.isArray(data) ? data : [];
      setReports(reportList);
      if (reportList.length > 0) {
        setSelectedReport(reportList[0]);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Calendar className="w-4 h-4" />;
      case 'weekly':
        return <TrendingUp className="w-4 h-4" />;
      case 'monthly':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading reports...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
            No Reports Yet
          </h3>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Generate your first performance report to get AI-powered insights
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Reports List */}
      <div className="lg:col-span-1">
        <Card>
          <div className="p-4 border-b border-light-border dark:border-dark-border">
            <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
              Your Reports
            </h3>
          </div>
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`w-full p-4 text-left transition-colors ${
                  selectedReport?.id === report.id
                    ? 'bg-primary/10'
                    : 'hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getReportTypeIcon(report.report_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="neutral" size="sm">
                        {report.report_type}
                      </Badge>
                      <span className={`text-sm font-semibold ${getScoreColor(report.overall_score)}`}>
                        {Math.round(report.overall_score)}%
                      </span>
                    </div>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      {formatDate(report.start_date)} - {formatDate(report.end_date)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Report Details */}
      {selectedReport && (
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                      {selectedReport.report_type.charAt(0).toUpperCase() + selectedReport.report_type.slice(1)} Report
                    </h2>
                    <Badge variant="primary">
                      {formatDate(selectedReport.created_at)}
                    </Badge>
                  </div>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Period: {formatDate(selectedReport.start_date)} - {formatDate(selectedReport.end_date)}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(selectedReport.overall_score)}`}>
                    {Math.round(selectedReport.overall_score)}%
                  </div>
                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    Overall Score
                  </p>
                </div>
              </div>

              <p className="text-light-text-primary dark:text-dark-text-primary">
                {selectedReport.summary}
              </p>
            </div>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <div className="p-4">
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                  Study Hours
                </p>
                <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {selectedReport.total_study_hours.toFixed(1)}h
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                  Avg Focus
                </p>
                <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {Math.round(selectedReport.avg_focus_score)}%
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                  Productivity
                </p>
                <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {Math.round(selectedReport.avg_productivity_score)}%
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                  Milestones
                </p>
                <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {Math.round(selectedReport.milestones_progress)}%
                </p>
              </div>
            </Card>
          </div>

          {/* Strengths */}
          {selectedReport.strengths && selectedReport.strengths.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                    Strengths
                  </h3>
                </div>
                <ul className="space-y-2">
                  {selectedReport.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-light-text-primary dark:text-dark-text-primary">
                        {strength}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* Weak Areas */}
          {selectedReport.weak_areas && selectedReport.weak_areas.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                    Areas for Improvement
                  </h3>
                </div>
                <ul className="space-y-2">
                  {selectedReport.weak_areas.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">⚠</span>
                      <span className="text-light-text-primary dark:text-dark-text-primary">
                        {area}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                    AI Recommendations
                  </h3>
                </div>
                <ul className="space-y-3">
                  {selectedReport.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary">
                      <span className="font-semibold text-primary">{index + 1}.</span>
                      <span className="text-light-text-primary dark:text-dark-text-primary">
                        {rec}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
