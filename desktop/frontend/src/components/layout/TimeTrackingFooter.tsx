import { useState, useEffect } from 'react';
import { Play, Square, Coffee, Clock, BookOpen } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { 
  StartStudySession, 
  GetActiveStudySession, 
  PauseStudySession, 
  ResumeStudySession, 
  StopStudySession,
  GetMyStudyPlans,
  UpdateMilestoneProgress,
  GetMilestones
} from '../../../wailsjs/go/main/App';
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

interface ActivityLogResponse {
  id: string;
  [key: string]: any;
}

interface StudyPlan {
  id: string;
  name: string;
}

export default function TimeTrackingFooter() {
  const { userRole } = useApp();
  const { user } = useAuth();
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

  // Poll for active session only on mount, limited runs
  // Catches sessions started elsewhere (e.g. Study Plan Details). No poll after stop.
  useEffect(() => {
    let count = 0;
    const maxPolls = 5;
    const interval = setInterval(() => {
      count++;
      loadActiveSession();
      if (count >= maxPolls) clearInterval(interval);
    }, 4000);

    return () => clearInterval(interval);
  }, []); // mount only – do not restart when activeSession becomes null after stop

  // Update display time every second
  useEffect(() => {
    if (!activeSession) {
      setDisplayTime('00:00:00');
      return;
    }

    updateDisplayTime(); // Initial update
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
      const plans: any = await GetMyStudyPlans();
      setStudyPlans(Array.isArray(plans) ? plans : []);
    } catch (error) {
      console.error('Failed to load study plans:', error);
    }
  };

  const loadActiveSession = async () => {
    try {
      const session: any = await GetActiveStudySession();
      if (session) {
        setActiveSession(session);
      } else {
        setActiveSession(null);
      }
    } catch (error: any) {
      // No active session (404) or other error - this is fine, just set to null
      // Don't log 404 errors as they're expected when there's no active session
      if (error?.message && !error.message.includes('404') && !error.message.includes('Not Found')) {
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

    // Don't count time if on break
    if (isOnBreak) {
      const totalSeconds = activeSession.total_study_seconds;
      formatTime(totalSeconds);
      return;
    }

    // Calculate current time including elapsed since last update
    const now = new Date().getTime();
    const lastActive = new Date(activeSession.last_active_time).getTime();
    const elapsedSeconds = Math.floor((now - lastActive) / 1000);
    const totalSeconds = activeSession.total_study_seconds + elapsedSeconds;
    
    formatTime(totalSeconds);
  };

  const handleStart = async () => {
    // If study plan is selected but no subject, use plan name
    let finalSubject = subject.trim();
    if (!finalSubject && selectedPlanId) {
      const selectedPlan = studyPlans.find(p => p.id === selectedPlanId);
      if (selectedPlan) {
        finalSubject = selectedPlan.name;
      }
    }
    
    // Subject is required
    if (!finalSubject) {
      alert('Please enter a subject or select a study plan');
      return;
    }

    setLoading(true);
    try {
      const session: any = await StartStudySession(selectedPlanId || '', finalSubject);
      setActiveSession(session);
      setSubject('');
      setSelectedPlanId(''); // Reset selection
    } catch (error: any) {
      alert('Failed to start study session: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBreak = async () => {
    setLoading(true);
    try {
      await PauseStudySession();
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
      await ResumeStudySession();
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

  const handleStopConfirm = async (notes: string, focusScore: number, milestoneId?: string, currentMilestoneProgress?: number, productivityScore?: number, totalStudySeconds?: number) => {
    console.log('handleStopConfirm called with:', { 
      notes, 
      focusScore, 
      milestoneId, 
      currentMilestoneProgress, 
      productivityScore, 
      totalStudySeconds,
      'activeSession.total_study_seconds': activeSession?.total_study_seconds,
      activeSession 
    });
    setLoading(true);
    try {
      await StopStudySession(notes, focusScore);
      console.log('StopStudySession completed');
      
      // Use passed totalStudySeconds (from modal) instead of activeSession
      const studySeconds = totalStudySeconds || activeSession?.total_study_seconds || 0;
      
      // If milestone is selected, update its progress based on study time
      if (milestoneId && studySeconds > 0) {
        console.log('Milestone selected, updating progress...', { milestoneId, currentMilestoneProgress, totalStudySeconds: studySeconds });
        
        // If currentMilestoneProgress is not provided, we need to fetch it
        let progressToUse = currentMilestoneProgress;
        if (progressToUse === undefined && activeSession?.study_plan_id) {
          try {
            console.log('Fetching milestone progress...');
            const milestonesData: any = await GetMilestones(activeSession.study_plan_id);
            const milestoneList = Array.isArray(milestonesData) ? milestonesData : [];
            const selectedMilestone = milestoneList.find((m: any) => m.id === milestoneId);
            if (selectedMilestone) {
              progressToUse = selectedMilestone.progress || 0;
              console.log('Fetched milestone progress:', progressToUse);
            }
          } catch (fetchError) {
            console.error('Failed to fetch milestone:', fetchError);
          }
        }
        
        if (progressToUse !== undefined && !isNaN(progressToUse) && isFinite(progressToUse)) {
          try {
            // Calculate progress increase based on study time
            // 1 hour = 10% progress increase (max 20% per session)
            const studyHours = studySeconds / 3600;
            const progressIncrease = Math.min(studyHours * 10, 20); // Max 20% per session
            
            // Calculate new progress (current + increase, capped at 100)
            let newProgress = progressToUse + progressIncrease;
            newProgress = Math.max(0, Math.min(newProgress, 100)); // Clamp between 0 and 100
            
            // Validate newProgress is a valid number
            if (isNaN(newProgress) || !isFinite(newProgress)) {
              console.error('Invalid progress value calculated:', newProgress);
              throw new Error('Invalid progress value');
            }
            
            console.log(`Updating milestone progress: ${progressToUse.toFixed(1)}% → ${newProgress.toFixed(1)}% (+${progressIncrease.toFixed(1)}%)`);
            console.log('Calling UpdateMilestoneProgress with:', { milestoneId, newProgress });
            
            // Update milestone progress
            const updateResult = await UpdateMilestoneProgress(milestoneId, newProgress);
            console.log('UpdateMilestoneProgress result:', updateResult);
            
            console.log('Milestone progress updated successfully');
            
            // Trigger event to refresh milestones page
            window.dispatchEvent(new CustomEvent('milestone-updated', { detail: { milestoneId, newProgress } }));
          } catch (milestoneError: any) {
            console.error('Failed to update milestone progress:', milestoneError);
            // Don't fail the entire operation if milestone update fails
            // Just show a warning
            alert('Study session ended, but failed to update milestone progress: ' + (milestoneError.message || 'Unknown error'));
          }
        } else {
          console.warn('Could not determine milestone progress, skipping update. progressToUse:', progressToUse);
        }
      } else {
        console.log('No milestone selected or no study time recorded. milestoneId:', milestoneId, 'studySeconds:', studySeconds);
      }
      
      // Clear active session and stop any polling
      setActiveSession(null);
      setShowStopModal(false);
      // Force reload to stop any ongoing polling
      // The polling will stop automatically when activeSession becomes null
    } catch (error: any) {
      console.error('Failed to stop study session:', error);
      alert('Failed to stop study session: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Determine status indicator color and animation
  const getStatusIndicator = () => {
    if (!activeSession) {
      return {
        color: 'bg-error',
        animate: false,
      };
    }
    if (isOnBreak) {
      return {
        color: 'bg-warning',
        animate: false,
      };
    }
    // Active session - green and pulsing
    return {
      color: 'bg-success',
      animate: true,
    };
  };

  const statusIndicator = getStatusIndicator();

  return (
    <>
      <div className="h-16 bg-light-card dark:bg-dark-card border-t border-light-border dark:border-dark-border shadow-soft">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left: Study Plan Selection & Subject (when not active) */}
          {!activeSession ? (
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                className="px-3 py-1.5 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 flex-1 max-w-xs"
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
                {/* Status Indicator Dot */}
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

          {/* Right: Action Buttons */}
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
          activityLogID={undefined} // Will be set after StopStudySession returns
        />
      )}
    </>
  );
}
