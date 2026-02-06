import { useEffect, useMemo, useState } from 'react';
import { Save, Settings as SettingsIcon, User as UserIcon, LogOut } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { userService } from '../services';

type Profile = {
  id?: string;
  user_id?: string;
  bio?: string;
  avatar_url?: string;
  grade?: string;
  school?: string;
  interests?: string[];
};

export default function Settings() {
  const { user, logout } = useAuth();
  const { setCurrentScreen } = useApp();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    bio: '',
    avatar_url: '',
    grade: '',
    school: '',
    interests: '', // comma separated
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const interestsArray = useMemo(() => {
    return form.interests
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [form.interests]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await userService.getMyProfile();
      const prof = (p && typeof p === 'object') ? (p as any) : null;
      setProfile(prof);
      setForm({
        bio: prof?.bio ?? '',
        avatar_url: prof?.avatar_url ?? '',
        grade: prof?.grade ?? '',
        school: prof?.school ?? '',
        interests: Array.isArray(prof?.interests) ? prof.interests.join(', ') : '',
      });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await userService.updateMyProfile({
        bio: form.bio,
        avatar_url: form.avatar_url,
        grade: form.grade,
        school: form.school,
        interests: interestsArray,
      });
      setSuccess('Profile saved');
      // Reload for consistency
      await loadProfile();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear state first for immediate visual feedback
      setCurrentScreen('onboarding');
      // Perform logout
      await logout();
    } catch (error) {
      // Even if error occurs, navigate to onboarding
      console.error('Logout error:', error);
      setCurrentScreen('onboarding');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-light-text-secondary dark:text-dark-text-secondary">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Settings
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Manage your profile and preferences
          </p>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Account */}
        <Card className="p-6 col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserIcon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">Account</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Name</div>
              <div className="text-light-text-primary dark:text-dark-text-primary font-medium">{user?.name ?? '-'}</div>
            </div>
            <div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Email</div>
              <div className="text-light-text-primary dark:text-dark-text-primary font-medium">{user?.email ?? '-'}</div>
            </div>
            <div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Role</div>
              <Badge variant="neutral" size="sm">{user?.role ?? '-'}</Badge>
            </div>
            <div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Age</div>
              <div className="text-light-text-primary dark:text-dark-text-primary font-medium">{user?.age ?? '-'}</div>
            </div>
          </div>
        </Card>

        {/* Profile */}
        <Card className="p-6 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <SettingsIcon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">Profile</h3>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error/10 text-error border border-error/20">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-success/10 text-success border border-success/20">
              {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Bio
              </label>
              <textarea
                className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-text-secondary/20 dark:border-dark-border text-light-text-primary dark:text-dark-text-primary"
                rows={4}
                value={form.bio}
                onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
              />
            </div>

            <Input
              label="Avatar URL"
              placeholder="https://..."
              value={form.avatar_url}
              onChange={(e) => setForm(prev => ({ ...prev, avatar_url: e.target.value }))}
            />
            <Input
              label="Grade"
              placeholder="e.g., 10th Grade"
              value={form.grade}
              onChange={(e) => setForm(prev => ({ ...prev, grade: e.target.value }))}
            />

            <Input
              label="School"
              placeholder="e.g., Ankara Science High School"
              value={form.school}
              onChange={(e) => setForm(prev => ({ ...prev, school: e.target.value }))}
            />
            <Input
              label="Interests (comma separated)"
              placeholder="math, physics, chess"
              value={form.interests}
              onChange={(e) => setForm(prev => ({ ...prev, interests: e.target.value }))}
            />
          </div>

          <div className="mt-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Profile ID: <span className="font-mono">{profile?.id ?? '-'}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
