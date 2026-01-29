import { useState, useEffect } from 'react';
import { X, User, Mail, Calendar, Briefcase, BookOpen, Trophy, Flame, Gem, Sparkles, Award, UserPlus, Check, Clock } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { useWailsUserProfile, useWailsFriends } from '../../hooks/useWails';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  userAvatar?: string;
}

export default function ProfileModal({ isOpen, onClose, userId, userName, userAvatar }: ProfileModalProps) {
  const { user: currentUser } = useAuth();
  const { getUserProfile, getUserStats } = useWailsUserProfile();
  const { sendFriendRequest, friends, loadFriends } = useWailsFriends();

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<'none' | 'friend' | 'requested' | 'loading'>('none');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadProfileData();
      checkFriendStatus();
    } else {
      // Reset state when modal closes
      setProfile(null);
      setStats(null);
      setLoading(true);
      setFriendStatus('none');
      setError(null);
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, statsData] = await Promise.all([
        getUserProfile(userId),
        getUserStats(userId),
      ]);
      setProfile(profileData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkFriendStatus = async () => {
    try {
      await loadFriends();
      // Check if user is already a friend
      const isFriend = Array.isArray(friends) && friends.some((f: any) => 
        f.user_id === userId || f.friend_id === userId || f.id === userId
      );
      if (isFriend) {
        setFriendStatus('friend');
      } else {
        setFriendStatus('none');
      }
    } catch (err) {
      console.error('Failed to check friend status:', err);
    }
  };

  const handleSendFriendRequest = async () => {
    if (friendStatus !== 'none' || !userId || userId === currentUser?.id) return;
    
    setFriendStatus('loading');
    try {
      await sendFriendRequest(userId);
      setFriendStatus('requested');
    } catch (err: any) {
      setError(err.message || 'Failed to send friend request');
      setFriendStatus('none');
    }
  };

  if (!isOpen) return null;

  const displayName = profile?.name || userName || 'Unknown User';
  const displayAvatar = profile?.avatar_url || userAvatar;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-light-text-secondary dark:text-dark-text-secondary">Loading profile...</div>
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="p-4 bg-light-danger/10 dark:bg-dark-danger/10 border border-light-danger dark:border-dark-danger rounded-lg">
            <p className="text-sm text-light-danger dark:text-dark-danger">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-6">
            <Avatar name={displayName} size="xl" src={displayAvatar} />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                {displayName}
              </h2>
              {profile?.bio && (
                <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
                  {profile.bio}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {profile?.grade && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{profile.grade}</span>
                  </div>
                )}
                {profile?.school && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{profile.school}</span>
                  </div>
                )}
              </div>
              {profile?.interests && Array.isArray(profile.interests) && profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.interests.map((interest: string, idx: number) => (
                    <Badge key={idx} variant="neutral" size="sm">{interest}</Badge>
                  ))}
                </div>
              )}
            </div>
            {userId !== currentUser?.id && (
              <div>
                {friendStatus === 'none' && (
                  <Button onClick={handleSendFriendRequest} size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Friend
                  </Button>
                )}
                {friendStatus === 'friend' && (
                  <Button variant="secondary" size="sm" disabled>
                    <Check className="w-4 h-4 mr-2" />
                    Friends
                  </Button>
                )}
                {friendStatus === 'requested' && (
                  <Button variant="secondary" size="sm" disabled>
                    <Clock className="w-4 h-4 mr-2" />
                    Request Sent
                  </Button>
                )}
                {friendStatus === 'loading' && (
                  <Button variant="secondary" size="sm" disabled>
                    Loading...
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="p-2 bg-primary/10 rounded-button mb-2 w-fit">
                  <Trophy className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {stats.total_xp?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Total XP</p>
              </Card>

              <Card className="p-4">
                <div className="p-2 bg-success/10 rounded-button mb-2 w-fit">
                  <Award className="w-4 h-4 text-success" />
                </div>
                <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  Level {stats.level || 1}
                </p>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Level</p>
              </Card>

              <Card className="p-4">
                <div className="p-2 bg-warning/10 rounded-button mb-2 w-fit">
                  <Flame className="w-4 h-4 text-warning" />
                </div>
                <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {stats.current_streak || 0}
                </p>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Day Streak</p>
              </Card>

              <Card className="p-4">
                <div className="p-2 bg-accent/10 rounded-button mb-2 w-fit">
                  <Gem className="w-4 h-4 text-accent" />
                </div>
                <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  {stats.gems || 0}
                </p>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Gems</p>
              </Card>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            {stats?.tokens !== undefined && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Tokens</span>
                </div>
                <p className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">
                  {stats.tokens || 0}
                </p>
              </Card>
            )}
            {stats?.badges_earned !== undefined && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Badges</span>
                </div>
                <p className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">
                  {stats.badges_earned || 0}
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
