import { useState, useRef } from 'react';
import { Upload, FileText, Video, BookOpen, FileCheck, Loader, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { resourceService } from '../../services';

interface SyllabusItem {
  title: string;
  description: string;
  order: number;
}

interface Syllabus {
  description?: string;
  items?: SyllabusItem[];
}

interface UploadResourceModalProps {
  roomId: string;
  syllabus: Syllabus | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadResourceModal({ roomId, syllabus, onClose, onSuccess }: UploadResourceModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'notes',
    subject: '',
    subjects: [] as string[],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'video', label: 'Video', icon: Video },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'assignment', label: 'Assignment', icon: FileCheck },
    { id: 'book', label: 'Book', icon: BookOpen },
    { id: 'other', label: 'Other', icon: FileText },
  ];

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: file.name }));
      }
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a resource name');
      return;
    }

    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    setLoading(true);
    try {
      // Upload the file and create resource via HTTP API
      await resourceService.uploadResource(roomId, selectedFile, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        subject: formData.subject || '',
        subjects: formData.subjects || [],
      });

      alert('Resource uploaded successfully!');
      onSuccess();
    } catch (error: any) {
      alert('Failed to upload resource: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Upload Resource" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            File *
          </label>
          <div className="flex items-center gap-3">
            <input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleSelectFile}
              disabled={loading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {selectedFile ? 'Change File' : 'Select File'}
            </Button>
            {selectedFile && (
              <span className="text-sm text-success font-medium flex items-center gap-1">
                ✓ {selectedFile.name}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
            Click "Select File" to choose a file from your computer
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            Name *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Resource name"
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
            placeholder="Describe this resource..."
            className="w-full px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary resize-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            Category *
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-button transition-colors ${
                    formData.category === cat.id
                      ? 'bg-primary text-white'
                      : 'bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
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
              {syllabusSubjects.map((subject) => (
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
              ))}
            </div>
            {formData.subjects.length > 0 && (
              <p className="mt-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                {formData.subjects.length} topic(s) selected
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading || !formData.name.trim() || !selectedFile}
            title={!selectedFile ? 'Please select a file first' : !formData.name.trim() ? 'Please enter a resource name' : undefined}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
