import { useState } from 'react';
import { X, FileText, Calendar, Award, Loader, Check } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface SyllabusItem {
  title: string;
  description: string;
  order: number;
}

interface Syllabus {
  description?: string;
  items?: SyllabusItem[];
}

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    dueDate: string;
    totalPoints: number;
    assignmentType: string;
    subjects: string[];
  }) => Promise<void>;
  syllabus?: Syllabus | null;
}

const assignmentTypes = [
  { id: 'homework', label: 'Homework', icon: FileText },
  { id: 'quiz', label: 'Quiz', icon: Award },
  { id: 'project', label: 'Project', icon: FileText },
  { id: 'exam', label: 'Exam', icon: Award },
];

export default function CreateAssignmentModal({ isOpen, onClose, onSubmit, syllabus }: CreateAssignmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    totalPoints: 100,
    assignmentType: 'homework',
    subjects: [] as string[],
  });

  const syllabusSubjects = syllabus?.items
    ?.sort((a, b) => a.order - b.order)
    .map(item => item.title) || [];

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Title is required.');
      return;
    }
    if (!formData.dueDate) {
      alert('Due date is required.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        totalPoints: 100,
        assignmentType: 'homework',
        subjects: [],
      });
      onClose();
    } catch (error: any) {
      alert('Failed to create assignment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Assignment" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            Title *
          </label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Chapter 5 Homework"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Assignment description and instructions..."
            className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary resize-none"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              Due Date *
            </label>
            <Input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              Total Points
            </label>
            <Input
              type="number"
              value={formData.totalPoints}
              onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            Assignment Type *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {assignmentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, assignmentType: type.id })}
                  className={`p-4 rounded-button border-2 transition-all ${
                    formData.assignmentType === type.id
                      ? 'border-primary bg-primary/10'
                      : 'border-light-text-secondary/20 dark:border-dark-border hover:border-primary/50'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {syllabusSubjects.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              Related Syllabus Topics (Optional)
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-button min-h-[100px]">
              {syllabusSubjects.length === 0 ? (
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  No syllabus topics available
                </p>
              ) : (
                syllabusSubjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleSubject(subject)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-button text-sm transition-all ${
                      formData.subjects.includes(subject)
                        ? 'bg-primary text-white'
                        : 'bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border text-light-text-primary dark:text-dark-text-primary hover:border-primary/50'
                    }`}
                  >
                    {formData.subjects.includes(subject) && (
                      <Check className="w-4 h-4" />
                    )}
                    {subject}
                  </button>
                ))
              )}
            </div>
            {formData.subjects.length > 0 && (
              <p className="mt-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                {formData.subjects.length} topic(s) selected
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Assignment'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
