import { useState } from 'react';
import { X, Loader, BookOpen, Lock, Users, Plus, Trash2, Upload, Sparkles, FileText } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import { aiService } from '../services';

interface SyllabusItem {
  title: string;
  description: string;
  order: number;
}

interface Syllabus {
  description?: string;
  items: SyllabusItem[];
}

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    subject: string;
    description: string;
    syllabus: Syllabus | null;
    isPrivate: boolean;
    maxMembers: number;
  }) => Promise<void>;
}

export default function CreateRoomModal({ isOpen, onClose, onSubmit }: CreateRoomModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: 'Mathematics',
    description: '',
    isPrivate: false,
    maxMembers: 30,
  });
  
  const [syllabus, setSyllabus] = useState<Syllabus>({ items: [] });
  const [syllabusMode, setSyllabusMode] = useState<'manual' | 'ai-file' | 'ai-topics'>('manual');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [topicsList, setTopicsList] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [generatingSyllabus, setGeneratingSyllabus] = useState(false);

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English',
    'History',
    'Geography',
    'Art',
    'Music',
  ];

  const handleAddTopic = () => {
    if (newTopicTitle.trim()) {
      const newItem: SyllabusItem = {
        title: newTopicTitle.trim(),
        description: newTopicDescription.trim(),
        order: syllabus.items.length + 1,
      };
      setSyllabus({
        ...syllabus,
        items: [...syllabus.items, newItem],
      });
      setNewTopicTitle('');
      setNewTopicDescription('');
    }
  };

  const handleRemoveTopic = (index: number) => {
    const newItems = syllabus.items.filter((_, i) => i !== index);
    // Reorder items
    const reorderedItems = newItems.map((item, i) => ({ ...item, order: i + 1 }));
    setSyllabus({ ...syllabus, items: reorderedItems });
  };

  const handleAddTopicToList = () => {
    if (newTopic.trim() && !topicsList.includes(newTopic.trim())) {
      setTopicsList([...topicsList, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const handleRemoveTopicFromList = (index: number) => {
    setTopicsList(topicsList.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFileContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateSyllabusFromFile = async () => {
    if (!fileContent.trim() || !formData.name) {
      alert('Please upload a file and enter a course name');
      return;
    }
    
    setGeneratingSyllabus(true);
    try {
      const response: any = await aiService.generateSyllabusFromFile(fileContent, formData.subject, formData.name);
      if (response.syllabus) {
        const generatedSyllabus = response.syllabus;
        setSyllabus({
          description: generatedSyllabus.description || '',
          items: Array.isArray(generatedSyllabus.items) ? generatedSyllabus.items : [],
        });
        setSyllabusMode('manual');
        alert('Syllabus generated successfully! You can edit it before creating the room.');
      } else {
        alert('Failed to generate syllabus. Please try again.');
      }
    } catch (error: any) {
      alert('Failed to generate syllabus: ' + (error.message || 'Unknown error'));
    } finally {
      setGeneratingSyllabus(false);
    }
  };

  const handleGenerateSyllabusFromTopics = async () => {
    if (topicsList.length === 0 || !formData.name) {
      alert('Please add at least one topic and enter a course name');
      return;
    }
    
    setGeneratingSyllabus(true);
    try {
      const response: any = await aiService.generateSyllabusFromTopics(topicsList, formData.subject, formData.name);
      if (response.syllabus) {
        const generatedSyllabus = response.syllabus;
        setSyllabus({
          description: generatedSyllabus.description || '',
          items: Array.isArray(generatedSyllabus.items) ? generatedSyllabus.items : [],
        });
        setSyllabusMode('manual');
        alert('Syllabus generated successfully! You can edit it before creating the room.');
      } else {
        alert('Failed to generate syllabus. Please try again.');
      }
    } catch (error: any) {
      alert('Failed to generate syllabus: ' + (error.message || 'Unknown error'));
    } finally {
      setGeneratingSyllabus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a room name');
      return;
    }
    setLoading(true);
    try {
      const syllabusToSubmit = (syllabus.items && syllabus.items.length > 0) || syllabus.description
        ? syllabus
        : null;
      await onSubmit({
        ...formData,
        syllabus: syllabusToSubmit,
      });
      // Reset form
      setFormData({
        name: '',
        subject: 'Mathematics',
        description: '',
        isPrivate: false,
        maxMembers: 30,
      });
      setSyllabus({ items: [] });
      setSyllabusMode('manual');
      setNewTopicTitle('');
      setNewTopicDescription('');
      setTopicsList([]);
      setNewTopic('');
      setFileContent('');
      onClose();
    } catch (error: any) {
      alert('Failed to create room: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-button">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                Create New Room
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-button transition-colors"
            >
              <X className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Room Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Advanced Calculus Study Group"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Subject *
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary"
                required
              >
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose and topics of this room..."
                className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary resize-none"
                rows={4}
              />
            </div>

            {/* Syllabus Section */}
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-3">
                Course Syllabus (Optional)
              </label>
              
              {/* Mode Selection */}
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={syllabusMode === 'manual' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSyllabusMode('manual')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Manual
                </Button>
                <Button
                  type="button"
                  variant={syllabusMode === 'ai-topics' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSyllabusMode('ai-topics')}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI from Topics
                </Button>
                <Button
                  type="button"
                  variant={syllabusMode === 'ai-file' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSyllabusMode('ai-file')}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  AI from File
                </Button>
              </div>

              {/* Manual Mode */}
              {syllabusMode === 'manual' && (
                <div className="space-y-4">
                  {syllabus.description && (
                    <div>
                      <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                        Course Description
                      </label>
                      <textarea
                        value={syllabus.description}
                        onChange={(e) => setSyllabus({ ...syllabus, description: e.target.value })}
                        placeholder="Overall course description..."
                        className="w-full px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary resize-none"
                        rows={2}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        placeholder="Topic title"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleAddTopic}
                        disabled={!newTopicTitle.trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {newTopicTitle && (
                      <textarea
                        value={newTopicDescription}
                        onChange={(e) => setNewTopicDescription(e.target.value)}
                        placeholder="Topic description (optional)"
                        className="w-full px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary resize-none"
                        rows={2}
                      />
                    )}
                  </div>

                  {syllabus.items.length > 0 && (
                    <div className="space-y-2">
                      {syllabus.items.map((item, index) => (
                        <Card key={index} className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                                {index + 1}. {item.title}
                              </div>
                              {item.description && (
                                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                  {item.description}
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTopic(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI from Topics Mode */}
              {syllabusMode === 'ai-topics' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="Enter a topic (e.g., Linear Algebra)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTopicToList();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddTopicToList}
                      disabled={!newTopic.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {topicsList.length > 0 && (
                    <div className="space-y-2">
                      {topicsList.map((topic, index) => (
                        <Card key={index} className="p-2 flex items-center justify-between">
                          <span className="text-light-text-primary dark:text-dark-text-primary">{topic}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTopicFromList(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Card>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handleGenerateSyllabusFromTopics}
                    disabled={topicsList.length === 0 || generatingSyllabus || !formData.name}
                    fullWidth
                  >
                    {generatingSyllabus ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Syllabus from Topics
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* AI from File Mode */}
              {syllabusMode === 'ai-file' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                      Upload Course Material (PDF, DOCX, TXT)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileUpload}
                      className="w-full px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary"
                    />
                  </div>

                  {fileContent && (
                    <div className="p-3 bg-light-bg dark:bg-dark-bg rounded-button border border-light-text-secondary/20 dark:border-dark-border">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                          File loaded ({fileContent.length} characters)
                        </span>
                      </div>
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        Preview: {fileContent.substring(0, 200)}...
                      </p>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handleGenerateSyllabusFromFile}
                    disabled={!fileContent.trim() || generatingSyllabus || !formData.name}
                    fullWidth
                  >
                    {generatingSyllabus ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Syllabus from File
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Maximum Members *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                <input
                  type="number"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
                  min="1"
                  max="100"
                  className="w-full pl-10 pr-4 py-3 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-light-bg dark:bg-dark-bg rounded-button">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                className="w-5 h-5 rounded border-light-text-secondary/20 dark:border-dark-border focus:ring-primary"
              />
              <label htmlFor="isPrivate" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary font-medium">
                  <Lock className="w-4 h-4" />
                  Private Room
                </div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  Only invited members can join this room
                </p>
              </label>
            </div>

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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Room'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
