import { useState, useEffect, useCallback } from 'react';
import { Target, TrendingUp, Award, Plus, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import CreateMilestoneModal from '../modals/CreateMilestoneModal';
import MilestoneDetailModal from '../modals/MilestoneDetailModal';
import { goalService, studyPlanService } from '../../services';
import type { Milestone } from '../../services/goal.service';

interface StudyPlan {
  id: string;
  name: string;
}

export default function MilestonesTab() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [filterPlanID, setFilterPlanID] = useState<string | null>(null); // null = All
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const plansData = await studyPlanService.getMyStudyPlans();
        const planList = Array.isArray(plansData) ? plansData : [];
        setPlans(planList.map((p: any) => ({ id: p.id || p._id, name: p.name })));
      } catch (e) {
        console.error('Failed to load study plans:', e);
      }
    })();
  }, []);

  const loadMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goalService.getMilestones(filterPlanID || undefined);
      setMilestones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load milestones:', error);
    } finally {
      setLoading(false);
    }
  }, [filterPlanID]);

  useEffect(() => {
    loadMilestones();
    
    // Listen for milestone updates from other components (e.g., TimeTrackingFooter)
    const handleMilestoneUpdated = () => {
      console.log('Milestone updated event received, reloading...');
      loadMilestones();
    };
    
    window.addEventListener('milestone-updated', handleMilestoneUpdated);
    
    return () => {
      window.removeEventListener('milestone-updated', handleMilestoneUpdated);
    };
  }, [loadMilestones]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysUntil = (targetDate?: string) => {
    if (!targetDate) return 0;
    const target = new Date(targetDate);
    const today = new Date();
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filteredMilestones = milestones.filter(m => {
    if (filter === 'active') return !m.completed && m.progress < 100;
    if (filter === 'completed') return m.completed || m.progress === 100;
    return true;
  });

  const completedCount = milestones.filter(m => m.completed).length;
  const avgProgress = milestones.length > 0 
    ? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length) 
    : 0;

  if (loading) {
    return <div className="text-center py-12">Loading milestones...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
            Milestones & Progress
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Track your learning achievements
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Milestone
        </Button>
      </div>

      <CreateMilestoneModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadMilestones}
        studyPlanID={filterPlanID ?? undefined}
      />

      <MilestoneDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedMilestone(null);
        }}
        milestone={selectedMilestone}
      />

      {/* Study Plan filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
          Study Plan
        </label>
        <select
          value={filterPlanID ?? ''}
          onChange={(e) => setFilterPlanID(e.target.value || null)}
          className="p-2.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary min-w-[200px]"
        >
          <option value="">All plans</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                Total Milestones
              </p>
              <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {milestones.length}
              </p>
            </div>
            <div className="p-3 bg-light-primary/10 dark:bg-dark-primary/10 rounded-lg">
              <Target className="w-6 h-6 text-light-primary dark:text-dark-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                Completed
              </p>
              <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {completedCount}
              </p>
            </div>
            <div className="p-3 bg-light-success/10 dark:bg-dark-success/10 rounded-lg">
              <Award className="w-6 h-6 text-light-success dark:text-dark-success" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                Avg. Progress
              </p>
              <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {avgProgress}%
              </p>
            </div>
            <div className="p-3 bg-light-accent/10 dark:bg-dark-accent/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-light-accent dark:text-dark-accent" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({milestones.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active ({milestones.filter(m => !m.completed).length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed ({completedCount})
        </Button>
      </div>

      {/* Milestones List */}
      {filteredMilestones.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-4 bg-light-primary/10 dark:bg-dark-primary/10 rounded-full flex items-center justify-center">
              <Target className="w-10 h-10 text-light-primary dark:text-dark-primary" />
            </div>
            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
              No Milestones
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
              {filter === 'all' 
                ? 'Create your first milestone to track your progress'
                : filter === 'active'
                ? 'No active milestones at the moment'
                : 'No completed milestones yet'}
            </p>
            {filter === 'all' && (
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                Create Milestone
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {filteredMilestones.map((milestone) => {
            const days = daysUntil(milestone.target_date);
            const isOverdue = days < 0 && !milestone.completed;
            const isDueSoon = days >= 0 && days <= 7 && !milestone.completed;

            return (
              <Card 
                key={milestone.id} 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedMilestone(milestone);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                        {milestone.title}
                      </h3>
                      {milestone.completed && (
                        <CheckCircle2 className="w-5 h-5 text-light-success dark:text-dark-success" />
                      )}
                    </div>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary line-clamp-2">
                      {milestone.description}
                    </p>
                  </div>
                </div>

                <ProgressBar 
                  progress={milestone.progress} 
                  showLabel 
                  className="mb-4"
                  variant={milestone.completed ? 'success' : isOverdue ? 'warning' : 'primary'}
                />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">
                    Target: {formatDate(milestone.target_date)}
                  </span>
                  {!milestone.completed && (
                    <Badge 
                      variant={isOverdue ? 'error' : isDueSoon ? 'warning' : 'neutral'}
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
                  {milestone.completed && (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
