import { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List as ListIcon, Users, Calendar, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import CreateStudyPlanModal from '../modals/CreateStudyPlanModal';
import { studyPlanService } from '../../services';

interface StudyPlan {
  id: string;
  name: string;
  description?: string;
  progress: number;
  start_date?: string;
  end_date?: string;
  daily_goal_hours?: number;
  is_challenge?: boolean;
  is_public?: boolean;
  created_at?: string;
}

type ViewMode = 'gallery' | 'list';

export default function PlansTab() {
  const { setCurrentScreen, setSelectedStudyPlan } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await studyPlanService.getMyStudyPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load study plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysRemaining = (endDate?: string) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const handleViewPlan = (planId: string) => {
    setSelectedStudyPlan(planId);
    setCurrentScreen('study-plan');
  };

  const handleCreateSuccess = () => {
    loadPlans(); // Reload plans after creation
  };

  if (loading) {
    return <div className="text-center py-12">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
            My Study Plans
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            {plans.length} {plans.length === 1 ? 'plan' : 'plans'} in total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg p-1">
            <Button
              variant={viewMode === 'gallery' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('gallery')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      <CreateStudyPlanModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Plans Display */}
      {plans.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-4 bg-light-primary/10 dark:bg-dark-primary/10 rounded-full flex items-center justify-center">
              <Calendar className="w-10 h-10 text-light-primary dark:text-dark-primary" />
            </div>
            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
              No Study Plans Yet
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
              Create your first study plan to organize your learning journey
            </p>
            <Button>
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Plan
            </Button>
          </div>
        </Card>
      ) : viewMode === 'gallery' ? (
        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} hover className="p-6 cursor-pointer" onClick={() => handleViewPlan(plan.id)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary line-clamp-2 mb-3">
                    {plan.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {plan.is_challenge && (
                  <Badge variant="warning" size="sm">
                    <Users className="w-3 h-3 mr-1" />
                    Challenge
                  </Badge>
                )}
                {plan.is_public && (
                  <Badge variant="accent" size="sm">
                    Public
                  </Badge>
                )}
                <Badge variant="neutral" size="sm">
                  {daysRemaining(plan.end_date)} days left
                </Badge>
              </div>

              <ProgressBar progress={plan.progress} showLabel className="mb-4" />

              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                <p>{formatDate(plan.start_date)} - {formatDate(plan.end_date)}</p>
                <p>Daily Goal: {plan.daily_goal_hours}h</p>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" fullWidth>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {plans.map((plan) => (
              <div key={plan.id} className="p-6 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer" onClick={() => handleViewPlan(plan.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                        {plan.name}
                      </h3>
                      {plan.is_challenge && (
                        <Badge variant="warning" size="sm">
                          <Users className="w-3 h-3 mr-1" />
                          Challenge
                        </Badge>
                      )}
                      {plan.is_public && (
                        <Badge variant="accent" size="sm">
                          Public
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">
                      {plan.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      <span>{formatDate(plan.start_date)} - {formatDate(plan.end_date)}</span>
                      <span>Daily Goal: {plan.daily_goal_hours}h</span>
                      <span>{daysRemaining(plan.end_date)} days remaining</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <ProgressBar progress={plan.progress} showLabel size="sm" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
