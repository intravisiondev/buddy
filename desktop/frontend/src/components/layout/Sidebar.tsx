import { Home, BookOpen, Trophy, Calendar, Users, Moon, Sun, Settings } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar() {
  const { currentScreen, setCurrentScreen, userRole, setSelectedRoom } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const studentNavItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'room', icon: BookOpen, label: 'Study Rooms' },
    { id: 'study-plan', icon: Calendar, label: 'Study Plans' },
    { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const parentNavItems = [
    { id: 'parent-dashboard', icon: Home, label: 'Dashboard' },
    { id: 'leaderboard', icon: Trophy, label: 'Progress' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const teacherNavItems = [
    { id: 'teacher-dashboard', icon: Home, label: 'Dashboard' },
    { id: 'room', icon: Users, label: 'Classrooms' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const navItems = userRole === 'parent' ? parentNavItems : userRole === 'teacher' ? teacherNavItems : studentNavItems;

  const handleNavClick = (itemId: string) => {
    if (itemId === 'room') {
      setSelectedRoom(null);
    }
    setCurrentScreen(itemId as any);
  };

  return (
    <aside className="w-64 h-screen bg-light-card dark:bg-dark-card border-r border-light-text-secondary/10 dark:border-dark-border flex flex-col backdrop-blur-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-card dark:bg-gradient-card-dark opacity-50 pointer-events-none"></div>

      <div className="relative z-10 p-6 border-b border-light-text-secondary/10 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-button flex items-center justify-center shadow-glow animate-pulse-slow">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Buddy</h2>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Learn Together</p>
          </div>
        </div>
      </div>

      <nav className="relative z-10 flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-button transition-all duration-300 transform ${
                isActive
                  ? 'bg-gradient-primary text-white shadow-glow scale-105'
                  : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-gradient-card dark:hover:bg-gradient-card-dark hover:text-primary hover:scale-105 hover:shadow-soft'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="relative z-10 p-4 border-t border-light-text-secondary/10 dark:border-dark-border space-y-3">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-button text-light-text-secondary dark:text-dark-text-secondary hover:bg-gradient-card dark:hover:bg-gradient-card-dark hover:text-primary transition-all duration-300 hover:scale-105"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          <span className="font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        <button
          onClick={() => setCurrentScreen('settings' as any)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-button bg-gradient-card dark:bg-gradient-card-dark hover:shadow-soft transition-all"
        >
          <Avatar name={user?.name || 'User'} status="online" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary capitalize">{userRole || 'Student'}</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
