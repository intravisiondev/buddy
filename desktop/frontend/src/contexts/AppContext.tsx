import { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'student' | 'parent' | 'teacher' | null;
type Screen = 'onboarding' | 'dashboard' | 'room' | 'study-plan' | 'leaderboard' | 'parent-dashboard' | 'teacher-dashboard' | 'settings';

type StudyPlanTab = 'dashboard' | 'plans' | 'schedule' | 'milestones';

interface AppContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  selectedRoom: string | null;
  setSelectedRoom: (room: string | null) => void;
  selectedStudyPlan: string | null;
  setSelectedStudyPlan: (planId: string | null) => void;
  studyPlanTab: StudyPlanTab | null;
  setStudyPlanTab: (tab: StudyPlanTab | null) => void;
  showAIPanel: boolean;
  setShowAIPanel: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedStudyPlan, setSelectedStudyPlan] = useState<string | null>(null);
  const [studyPlanTab, setStudyPlanTab] = useState<StudyPlanTab | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  return (
    <AppContext.Provider
      value={{
        userRole,
        setUserRole,
        currentScreen,
        setCurrentScreen,
        selectedRoom,
        setSelectedRoom,
        selectedStudyPlan,
        setSelectedStudyPlan,
        studyPlanTab,
        setStudyPlanTab,
        showAIPanel,
        setShowAIPanel,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
