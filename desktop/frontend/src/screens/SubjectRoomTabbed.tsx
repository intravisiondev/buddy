import { useState, useEffect } from 'react';
import { ArrowLeft, Loader, BookOpen, MessageCircle, FolderOpen, Gamepad2, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import RoomProfile from '../components/RoomProfile';
import SubjectRoomChat from '../components/SubjectRoomChat';
import ResourcesTab from '../components/ResourcesTab';
import AICoachTab from '../components/AICoachTab';
// Import placeholder components
// import GamesTab from '../components/GamesTab';

type TabType = 'profile' | 'chat' | 'resources' | 'games' | 'ai-coach';

export default function SubjectRoomTabbed() {
  const { selectedRoom, setSelectedRoom, setCurrentScreen } = useApp();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [roomDetails, setRoomDetails] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [joining, setJoining] = useState(false);

  // Load room details and membership status
  useEffect(() => {
    if (selectedRoom) {
      loadRoomData();
    }
  }, [selectedRoom]);

  const loadRoomData = async () => {
    setLoadingRoom(true);
    try {
      // @ts-ignore
      const { GetRoom } = await import('../wailsjs/go/main/App');
      
      const room = await GetRoom(selectedRoom);
      console.log('loadRoomData - room loaded:', room);
      console.log('loadRoomData - room.syllabus:', room?.syllabus);
      setRoomDetails(room);

      // Check membership
      await checkMembership();
    } catch (error) {
      console.error('Failed to load room data:', error);
    } finally {
      setLoadingRoom(false);
    }
  };

  const checkMembership = async () => {
    try {
      // @ts-ignore
      const { GetRoomMembers } = await import('../wailsjs/go/main/App');
      const members = await GetRoomMembers(selectedRoom);
      
      const userIsMember = Array.isArray(members) && members.some((m: any) => m.user_id === user?.id);
      setIsMember(userIsMember);
      
      // If user is a member, switch to chat tab
      if (userIsMember && activeTab === 'profile') {
        setActiveTab('chat');
      }
    } catch (error) {
      console.error('Failed to check membership:', error);
    }
  };

  const handleRoomUpdate = (updatedRoom: any) => {
    console.log('Room updated in SubjectRoomTabbed - full object:', updatedRoom);
    console.log('Room updated in SubjectRoomTabbed - syllabus:', updatedRoom?.syllabus);
    console.log('Room updated in SubjectRoomTabbed - syllabus type:', typeof updatedRoom?.syllabus);
    setRoomDetails(updatedRoom);
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      // @ts-ignore
      const { JoinRoom } = await import('../wailsjs/go/main/App');
      await JoinRoom(selectedRoom);
      
      setIsMember(true);
      setActiveTab('chat');
      alert('Successfully joined the classroom!');
    } catch (error: any) {
      console.error('Failed to join room:', error);
      alert('Failed to join room: ' + error.message);
    } finally {
      setJoining(false);
    }
  };

  const handleBack = () => {
    setSelectedRoom(null);
    setCurrentScreen('room');
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: BookOpen, available: true },
    { id: 'chat' as TabType, label: 'Chat', icon: MessageCircle, available: isMember },
    { id: 'resources' as TabType, label: 'Resources', icon: FolderOpen, available: isMember },
    { id: 'games' as TabType, label: 'Games', icon: Gamepad2, available: isMember },
    { id: 'ai-coach' as TabType, label: 'AI Coach', icon: Sparkles, available: isMember },
  ];

  if (loadingRoom) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading classroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Tabs */}
      <div className="border-b border-light-text-secondary/10 dark:border-dark-border bg-light-card dark:bg-dark-card">
        <div className="p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="hover:bg-gradient-card dark:hover:bg-gradient-card-dark mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Rooms
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isAvailable = tab.available;

            return (
              <button
                key={tab.id}
                onClick={() => isAvailable && setActiveTab(tab.id)}
                disabled={!isAvailable}
                className={`flex items-center gap-2 px-6 py-3 rounded-t-button transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'bg-light-bg dark:bg-dark-bg text-primary border-b-2 border-primary font-semibold'
                    : isAvailable
                    ? 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg/50 dark:hover:bg-dark-bg/50'
                    : 'text-light-text-secondary/50 dark:text-dark-text-secondary/50 cursor-not-allowed'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-light-bg dark:bg-dark-bg">
        {activeTab === 'profile' && roomDetails && (
          <RoomProfile
            room={roomDetails}
            onRoomUpdate={handleRoomUpdate}
            isMember={isMember}
            onJoin={handleJoin}
            joining={joining}
          />
        )}

        {activeTab === 'chat' && isMember && (
          <SubjectRoomChat roomId={selectedRoom} />
        )}

        {activeTab === 'resources' && isMember && (
          <ResourcesTab roomId={selectedRoom} />
        )}

        {activeTab === 'games' && isMember && (
          <div className="p-8 text-center">
            <Gamepad2 className="w-16 h-16 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
              Games Coming Soon
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              Quiz, flashcards and more educational games will be available here
            </p>
          </div>
        )}

        {activeTab === 'ai-coach' && isMember && (
          <AICoachTab roomId={selectedRoom} />
        )}
      </div>
    </div>
  );
}
