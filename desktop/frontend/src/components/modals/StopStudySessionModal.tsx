import { useState, useEffect } from 'react';
import { Clock, Target, X, Brain, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { GetMilestones, GenerateAssessmentQuestions, CompleteAssessment } from '../../../wailsjs/go/main/App';

interface Milestone {
  id: string;
  title: string;
  description: string;
  progress: number;
  completed: boolean;
}

interface AIQuestion {
  question: string;
  question_type: string;
  options?: string[];
  correct_answer: string;
}

interface StopStudySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string, focusScore: number, milestoneId?: string, milestoneProgress?: number, productivityScore?: number, totalStudySeconds?: number) => void;
  totalStudySeconds: number;
  breakCount: number;
  totalBreakSeconds: number;
  studyPlanID?: string;
  subject: string;
  activityLogID?: string;
}

export default function StopStudySessionModal({
  isOpen,
  onClose,
  onConfirm,
  totalStudySeconds,
  breakCount,
  totalBreakSeconds,
  studyPlanID,
  subject,
  activityLogID,
}: StopStudySessionModalProps) {
  // Wizard step: 1 = User Input, 2 = AI Questions, 3 = Results
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const [notes, setNotes] = useState('');
  const [focusScore, setFocusScore] = useState(50);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  
  // AI Assessment state
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<string[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load milestones when modal opens and studyPlanID is available
  useEffect(() => {
    console.log('StopStudySessionModal useEffect - Props:', { 
      isOpen, 
      studyPlanID, 
      totalStudySeconds, 
      breakCount, 
      totalBreakSeconds,
      subject 
    });
    if (isOpen && studyPlanID) {
      loadMilestones();
    } else {
      setMilestones([]);
      setSelectedMilestoneId('');
    }
  }, [isOpen, studyPlanID, totalStudySeconds, breakCount, totalBreakSeconds, subject]);

  const loadMilestones = async () => {
    if (!studyPlanID) {
      console.log('No studyPlanID provided, skipping milestone load');
      return;
    }
    
    console.log('Loading milestones for studyPlanID:', studyPlanID);
    setLoadingMilestones(true);
    try {
      // GetMilestones expects a string or null, not undefined
      const data: any = await GetMilestones(studyPlanID);
      console.log('Milestones loaded:', data);
      const milestoneList = Array.isArray(data) ? data : [];
      // Filter out completed milestones
      const activeMilestones = milestoneList.filter((m: Milestone) => !m.completed);
      console.log('Active milestones:', activeMilestones);
      setMilestones(activeMilestones);
    } catch (error) {
      console.error('Failed to load milestones:', error);
      setMilestones([]);
    } finally {
      setLoadingMilestones(false);
    }
  };

  const getSelectedMilestone = (): Milestone | null => {
    if (!selectedMilestoneId) return null;
    return milestones.find(m => m.id === selectedMilestoneId) || null;
  };

  const handleStep1Continue = async () => {
    if (!studyPlanID || !subject) {
      // No study plan or subject, skip AI and finish
      handleFinalSubmit();
      return;
    }
    
    // Calculate duration in minutes (minimum 1 minute)
    const durationMinutes = Math.max(1, Math.floor(totalStudySeconds / 60));
    
    // Generate AI questions before moving to step 2
    setLoadingQuestions(true);
    
    try {
      const response: any = await GenerateAssessmentQuestions(subject, notes || '', durationMinutes);
      
      if (response && response.questions && response.questions.length > 0) {
        setAiQuestions(response.questions);
        setStudentAnswers(new Array(response.questions.length).fill(''));
        setLoadingQuestions(false);
        setStep(2); // Move to step 2 only after questions are loaded
      } else {
        // No questions, skip to final
        console.log('No questions generated, skipping to final');
        setLoadingQuestions(false);
        handleFinalSubmit();
      }
    } catch (error) {
      console.error('Failed to generate AI questions:', error);
      setLoadingQuestions(false);
      // Skip AI on error and show alert
      alert('Failed to generate AI questions. Completing session without assessment.');
      handleFinalSubmit();
    }
  };

  const handleStep2Continue = async () => {
    setSubmitting(true);
    
    try {
      // For now, create a mock assessment result since we don't have activityLogID yet
      // In production, the parent should call StopStudySession first and pass activityLogID
      
      // Calculate a basic productivity score based on focus and answers
      const correctCount = studentAnswers.filter((ans, idx) => 
        ans.toLowerCase().trim() === aiQuestions[idx]?.correct_answer?.toLowerCase().trim()
      ).length;
      
      const aiScore = (correctCount / aiQuestions.length) * 100;
      const productivityScore = (aiScore * 0.6 + focusScore * 0.4); // 60% AI, 40% focus
      
      const mockResult = {
        productivity_score: Math.round(productivityScore),
        correct_answers: correctCount,
        total_questions: aiQuestions.length,
        ai_analysis: `You answered ${correctCount} out of ${aiQuestions.length} questions correctly (${Math.round(aiScore)}%). Combined with your focus score of ${focusScore}%, your overall productivity score is ${Math.round(productivityScore)}%.`
      };
      
      console.log('Mock assessment result:', mockResult);
      setAssessmentResult(mockResult);
      setStep(3);
    } catch (error) {
      console.error('Failed to complete assessment:', error);
      alert('Failed to complete assessment: ' + (error as any).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalSubmit = () => {
    const selectedMilestone = getSelectedMilestone();
    const productivityScore = assessmentResult?.productivity_score;
    
    console.log('Modal handleFinalSubmit - passing to parent:', {
      notes,
      focusScore,
      selectedMilestoneId,
      milestoneProgress: selectedMilestone?.progress,
      productivityScore,
      totalStudySeconds
    });
    
    // Pass all data to parent (TimeTrackingFooter) which will stop the session
    // Include totalStudySeconds for milestone progress calculation
    onConfirm(
      notes, 
      focusScore, 
      selectedMilestoneId || undefined,
      selectedMilestone ? selectedMilestone.progress : undefined,
      productivityScore,
      totalStudySeconds // Pass the study time
    );
    
    handleClose();
  };

  const handleAnswerChange = (index: number, answer: string) => {
    const newAnswers = [...studentAnswers];
    newAnswers[index] = answer;
    setStudentAnswers(newAnswers);
  };

  const handleClose = () => {
    setStep(1);
    setNotes('');
    setFocusScore(50);
    setSelectedMilestoneId('');
    setAiQuestions([]);
    setStudentAnswers([]);
    setAssessmentResult(null);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };


  if (!isOpen) return null;

  const getStepTitle = () => {
    if (step === 1) return 'End Study Session - Review';
    if (step === 2) return 'AI Assessment Questions';
    return 'Session Report';
  };

  const getFooter = () => {
    if (step === 1) {
      return (
        <div className="flex justify-between items-center">
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Step 1 of 3
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClose} disabled={loadingQuestions}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleStep1Continue} disabled={loadingQuestions}>
              {loadingQuestions ? 'Generating Questions...' : 'Continue'}
            </Button>
          </div>
        </div>
      );
    }
    
    if (step === 2) {
      const allAnswered = studentAnswers.every(a => a.trim() !== '');
      return (
        <div className="flex justify-between items-center">
          <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Step 2 of 3 - {studentAnswers.filter(a => a.trim() !== '').length}/{aiQuestions.length} answered
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button 
              variant="primary" 
              onClick={handleStep2Continue}
              disabled={!allAnswered || submitting}
            >
              {submitting ? 'Analyzing...' : 'Submit Answers'}
            </Button>
          </div>
        </div>
      );
    }
    
    // Step 3
    return (
      <div className="flex justify-between items-center">
        <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Step 3 of 3 - Session Complete
        </div>
        <Button variant="primary" onClick={handleFinalSubmit}>
          Finish
        </Button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getStepTitle()}
      size="lg"
      footer={getFooter()}
    >
      {/* Step 1: User Input */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Session Summary */}
          <div className="p-4 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border dark:border-dark-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                  Study Time
                </span>
              </div>
              <Badge variant="primary" size="sm">
                {formatTime(totalStudySeconds)}
              </Badge>
            </div>
            {breakCount > 0 && (
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {breakCount} break{breakCount !== 1 ? 's' : ''} taken • {formatTime(totalBreakSeconds)} break time
              </div>
            )}
          </div>

          {/* Focus Score */}
          <div>
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                How focused were you? {focusScore}%
              </div>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={focusScore}
              onChange={(e) => setFocusScore(parseInt(e.target.value))}
              className="w-full h-2 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${focusScore}%, var(--border) ${focusScore}%, var(--border) 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
              <span>Distracted</span>
              <span>Moderate</span>
              <span>Very Focused</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              Study Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What topics did you cover? Any challenges or insights?"
              rows={4}
              className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary resize-none"
            />
          </div>

          {/* Milestone Selection */}
          <div>
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Link to Milestone (Optional)
              </div>
            </label>
            {!studyPlanID ? (
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary p-3 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary">
                No study plan linked - milestone tracking unavailable
              </div>
            ) : loadingMilestones ? (
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Loading milestones...
              </div>
            ) : milestones.length > 0 ? (
              <select
                value={selectedMilestoneId}
                onChange={(e) => setSelectedMilestoneId(e.target.value)}
                className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
              >
                <option value="">No milestone (just track time)</option>
                {milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.title} - {milestone.progress}% complete
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary p-3 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary">
                No active milestones for this plan
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: AI Questions */}
      {step === 2 && (
        <div className="space-y-6">
          {loadingQuestions ? (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-light-text-primary dark:text-dark-text-primary font-medium">
                Generating assessment questions...
              </p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-2">
                AI is creating questions based on your study session
              </p>
            </div>
          ) : aiQuestions.length > 0 ? (
            <>
              <div className="p-4 rounded-lg bg-gradient-to-r from-light-primary/10 to-light-accent/10 dark:from-dark-primary/10 dark:to-dark-accent/10 border border-light-primary/20 dark:border-dark-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-light-primary dark:text-dark-primary" />
                  <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                    Knowledge Check
                  </h3>
                </div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Answer these questions to measure your study effectiveness. This helps track your progress!
                </p>
              </div>

              <div className="space-y-5">
                {aiQuestions.map((question, index) => (
                  <div key={index} className="p-5 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border dark:border-dark-border">
                    <p className="font-medium text-light-text-primary dark:text-dark-text-primary mb-4">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-light-primary/20 dark:bg-dark-primary/20 text-light-primary dark:text-dark-primary text-sm font-bold mr-2">
                        {index + 1}
                      </span>
                      {question.question}
                    </p>
                    {question.question_type === 'multiple_choice' && question.options ? (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <label
                            key={optIndex}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              studentAnswers[index] === option
                                ? 'bg-light-primary/20 dark:bg-dark-primary/20 border-2 border-light-primary dark:border-dark-primary'
                                : 'bg-light-bg dark:bg-dark-bg border-2 border-transparent hover:border-light-border dark:hover:border-dark-border'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value={option}
                              checked={studentAnswers[index] === option}
                              onChange={(e) => handleAnswerChange(index, e.target.value)}
                              className="w-5 h-5 text-light-primary dark:text-dark-primary"
                            />
                            <span className="text-sm text-light-text-primary dark:text-dark-text-primary flex-1">
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={studentAnswers[index] || ''}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                No AI questions available
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && assessmentResult && (
        <div className="space-y-6">
          {/* Productivity Score */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-light-primary/10 via-light-accent/10 to-light-success/10 dark:from-dark-primary/10 dark:via-dark-accent/10 dark:to-dark-success/10 border border-light-primary/20 dark:border-dark-primary/20 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-light-primary/20 dark:bg-dark-primary/20 flex items-center justify-center">
              <Brain className="w-10 h-10 text-light-primary dark:text-dark-primary" />
            </div>
            <h3 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
              Productivity Score
            </h3>
            <div className="text-5xl font-bold text-light-primary dark:text-dark-primary mb-2">
              {Math.round(assessmentResult.productivity_score)}%
            </div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Based on AI assessment, focus, and study efficiency
            </p>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border dark:border-dark-border">
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                Focus Score
              </div>
              <div className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {focusScore}%
              </div>
            </div>
            <div className="p-4 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border dark:border-dark-border">
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                AI Quiz Score
              </div>
              <div className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {assessmentResult.correct_answers}/{assessmentResult.total_questions}
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          {assessmentResult.ai_analysis && (
            <div className="p-5 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border dark:border-dark-border">
              <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-light-primary dark:text-dark-primary" />
                AI Insights
              </h4>
              <div className="space-y-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {assessmentResult.ai_analysis.split('\n').map((line: string, i: number) => (
                  line.trim() && (
                    <p key={i} className="leading-relaxed">
                      {line.trim()}
                    </p>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Question Review */}
          <div>
            <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              Answer Review
            </h4>
            <div className="space-y-3">
              {aiQuestions.map((question, index) => {
                const isCorrect = studentAnswers[index]?.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
                return (
                  <div key={index} className={`p-4 rounded-lg border-2 ${
                    isCorrect 
                      ? 'bg-light-success/10 dark:bg-dark-success/10 border-light-success dark:border-dark-success'
                      : 'bg-light-danger/10 dark:bg-dark-danger/10 border-light-danger dark:border-dark-danger'
                  }`}>
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-light-success dark:text-dark-success mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-light-danger dark:text-dark-danger mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                          {question.question}
                        </p>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-light-text-secondary dark:text-dark-text-secondary">Your answer: </span>
                            <span className={isCorrect ? 'text-light-success dark:text-dark-success font-medium' : 'text-light-danger dark:text-dark-danger font-medium'}>
                              {studentAnswers[index] || '(no answer)'}
                            </span>
                          </div>
                          {!isCorrect && (
                            <div>
                              <span className="text-light-text-secondary dark:text-dark-text-secondary">Correct: </span>
                              <span className="text-light-success dark:text-dark-success font-medium">
                                {question.correct_answer}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
