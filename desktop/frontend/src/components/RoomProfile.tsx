import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BookOpen, Award, FileText, User, CheckCircle, Plus, Edit2, Save, X, Trash2 } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Input from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import CreateAssignmentModal from './modals/CreateAssignmentModal';
import ManageExamDatesModal from './modals/ManageExamDatesModal';

interface WeeklySchedule {
  day: string;
  start_time: string;
  end_time: string;
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

interface ExamDate {
  title: string;
  date: string; // ISO string
  description?: string;
  subject?: string;
}

interface RoomProfileProps {
  room: {
    id: string;
    name: string;
    subject: string;
    description: string;
    teacher_name?: string;
    teacher_bio?: string;
    owner_id?: string;
    schedule?: WeeklySchedule[];
    start_date?: string;
    end_date?: string;
    registration_end?: string;
    syllabus?: Syllabus | string; // Can be structured or legacy string
    exam_dates?: ExamDate[]; // Exam dates for the course
    max_members: number;
    is_private: boolean;
  };
  isMember: boolean;
  onJoin: () => void;
  joining: boolean;
  onRoomUpdate?: (updatedRoom: any) => void; // Callback when room is updated
}

export default function RoomProfile({ room, isMember, onJoin, joining, onRoomUpdate }: RoomProfileProps) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const isOwner = user?.id === room.owner_id;
  const canEditSyllabus = isTeacher && isOwner;

  const [isEditingSyllabus, setIsEditingSyllabus] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState<Syllabus>(() => {
    if (typeof room.syllabus === 'string') {
      return { items: [] };
    }
    return room.syllabus || { items: [] };
  });
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [savingSyllabus, setSavingSyllabus] = useState(false);
  
