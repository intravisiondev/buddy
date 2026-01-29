import { useState } from 'react';
import { X, Upload, FileText, Video, BookOpen, FileCheck, Loader, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

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

interface Resource {
  name: string;
  description: string;
  category: string;
  subject?: string;
  subjects?: string[];
  file_url: string;
  file_type: string;
  file_size: number;
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
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // File input is hidden, this is just a fallback
    // The main file selection should go through handleSelectFile (Wails file dialog)
    const file = e.target.files?.[0];
    if (file) {
      // If file input is used, prompt user to use Select File button instead
      alert('Please use "Select File" button to choose a file');
      e.target.value = ''; // Reset input
    }
  };

  const handleSelectFile = async () => {
    try {
      // @ts-ignore
      const { OpenFileDialog } = await import('../../../wailsjs/go/main/App');
      const filePath = await OpenFileDialog();
      console.log('File dialog returned:', filePath);
      if (filePath) {
        setSelectedFilePath(filePath);
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'file';
        if (!formData.name) {
          setFormData(prev => ({ ...prev, name: fileName }));
        }
        setSelectedFile(new File([], fileName) as any);
        console.log('File selected:', fileName, 'Path:', filePath);
      } else {
        console.log('No file selected (user cancelled)');
      }
    } catch (error: any) {
      console.error('Error opening file dialog:', error);
      alert('Failed to open file dialog: ' + (error.message || 'Unknown error') + '. Please try again.');
      // Fallback to file input if OpenFileDialog is not available
      // document.getElementById('file-input')?.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a resource name');
      return;
    }

    if (!selectedFilePath && !selectedFile) {
      alert('Please select a file using "Select File" button');
      return;
    }

    // If file was selected via file input (fallback), we need to use file dialog
    if (!selectedFilePath && selectedFile) {
      alert('Please use "Select File" button to choose a file. File input is not supported in Wails.');
      return;
    }

    setLoading(true);
    try {
          // @ts-ignore
          const { UploadFile, CreateResource } = await import('../../../wailsjs/go/main/App');
      
      // First upload the file
      const uploadResult: any = await UploadFile(roomId, selectedFilePath);
      
      if (!uploadResult?.file_url) {
        throw new Error('File upload failed');
      }

      // Get file info from path
      const fileName = selectedFilePath.split('/').pop() || selectedFilePath.split('\\').pop() || 'file';
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      const mimeTypes: { [key: string]: string } = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
      };
      const fileType = mimeTypes[fileExtension] || 'application/octet-stream';

      // Then create the resource
      const resourceData: Resource = {
        name: formData.name || fileName,
        description: formData.description,
        category: formData.category,
        subject: formData.subject || '', // Legacy support
        subjects: formData.subjects || [], // New: multiple subjects
        file_url: uploadResult.file_url,
        file_type: fileType,
        file_size: uploadResult.file_size || 0,
      };
      await CreateResource(roomId, resourceData);

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
              {selectedFilePath ? 'Change File' : 'Select File'}
            </Button>
            {selectedFilePath && (
              <span className="text-sm text-success font-medium flex items-center gap-1">
                ✓ {selectedFile?.name || selectedFilePath.split('/').pop() || selectedFilePath.split('\\').pop() || 'File selected'}
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
            disabled={loading || !formData.name.trim() || !selectedFilePath}
            title={!selectedFilePath ? 'Please select a file first using "Select File" button' : !formData.name.trim() ? 'Please enter a resource name' : undefined}
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
