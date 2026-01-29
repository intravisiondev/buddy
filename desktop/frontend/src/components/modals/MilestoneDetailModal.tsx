import { useState } from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import { CheckCircle2, Calendar, Target, FileText } from 'lucide-react';

interface Milestone {
  id: string;
  user_id: string;
  study_plan_id?: string;
  title: string;
  description: string;
  target_date: string;
  progress: number;
  completed: boolean;
  created_at: string;
  completed_at?: string;
}

interface MilestoneDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone | null;
}

export default function MilestoneDetailModal({ isOpen, onClose, milestone }: MilestoneDetailModalProps) {
  if (!milestone) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const daysUntil = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const days = daysUntil(milestone.target_date);
  const isOverdue = days < 0 && !milestone.completed;
  const isDueSoon = days >= 0 && days <= 7 && !milestone.completed;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Milestone Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {milestone.title}
              </h2>
              {milestone.completed && (
                <CheckCircle2 className="w-6 h-6 text-light-success dark:text-dark-success" />
              )}
            </div>
            {milestone.completed ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            ) : (
              <Badge 
                variant={isOverdue ? 'danger' : isDueSoon ? 'warning' : 'neutral'}
                size="sm"
              >
                {isOverdue 
                  ? `${Math.abs(days)} days overdue` 
                  : days === 0
                  ? 'Due today'
                  : `${days} days left`
                }
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
            <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
              Description
            </h3>
          </div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary whitespace-pre-wrap">
            {milestone.description || 'No description provided.'}
          </p>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                Progress
              </h3>
            </div>
            <span className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              {milestone.progress}%
            </span>
          </div>
          <ProgressBar 
            progress={milestone.progress} 
            showLabel 
            variant={milestone.completed ? 'success' : isOverdue ? 'danger' : 'primary'}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                Target Date
              </h3>
            </div>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              {formatDate(milestone.target_date)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                Created
              </h3>
            </div>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              {formatDate(milestone.created_at)}
            </p>
          </div>
          {milestone.completed_at && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-light-success dark:text-dark-success" />
                <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                  Completed
                </h3>
              </div>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                {formatDate(milestone.completed_at)}
              </p>
            </div>
          )}
        </div>

        {/* Study Plan Info */}
        {milestone.study_plan_id && (
          <div className="p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              <span className="font-semibold">Associated Study Plan:</span> {milestone.study_plan_id}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
