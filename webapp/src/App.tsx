import { useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import AIAssistantPanel from './components/AIAssistantPanel';
import Onboarding from './screens/Onboarding';
import StudentDashboard from './screens/StudentDashboard';
import SubjectRoomTabbed from './screens/SubjectRoomTabbed';
import RoomList from './screens/RoomList';
import StudyPlans from './screens/StudyPlans';
import StudyPlanDetail from './screens/StudyPlanDetail';
import Settings from './screens/Settings';
import Leaderboard from './screens/Leaderboard';
import ParentDashboard from './screens/ParentDashboard';
import TeacherDashboard from './screens/TeacherDashboard';

function AppContent() {
  const { currentScreen, userRole, selectedRoom, selectedStudyPlan, setCurrentScreen, setUserRole } = useApp();
  const { user } = useAuth();

  // Sync: update screen and role when auth state changes
  useEffect(() => {
    if (!user) {
      // User logged out → return to onboarding and reset role
      setUserRole(null);
      setCurrentScreen('onboarding');
      return;
    }

    // Update role if user is logged in
    const role = (user as any).role as 'student' | 'parent' | 'teacher';
    if (userRole !== role) {
      setUserRole(role);
    }

    // If currently on onboarding, navigate to default screen based on role
    if (currentScreen === 'onboarding') {
      if (role === 'teacher') {
        setCurrentScreen('teacher-dashboard');
      } else if (role === 'parent') {
        setCurrentScreen('parent-dashboard');
      } else {
        setCurrentScreen('dashboard');
      }
    }
  }, [user, currentScreen, userRole, setCurrentScreen, setUserRole]);

  // Show Onboarding if no user (most important condition)
  if (!user) {
    return <Onboarding />;
  }

  // User exists but on onboarding screen
  if (currentScreen === 'onboarding') {
    return <Onboarding />;
  }

  // User exists but no role
  if (!userRole) {
    return <Onboarding />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <StudentDashboard />;
      case 'room':
        return selectedRoom ? <SubjectRoomTabbed /> : <RoomList />;
      case 'study-plan':
        return selectedStudyPlan ? <StudyPlanDetail /> : <StudyPlans />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'parent-dashboard':
        return <ParentDashboard />;
      case 'teacher-dashboard':
        return <TeacherDashboard />;
      case 'settings':
        return <Settings />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <>
      <Layout>{renderScreen()}</Layout>
      <AIAssistantPanel />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
