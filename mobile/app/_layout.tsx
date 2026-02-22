import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { AppProvider } from '../contexts/AppContext';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(teacher)" />
            <Stack.Screen name="(parent)" />
            <Stack.Screen name="room/[id]" />
            <Stack.Screen name="study-plan/[id]" />
            <Stack.Screen name="settings" />
          </Stack>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
