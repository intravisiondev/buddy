import { useState, useEffect } from 'react';
import { LayoutGrid, List, Calendar as CalendarIcon, Target, FileText } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PlansTab from '../components/studyplans/PlansTab';
import ScheduleTab from '../components/studyplans/ScheduleTab';
import MilestonesTab from '../components/studyplans/MilestonesTab';
import StudyPlanDashboard from '../components/studyplans/StudyPlanDashboard';
import ReportGenerator from '../components/reports/ReportGenerator';
import ReportViewer from '../components/reports/ReportViewer';

type TabType = 'dashboard' | 'plans' | 'schedule' | 'milestones' | 'reports';

export default function StudyPlans() {
  const { studyPlanTab, setStudyPlanTab } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>(studyPlanTab || 'dashboard');

  // Sync with context
  useEffect(() => {
    if (studyPlanTab) {
      setActiveTab(studyPlanTab);
      setStudyPlanTab(null); // Reset after using
    }
  }, [studyPlanTab, setStudyPlanTab]);

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutGrid },
    { id: 'plans' as TabType, label: 'Plans', icon: List },
    { id: 'schedule' as TabType, label: 'Schedule', icon: CalendarIcon },
    { id: 'milestones' as TabType, label: 'Milestones', icon: Target },
    { id: 'reports' as TabType, label: 'Reports', icon: FileText },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Study Plans
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Organize your learning journey with structured plans and schedules
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card className="p-2">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1"
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'dashboard' && <StudyPlanDashboard />}
        {activeTab === 'plans' && <PlansTab />}
        {activeTab === 'schedule' && <ScheduleTab />}
        {activeTab === 'milestones' && <MilestonesTab />}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  Performance Reports
                </h2>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  AI-powered insights into your study performance
                </p>
              </div>
              <ReportGenerator onReportGenerated={() => window.location.reload()} />
            </div>
            <ReportViewer />
          </div>
        )}
      </div>
    </div>
  );
}
