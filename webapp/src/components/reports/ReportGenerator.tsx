import { useState } from 'react';
import { Calendar, TrendingUp, FileText } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { reportService } from '../../services';

interface ReportGeneratorProps {
  onReportGenerated?: () => void;
}

export default function ReportGenerator({ onReportGenerated }: ReportGeneratorProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await reportService.generateReport(selectedType);
      alert(`${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} report generated successfully!`);
      setShowModal(false);
      if (onReportGenerated) {
        onReportGenerated();
      }
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report: ' + (error.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const reportTypes = [
    {
      type: 'daily' as const,
      icon: Calendar,
      title: 'Daily Report',
      description: 'Last 24 hours performance',
      color: 'text-blue-500',
    },
    {
      type: 'weekly' as const,
      icon: TrendingUp,
      title: 'Weekly Report',
      description: 'Last 7 days performance',
      color: 'text-green-500',
    },
    {
      type: 'monthly' as const,
      icon: FileText,
      title: 'Monthly Report',
      description: 'Last 30 days performance',
      color: 'text-purple-500',
    },
  ];

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant="primary"
      >
        Generate Report
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Generate Performance Report"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Select the time period for your performance report. AI will analyze your study data and provide insights.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              const isSelected = selectedType === report.type;

              return (
                <button
                  key={report.type}
                  onClick={() => setSelectedType(report.type)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-light-border dark:border-dark-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-6 h-6 ${report.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                          {report.title}
                        </h3>
                        {isSelected && <Badge variant="primary" size="sm">Selected</Badge>}
                      </div>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
}
