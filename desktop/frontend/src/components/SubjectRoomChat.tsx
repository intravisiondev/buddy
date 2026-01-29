import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, Clock, CheckCheck, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWailsMessages } from '../hooks/useWails';
import Card from './ui/Card';
import Button from './ui/Button';
import Avatar from './ui/Avatar';
import Input from './ui/Input';
import ProfileModal from './modals/ProfileModal';

interface SubjectRoomChatProps {
  roomId: string;
}

export default function SubjectRoomChat({ roomId }: SubjectRoomChatProps) {
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | undefined>(undefined);
  const [selectedUserAvatar, setSelectedUserAvatar] = useState<string | undefined>(undefined);

  const { messages, loading: loadingMessages, sendMessage } = useWailsMessages(roomId);
  
  // Safe messages array
  const safeMessages = Array.isArray(messages) ? messages : [];

  // Load room members
  useEffect(() => {
    if (roomId) {
      loadMembers();
    }
  }, [roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [safeMessages]);

  const loadMembers = async () => {
    try {
      // @ts-ignore
      const { GetRoomMembers } = await import('../wailsjs/go/main/App');
      const roomMembers = await GetRoomMembers(roomId);
      setMembers(Array.isArray(roomMembers) ? roomMembers : []);
    } catch (error) {
      console.error('Failed to load members:', error);
      setMembers([]);
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

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loadingMessages && safeMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : safeMessages.length === 0 ? (
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
              {safeMessages.map((message, index) => {
                const isMyMessage = message.user_id === user?.id;
                const showAvatar = index === 0 || safeMessages[index - 1].user_id !== message.user_id;

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
              Members ({Array.isArray(members) ? members.length : 0})
            </h3>
          </div>

          <div className="space-y-3">
            {Array.isArray(members) && members.length === 0 ? (
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center py-4">
                No members yet
              </p>
            ) : Array.isArray(members) ? (
              members.map((member: any, index: number) => {
                const memberUserId = member.user_id;
                const memberName = member.user_name || 'Unknown User';
                const isCurrentUser = memberUserId === user?.id;
                
                return (
                  <Card 
                    key={memberUserId || index} 
                    className={`p-3 hover:bg-light-bg dark:hover:bg-dark-bg transition-colors ${!isCurrentUser ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (!isCurrentUser && memberUserId) {
                        setSelectedUserId(memberUserId);
                        setSelectedUserName(memberName);
                        setSelectedUserAvatar(member.avatar_url);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={memberName} size="sm" src={member.avatar_url} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-light-text-primary dark:text-dark-text-primary truncate">
                          {isCurrentUser ? 'You' : memberName}
                        </p>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                          {member.role === 'moderator' ? 'Moderator' : member.role === 'owner' ? 'Owner' : 'Member'}
                        </p>
                      </div>
                      {!isCurrentUser && memberUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserId(memberUserId);
                            setSelectedUserName(memberName);
                            setSelectedUserAvatar(member.avatar_url);
                          }}
                        >
                          Profil
                        </Button>
                      )}
                      {member.is_active && (
                        <span className="w-2 h-2 bg-success rounded-full"></span>
                      )}
                    </div>
                  </Card>
                );
              })
            ) : null}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedUserId && (
        <ProfileModal
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
          userId={selectedUserId}
          userName={selectedUserName}
          userAvatar={selectedUserAvatar}
        />
      )}
    </div>
  );
}
