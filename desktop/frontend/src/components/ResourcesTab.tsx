import { useState, useEffect } from 'react';
import { Upload, FileText, Video, BookOpen, FileCheck, Share2, Trash2, Filter, Loader, FolderOpen, Sparkles, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Input from './ui/Input';
import UploadResourceModal from './modals/UploadResourceModal';

interface Resource {
  id: string;
  name: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string;
  subject?: string; // Related syllabus topic/subject title
  uploader_type: string;
  uploader_id: string;
  is_public: boolean;
  shared_with: string[];
  created_at: string;
}

interface SyllabusItem {
  title: string;
  description: string;
  order: number;
}

interface Syllabus {
  description?: string;
  items?: SyllabusItem[];
}

interface ResourcesTabProps {
  roomId: string;
}

const categories = [
  { id: 'all', label: 'All', icon: FolderOpen },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'assignment', label: 'Assignments', icon: FileCheck },
  { id: 'book', label: 'Books', icon: BookOpen },
];

export default function ResourcesTab({ roomId }: ResourcesTabProps) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const [teacherResources, setTeacherResources] = useState<Resource[]>([]);
  const [studentResources, setStudentResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [roomSyllabus, setRoomSyllabus] = useState<Syllabus | null>(null);
  const [trainingAI, setTrainingAI] = useState(false);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [showTrainConfirm, setShowTrainConfirm] = useState(false);

  useEffect(() => {
    loadResources();
    loadRoomSyllabus();
    if (isTeacher) {
      loadAIStatus();
    }
  }, [roomId, selectedCategory]);

  const loadRoomSyllabus = async () => {
    try {
      // @ts-ignore
      const { GetRoom } = await import('../wailsjs/go/main/App');
      const room = await GetRoom(roomId);
      if (room?.syllabus) {
        if (typeof room.syllabus === 'string') {
          // Legacy format - skip
          setRoomSyllabus(null);
        } else {
          setRoomSyllabus(room.syllabus);
        }
      } else {
        setRoomSyllabus(null);
      }
    } catch (error) {
      console.error('Failed to load room syllabus:', error);
      setRoomSyllabus(null);
    }
  };

  const loadResources = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const { GetResources } = await import('../wailsjs/go/main/App');

      const [teacherRes, studentRes] = await Promise.all([
        GetResources(roomId, 'teacher', selectedCategory).catch(() => []),
        isStudent ? GetResources(roomId, 'student', selectedCategory).catch(() => []) : Promise.resolve([]),
      ]);
      
      setTeacherResources(Array.isArray(teacherRes) ? teacherRes : []);
      setStudentResources(Array.isArray(studentRes) ? studentRes : []);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'video': return Video;
      case 'notes': return FileText;
      case 'assignment': return FileCheck;
      case 'book': return BookOpen;
      default: return FileText;
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      // @ts-ignore
      const { DeleteResource } = await import('../wailsjs/go/main/App');
      await DeleteResource(resourceId);
      alert('Resource deleted successfully!');
      loadResources();
    } catch (error: any) {
      alert('Failed to delete resource: ' + error.message);
    }
  };

  const handleShare = (resource: Resource) => {
    setSelectedResource(resource);
    setShowShareModal(true);
  };

  const loadAIStatus = async () => {
    try {
      // @ts-ignore
      const { GetRoomAIStatus } = await import('../wailsjs/go/main/App');
      const status = await GetRoomAIStatus(roomId);
      setAiStatus(status);
    } catch (error) {
      console.error('Failed to load AI status:', error);
    }
  };

  const handleTrainAI = () => {
    if (!teacherResources || teacherResources.length === 0) {
      alert('Please upload resources first before training the AI Coach');
      return;
    }
    setShowTrainConfirm(true);
  };

  const confirmTrainAI = async () => {
    setShowTrainConfirm(false);
    setTrainingAI(true);
    try {
      // @ts-ignore
      const { TrainRoomAI } = await import('../wailsjs/go/main/App');
      const resourceIDs = teacherResources.map(r => r.id);
      await TrainRoomAI(roomId, resourceIDs);
      alert('AI Coach trained successfully! Students can now ask questions in the AI Coach tab.');
      await loadAIStatus();
    } catch (error: any) {
      console.error('Training error:', error);
      alert('Failed to train AI Coach: ' + error.message);
    } finally {
      setTrainingAI(false);
    }
  };

  const renderResourceCard = (resource: Resource, isOwnResource: boolean) => {
    const CategoryIcon = getCategoryIcon(resource.category);

    return (
      <Card key={resource.id} className="p-4 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-button">
            <CategoryIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1 truncate">
                  {resource.name}
                </h4>
                {resource.description && (
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary line-clamp-2 mb-2">
                    {resource.description}
                  </p>
                )}
                {resource.subject && (
                  <Badge variant="neutral" size="sm" className="mb-2">
                    📚 {resource.subject}
                  </Badge>
                )}
                <div className="flex items-center gap-3 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  <span>{formatFileSize(resource.file_size)}</span>
                  <span>•</span>
                  <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                  {resource.is_public && (
                    <>
                      <span>•</span>
                      <Badge variant="success" size="sm">Public</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(resource.file_url, '_blank')}
              >
                <FileText className="w-4 h-4" />
                Download
              </Button>
              {isOwnResource && isStudent && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleShare(resource)}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDelete(resource.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Resources
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Access course materials and share your own resources
          </p>
        </div>
        <div className="flex gap-3">
          {isTeacher && (
            <>
              <Button 
                variant="secondary" 
                onClick={handleTrainAI}
                disabled={trainingAI || !teacherResources || teacherResources.length === 0}
              >
                {trainingAI ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Brain className="w-5 h-5" />
                )}
                {aiStatus?.trained ? 'Retrain AI Coach' : 'Train AI Coach'}
              </Button>
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="w-5 h-5" />
                Upload Resource
              </Button>
            </>
          )}
          {isStudent && (
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="w-5 h-5" />
              Upload My Resource
            </Button>
          )}
        </div>
      </div>

      {/* AI Status Banner */}
      {isTeacher && aiStatus && (
        <Card className={`p-4 ${aiStatus.trained ? 'bg-gradient-to-r from-success/10 to-primary/10 border-success/30' : 'bg-gradient-to-r from-warning/10 to-accent/10 border-warning/30'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 ${aiStatus.trained ? 'bg-success/20' : 'bg-warning/20'} rounded-button`}>
              {aiStatus.trained ? (
                <Sparkles className="w-5 h-5 text-success" />
              ) : (
                <Brain className="w-5 h-5 text-warning" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                {aiStatus.trained ? 'AI Coach is Active' : 'AI Coach Not Trained'}
              </h4>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {aiStatus.trained 
                  ? `Trained with ${aiStatus.resource_count} resources • ${aiStatus.message_count || 0} messages answered`
                  : 'Upload resources and train the AI to enable the AI Coach for students'}
              </p>
            </div>
            {aiStatus.last_trained_at && (
              <Badge variant="neutral" size="sm">
                Last trained: {new Date(aiStatus.last_trained_at).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </Button>
          );
        })}
      </div>

      {/* Teacher Resources Section */}
      {Array.isArray(teacherResources) && teacherResources.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
              Teacher Resources
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teacherResources.map((resource) => renderResourceCard(resource, false))}
          </div>
        </div>
      )}

      {/* Student Resources Section */}
      {isStudent && Array.isArray(studentResources) && studentResources.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="w-5 h-5 text-accent" />
            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
              My Resources
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentResources.map((resource) =>
              renderResourceCard(resource, resource.uploader_id === user?.id)
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(Array.isArray(teacherResources) ? teacherResources.length : 0) === 0 && 
       (Array.isArray(studentResources) ? studentResources.length : 0) === 0 && (
        <Card className="p-12 text-center">
          <FolderOpen className="w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
            No resources yet
          </h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
            {isTeacher
              ? 'Upload course materials for your students'
              : 'Upload your own resources or wait for teacher to share materials'}
          </p>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="w-5 h-5" />
            Upload Resource
          </Button>
        </Card>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadResourceModal
          roomId={roomId}
          syllabus={roomSyllabus}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadResources();
          }}
        />
      )}

      {/* Share Modal - Placeholder */}
      {showShareModal && selectedResource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Share Resource</h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Sharing functionality coming soon...
            </p>
            <Button variant="secondary" onClick={() => setShowShareModal(false)}>
              Close
            </Button>
          </Card>
        </div>
      )}

      {/* Train AI Confirmation Modal */}
      {showTrainConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/20 rounded-card">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
                Train AI Coach
              </h3>
            </div>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Train AI Coach with <strong>{teacherResources?.length || 0} teacher resources</strong>?
            </p>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-6">
              This will allow students to ask questions about the course materials in the AI Coach tab.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                fullWidth 
                onClick={() => setShowTrainConfirm(false)}
                disabled={trainingAI}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                fullWidth 
                onClick={confirmTrainAI}
                disabled={trainingAI}
              >
                {trainingAI ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    Training...
                  </>
                ) : (
                  'Train AI'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
