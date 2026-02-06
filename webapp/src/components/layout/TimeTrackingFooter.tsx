import { useState, useEffect } from 'react';
import { Play, Square, Coffee, Clock, BookOpen } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { activityService, studyPlanService, goalService } from '../../services';
import StopStudySessionModal from '../modals/StopStudySessionModal';

interface ActiveStudySession {
  id: string;
  study_plan_id?: string;
  subject: string;
  start_time: string;
  last_active_time: string;
  is_idle: boolean;
  total_study_seconds: number;
  breaks: Array<{
    start_time: string;
    end_time?: string;
    duration_seconds: number;
  }>;
}

interface StudyPlan {
  id: string;
  name: string;
}

export default function TimeTrackingFooter() {
  const { userRole } = useApp();
  useAuth(); // Keep for authentication context
  const [activeSession, setActiveSession] = useState<ActiveStudySession | null>(null);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [displayTime, setDisplayTime] = useState('00:00:00');
  const [isOnBreak, setIsOnBreak] = useState(false);

  // Only show for students
  if (userRole !== 'student') {
    return null;
  }

  // Load study plans and active session on mount
  useEffect(() => {
    loadStudyPlans();
    loadActiveSession();
    
    // Listen for study session started from other components
    const handleSessionStarted = () => {
      loadActiveSession();
    };
    
    window.addEventListener('study-session-started', handleSessionStarted);
    
    return () => {
      window.removeEventListener('study-session-started', handleSessionStarted);
    };
  }, []);

  // Poll for active session every 10 seconds
  useEffect(() => {
    if (!activeSession) {
      const interval = setInterval(() => {
        loadActiveSession();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  // Update display time every second
  useEffect(() => {
    if (!activeSession) {
      setDisplayTime('00:00:00');
      return;
    }

    updateDisplayTime();
    const interval = setInterval(() => {
      updateDisplayTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, isOnBreak]);

  // Check if on break
  useEffect(() => {
    if (activeSession && activeSession.breaks.length > 0) {
      const lastBreak = activeSession.breaks[activeSession.breaks.length - 1];
      setIsOnBreak(lastBreak.end_time === undefined || lastBreak.end_time === null);
    } else {
      setIsOnBreak(false);
    }
  }, [activeSession]);

  const loadStudyPlans = async () => {
    try {
      const plans: any = await studyPlanService.getMyStudyPlans();
      setStudyPlans(Array.isArray(plans) ? plans : []);
    } catch (error) {
      console.error('Failed to load study plans:', error);
    }
  };

  const loadActiveSession = async () => {
    try {
      const session = await activityService.getActiveStudySession();
      if (session) {
        setActiveSession(session as ActiveStudySession);
      } else {
        setActiveSession(null);
      }
    } catch (error: any) {
      if (error?.status !== 404) {
        console.error('Failed to load active session:', error);
      }
      setActiveSession(null);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    setDisplayTime(
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    );
  };

  const updateDisplayTime = () => {
    if (!activeSession) {
      setDisplayTime('00:00:00');
      return;
    }

    if (isOnBreak) {
      const totalSeconds = activeSession.total_study_seconds;
      formatTime(totalSeconds);
      return;
    }

    const now = new Date().getTime();
    const lastActive = new Date(activeSession.last_active_time).getTime();
    const elapsedSeconds = Math.floor((now - lastActive) / 1000);
    const totalSeconds = activeSession.total_study_seconds + elapsedSeconds;
    
    formatTime(totalSeconds);
  };

  const handleStart = async () => {
    let finalSubject = subject.trim();
    if (!finalSubject && selectedPlanId) {
      const selectedPlan = studyPlans.find(p => p.id === selectedPlanId);
      if (selectedPlan) {
        finalSubject = selectedPlan.name;
      }
    }
    
    if (!finalSubject) {
      alert('Please enter a subject or select a study plan');
      return;
    }

    setLoading(true);
    try {
      const session: any = await activityService.startStudySession(selectedPlanId || '', finalSubject);
      setActiveSession(session);
      setSubject('');
      setSelectedPlanId('');
    } catch (error: any) {
      alert('Failed to start study session: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBreak = async () => {
    setLoading(true);
    try {
      await activityService.pauseStudySession();
      await loadActiveSession();
    } catch (error: any) {
      alert('Failed to start break: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      await activityService.resumeStudySession();
      await loadActiveSession();
    } catch (error: any) {
      alert('Failed to resume: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    setShowStopModal(true);
  };

  const handleStopConfirm = async (notes: string, focusScore: number, milestoneId?: string, currentMilestoneProgress?: number, _productivityScore?: number, totalStudySeconds?: number) => {
    setLoading(true);
    try {
      await activityService.stopStudySession(notes, focusScore);
      
      const studySeconds = totalStudySeconds || activeSession?.total_study_seconds || 0;
      
      if (milestoneId && studySeconds > 0) {
        try {
          const studyHours = studySeconds / 3600;
          const progressIncrease = Math.min(studyHours * 10, 20);
          let newProgress = (currentMilestoneProgress || 0) + progressIncrease;
          newProgress = Math.max(0, Math.min(newProgress, 100));
          
          await goalService.updateMilestoneProgress(milestoneId, newProgress);
          window.dispatchEvent(new CustomEvent('milestone-updated', { detail: { milestoneId, newProgress } }));
        } catch (milestoneError: any) {
          console.error('Failed to update milestone progress:', milestoneError);
        }
      }
      
      setActiveSession(null);
      setShowStopModal(false);
    } catch (error: any) {
      console.error('Failed to stop study session:', error);
      alert('Failed to stop study session: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndicator = () => {
    if (!activeSession) {
      return { color: 'bg-error', animate: false };
    }
    if (isOnBreak) {
      return { color: 'bg-warning', animate: false };
    }
    return { color: 'bg-success', animate: true };
  };

  const statusIndicator = getStatusIndicator();

  return (
    <>
      <div className="h-16 bg-light-card dark:bg-dark-card border-t border-light-text-secondary/10 dark:border-dark-border shadow-soft">
        <div className="h-full px-6 flex items-center justify-between">
          {!activeSession ? (
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select Study Plan (Optional)</option>
                  {studyPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder={selectedPlanId ? "Subject (optional - will use plan name)" : "Subject (e.g., Mathematics) *"}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                className="px-3 py-1.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 flex-1 max-w-xs"
              />
              <Button
                onClick={handleStart}
                disabled={loading || (!subject.trim() && !selectedPlanId)}
                variant="primary"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${statusIndicator.color} ${
                      statusIndicator.animate ? 'animate-pulse' : ''
                    }`}
                  />
                  {statusIndicator.animate && (
                    <div
                      className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${statusIndicator.color} animate-ping opacity-75`}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                  <span className="text-lg font-mono font-semibold text-light-text-primary dark:text-dark-text-primary">
                    {displayTime}
                  </span>
                </div>
              </div>
              {activeSession.subject && (
                <Badge variant="neutral" size="sm">
                  {activeSession.subject}
                </Badge>
              )}
            </div>
          )}

          {activeSession && (
            <div className="flex items-center gap-2">
              {!isOnBreak ? (
                <Button
                  onClick={handleBreak}
                  variant="secondary"
                  size="sm"
                  disabled={loading}
                >
                  <Coffee className="w-4 h-4 mr-2" />
                  Break
                </Button>
              ) : (
                <Button
                  onClick={handleResume}
                  variant="primary"
                  size="sm"
                  disabled={loading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button
                onClick={handleStop}
                variant="error"
                size="sm"
                disabled={loading}
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>
          )}
        </div>
      </div>

      {showStopModal && activeSession && (
        <StopStudySessionModal
          isOpen={showStopModal}
          onClose={() => setShowStopModal(false)}
          onConfirm={handleStopConfirm}
          totalStudySeconds={activeSession.total_study_seconds}
          breakCount={activeSession.breaks.length}
          totalBreakSeconds={activeSession.breaks.reduce((sum, b) => sum + (b.duration_seconds || 0), 0)}
          studyPlanID={activeSession.study_plan_id ? String(activeSession.study_plan_id) : undefined}
          subject={activeSession.subject}
          activityLogID={undefined}
        />
      )}
    </>
  );
}
