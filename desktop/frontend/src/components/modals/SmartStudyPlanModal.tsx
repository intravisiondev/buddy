import { useState } from 'react';
import { X, Sparkles, Calendar, Target, Clock, ChevronRight, ChevronLeft, Plus, Trash2, Edit2, Check, Loader2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';

interface ScheduleBlock {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  topic: string;
  block_type: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  target_date: string;
  progress: number;
}

interface GeneratedPlan {
  name: string;
  description: string;
  subject: string;
  schedule_blocks: ScheduleBlock[];
  milestones: Milestone[];
}

interface SmartStudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const subjects = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'History',
  'Geography',
  'Economics',
  'Other',
];

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SmartStudyPlanModal({ isOpen, onClose, onSuccess }: SmartStudyPlanModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Step 1: User input
  const [subject, setSubject] = useState('');
  const [goals, setGoals] = useState('');
  const [description, setDescription] = useState('');
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const future = new Date();
    future.setMonth(future.getMonth() + 1);
    return future.toISOString().split('T')[0];
  });

  // Step 2: Generated plan (editable)
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    if (!subject || !goals || !description) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // @ts-ignore
      const { GenerateSmartStudyPlan } = await import('../../../wailsjs/go/main/App');
      
      const result = await GenerateSmartStudyPlan({
        subject,
        goals,
        description,
        weekly_hours: weeklyHours,
        start_date: startDate,
        end_date: endDate,
      });

      // Parse the AI response and set generated plan
      if (result) {
        // Generate unique IDs for schedule blocks and milestones
        const planData: GeneratedPlan = {
          name: result.name || `${subject} Study Plan`,
          description: result.description || description,
          subject: subject,
          schedule_blocks: (result.schedule_blocks || []).map((block: any, idx: number) => ({
            ...block,
            id: `schedule-${idx}`,
          })),
          milestones: (result.milestones || []).map((milestone: any, idx: number) => ({
            ...milestone,
            id: `milestone-${idx}`,
            progress: 0,
          })),
        };
        setGeneratedPlan(planData);
        setStep(2);
      }
    } catch (error: any) {
      console.error('Failed to generate plan:', error);
      alert('Failed to generate plan: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!generatedPlan) return;

    setSaving(true);
    try {
      // @ts-ignore
      const { CreateSmartStudyPlan } = await import('../../../wailsjs/go/main/App');
      
      await CreateSmartStudyPlan({
        name: generatedPlan.name,
        description: generatedPlan.description,
        subject: generatedPlan.subject,
        start_date: startDate,
        end_date: endDate,
        schedule_blocks: generatedPlan.schedule_blocks,
        milestones: generatedPlan.milestones,
      });

      alert('Study plan created successfully!');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to create plan:', error);
      alert('Failed to create plan: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSubject('');
    setGoals('');
    setDescription('');
    setWeeklyHours(10);
    setGeneratedPlan(null);
    onClose();
  };

  // Schedule block editing
  const handleUpdateScheduleBlock = (id: string, updates: Partial<ScheduleBlock>) => {
    if (!generatedPlan) return;
    setGeneratedPlan({
      ...generatedPlan,
      schedule_blocks: generatedPlan.schedule_blocks.map(block =>
        block.id === id ? { ...block, ...updates } : block
      ),
    });
  };

  const handleDeleteScheduleBlock = (id: string) => {
    if (!generatedPlan) return;
    setGeneratedPlan({
      ...generatedPlan,
      schedule_blocks: generatedPlan.schedule_blocks.filter(block => block.id !== id),
    });
  };

  const handleAddScheduleBlock = () => {
    if (!generatedPlan) return;
    const newBlock: ScheduleBlock = {
      id: `schedule-${Date.now()}`,
      day_of_week: 1,
      start_time: '09:00',
      end_time: '10:00',
      subject: generatedPlan.subject,
      topic: 'New Study Block',
      block_type: 'study',
    };
    setGeneratedPlan({
      ...generatedPlan,
      schedule_blocks: [...generatedPlan.schedule_blocks, newBlock],
    });
    setEditingSchedule(newBlock.id);
  };

  // Milestone editing
  const handleUpdateMilestone = (id: string, updates: Partial<Milestone>) => {
    if (!generatedPlan) return;
    setGeneratedPlan({
      ...generatedPlan,
      milestones: generatedPlan.milestones.map(milestone =>
        milestone.id === id ? { ...milestone, ...updates } : milestone
      ),
    });
  };

  const handleDeleteMilestone = (id: string) => {
    if (!generatedPlan) return;
    setGeneratedPlan({
      ...generatedPlan,
      milestones: generatedPlan.milestones.filter(milestone => milestone.id !== id),
    });
  };

  const handleAddMilestone = () => {
    if (!generatedPlan) return;
    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      title: 'New Milestone',
      description: 'Describe this milestone',
      target_date: endDate,
      progress: 0,
    };
    setGeneratedPlan({
      ...generatedPlan,
      milestones: [...generatedPlan.milestones, newMilestone],
    });
    setEditingMilestone(newMilestone.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light-text-secondary/10 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-button">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                Smart Study Plan
              </h2>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {step === 1 ? 'Step 1: Describe your learning goals' : 'Step 2: Review and customize your plan'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-button">
            <X className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-light-bg dark:bg-dark-bg border-b border-light-text-secondary/10 dark:border-dark-border">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-light-text-secondary'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-primary text-white' : 'bg-light-text-secondary/20'}`}>
                1
              </div>
              <span className="font-medium">Describe Goals</span>
            </div>
            <div className="flex-1 h-1 bg-light-text-secondary/20 rounded">
              <div className={`h-full bg-primary rounded transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-light-text-secondary'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-primary text-white' : 'bg-light-text-secondary/20'}`}>
                2
              </div>
              <span className="font-medium">Review Plan</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-6">
              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                  Subject *
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select a subject</option>
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Goals */}
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                  What do you want to learn? *
                </label>
                <Input
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g., Calculus fundamentals, derivatives, and integrals"
                />
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  List the specific topics or concepts you want to master
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                  Describe your ideal study plan *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., I'm preparing for my university entrance exam. I need a structured plan that starts with basics and gradually increases difficulty. I prefer morning study sessions and want to include practice problems..."
                  rows={4}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* Time Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                    Weekly Hours Available
                  </label>
                  <Input
                    type="number"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(parseInt(e.target.value) || 0)}
                    min={1}
                    max={40}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* AI Info */}
              <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                      AI-Powered Plan Generation
                    </h4>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      Our AI will analyze your goals and create a personalized study plan with optimized schedule blocks and milestones. You can review and customize everything before creating the plan.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {generatedPlan && (
                <>
                  {/* Plan Overview */}
                  <Card className="p-4 bg-gradient-to-r from-success/10 to-primary/10 border-success/30">
                    <div className="flex items-center gap-3 mb-3">
                      <Check className="w-5 h-5 text-success" />
                      <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                        Plan Generated Successfully!
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
                          Plan Name
                        </label>
                        <Input
                          value={generatedPlan.name}
                          onChange={(e) => setGeneratedPlan({ ...generatedPlan, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
                          Subject
                        </label>
                        <Input value={generatedPlan.subject} disabled />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
                        Description
                      </label>
                      <textarea
                        value={generatedPlan.description}
                        onChange={(e) => setGeneratedPlan({ ...generatedPlan, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button text-sm text-light-text-primary dark:text-dark-text-primary resize-none"
                      />
                    </div>
                  </Card>

                  {/* Schedule Blocks */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                          Weekly Schedule ({generatedPlan.schedule_blocks.length} blocks)
                        </h3>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleAddScheduleBlock}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Block
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {generatedPlan.schedule_blocks.map((block) => (
                        <Card key={block.id} className="p-3">
                          {editingSchedule === block.id ? (
                            <div className="grid grid-cols-5 gap-2 items-center">
                              <select
                                value={block.day_of_week}
                                onChange={(e) => handleUpdateScheduleBlock(block.id, { day_of_week: parseInt(e.target.value) })}
                                className="px-2 py-1 text-sm bg-light-bg dark:bg-dark-bg border rounded"
                              >
                                {dayNames.map((day, idx) => (
                                  <option key={idx} value={idx}>{day}</option>
                                ))}
                              </select>
                              <Input
                                type="time"
                                value={block.start_time}
                                onChange={(e) => handleUpdateScheduleBlock(block.id, { start_time: e.target.value })}
                                className="text-sm"
                              />
                              <Input
                                type="time"
                                value={block.end_time}
                                onChange={(e) => handleUpdateScheduleBlock(block.id, { end_time: e.target.value })}
                                className="text-sm"
                              />
                              <Input
                                value={block.topic}
                                onChange={(e) => handleUpdateScheduleBlock(block.id, { topic: e.target.value })}
                                placeholder="Topic"
                                className="text-sm"
                              />
                              <Button variant="ghost" size="sm" onClick={() => setEditingSchedule(null)}>
                                <Check className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Badge variant="primary" size="sm">{dayNames[block.day_of_week]}</Badge>
                                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                  {block.start_time} - {block.end_time}
                                </span>
                                <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                                  {block.topic}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => setEditingSchedule(block.id)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteScheduleBlock(block.id)}>
                                  <Trash2 className="w-4 h-4 text-error" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Milestones */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-accent" />
                        <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                          Milestones ({generatedPlan.milestones.length})
                        </h3>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleAddMilestone}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Milestone
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {generatedPlan.milestones.map((milestone, index) => (
                        <Card key={milestone.id} className="p-3">
                          {editingMilestone === milestone.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={milestone.title}
                                  onChange={(e) => handleUpdateMilestone(milestone.id, { title: e.target.value })}
                                  placeholder="Title"
                                />
                                <Input
                                  type="date"
                                  value={milestone.target_date}
                                  onChange={(e) => handleUpdateMilestone(milestone.id, { target_date: e.target.value })}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  value={milestone.description}
                                  onChange={(e) => handleUpdateMilestone(milestone.id, { description: e.target.value })}
                                  placeholder="Description"
                                  className="flex-1"
                                />
                                <Button variant="ghost" size="sm" onClick={() => setEditingMilestone(null)}>
                                  <Check className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-accent/20 text-accent rounded-full flex items-center justify-center font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                                    {milestone.title}
                                  </p>
                                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                    {milestone.description} • Due: {new Date(milestone.target_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => setEditingMilestone(milestone.id)}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteMilestone(milestone.id)}>
                                  <Trash2 className="w-4 h-4 text-error" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-light-text-secondary/10 dark:border-dark-border bg-light-card dark:bg-dark-card">
          {step === 1 ? (
            <>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGeneratePlan} disabled={loading || !subject || !goals || !description}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Plan
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back to Edit
              </Button>
              <Button onClick={handleCreatePlan} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Create Study Plan
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
