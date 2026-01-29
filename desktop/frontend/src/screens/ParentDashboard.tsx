import { useState, useEffect } from 'react';
import { TrendingUp, Clock, BookOpen, Trophy, Target, Calendar, AlertCircle, UserPlus, Loader } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import AddChildModal from '../components/modals/AddChildModal';

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [childStats, setChildStats] = useState<{ [childId: string]: any }>({});
  const [childActivity, setChildActivity] = useState<{ [childId: string]: any[] }>({});
  const [childGoals, setChildGoals] = useState<{ [childId: string]: any[] }>({});

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadChildData(selectedChild.id);
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const { GetChildren } = await import('../wailsjs/go/main/App');
      const childrenData = await GetChildren().catch(() => []);
      const childrenArray = Array.isArray(childrenData) ? childrenData : [];
      setChildren(childrenArray);
      
      // Select first child by default
      if (childrenArray.length > 0 && !selectedChild) {
        setSelectedChild(childrenArray[0]);
      }
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildData = async (childId: string) => {
    try {
      // @ts-ignore
      const { GetUserStats } = await import('../wailsjs/go/main/App');
      
      // Get child stats
      const stats = await GetUserStats(childId).catch(() => null);
      setChildStats(prev => ({ ...prev, [childId]: stats }));
      
      // Activity and goals would require child-specific endpoints
      // For now, we'll use empty arrays
      setChildActivity(prev => ({ ...prev, [childId]: [] }));
      setChildGoals(prev => ({ ...prev, [childId]: [] }));
    } catch (error) {
      console.error('Failed to load child data:', error);
    }
  };

  const handleAddChild = async (data: {
    email: string;
    password: string;
    name: string;
    age: number;
  }) => {
    try {
      // @ts-ignore
      const { CreateChild } = await import('../wailsjs/go/main/App');
      await CreateChild(data.email, data.password, data.name, data.age);
      alert('Student added successfully!');
      await loadChildren();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add student');
    }
  };

  const currentStats = selectedChild ? childStats[selectedChild.id] : null;
  const currentActivity = selectedChild ? (childActivity[selectedChild.id] || []) : [];
  const currentGoals = selectedChild ? (childGoals[selectedChild.id] || []) : [];

  // Calculate weekly activity from activity data
  const weeklyActivity = calculateWeeklyActivity(currentActivity);
  const maxHours = Math.max(...weeklyActivity.map(d => d.hours), 1);

  // Calculate stats
  const totalXP = currentStats?.total_xp || 0;
  const totalHours = currentStats?.total_study_hours || 0;
  const completedGoals = currentGoals.filter((g: any) => g.completed).length;
  const goalProgress = currentGoals.length > 0 ? (completedGoals / currentGoals.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-light-text-secondary dark:text-dark-text-secondary flex items-center gap-2">
          <Loader className="w-5 h-5 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Parent Dashboard
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Monitor your child's learning progress and achievements
          </p>
        </div>
        <Button onClick={() => setShowAddChildModal(true)}>
          <UserPlus className="w-5 h-5 mr-2" />
          Add Student
        </Button>
      </div>

      {children.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
            No students added yet. Click "Add Student" to get started!
          </p>
          <Button onClick={() => setShowAddChildModal(true)}>
            <UserPlus className="w-5 h-5 mr-2" />
            Add Your First Student
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex gap-4 flex-wrap">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`flex items-center gap-3 px-4 py-3 rounded-button transition-colors ${
                  selectedChild?.id === child.id
                    ? 'bg-primary text-white'
                    : 'bg-light-card dark:bg-dark-card text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg dark:hover:bg-dark-bg'
                }`}
              >
                <Avatar name={child.name} size="sm" />
                <span className="font-medium">{child.name}</span>
              </button>
            ))}
          </div>

          {selectedChild && (
            <>
              <div className="grid grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="p-2 bg-primary/10 rounded-button mb-2 w-fit">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    {totalHours.toFixed(1)} hrs
                  </p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Total Study Time</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-xs text-success font-medium">Active</span>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="p-2 bg-success/10 rounded-button mb-2 w-fit">
                    <Trophy className="w-5 h-5 text-success" />
                  </div>
                  <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    {totalXP.toLocaleString()}
                  </p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Total Points</p>
                  {currentStats?.level && (
                    <div className="mt-2">
                      <Badge variant="success" size="sm">Level {currentStats.level}</Badge>
                    </div>
                  )}
                </Card>

                <Card className="p-6">
                  <div className="p-2 bg-accent/10 rounded-button mb-2 w-fit">
                    <Target className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    {Math.round(goalProgress)}%
                  </p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Goals Progress</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-xs text-success font-medium">
                      {completedGoals}/{currentGoals.length} completed
                    </span>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="p-2 bg-warning/10 rounded-button mb-2 w-fit">
                    <BookOpen className="w-5 h-5 text-warning" />
                  </div>
                  <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    {completedGoals} / {currentGoals.length}
                  </p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Goals Met</p>
                  <ProgressBar progress={goalProgress} variant="warning" size="sm" className="mt-2" />
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-6">
                      Weekly Study Activity
                    </h3>
                    {weeklyActivity.length > 0 ? (
                      <div className="flex items-end justify-between gap-3 h-48">
                        {weeklyActivity.map((day) => (
                          <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex items-end justify-center flex-1">
                              <div
                                className="w-full bg-primary rounded-t-button transition-all hover:bg-primary/80"
                                style={{ height: `${(day.hours / maxHours) * 100}%` }}
                              />
                            </div>
                            <p className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">
                              {day.day}
                            </p>
                            <p className="text-xs font-bold text-light-text-primary dark:text-dark-text-primary">
                              {day.hours.toFixed(1)}h
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
                        No activity data available
                      </div>
                    )}
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-success/10 rounded-button">
                        <Calendar className="w-5 h-5 text-success" />
                      </div>
                      <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                        Recent Activity
                      </h3>
                    </div>

                    {currentActivity.length === 0 ? (
                      <div className="text-center py-4 text-light-text-secondary dark:text-dark-text-secondary text-sm">
                        No recent activity
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentActivity.slice(0, 5).map((activity: any, idx: number) => (
                          <div key={idx} className="pb-3 border-b border-light-text-secondary/10 dark:border-dark-border last:border-0">
                            <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                              {activity.type || 'Activity'}
                            </p>
                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                              {activity.description || 'No description'}
                            </p>
                            {activity.created_at && (
                              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                {new Date(activity.created_at).toLocaleDateString('tr-TR')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-warning/10 rounded-button">
                        <Target className="w-5 h-5 text-warning" />
                      </div>
                      <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                        Current Goals
                      </h3>
                    </div>

                    {currentGoals.length === 0 ? (
                      <div className="text-center py-4 text-light-text-secondary dark:text-dark-text-secondary text-sm">
                        No goals set
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentGoals.map((goal: any) => (
                          <div key={goal.id} className="p-3 rounded-button bg-light-bg dark:bg-dark-bg">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  goal.completed
                                    ? 'bg-success border-success'
                                    : 'border-light-text-secondary dark:border-dark-text-secondary'
                                }`}
                              >
                                {goal.completed && (
                                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                    <path
                                      d="M10 3L4.5 8.5L2 6"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </div>
                              <p className={`text-sm font-medium ${goal.completed ? 'text-light-text-secondary dark:text-dark-text-secondary line-through' : 'text-light-text-primary dark:text-dark-text-primary'}`}>
                                {goal.title || goal.description || 'Goal'}
                              </p>
                            </div>
                            {goal.target_value && goal.current_value !== undefined && (
                              <ProgressBar
                                progress={goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0}
                                size="sm"
                                variant={goal.completed ? 'success' : 'primary'}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {showAddChildModal && (
        <AddChildModal
          isOpen={showAddChildModal}
          onClose={() => setShowAddChildModal(false)}
          onSubmit={handleAddChild}
        />
      )}
    </div>
  );
}

// Helper function to calculate weekly activity from activity data
function calculateWeeklyActivity(activities: any[]): { day: string; hours: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekData: { [key: string]: number } = {};
  
  days.forEach(day => {
    weekData[day] = 0;
  });

  // Group activities by day of week
  activities.forEach((activity: any) => {
    if (activity.created_at) {
      const date = new Date(activity.created_at);
      const dayIndex = date.getDay();
      const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]; // Convert Sunday=0 to Monday=0
      
      // Add study hours if available
      if (activity.duration_minutes) {
        weekData[dayName] += activity.duration_minutes / 60;
      } else if (activity.hours) {
        weekData[dayName] += activity.hours;
      }
    }
  });

  return days.map(day => ({
    day,
    hours: weekData[day] || 0,
  }));
}
