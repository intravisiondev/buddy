import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import { colors } from '../constants/theme';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      checkInitialRoute();
    }
  }, [loading, user]);

  const checkInitialRoute = async () => {
    if (user) {
      const role = await storage.getRole();
      if (role === 'teacher') {
        router.replace('/(teacher)/dashboard');
      } else if (role === 'parent') {
        router.replace('/(parent)/dashboard');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    } else {
      router.replace('/onboarding');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightBg, alignItems: 'center', justifyContent: 'center' },
});
