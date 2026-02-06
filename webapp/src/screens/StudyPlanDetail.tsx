import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Edit2, Trash2, Plus, Target, Calendar, Clock, Users, BookOpen, TrendingUp, Save, X, Play, Activity } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import Input from '../components/ui/Input';
import { studyPlanService, activityService } from '../services';
import ProgressDonut from '../components/charts/ProgressDonut';
import CourseProgressBars from '../components/charts/CourseProgressBars';

interface Course {
  id: string;
  subject: string;
  hours_allocated: number;
  hours_completed: number;
}

interface StudyPlan {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  daily_goal_hours?: number;
  progress: number;
  is_challenge?: boolean;
  is_public?: boolean;
  created_at?: string;
}

interface ActivityLog {
  id: string;
  activity_type: string;
  subject: string;
  duration_minutes: number;
  notes?: string;
  focus_score?: number;
  created_at: string;
  study_plan_id?: string;
}

export default function StudyPlanDetail() {
  const { setCurrentScreen, selectedStudyPlan, setSelectedStudyPlan } = useApp();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<Partial<StudyPlan>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedStudyPlan) {
      loadPlanDetails();
    }
  }, [selectedStudyPlan]);

  const loadPlanDetails = async () => {
    try {
      const plans = await studyPlanService.getMyStudyPlans();
      const foundPlan = Array.isArray(plans) 
        ? plans.find((p: any) => p.id === selectedStudyPlan) 
        : null;
      
      if (foundPlan) {
        setPlan(foundPlan);
        setEditedPlan(foundPlan);
      }
      
      // Load activities for this study plan
      const allActivities: any = await activityService.getMyActivity();
      const planActivities = Array.isArray(allActivities)
        ? allActivities.filter((a: any) => {
            // Filter by study_plan_id if available
            if (a.study_plan_id) {
              return a.study_plan_id === selectedStudyPlan;
            }
            // If no study_plan_id, don't include (only show activities explicitly linked to this plan)
            return false;
          })
        : [];
      setActivities(planActivities);

      // Calculate courses from activities
      const subjectMap = new Map<string, { minutes: number }>();
      planActivities.forEach((activity: ActivityLog) => {
        if (activity.subject) {
          const existing = subjectMap.get(activity.subject) || { minutes: 0 };
          existing.minutes += activity.duration_minutes || 0;
          subjectMap.set(activity.subject, existing);
        }
      });

      // Convert to courses format
      const coursesData: Course[] = Array.from(subjectMap.entries()).map(([subject, data], index) => {
        const hoursCompleted = data.minutes / 60;
        // Estimate allocated hours (completed + 30% buffer, rounded up)
        const hoursAllocated = Math.ceil(hoursCompleted * 1.3);
        return {
          id: `course-${index}`,
          subject,
          hours_allocated: hoursAllocated,
          hours_completed: Math.round(hoursCompleted * 10) / 10, // Round to 1 decimal
        };
      });
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to load plan details:', error);
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

  // Calculate total study time from activities
  const totalStudyMinutes = useMemo(() => {
    return activities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
  }, [activities]);

  const totalHoursAllocated = courses.reduce((sum, c) => sum + c.hours_allocated, 0);
  const totalHoursCompleted = useMemo(() => {
    // Use actual activity data instead of course data
    return totalStudyMinutes / 60;
  }, [totalStudyMinutes]);
  const overallProgress = totalHoursAllocated > 0 ? (totalHoursCompleted / totalHoursAllocated) * 100 : 0;

  const handleSave = async () => {
    if (!plan) return;
    
    try {
      // Update plan (you'd need an UpdateStudyPlan endpoint)
      // For now, just close edit mode
      setPlan({ ...plan, ...editedPlan });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  };

  const handleUpdateProgress = async (newProgress: number) => {
    if (!plan || !plan.id) {
      console.error('Plan or plan ID is missing');
      return;
    }
    try {
      // Validate and clamp progress value
      if (isNaN(newProgress) || !isFinite(newProgress)) {
        console.error('Invalid progress value:', newProgress);
        return;
      }
      const p = Math.max(0, Math.min(100, newProgress));
      console.log('Updating progress:', { planID: plan.id, progress: p }); // Debug log
      await studyPlanService.updateStudyPlanProgress(plan.id, p);
      setPlan(prev => prev ? { ...prev, progress: p } : prev);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleStartStudy = async () => {
    if (!plan) return;
    
    try {
      // Get subject from plan description or use plan name
      const subject = plan.description || plan.name || 'Study Session';
      const session: any = await activityService.startStudySession(plan.id, subject);
      if (session) {
        // Notify success
        alert('Study session started! Check the footer to track your time.');
        // Trigger a custom event to notify footer to reload
        window.dispatchEvent(new CustomEvent('study-session-started'));
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      
      // If session already active, inform user
      if (errorMsg.includes('already has an active study session')) {
        alert('You already have an active study session. Please stop it first from the footer.');
      } else {
        alert('Failed to start study session: ' + errorMsg);
      }
      console.error('Start study session error:', error);
    }
  };

  const handleCancel = () => {
    setEditedPlan(plan || {});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-light-text-secondary dark:text-dark-text-secondary">Loading plan details...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">Plan not found</p>
          <Button onClick={() => {
            setSelectedStudyPlan(null);
            setCurrentScreen('study-plan');
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedStudyPlan(null);
              setCurrentScreen('study-plan');
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            {isEditing ? (
              <Input
                value={editedPlan.name || ''}
                onChange={(e) => setEditedPlan({ ...editedPlan, name: e.target.value })}
                className="text-2xl font-bold"
              />
            ) : (
              <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {plan.name}
              </h1>
            )}
            <div className="flex items-center gap-2 mt-2">
              {plan.is_challenge && (
                <Badge variant="warning">
                  <Users className="w-3 h-3 mr-1" />
                  Challenge
                </Badge>
              )}
              {plan.is_public && <Badge variant="accent">Public</Badge>}
              <Badge variant="neutral">{daysRemaining(plan.end_date)} days remaining</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <Button variant="primary" onClick={handleStartStudy}>
              <Play className="w-5 h-5 mr-2" />
              Start Study
            </Button>
          )}
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                <X className="w-5 h-5 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-5 h-5 mr-2" />
                Edit Plan
              </Button>
              <Button variant="error">
                <Trash2 className="w-5 h-5 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-light-primary/10 dark:bg-dark-primary/10 rounded-lg">
              <Target className="w-5 h-5 text-light-primary dark:text-dark-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {Math.round(overallProgress)}%
          </p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Overall Progress</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-light-success/10 dark:bg-dark-success/10 rounded-lg">
              <Clock className="w-5 h-5 text-light-success dark:text-dark-success" />
            </div>
          </div>
          <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {Math.round(totalHoursCompleted * 10) / 10}h {totalHoursAllocated > 0 ? `/ ${totalHoursAllocated}h` : ''}
          </p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Study Hours</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-light-accent/10 dark:bg-dark-accent/10 rounded-lg">
              <Calendar className="w-5 h-5 text-light-accent dark:text-dark-accent" />
            </div>
          </div>
          <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {plan.daily_goal_hours}h
          </p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Daily Goal</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-light-warning/10 dark:bg-dark-warning/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-light-warning dark:text-dark-warning" />
            </div>
          </div>
          <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {courses.length}
          </p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Courses</p>
        </Card>
      </div>

      {/* Description */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
          Description
        </h3>
        {isEditing ? (
          <textarea
            value={editedPlan.description || ''}
            onChange={(e) => setEditedPlan({ ...editedPlan, description: e.target.value })}
            className="w-full p-3 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary border border-light-border dark:border-dark-border"
            rows={3}
          />
        ) : (
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            {plan.description || 'No description provided'}
          </p>
        )}
      </Card>

      {/* Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
          Timeline
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Start Date</p>
            <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
              {formatDate(plan.start_date)}
            </p>
          </div>
          <div className="flex-1 mx-8">
            <ProgressBar progress={overallProgress} showLabel />
          </div>
          <div className="text-right">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">End Date</p>
            <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
              {formatDate(plan.end_date)}
            </p>
          </div>
        </div>
      </Card>

      {/* Courses */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
            Courses
          </h3>
          <Button variant="ghost" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>

        <div className="space-y-4">
          {courses.map((course) => {
            const courseProgress = course.hours_allocated > 0 
              ? (course.hours_completed / course.hours_allocated) * 100 
              : 0;
            
            return (
              <div key={course.id} className="p-4 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-light-primary/10 dark:bg-dark-primary/10 rounded-lg">
                      <BookOpen className="w-5 h-5 text-light-primary dark:text-dark-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                        {course.subject}
                      </h4>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        {course.hours_completed}h / {course.hours_allocated}h completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <ProgressBar progress={courseProgress} showLabel variant="primary" />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Visual Analytics */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
            Visual Analytics
          </h3>
          <Badge variant="neutral" size="sm">
            <TrendingUp className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Plan Progress</div>
            </div>
            <ProgressDonut value={overallProgress} label="Based on course hours" />
            <div className="mt-4">
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Manual Progress (%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={plan.progress ?? 0}
                onChange={(e) => handleUpdateProgress(Number(e.target.value))}
                className="w-full"
              />
              <div className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {Math.round(plan.progress ?? 0)}%
              </div>
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">
              Course completion (hours)
            </div>
            <div className="p-4 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary">
              <CourseProgressBars courses={courses} />
            </div>
          </div>
        </div>
      </Card>

      {/* Activity List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
            Activity History
          </h3>
          <Badge variant="neutral" size="sm">
            {activities.length} session{activities.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              No study sessions recorded yet
            </p>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
              Start a study session to track your progress
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const date = activity.created_at ? new Date(activity.created_at) : new Date();
              const hours = Math.floor((activity.duration_minutes || 0) / 60);
              const minutes = (activity.duration_minutes || 0) % 60;
              
              return (
                <div
                  key={activity.id}
                  className="p-4 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border dark:border-dark-border hover:border-primary/30 dark:hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg mt-0.5">
                        <Activity className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                            {activity.subject || 'Study Session'}
                          </h4>
                          <Badge variant="primary" size="sm">
                            {hours > 0 ? `${hours}h ` : ''}{minutes}m
                          </Badge>
                          {activity.focus_score !== undefined && activity.focus_score > 0 && (
                            <Badge variant="neutral" size="sm">
                              Focus: {activity.focus_score}%
                            </Badge>
                          )}
                        </div>
                        {activity.notes && (
                          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                            {activity.notes}
                          </p>
                        )}
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                          {date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
