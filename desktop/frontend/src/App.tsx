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

  // Senkronize: auth durumu değişince ekran ve rolü güncelle
  useEffect(() => {
    if (!user) {
      // Kullanıcı çıkış yaptı → onboarding'e dön ve rolü sıfırla
      setUserRole(null);
      setCurrentScreen('onboarding');
      return;
    }

    // Kullanıcı giriş yaptıysa rolü güncelle
    const role = (user as any).role as 'student' | 'parent' | 'teacher';
    if (userRole !== role) {
      setUserRole(role);
    }

    // Eğer şu an onboarding'deysek, role göre varsayılan ekrana geç
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

  // Kullanıcı yoksa Onboarding göster (en önemli koşul)
  if (!user) {
    return <Onboarding />;
  }

  // Kullanıcı var ama onboarding ekranındaysak Onboarding göster
  if (currentScreen === 'onboarding') {
    return <Onboarding />;
  }

  // Kullanıcı var ama rol yoksa Onboarding göster
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
