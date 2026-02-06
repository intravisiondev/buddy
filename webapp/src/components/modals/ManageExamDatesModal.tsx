import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Edit2, Save } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface ExamDate {
  title: string;
  date: string; // ISO string
  description?: string;
  subject?: string;
}

interface ManageExamDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (examDates: ExamDate[]) => Promise<void>;
  initialExamDates?: ExamDate[];
  syllabusSubjects?: string[]; // For subject dropdown
}

export default function ManageExamDatesModal({
  isOpen,
  onClose,
  onSubmit,
  initialExamDates = [],
  syllabusSubjects = [],
}: ManageExamDatesModalProps) {
  const [loading, setLoading] = useState(false);
  const [examDates, setExamDates] = useState<ExamDate[]>(initialExamDates);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newExamDate, setNewExamDate] = useState<ExamDate>({
    title: '',
    date: '',
    description: '',
    subject: '',
  });

  useEffect(() => {
    if (isOpen) {
      setExamDates(initialExamDates);
      setEditingIndex(null);
      setNewExamDate({
        title: '',
        date: '',
        description: '',
        subject: '',
      });
    }
  }, [isOpen, initialExamDates]);

  const handleAdd = () => {
    if (!newExamDate.title.trim() || !newExamDate.date) {
      alert('Title and date are required.');
      return;
    }
    setExamDates([...examDates, { ...newExamDate }]);
    setNewExamDate({
      title: '',
      date: '',
      description: '',
      subject: '',
    });
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setNewExamDate({ ...examDates[index] });
  };

  const handleSaveEdit = () => {
    if (!newExamDate.title.trim() || !newExamDate.date) {
      alert('Title and date are required.');
      return;
    }
    if (editingIndex !== null) {
      const updated = [...examDates];
      updated[editingIndex] = { ...newExamDate };
      setExamDates(updated);
      setEditingIndex(null);
      setNewExamDate({
        title: '',
        date: '',
        description: '',
        subject: '',
      });
    }
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this exam date?')) {
      setExamDates(examDates.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(examDates);
      onClose();
    } catch (error: any) {
      alert('Failed to save exam dates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Exam Dates" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Add/Edit Form */}
        <Card className="p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            {editingIndex !== null ? 'Edit Exam Date' : 'Add Exam Date'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Title *
              </label>
              <Input
                value={newExamDate.title}
                onChange={(e) => setNewExamDate({ ...newExamDate, title: e.target.value })}
                placeholder="e.g., Midterm Exam, Final Exam"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                  Date & Time *
                </label>
                <Input
                  type="datetime-local"
                  value={newExamDate.date}
                  onChange={(e) => setNewExamDate({ ...newExamDate, date: e.target.value })}
                  required
                />
              </div>

              {syllabusSubjects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                    Subject (Optional)
                  </label>
                  <select
                    value={newExamDate.subject || ''}
                    onChange={(e) => setNewExamDate({ ...newExamDate, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary"
                  >
                    <option value="">All Subjects</option>
                    {syllabusSubjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Description (Optional)
              </label>
              <textarea
                value={newExamDate.description || ''}
                onChange={(e) => setNewExamDate({ ...newExamDate, description: e.target.value })}
                placeholder="Additional details about the exam..."
                className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              {editingIndex !== null ? (
                <>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSaveEdit}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditingIndex(null);
                      setNewExamDate({
                        title: '',
                        date: '',
                        description: '',
                        subject: '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button type="button" variant="primary" onClick={handleAdd} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Exam Date
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Exam Dates List */}
        <div>
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            Exam Dates ({examDates.length})
          </h3>
          {examDates.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4 opacity-50" />
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                No exam dates added yet.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {examDates.map((exam, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                          {exam.title}
                        </h4>
                        {exam.subject && (
                          <Badge variant="neutral" size="sm">
                            {exam.subject}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                        {new Date(exam.date).toLocaleString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {exam.description && (
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          {exam.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(index)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="error"
                        size="sm"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Exam Dates'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