  // Assignment states
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  
  // Exam dates states
  const [showExamDatesModal, setShowExamDatesModal] = useState(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Load assignments when component mounts or room changes
  useEffect(() => {
    if (room.id && isMember) {
      loadAssignments();
    }
  }, [room.id, isMember]);

  const loadAssignments = async () => {
    setLoadingAssignments(true);
    try {
      // @ts-ignore
      const App = await import('../wailsjs/go/main/App');
      if (!App.GetAssignments) {
        console.error('GetAssignments function not found in App module');
        setAssignments([]);
        return;
      }
      const assignmentsList = await App.GetAssignments(room.id);
      setAssignments(Array.isArray(assignmentsList) ? assignmentsList : []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleCreateAssignment = async (data: {
    title: string;
    description: string;
    dueDate: string;
    totalPoints: number;
    assignmentType: string;
    subjects: string[];
  }) => {
    try {
      // @ts-ignore
      const App = await import('../wailsjs/go/main/App');
      if (!App.CreateAssignment) {
        throw new Error('CreateAssignment function not found');
      }
      // Convert date string to ISO format for backend
      const dueDateISO = new Date(data.dueDate).toISOString();
      await App.CreateAssignment(room.id, data.title, data.description, dueDateISO, data.totalPoints, data.assignmentType, data.subjects || []);
      alert('Assignment created successfully!');
      loadAssignments(); // Reload assignments
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create assignment');
    }
  };

  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setShowEditAssignmentModal(true);
  };

  const handleUpdateAssignment = async (data: {
    title: string;
    description: string;
    dueDate: string;
    totalPoints: number;
    assignmentType: string;
    subjects: string[];
  }) => {
    if (!editingAssignment) return;
    try {
      // @ts-ignore
      const App = await import('../wailsjs/go/main/App');
      if (!App.UpdateAssignment) {
        throw new Error('UpdateAssignment function not found');
      }
      const dueDateISO = new Date(data.dueDate).toISOString();
      await App.UpdateAssignment(editingAssignment.id, data.title, data.description, dueDateISO, data.totalPoints, data.assignmentType, data.subjects || []);
      alert('Assignment updated successfully!');
      setShowEditAssignmentModal(false);
      setEditingAssignment(null);
      loadAssignments(); // Reload assignments
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentID: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      // @ts-ignore
      const App = await import('../wailsjs/go/main/App');
      if (!App.DeleteAssignment) {
        throw new Error('DeleteAssignment function not found');
      }
      await App.DeleteAssignment(assignmentID);
      alert('Assignment deleted successfully!');
      loadAssignments(); // Reload assignments
    } catch (error: any) {
      alert('Failed to delete assignment: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSaveExamDates = async (examDates: any[]) => {
    try {
      // @ts-ignore
      const { UpdateRoomExamDates, GetRoom } = await import('../wailsjs/go/main/App');
      
      // Convert exam dates to proper format
      const formattedExamDates = examDates.map(ed => ({
        title: ed.title,
        date: new Date(ed.date).toISOString(),
        description: ed.description || '',
        subject: ed.subject || '',
      }));
      
      await UpdateRoomExamDates(room.id, formattedExamDates);
      
      // Reload room to get updated exam dates
      const freshRoom = await GetRoom(room.id);
      if (onRoomUpdate) {
        onRoomUpdate(freshRoom);
      }
      
      alert('Exam dates saved successfully!');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save exam dates');
    }
  };

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedSchedule = room.schedule?.sort((a, b) => 
    daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day)
  ) || [];

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-card mb-4">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
          {room.name}
        </h1>
        <div className="flex items-center justify-center gap-3 mb-4">
          <Badge variant="primary" size="lg">{room.subject}</Badge>
          {room.is_private && <Badge variant="warning" size="lg">Private</Badge>}
        </div>
        <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary max-w-2xl mx-auto">
          {room.description}
        </p>
      </div>

      {/* Join Button (if not a member) */}
      {!isMember && (
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                Ready to start learning?
              </h3>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                Join this classroom to access chat, resources, games and AI coach
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={onJoin}
              disabled={joining}
              className="px-8"
            >
              {joining ? 'Joining...' : 'Join Classroom'}
            </Button>
          </div>
        </Card>
      )}

      {/* Already Member */}
      {isMember && (
        <Card className="p-6 bg-gradient-to-r from-success/10 to-primary/10 border-success/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-success" />
            <div>
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                You're enrolled in this classroom
              </h3>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Use the tabs above to access chat, resources and more
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Teacher Info */}
        {room.teacher_name && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Instructor
              </h3>
            </div>
            <p className="text-xl font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              {room.teacher_name}
            </p>
            {room.teacher_bio && (
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {room.teacher_bio}
              </p>
            )}
          </Card>
        )}

        {/* Class Size */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              Class Size
            </h3>
          </div>
          <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {room.max_members}
          </p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Maximum students
          </p>
        </Card>

        {/* Course Duration */}
        {(room.start_date || room.end_date) && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Course Duration
              </h3>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Start Date</p>
                <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                  {formatDate(room.start_date)}
                </p>
              </div>
              <div>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">End Date</p>
                <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                  {formatDate(room.end_date)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Registration Deadline */}
        {room.registration_end && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Registration Deadline
              </h3>
            </div>
            <p className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary">
              {formatDate(room.registration_end)}
            </p>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
              Don't miss out!
            </p>
          </Card>
        )}
      </div>

      {/* Weekly Schedule */}
      {sortedSchedule.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              Weekly Schedule
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSchedule.map((schedule, index) => (
              <div 
                key={index}
                className="p-4 bg-light-bg dark:bg-dark-bg rounded-button border border-light-text-secondary/10 dark:border-dark-border"
              >
                <p className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                  {schedule.day}
                </p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {schedule.start_time} - {schedule.end_time}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Syllabus */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              Course Syllabus
            </h3>
          </div>
          {canEditSyllabus && !isEditingSyllabus && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const currentSyllabus = typeof room.syllabus === 'string' 
                  ? { items: [] } 
                  : (room.syllabus || { items: [] });
                setEditingSyllabus(currentSyllabus);
                setIsEditingSyllabus(true);
              }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Syllabus
            </Button>
          )}
        </div>

        {isEditingSyllabus ? (
          // Edit Mode
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Course Description
              </label>
              <textarea
                value={editingSyllabus.description || ''}
                onChange={(e) => setEditingSyllabus({ ...editingSyllabus, description: e.target.value })}
                placeholder="Overall course description..."
                className="w-full px-4 py-2 bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border rounded-button focus:outline-none focus:border-primary transition-colors text-light-text-primary dark:text-dark-text-primary resize-none"
                rows={3}
              />
            </div>

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
                  onClick={() => {
                    if (newTopicTitle.trim()) {
                      const newItem: SyllabusItem = {
                        title: newTopicTitle.trim(),
                        description: newTopicDescription.trim(),
                        order: (editingSyllabus.items?.length || 0) + 1,
                      };
                      setEditingSyllabus({
                        ...editingSyllabus,
                        items: [...(editingSyllabus.items || []), newItem],
                      });
                      setNewTopicTitle('');
                      setNewTopicDescription('');
                    }
                  }}
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

            {editingSyllabus.items && editingSyllabus.items.length > 0 && (
              <div className="space-y-2">
                {editingSyllabus.items
                  .sort((a, b) => a.order - b.order)
                  .map((item, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center font-semibold text-xs">
                              {item.order}
                            </div>
                            <div className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                              {item.title}
                            </div>
                          </div>
                          {item.description && (
                            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary ml-8">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newItems = editingSyllabus.items?.filter((_, i) => i !== index) || [];
                            const reorderedItems = newItems.map((item, i) => ({ ...item, order: i + 1 }));
                            setEditingSyllabus({ ...editingSyllabus, items: reorderedItems });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setIsEditingSyllabus(false);
                  const currentSyllabus = typeof room.syllabus === 'string' 
                    ? { items: [] } 
                    : (room.syllabus || { items: [] });
                  setEditingSyllabus(currentSyllabus);
                }}
                disabled={savingSyllabus}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={async () => {
                  setSavingSyllabus(true);
                  try {
                    // @ts-ignore
                    const { UpdateRoomSyllabus } = await import('../wailsjs/go/main/App');
                    
                    // Ensure items array exists and is properly formatted
                    const syllabusToSave: Syllabus = {
                      description: editingSyllabus.description || '',
                      items: (editingSyllabus.items || []).map(item => ({
                        title: item.title || '',
                        description: item.description || '',
                        order: item.order || 0,
                      })),
                    };
                    
                    console.log('Saving syllabus:', JSON.stringify(syllabusToSave, null, 2));
                    const updatedRoom = await UpdateRoomSyllabus(room.id, syllabusToSave);
                    console.log('Updated room received (full):', JSON.stringify(updatedRoom, null, 2));
                    console.log('Updated room received (syllabus):', updatedRoom?.syllabus);
                    
                    // Reload room from server to ensure we have the latest data
                    // @ts-ignore
                    const { GetRoom } = await import('../wailsjs/go/main/App');
                    const freshRoom = await GetRoom(room.id);
                    console.log('Fresh room loaded:', freshRoom);
                    console.log('Fresh room syllabus:', freshRoom?.syllabus);
                    
                    // Notify parent component with fresh data
                    if (onRoomUpdate) {
                      console.log('Calling onRoomUpdate with fresh room:', freshRoom);
                      onRoomUpdate(freshRoom);
                    }
                    
                    setIsEditingSyllabus(false);
                    alert('Syllabus updated successfully!');
                  } catch (error: any) {
                    console.error('Failed to update syllabus:', error);
                    alert('Failed to update syllabus: ' + (error.message || JSON.stringify(error) || 'Unknown error'));
                  } finally {
                    setSavingSyllabus(false);
                  }
                }}
                disabled={savingSyllabus}
              >
                <Save className="w-4 h-4 mr-2" />
                {savingSyllabus ? 'Saving...' : 'Save Syllabus'}
              </Button>
            </div>
          </div>
        ) : (
          // View Mode
          <>
            {(() => {
              console.log('RoomProfile render - room:', room);
              console.log('RoomProfile render - room.syllabus:', room.syllabus);
              console.log('RoomProfile render - typeof room.syllabus:', typeof room.syllabus);
              
              if (typeof room.syllabus === 'string') {
                // Legacy string format
                return (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-light-text-secondary dark:text-dark-text-secondary font-sans">
                      {room.syllabus}
                    </pre>
                  </div>
                );
              } else if (room.syllabus && typeof room.syllabus === 'object') {
                // Structured format
                return (
                  <div className="space-y-4">
                    {room.syllabus.description && (
                      <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
                        {room.syllabus.description}
                      </p>
                    )}
                    
                    {room.syllabus.items && room.syllabus.items.length > 0 ? (
                      <div className="space-y-3">
                        {room.syllabus.items
                          .sort((a, b) => a.order - b.order)
                          .map((item, index) => (
                            <div
                              key={index}
                              className="p-4 bg-light-bg dark:bg-dark-bg rounded-button border border-light-text-secondary/10 dark:border-dark-border"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                                  {item.order}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                                    {item.title}
                                  </h4>
                                  {item.description && (
                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-light-text-secondary dark:text-dark-text-secondary text-center py-4">
                        No syllabus topics yet. {canEditSyllabus && 'Click "Edit Syllabus" to add topics.'}
                      </p>
                    )}
                  </div>
                );
              } else {
                return (
                  <p className="text-light-text-secondary dark:text-dark-text-secondary text-center py-4">
                    No syllabus available. {canEditSyllabus && 'Click "Edit Syllabus" to create one.'}
                  </p>
                );
              }
            })()}
          </>
        )}
      </Card>

      {/* Assignments Section - Only visible to members */}
      {isMember && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Assignments
              </h3>
            </div>
            {canEditSyllabus && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCreateAssignmentModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            )}
          </div>

          {loadingAssignments ? (
            <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
              Loading assignments...
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
              {canEditSyllabus
                ? 'No assignments yet. Create one to get started!'
                : 'No assignments available.'}
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="p-4 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="primary" size="sm">
                          {assignment.assignment_type}
                        </Badge>
                        <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                          {assignment.title}
                        </h4>
                        {assignment.total_points > 0 && (
                          <Badge variant="neutral" size="sm">
                            {assignment.total_points} pts
                          </Badge>
                        )}
                      </div>
                      {assignment.subjects && Array.isArray(assignment.subjects) && assignment.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {assignment.subjects.map((subject: string, idx: number) => (
                            <Badge key={idx} variant="neutral" size="sm">
                              📚 {subject}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {assignment.description && (
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Due: {new Date(assignment.due_date).toLocaleString('tr-TR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {canEditSyllabus && (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditAssignment(assignment)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Exam Dates Section - Only visible to members */}
      {isMember && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Exam Dates
              </h3>
            </div>
            {canEditSyllabus && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExamDatesModal(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Manage Exam Dates
              </Button>
            )}
          </div>

          {room.exam_dates && Array.isArray(room.exam_dates) && room.exam_dates.length > 0 ? (
            <div className="space-y-3">
              {room.exam_dates
                .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((exam: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                            {exam.title}
                          </h4>
                          {exam.subject && (
                            <Badge variant="neutral" size="sm">
                              {exam.subject}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
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
                    </div>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
              {canEditSyllabus
                ? 'No exam dates set. Click "Manage Exam Dates" to add them.'
                : 'No exam dates available.'}
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      {showCreateAssignmentModal && (
        <CreateAssignmentModal
          isOpen={showCreateAssignmentModal}
          onClose={() => setShowCreateAssignmentModal(false)}
          onSubmit={handleCreateAssignment}
          syllabus={typeof room.syllabus === 'object' ? room.syllabus : null}
        />
      )}

      {showEditAssignmentModal && editingAssignment && (
        <EditAssignmentModal
          isOpen={showEditAssignmentModal}
          onClose={() => {
            setShowEditAssignmentModal(false);
            setEditingAssignment(null);
          }}
          onSubmit={handleUpdateAssignment}
          assignment={editingAssignment}
          syllabus={typeof room.syllabus === 'object' ? room.syllabus : null}
        />
      )}

      {showExamDatesModal && (
        <ManageExamDatesModal
          isOpen={showExamDatesModal}
          onClose={() => setShowExamDatesModal(false)}
          onSubmit={handleSaveExamDates}
          initialExamDates={
            room.exam_dates && Array.isArray(room.exam_dates)
              ? room.exam_dates.map((ed: any) => ({
                  title: ed.title,
                  date: ed.date,
                  description: ed.description || '',
                  subject: ed.subject || '',
                }))
              : []
          }
          syllabusSubjects={
            room.syllabus && typeof room.syllabus === 'object' && room.syllabus.items
              ? room.syllabus.items.map((item: any) => item.title)
              : []
          }
        />
      )}
    </div>
  );
}
