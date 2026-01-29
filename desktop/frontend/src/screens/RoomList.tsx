import { useState, useEffect } from 'react';
import { Users, Grid3x3, List, Search, Plus, Clock, Sparkles, MessageCircle, BookOpen, Lock, Loader } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useWailsRooms } from '../hooks/useWails';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import CreateRoomModal from '../components/CreateRoomModal';

export default function RoomList() {
  const { setCurrentScreen, setSelectedRoom } = useApp();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { rooms, loading, loadRooms, createRoom, joinRoom } = useWailsRooms(selectedSubject, isTeacher);

  useEffect(() => {
    loadRooms();
  }, [selectedSubject]);

  const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Biology', 'English', 'History'];

  const safeRooms = Array.isArray(rooms) ? rooms : [];

  const filteredRooms = safeRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRoomClick = (roomId: string) => {
    setSelectedRoom(roomId);
    setCurrentScreen('room');
  };

  const handleJoinRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    try {
      await joinRoom(roomId);
      alert('Successfully joined the room!');
      handleRoomClick(roomId);
    } catch (error: any) {
      alert('Failed to join room: ' + error.message);
    }
  };

  const handleSubjectFilter = (subject: string) => {
    setSelectedSubject(subject === 'All' ? '' : subject);
  };

  const handleCreateRoom = async (data: {
    name: string;
    subject: string;
    description: string;
    syllabus: any; // Structured syllabus or null
    isPrivate: boolean;
    maxMembers: number;
  }) => {
    try {
      await createRoom(
        data.name,
        data.subject,
        data.description,
        data.syllabus,
        data.isPrivate,
        data.maxMembers
      );
      alert('Room created successfully!');
      loadRooms(); // Reload rooms
    } catch (error: any) {
      throw error;
    }
  };

  const getColorClasses = (subject: string) => {
    const colors: Record<string, string> = {
      Mathematics: 'from-primary/20 to-primary/5 border-primary/30',
      Physics: 'from-accent/20 to-accent/5 border-accent/30',
      Chemistry: 'from-success/20 to-success/5 border-success/30',
      Biology: 'from-success/20 to-success/5 border-success/30',
      'Computer Science': 'from-primary/20 to-primary/5 border-primary/30',
      English: 'from-accent/20 to-accent/5 border-accent/30',
      History: 'from-warning/20 to-warning/5 border-warning/30',
    };
    return colors[subject] || 'from-primary/20 to-primary/5 border-primary/30';
  };

  if (loading && safeRooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            {isTeacher ? 'My Classrooms' : 'Study Rooms'}
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            {isTeacher
              ? 'Manage your classrooms and connect with students'
              : 'Join study groups and collaborate with peers'}
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5" />
            Create Room
          </Button>
        )}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search rooms by name, subject, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <div className="flex gap-2 border-2 border-light-text-secondary/20 dark:border-dark-border rounded-button p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-button transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-gradient-primary text-white shadow-soft'
                  : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-gradient-card dark:hover:bg-gradient-card-dark'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-button transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-gradient-primary text-white shadow-soft'
                  : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-gradient-card dark:hover:bg-gradient-card-dark'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {subjects.map((subject) => (
          <Button
            key={subject}
            variant={selectedSubject === (subject === 'All' ? '' : subject) ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleSubjectFilter(subject)}
          >
            {subject}
          </Button>
        ))}
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-3 gap-6">
          {filteredRooms.map((room, index) => (
            <Card
              key={room.id}
              hover
              onClick={() => handleRoomClick(room.id)}
              className={`p-6 bg-gradient-to-br ${getColorClasses(room.subject)} animate-scale-in cursor-pointer`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                      {room.name}
                    </h3>
                    {room.is_private && (
                      <Lock className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                    )}
                  </div>
                  <Badge variant="neutral" size="sm">{room.subject}</Badge>
                </div>
                {room.is_live && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-error/10 border border-error/30 rounded-full">
                    <span className="w-2 h-2 bg-error rounded-full animate-pulse"></span>
                    <span className="text-xs font-medium text-error">Live</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4 line-clamp-2">
                {room.description || 'No description'}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-light-text-secondary/10 dark:border-dark-border">
                <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  <Users className="w-4 h-4" />
                  <span>{room.max_members} max</span>
                </div>
                {!isTeacher && (
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={(e) => handleJoinRoom(e, room.id)}
                  >
                    Join
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRooms.map((room, index) => (
            <Card
              key={room.id}
              hover
              onClick={() => handleRoomClick(room.id)}
              className="p-6 animate-scale-in cursor-pointer"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-card bg-gradient-to-br ${getColorClasses(room.subject)} flex items-center justify-center flex-shrink-0`}>
                  <BookOpen className="w-10 h-10 text-light-text-primary dark:text-dark-text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                      {room.name}
                    </h3>
                    {room.is_live && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-error/10 border border-error/30 rounded-full">
                        <span className="w-2 h-2 bg-error rounded-full animate-pulse"></span>
                        <span className="text-xs font-medium text-error">Live</span>
                      </div>
                    )}
                    {room.is_private && (
                      <Lock className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                    )}
                  </div>

                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-3">
                    {room.description || 'No description'}
                  </p>

                  <div className="flex items-center gap-6">
                    <Badge variant="neutral" size="sm">{room.subject}</Badge>
                    <div className="flex items-center gap-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      <Users className="w-4 h-4" />
                      <span>{room.max_members} max members</span>
                    </div>
                  </div>
                </div>

                {!isTeacher && (
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={(e) => handleJoinRoom(e, room.id)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Join Room
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredRooms.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-card dark:bg-gradient-card-dark rounded-card mb-4">
            <Sparkles className="w-8 h-8 text-light-text-secondary dark:text-dark-text-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
            No rooms found
          </h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
            {isTeacher 
              ? "You haven't created any rooms yet" 
              : 'No rooms available at the moment'}
          </p>
          {isTeacher && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5" />
              Create New Room
            </Button>
          )}
        </Card>
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateRoom}
      />
    </div>
  );
}
