import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { studyPlanService } from '../../services';

interface CreateScheduleBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  studyPlanID?: string; // Made optional to allow selection
}

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

export default function CreateScheduleBlockModal({ isOpen, onClose, onSuccess, studyPlanID: propStudyPlanID }: CreateScheduleBlockModalProps) {
  const [selectedPlanID, setSelectedPlanID] = useState<string>(propStudyPlanID || '');
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [formData, setFormData] = useState({
    day_of_week: 1, // Monday by default
    start_time: '09:00',
    end_time: '11:00',
    subject: '',
    topic: '',
    block_type: 'study' as 'study' | 'break' | 'review',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && !propStudyPlanID) {
      loadStudyPlans();
    } else if (propStudyPlanID) {
      setSelectedPlanID(propStudyPlanID);
    }
  }, [isOpen, propStudyPlanID]);

  const loadStudyPlans = async () => {
    setLoadingPlans(true);
    try {
      const plans = await studyPlanService.getMyStudyPlans();
      setStudyPlans(Array.isArray(plans) ? plans : []);
      if (Array.isArray(plans) && plans.length > 0 && !selectedPlanID) {
        setSelectedPlanID(plans[0].id || '');
      }
    } catch (err) {
      console.error('Failed to load study plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlanID) {
      setError('Please select a study plan');
      return;
    }
    if (!formData.subject.trim()) {
      setError('Subject is required');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      await studyPlanService.createScheduleBlock(selectedPlanID, {
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
        subject: formData.subject,
        topic: formData.topic,
        block_type: formData.block_type,
      });

      // Reset form
      setFormData({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '11:00',
        subject: '',
        topic: '',
        block_type: 'study',
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create schedule block');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '11:00',
      subject: '',
      topic: '',
      block_type: 'study',
    });
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Schedule Block"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Plus className="w-5 h-5 mr-2" />
            {loading ? 'Adding...' : 'Add Block'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-light-danger/10 dark:bg-dark-danger/10 border border-light-danger dark:border-dark-danger rounded-lg">
            <p className="text-sm text-light-danger dark:text-dark-danger">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {!propStudyPlanID && (
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Study Plan *
              </label>
              {loadingPlans ? (
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Loading plans...</p>
              ) : (
                <select
                  value={selectedPlanID}
                  onChange={(e) => setSelectedPlanID(e.target.value)}
                  className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                  required
                >
                  <option value="">Select a plan...</option>
                  {studyPlans.map((plan) => (
                    <option key={plan.id || plan._id || plan.ID} value={plan.id || plan._id || plan.ID}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              Day of Week *
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
              className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
              required
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Start Time *
              </label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                End Time *
              </label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <Input
            label="Subject *"
            placeholder="e.g., Mathematics"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />

          <Input
            label="Topic (Optional)"
            placeholder="e.g., Calculus"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              Block Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {BLOCK_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, block_type: type.value as any })}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                    formData.block_type === type.value
                      ? 'border-light-primary dark:border-dark-primary bg-light-primary/10 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary font-medium'
                      : 'border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary hover:border-light-primary/50 dark:hover:border-dark-primary/50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
