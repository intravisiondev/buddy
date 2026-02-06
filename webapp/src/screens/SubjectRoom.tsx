import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Users, Send, ArrowLeft, Loader, Clock, CheckCheck } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useApiMessages } from '../hooks/useApi';
import { roomService } from '../services';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';

export default function SubjectRoom() {
  const { selectedRoom, setSelectedRoom, setCurrentScreen } = useApp();
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const [roomDetails, setRoomDetails] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading: loadingMessages, sendMessage } = useApiMessages(selectedRoom);

  // Load room details and members
  useEffect(() => {
    if (selectedRoom) {
      loadRoomData();
    }
  }, [selectedRoom]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadRoomData = async () => {
    setLoadingRoom(true);
    try {
      const [room, roomMembers] = await Promise.all([
        roomService.getRoom(selectedRoom!).catch(() => null),
        roomService.getRoomMembers(selectedRoom!).catch(() => []),
      ]);

      setRoomDetails(room);
      setMembers(Array.isArray(roomMembers) ? roomMembers : []);
    } catch (error) {
      console.error('Failed to load room data:', error);
    } finally {
      setLoadingRoom(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      await sendMessage(messageInput.trim());
      setMessageInput('');
    } catch (error: any) {
      alert('Failed to send message: ' + error.message);
    }
  };

  const handleBack = () => {
    setSelectedRoom(null);
    setCurrentScreen('room');
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (loadingRoom) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-light-text-secondary/10 dark:border-dark-border p-6 bg-light-card dark:bg-dark-card">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="hover:bg-gradient-card dark:hover:bg-gradient-card-dark"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Rooms
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
                {roomDetails?.name || 'Study Room'}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
                  <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {members.length} members
                  </span>
                </div>
                {roomDetails?.subject && (
                  <Badge variant="primary" size="sm">{roomDetails.subject}</Badge>
                )}
                {roomDetails?.is_live && (
                  <Badge variant="success" size="sm">Active</Badge>
                )}
              </div>
            </div>
          </div>
          {roomDetails?.description && (
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-3">
              {roomDetails.description}
            </p>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-light-bg dark:bg-dark-bg">
          {loadingMessages && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-light-text-secondary dark:text-dark-text-secondary mx-auto mb-4 opacity-50" />
                <p className="text-light-text-secondary dark:text-dark-text-secondary">
                  No messages yet. Start the conversation!
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isMyMessage = message.user_id === user?.id;
                const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;

                return (
                  <div
                    key={message.id || index}
                    className={`flex gap-3 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {showAvatar ? (
                      <Avatar name={message.user_name || message.user_id} size="sm" />
                    ) : (
                      <div className="w-8" />
                    )}
                    <div className={`flex-1 max-w-[70%] ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                      {showAvatar && !isMyMessage && (
                        <span className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                          {message.user_name || 'Unknown User'}
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isMyMessage
                            ? 'bg-gradient-primary text-white'
                            : 'bg-light-card dark:bg-dark-card text-light-text-primary dark:text-dark-text-primary'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          isMyMessage ? 'text-white/70' : 'text-light-text-secondary dark:text-dark-text-secondary'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(message.created_at)}</span>
                          {isMyMessage && (
                            <CheckCheck className="w-3 h-3 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-light-text-secondary/10 dark:border-dark-border p-4 bg-light-card dark:bg-dark-card">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={loadingMessages}
            />
            <Button
              type="submit"
              disabled={!messageInput.trim() || loadingMessages}
              className="px-6"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Members Sidebar */}
      <div className="w-80 border-l border-light-text-secondary/10 dark:border-dark-border bg-light-card dark:bg-dark-card overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-light-text-primary dark:text-dark-text-primary" />
            <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
              Members ({members.length})
            </h3>
          </div>

          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center py-4">
                No members yet
              </p>
            ) : (
              members.map((member: any, index: number) => (
                <Card key={member.user_id || index} className="p-3 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.user_name || member.user_id} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-light-text-primary dark:text-dark-text-primary truncate">
                        {member.user_id === user?.id ? 'You' : (member.user_name || 'Unknown User')}
                      </p>
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {member.role === 'moderator' ? 'Moderator' : member.role === 'owner' ? 'Owner' : 'Member'}
                      </p>
                    </div>
                    {member.is_active && (
                      <span className="w-2 h-2 bg-success rounded-full"></span>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
