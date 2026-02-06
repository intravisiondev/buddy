import { Target, BookOpen, Trophy, Clock, TrendingUp, Users, Flame, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useApiDashboard, useApiRooms } from '../hooks/useApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import CreateGoalModal from '../components/modals/CreateGoalModal';
import LogStudySessionModal from '../components/modals/LogStudySessionModal';
import RecentStudySessions from '../components/widgets/RecentStudySessions';
import { useEffect, useState } from 'react';

export default function StudentDashboard() {
  const { setCurrentScreen, setSelectedRoom, setShowAIPanel } = useApp();
  const { user } = useAuth();
  const { stats, goals, studyPlans, challenges, loading, toggleGoal, loadDashboardData } = useApiDashboard();
  const { rooms, loadRooms } = useApiRooms();
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [showLogStudyModal, setShowLogStudyModal] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  // Filter active rooms (mock logic, adjust based on actual room data)
  const activeRooms = rooms ? rooms.slice(0, 3) : [];

  const completedGoals = Array.isArray(goals) ? goals.filter(g => g.completed).length : 0;
  const goalProgress = Array.isArray(goals) && goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-light-text-secondary dark:text-dark-text-secondary">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            {stats ? `You're on a ${stats.study_streak}-day study streak! Keep it up!` : 'Let\'s start your learning journey!'}
          </p>
        </div>
        <Button onClick={() => setShowAIPanel(true)}>
          <Sparkles className="w-5 h-5" />
          Ask Buddy AI
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-primary/10 rounded-button">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            {stats && stats.study_streak > 0 && <Badge variant="success" size="sm">🔥</Badge>}
          </div>
          <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {stats?.study_streak || 0} Days
          </p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Study Streak</p>
        </Card>

        <Card className="p-6">
          <div className="p-2 bg-success/10 rounded-button mb-2 w-fit">
            <Trophy className="w-5 h-5 text-success" />
          </div>
          <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {stats?.total_xp?.toLocaleString() || 0} XP
          </p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Total Points</p>
        </Card>

        <Card className="p-6">
          <div className="p-2 bg-accent/10 rounded-button mb-2 w-fit">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {stats?.gems ?? 0} 💎
          </p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Gems</p>
        </Card>

        <Card className="p-6">
          <div className="p-2 bg-warning/10 rounded-button mb-2 w-fit">
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {stats?.today_hours?.toFixed(1) || 0} hrs
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Today</p>
            <Button variant="ghost" size="sm" onClick={() => setShowLogStudyModal(true)}>
              Log
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-button">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                    Today's Goals
                  </h3>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {completedGoals} of {goals.length} completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="primary">{Math.round(goalProgress)}%</Badge>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateGoalModal(true)}>
                  <Target className="w-4 h-4 mr-2" />
                  Add Goal
                </Button>
              </div>
            </div>

            <ProgressBar progress={goalProgress} className="mb-6" />

            <div className="space-y-3">
              {goals.length === 0 ? (
                <p className="text-center text-light-text-secondary dark:text-dark-text-secondary py-4">
                  No goals for today. Set some goals to get started!
                </p>
              ) : (
                goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`flex items-center gap-3 p-3 rounded-button border cursor-pointer transition-all hover:scale-[1.01] ${
                      goal.completed
                        ? 'bg-success/5 border-success/20'
                        : 'bg-light-bg dark:bg-dark-bg border-light-text-secondary/10 dark:border-dark-border'
                    }`}
                    onClick={() => toggleGoal(goal.id)}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        goal.completed
                          ? 'bg-success border-success'
                          : 'border-light-text-secondary dark:border-dark-text-secondary'
                      }`}
                    >
                      {goal.completed && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${goal.completed ? 'text-light-text-secondary dark:text-dark-text-secondary line-through' : 'text-light-text-primary dark:text-dark-text-primary'}`}>
                        {goal.title}
                      </p>
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{goal.subject}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-button">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                  Active Study Plans
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCurrentScreen('study-plan')}>
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {studyPlans.length === 0 ? (
                <p className="text-center text-light-text-secondary dark:text-dark-text-secondary py-4">
                  No study plans yet. Create one to organize your learning!
                </p>
              ) : (
                studyPlans.map((plan) => (
                  <div key={plan.id} className="p-4 rounded-button bg-light-bg dark:bg-dark-bg">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">{plan.name}</p>
                      <Badge variant="neutral" size="sm">{plan.due_date}</Badge>
                    </div>
                    <ProgressBar progress={plan.progress} variant="primary" showLabel />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-success/10 rounded-button">
                <Users className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Active Rooms
              </h3>
            </div>

            <div className="space-y-3">
              {activeRooms.length === 0 ? (
                <p className="text-center text-light-text-secondary dark:text-dark-text-secondary py-4 text-sm">
                  No active rooms yet.
                </p>
              ) : (
                activeRooms.map((room) => (
                  <Card
                    key={room.id}
                    hover
                    onClick={() => {
                      setSelectedRoom(room.id);
                      setCurrentScreen('room');
                    }}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-light-text-primary dark:text-dark-text-primary text-sm">
                        {room.name}
                      </p>
                      {room.is_live && (
                        <span className="w-2 h-2 bg-success rounded-full"></span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral" size="sm">{room.subject}</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <Button variant="secondary" size="sm" fullWidth className="mt-4" onClick={() => {
              setSelectedRoom(null);
              setCurrentScreen('room');
            }}>
              Browse All Rooms
            </Button>
          </Card>

          <RecentStudySessions />

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-warning/10 rounded-button">
                <Trophy className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Live Challenges
              </h3>
            </div>

            <div className="space-y-3">
              {challenges.length === 0 ? (
                <p className="text-center text-light-text-secondary dark:text-dark-text-secondary py-4 text-sm">
                  No active challenges.
                </p>
              ) : (
                challenges.map((challenge) => (
                  <div key={challenge.id} className="p-4 rounded-button bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20">
                    <p className="font-semibold text-light-text-primary dark:text-dark-text-primary text-sm mb-2">
                      {challenge.title}
                    </p>
                    <div className="flex items-center justify-between text-xs text-light-text-secondary dark:text-dark-text-secondary mb-2">
                      <span>{challenge.participants} playing</span>
                      <span>Ends in {challenge.ends_in}</span>
                    </div>
                    <Badge variant="warning" size="sm">{challenge.reward}</Badge>
                  </div>
                ))
              )}
            </div>

            <Button variant="secondary" size="sm" fullWidth className="mt-4" onClick={() => setCurrentScreen('leaderboard')}>
              View Leaderboard
            </Button>
          </Card>
        </div>
      </div>

      <CreateGoalModal
        isOpen={showCreateGoalModal}
        onClose={() => setShowCreateGoalModal(false)}
        onSuccess={loadDashboardData}
      />

      <LogStudySessionModal
        isOpen={showLogStudyModal}
        onClose={() => setShowLogStudyModal(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}
