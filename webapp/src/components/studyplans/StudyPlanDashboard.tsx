import { useEffect, useState } from 'react';
import { Plus, Target, Clock, TrendingUp, Calendar, Sparkles, Wand2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import CreateGoalModal from '../modals/CreateGoalModal';
import SmartStudyPlanModal from '../modals/SmartStudyPlanModal';
import { studyPlanService, goalService } from '../../services';
import RecentStudySessions from '../widgets/RecentStudySessions';

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  subject?: string;
}

interface StudyPlan {
  id: string;
  name: string;
  description?: string;
  progress: number;
  start_date?: string;
  end_date?: string;
  is_challenge?: boolean;
}

export default function StudyPlanDashboard() {
  const { setCurrentScreen, setSelectedStudyPlan, setStudyPlanTab } = useApp();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [showSmartPlanModal, setShowSmartPlanModal] = useState(false);
  const [generatingDaily, setGeneratingDaily] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [goalsData, plansData] = await Promise.all([
        goalService.getTodayGoals(),
        studyPlanService.getMyStudyPlans(),
      ]);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGoal = async (goalID: string) => {
    try {
      await goalService.toggleGoalComplete(goalID);
      setGoals(prev => prev.map(g => g.id === goalID ? { ...g, completed: !g.completed } : g));
    } catch (error) {
      console.error('Failed to toggle goal:', error);
    }
  };

  const handleGenerateDailyGoals = async () => {
    setGeneratingDaily(true);
    try {
      await goalService.generateDailyGoals();
      await loadData();
    } catch (error) {
      console.error('Failed to generate daily goals:', error);
      alert('Failed to generate daily goals. ' + (error as Error)?.message);
    } finally {
      setGeneratingDaily(false);
    }
  };

  const completedGoals = goals.filter(g => g.completed).length;
  const activePlans = plans.filter(p => p.progress < 100);

  const handleViewPlan = (planId: string) => {
    setSelectedStudyPlan(planId);
    setCurrentScreen('study-plan');
  };

  const handleViewAll = () => {
    setStudyPlanTab('plans');
    setCurrentScreen('study-plan');
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Smart Study Plan Banner */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-card">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
                Smart Study Plan
              </h3>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                Let AI create a personalized study plan with schedule and milestones for you
              </p>
            </div>
          </div>
          <Button onClick={() => setShowSmartPlanModal(true)} className="px-6">
            <Sparkles className="w-5 h-5 mr-2" />
            Create with AI
          </Button>
        </div>
      </Card>

      {/* Smart Plan Modal */}
      <SmartStudyPlanModal
        isOpen={showSmartPlanModal}
        onClose={() => setShowSmartPlanModal(false)}
        onSuccess={loadData}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                Active Plans
              </p>
              <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {activePlans.length}
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
                Today's Goals
              </p>
              <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {completedGoals}/{goals.length}
              </p>
            </div>
            <div className="p-3 bg-light-success/10 dark:bg-dark-success/10 rounded-lg">
              <Clock className="w-6 h-6 text-light-success dark:text-dark-success" />
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
                {plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + p.progress, 0) / plans.length) : 0}%
              </p>
            </div>
            <div className="p-3 bg-light-accent/10 dark:bg-dark-accent/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-light-accent dark:text-dark-accent" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                This Week
              </p>
              <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                12h
              </p>
            </div>
            <div className="p-3 bg-light-warning/10 dark:bg-dark-warning/10 rounded-lg">
              <Calendar className="w-6 h-6 text-light-warning dark:text-dark-warning" />
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Goals */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
            Today's Goals
          </h3>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateDailyGoals}
              disabled={generatingDaily}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {generatingDaily ? 'Generating...' : 'AI Daily Goals'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateGoalModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </div>

        <CreateGoalModal
          isOpen={showCreateGoalModal}
          onClose={() => setShowCreateGoalModal(false)}
          onSuccess={loadData}
        />

        <div className="space-y-3">
          {goals.length === 0 ? (
            <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary space-y-3">
              <p>No goals for today.</p>
              <p className="text-sm">Use <strong>AI Daily Goals</strong> to generate tickable suggestions, or <strong>Add Goal</strong> to create one.</p>
            </div>
          ) : (
            goals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors cursor-pointer"
                onClick={() => handleToggleGoal(goal.id)}
              >
                <input
                  type="checkbox"
                  checked={goal.completed}
                  onChange={() => {}}
                  className="w-5 h-5 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <p className={`font-medium ${goal.completed ? 'line-through text-light-text-secondary dark:text-dark-text-secondary' : 'text-light-text-primary dark:text-dark-text-primary'}`}>
                    {goal.title}
                  </p>
                </div>
                <Badge variant="neutral" size="sm">{goal.subject}</Badge>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Active Study Plans */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
            Active Study Plans
          </h3>
          <Button variant="ghost" size="sm" onClick={handleViewAll}>
            View All
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {activePlans.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
              No active study plans. Create your first plan!
            </div>
          ) : (
            activePlans.map((plan) => (
              <Card 
                key={plan.id} 
                hover 
                className="p-4 cursor-pointer" 
                onClick={() => handleViewPlan(plan.id)}
              >
                <div className="mb-3">
                  <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                    {plan.name}
                  </h4>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary line-clamp-2">
                    {plan.description}
                  </p>
                </div>
                <ProgressBar progress={plan.progress} showLabel size="sm" />
                {plan.is_challenge && (
                  <Badge variant="warning" size="sm" className="mt-2">
                    Challenge
                  </Badge>
                )}
              </Card>
            ))
          )}
        </div>
      </Card>

      <RecentStudySessions />
    </div>
  );
}
