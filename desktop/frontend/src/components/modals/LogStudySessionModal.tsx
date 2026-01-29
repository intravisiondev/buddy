import { useState } from 'react';
import { Clock, Play } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { LogStudySession } from '../../../wailsjs/go/main/App';

interface LogStudySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LogStudySessionModal({ isOpen, onClose, onSuccess }: LogStudySessionModalProps) {
  const [subject, setSubject] = useState('');
  const [minutes, setMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preset = (m: number) => () => setMinutes(m);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await LogStudySession(subject, minutes);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to log study session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Study Session"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => handleSubmit()} disabled={loading}>
            <Play className="w-5 h-5 mr-2" />
            {loading ? 'Logging...' : 'Log Session'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-light-danger/10 dark:bg-dark-danger/10 text-light-danger dark:text-dark-danger border border-light-danger/20 dark:border-dark-danger/20">
            {error}
          </div>
        )}

        <Input
          label="Subject (optional)"
          placeholder="e.g., Mathematics"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            Duration (minutes)
          </label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <button type="button" onClick={preset(30)} className={`px-3 py-2 rounded-lg border ${minutes === 30 ? 'bg-light-primary/10 dark:bg-dark-primary/10 border-light-primary dark:border-dark-primary' : 'border-light-border dark:border-dark-border'}`}>30</button>
            <button type="button" onClick={preset(60)} className={`px-3 py-2 rounded-lg border ${minutes === 60 ? 'bg-light-primary/10 dark:bg-dark-primary/10 border-light-primary dark:border-dark-primary' : 'border-light-border dark:border-dark-border'}`}>60</button>
            <button type="button" onClick={preset(90)} className={`px-3 py-2 rounded-lg border ${minutes === 90 ? 'bg-light-primary/10 dark:bg-dark-primary/10 border-light-primary dark:border-dark-primary' : 'border-light-border dark:border-dark-border'}`}>90</button>
            <button type="button" onClick={preset(120)} className={`px-3 py-2 rounded-lg border ${minutes === 120 ? 'bg-light-primary/10 dark:bg-dark-primary/10 border-light-primary dark:border-dark-primary' : 'border-light-border dark:border-dark-border'}`}>120</button>
          </div>

          <Input
            type="number"
            min="1"
            max="600"
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value || '0', 10) || 0)}
          />
          <div className="mt-2 flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
            <Clock className="w-4 h-4" />
            Rewards: 1 XP/min, tokens per hour, +1 gem if 90+ mins
          </div>
        </div>
      </form>
    </Modal>
  );
}

