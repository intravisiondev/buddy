import { useState, useEffect } from 'react';
import { Plus, Calendar, TrendingUp } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { CreateMilestone, GetMyStudyPlans } from '../../../wailsjs/go/main/App';

interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  studyPlanID?: string;
}

export default function CreateMilestoneModal({ isOpen, onClose, onSuccess, studyPlanID: propStudyPlanID }: CreateMilestoneModalProps) {
  const [selectedPlanID, setSelectedPlanID] = useState<string>(propStudyPlanID || '');
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    progress: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (propStudyPlanID) {
        setSelectedPlanID(propStudyPlanID);
      } else {
        loadStudyPlans();
      }
    }
  }, [isOpen, propStudyPlanID]);

  const loadStudyPlans = async () => {
    setLoadingPlans(true);
    try {
      const plans = await GetMyStudyPlans();
      setStudyPlans(Array.isArray(plans) ? plans : []);
    } catch (err) {
      console.error('Failed to load study plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert date from YYYY-MM-DD to ISO 8601 format (RFC3339)
      let targetDateISO = '';
      if (formData.target_date) {
        const date = new Date(formData.target_date + 'T00:00:00');
        targetDateISO = date.toISOString();
      }

      const milestoneData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        target_date: targetDateISO,
        progress: formData.progress,
      };

      if (selectedPlanID) {
        milestoneData.study_plan_id = selectedPlanID;
      }

      await CreateMilestone(milestoneData);

      // Reset form
      setFormData({
        title: '',
        description: '',
        target_date: '',
        progress: 0,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      target_date: '',
      progress: 0,
    });
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={propStudyPlanID ? 'Add Milestone to Plan' : 'Add Milestone'}
      size="md"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
            <TrendingUp className="w-4 h-4" />
            Track long-term progress milestones
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !formData.title || !formData.target_date}>
              <Plus className="w-5 h-5 mr-2" />
              {loading ? 'Adding...' : 'Add Milestone'}
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

        <div className="space-y-4">
          {!propStudyPlanID && (
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Study Plan (Optional)
              </label>
              {loadingPlans ? (
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Loading plans...</p>
              ) : (
                <select
                  value={selectedPlanID}
                  onChange={(e) => setSelectedPlanID(e.target.value)}
                  className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                >
                  <option value="">No plan (standalone milestone)</option>
                  {studyPlans.map((plan) => (
                    <option key={plan.id || plan._id || plan.ID} value={plan.id || plan._id || plan.ID}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <Input
            label="Milestone Title *"
            placeholder="e.g., Complete Mathematics Course"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              Description
            </label>
            <textarea
              className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
              rows={4}
              placeholder="What does success look like? Any notes?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-[38px] text-light-text-secondary dark:text-dark-text-secondary">
              <Calendar className="w-4 h-4" />
            </div>
            <Input
              label="Target Date *"
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              required
              className="pl-10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              Initial Progress
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseFloat(e.target.value) || 0 })}
                className="w-full"
              />
              <Badge variant="neutral" size="sm">{Math.round(formData.progress)}%</Badge>
            </div>
            <p className="mt-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
              You can update progress later from the milestones list.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
