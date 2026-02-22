import { createContext, useContext, useState, ReactNode } from 'react';

type Screen = 
  | 'dashboard' 
  | 'rooms' 
  | 'room-list' 
  | 'subject-room' 
  | 'study-plans' 
  | 'study-plan-detail'
  | 'study-plan-builder'
  | 'leaderboard' 
  | 'settings'
  | 'teacher-dashboard'
  | 'parent-dashboard';

type StudyPlanTab = 'dashboard' | 'plans' | 'schedule' | 'milestones' | 'reports';

interface AppContextType {
  userRole: 'student' | 'parent' | 'teacher' | null;
  setUserRole: (role: 'student' | 'parent' | 'teacher' | null) => void;
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  selectedRoom: string | null;
  setSelectedRoom: (roomId: string | null) => void;
  selectedStudyPlan: string | null;
  setSelectedStudyPlan: (planId: string | null) => void;
  studyPlanTab: StudyPlanTab;
  setStudyPlanTab: (tab: StudyPlanTab) => void;
  showAIPanel: boolean;
  setShowAIPanel: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<'student' | 'parent' | 'teacher' | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedStudyPlan, setSelectedStudyPlan] = useState<string | null>(null);
  const [studyPlanTab, setStudyPlanTab] = useState<StudyPlanTab>('dashboard');
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
