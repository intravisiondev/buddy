import { useState } from 'react';
import { Plus, Calendar, Flag, Globe, Clock, Target, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { CreateStudyPlan, CreateScheduleBlock, CreateMilestone } from '../../../wailsjs/go/main/App';

interface CreateStudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateStudyPlanModal({ isOpen, onClose, onSuccess }: CreateStudyPlanModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    daily_goal_hours: 2,
    is_challenge: false,
    is_public: false,
  });
  const [autoCreateSchedule, setAutoCreateSchedule] = useState(false);
  const [autoCreateMilestone, setAutoCreateMilestone] = useState(false);
  const [scheduleBlocks, setScheduleBlocks] = useState<Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    subject: string;
    topic: string;
    block_type: string;
  }>>([]);
  const [milestones, setMilestones] = useState<Array<{
    title: string;
    description: string;
    target_date: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Plan name is required');
      return;
    }
    if (!formData.start_date) {
      setError('Start date is required');
      return;
    }
    if (!formData.end_date) {
      setError('End date is required');
      return;
    }
    if (!formData.daily_goal_hours || formData.daily_goal_hours <= 0 || isNaN(formData.daily_goal_hours)) {
      setError('Daily goal hours must be greater than 0');
      return;
    }
    
    // Check if end date is after start date
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    if (endDate <= startDate) {
      setError('End date must be after start date');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Create study plan
      const planResult: any = await CreateStudyPlan({
        name: formData.name.trim(),
        description: formData.description.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        daily_goal_hours: formData.daily_goal_hours,
        is_challenge: formData.is_challenge,
        is_public: formData.is_public,
      });

      const planID = planResult?.id || planResult?._id || planResult?.ID;
      
      if (!planID) {
        throw new Error('Failed to get plan ID after creation');
      }

      // Create schedule blocks if enabled
      if (autoCreateSchedule && scheduleBlocks.length > 0) {
        for (const block of scheduleBlocks) {
          try {
            await CreateScheduleBlock(planID, block);
          } catch (err: any) {
            console.error('Failed to create schedule block:', err);
            // Continue with other blocks even if one fails
          }
        }
      }

      // Create milestones if enabled
      if (autoCreateMilestone && milestones.length > 0) {
        for (const milestone of milestones) {
          try {
            // Convert date to ISO format
            const targetDateISO = milestone.target_date 
              ? new Date(milestone.target_date + 'T00:00:00').toISOString()
              : new Date(formData.end_date + 'T00:00:00').toISOString();
            
            await CreateMilestone({
              title: milestone.title.trim(),
              description: milestone.description.trim(),
              target_date: targetDateISO,
              study_plan_id: planID,
              progress: 0,
            });
          } catch (err: any) {
            console.error('Failed to create milestone:', err);
            // Continue with other milestones even if one fails
          }
        }
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        daily_goal_hours: 2,
        is_challenge: false,
        is_public: false,
      });
      setAutoCreateSchedule(false);
      setAutoCreateMilestone(false);
      setScheduleBlocks([]);
      setMilestones([]);

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create study plan');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      daily_goal_hours: 2,
      is_challenge: false,
      is_public: false,
    });
    setAutoCreateSchedule(false);
    setAutoCreateMilestone(false);
    setScheduleBlocks([]);
    setMilestones([]);
    setError('');
    onClose();
  };

  const addScheduleBlock = () => {
    setScheduleBlocks([...scheduleBlocks, {
      day_of_week: 1,
      start_time: '09:00',
      end_time: '11:00',
      subject: '',
      topic: '',
      block_type: 'study',
    }]);
  };

  const updateScheduleBlock = (index: number, field: string, value: any) => {
    const updated = [...scheduleBlocks];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleBlocks(updated);
  };

  const removeScheduleBlock = (index: number) => {
    setScheduleBlocks(scheduleBlocks.filter((_, i) => i !== index));
  };

  const addMilestone = () => {
    setMilestones([...milestones, {
      title: '',
      description: '',
      target_date: formData.end_date || '',
    }]);
  };

  const updateMilestone = (index: number, field: string, value: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  const BLOCK_TYPES = [
    { value: 'study', label: 'Study' },
    { value: 'break', label: 'Break' },
    { value: 'review', label: 'Review' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Study Plan"
      size="lg"
      footer={
        <div className="flex items-center justify-between">
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Tip: You can edit courses & schedule after creating the plan.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !formData.name.trim() || !formData.start_date || !formData.end_date || !formData.daily_goal_hours || formData.daily_goal_hours <= 0 || isNaN(formData.daily_goal_hours)}
              title={
                !formData.name.trim() 
                  ? 'Please enter a plan name' 
                  : !formData.start_date 
                    ? 'Please select a start date' 
                    : !formData.end_date 
                      ? 'Please select an end date' 
                      : formData.daily_goal_hours <= 0 
                        ? 'Daily goal hours must be greater than 0' 
                        : undefined
              }
            >
              <Plus className="w-5 h-5 mr-2" />
              {loading ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-light-danger/10 dark:bg-dark-danger/10 border border-light-danger dark:border-dark-danger rounded-lg">
            <p className="text-sm text-light-danger dark:text-dark-danger">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Left: Basics */}
          <div className="col-span-2 space-y-4">
            <Input
              label="Plan Name *"
              placeholder="e.g., Final Exam Preparation"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Description
              </label>
              <textarea
                className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                rows={4}
                placeholder="What are you trying to achieve? Any key topics?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="mt-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                Keep it short—this appears on your plan card.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-[38px] text-light-text-secondary dark:text-dark-text-secondary">
                  <Calendar className="w-4 h-4" />
                </div>
                <Input
                  label="Start Date *"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-[38px] text-light-text-secondary dark:text-dark-text-secondary">
                  <Calendar className="w-4 h-4" />
                </div>
                <Input
                  label="End Date *"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Daily Goal (hours) *"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={formData.daily_goal_hours}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    setFormData({ ...formData, daily_goal_hours: value });
                  }
                }}
                required
              />
              <div className="flex items-end gap-2">
                {[1, 2, 3, 4].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setFormData({ ...formData, daily_goal_hours: h })}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      formData.daily_goal_hours === h
                        ? 'border-light-primary dark:border-dark-primary bg-light-primary/10 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary'
                        : 'border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:border-light-primary/40 dark:hover:border-dark-primary/40'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Sharing */}
          <div className="col-span-1 space-y-4">
            <div className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-bg-secondary dark:bg-dark-bg-secondary">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="w-4 h-4 text-warning" />
                <div className="font-semibold text-light-text-primary dark:text-dark-text-primary">Challenge</div>
              </div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">
                Let others join your plan and compete.
              </p>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_challenge: !formData.is_challenge })}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  formData.is_challenge
                    ? 'border-warning/60 bg-warning/10 text-warning'
                    : 'border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:border-warning/40'
                }`}
              >
                {formData.is_challenge ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-bg-secondary dark:bg-dark-bg-secondary">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-accent" />
                <div className="font-semibold text-light-text-primary dark:text-dark-text-primary">Public</div>
              </div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">
                Show this plan in public challenges list.
              </p>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  formData.is_public
                    ? 'border-light-primary dark:border-dark-primary bg-light-primary/10 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary'
                    : 'border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:border-light-primary/40 dark:hover:border-dark-primary/40'
                }`}
              >
                {formData.is_public ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Auto-create Schedule */}
            <div className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-bg-secondary dark:bg-dark-bg-secondary">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <div className="font-semibold text-light-text-primary dark:text-dark-text-primary">Auto-create Schedule</div>
              </div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">
                Add schedule blocks when creating the plan.
              </p>
              <button
                type="button"
                onClick={() => setAutoCreateSchedule(!autoCreateSchedule)}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  autoCreateSchedule
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:border-primary/40'
                }`}
              >
                {autoCreateSchedule ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Auto-create Milestones */}
            <div className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-bg-secondary dark:bg-dark-bg-secondary">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-accent" />
                <div className="font-semibold text-light-text-primary dark:text-dark-text-primary">Auto-create Milestones</div>
              </div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">
                Add milestones when creating the plan.
              </p>
              <button
                type="button"
                onClick={() => setAutoCreateMilestone(!autoCreateMilestone)}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  autoCreateMilestone
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:border-accent/40'
                }`}
              >
                {autoCreateMilestone ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Blocks Section */}
        {autoCreateSchedule && (
          <div className="mt-6 p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-bg-secondary dark:bg-dark-bg-secondary">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">Schedule Blocks</h3>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addScheduleBlock}>
                <Plus className="w-4 h-4 mr-1" />
                Add Block
              </Button>
            </div>
            {scheduleBlocks.length === 0 ? (
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center py-4">
                No schedule blocks added. Click "Add Block" to add one.
              </p>
            ) : (
              <div className="space-y-4">
                {scheduleBlocks.map((block, index) => (
                  <div key={index} className="p-4 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                        Block {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScheduleBlock(index)}
                        className="text-error hover:text-error"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                          Day *
                        </label>
                        <select
                          value={block.day_of_week}
                          onChange={(e) => updateScheduleBlock(index, 'day_of_week', parseInt(e.target.value))}
                          className="w-full p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm"
                        >
                          {DAYS_OF_WEEK.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                          Type *
                        </label>
                        <select
                          value={block.block_type}
                          onChange={(e) => updateScheduleBlock(index, 'block_type', e.target.value)}
                          className="w-full p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm"
                        >
                          {BLOCK_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                          Start Time *
                        </label>
                        <Input
                          type="time"
                          value={block.start_time}
                          onChange={(e) => updateScheduleBlock(index, 'start_time', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                          End Time *
                        </label>
                        <Input
                          type="time"
                          value={block.end_time}
                          onChange={(e) => updateScheduleBlock(index, 'end_time', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                          Subject *
                        </label>
                        <Input
                          value={block.subject}
                          onChange={(e) => updateScheduleBlock(index, 'subject', e.target.value)}
                          placeholder="e.g., Mathematics"
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                          Topic (Optional)
                        </label>
                        <Input
                          value={block.topic}
                          onChange={(e) => updateScheduleBlock(index, 'topic', e.target.value)}
                          placeholder="e.g., Calculus"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Milestones Section */}
        {autoCreateMilestone && (
          <div className="mt-6 p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-bg-secondary dark:bg-dark-bg-secondary">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">Milestones</h3>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addMilestone}>
                <Plus className="w-4 h-4 mr-1" />
                Add Milestone
              </Button>
            </div>
            {milestones.length === 0 ? (
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center py-4">
                No milestones added. Click "Add Milestone" to add one.
              </p>
            ) : (
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={index} className="p-4 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                        Milestone {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(index)}
                        className="text-error hover:text-error"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Input
                        label="Title *"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        placeholder="e.g., Complete Mathematics Course"
                        className="text-sm"
                      />
                      <div>
                        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                          Description
                        </label>
                        <textarea
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          placeholder="Milestone description..."
                          className="w-full p-2 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary text-sm"
                          rows={2}
                        />
                      </div>
                      <div className="relative">
                        <div className="pointer-events-none absolute left-3 top-[38px] text-light-text-secondary dark:text-dark-text-secondary">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <Input
                          label="Target Date *"
                          type="date"
                          value={milestone.target_date}
                          onChange={(e) => updateMilestone(index, 'target_date', e.target.value)}
                          min={formData.start_date}
                          max={formData.end_date}
                          className="pl-10 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
