import { useMemo, useState } from 'react';
import { Plus, Calendar, BookOpen, Flag } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { CreateGoal } from '../../../wailsjs/go/main/App';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  studyPlanID?: string;
}

export default function CreateGoalModal({ isOpen, onClose, onSuccess, studyPlanID }: CreateGoalModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const goalData: any = {
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date,
        category: studyPlanID ? 'study_plan' : 'daily',
      };

      if (studyPlanID) {
        goalData.study_plan_id = studyPlanID;
      }

      if (formData.subject) {
        goalData.subject = formData.subject;
      }

      // optional priority field if server supports it
      goalData.priority = formData.priority;

      await CreateGoal(goalData);

      // Reset form
      setFormData({
        title: '',
        description: '',
        subject: '',
        due_date: '',
        priority: 'medium',
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      due_date: '',
      priority: 'medium',
    });
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={studyPlanID ? 'Add Goal to Plan' : 'Add Goal'}
      size="md"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
            <Flag className="w-4 h-4" />
            Completing goals rewards XP + gems
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !formData.title || !formData.due_date}>
              <Plus className="w-5 h-5 mr-2" />
              {loading ? 'Adding...' : 'Add Goal'}
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
          <Input
            label="Goal Title *"
            placeholder="e.g., Complete Math Chapter 5"
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
              placeholder="Optional details (what to do, resources, etc.)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-[38px] text-light-text-secondary dark:text-dark-text-secondary">
                <BookOpen className="w-4 h-4" />
              </div>
              <Input
                label="Subject (Optional)"
                placeholder="e.g., Mathematics"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-[38px] text-light-text-secondary dark:text-dark-text-secondary">
                <Calendar className="w-4 h-4" />
              </div>
              <Input
                label="Due Date *"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.priority === priority
                      ? 'border-light-primary dark:border-dark-primary bg-light-primary/10 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary font-medium'
                      : 'border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary hover:border-light-primary/50 dark:hover:border-dark-primary/50'
                  }`}
                >
                  <div className="text-sm font-semibold">
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </div>
                  <div className="text-xs opacity-80">
                    {priority === 'high' ? '20 XP' : priority === 'medium' ? '10 XP' : '5 XP'}
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
              Priority affects XP reward when you complete the goal.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
