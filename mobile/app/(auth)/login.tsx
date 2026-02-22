import { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../utils/storage';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const response = await login(email, password);
      const role = response?.user?.role ?? (await storage.getRole());
      if (role === 'teacher') {
        router.replace('/(teacher)/dashboard');
      } else if (role === 'parent') {
        router.replace('/(parent)/dashboard');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <View style={s.header}>
          <View style={s.iconCircle}>
            <Text style={s.iconEmoji}>👋</Text>
          </View>
          <Text style={s.title}>Welcome Back!</Text>
          <Text style={s.subtitle}>Sign in to continue learning</Text>
        </View>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          autoComplete="password"
        />

        <Button onPress={handleLogin} loading={loading} style={{ marginTop: 8, marginBottom: 16 }}>
          Sign In
        </Button>

        <Button variant="ghost" onPress={() => router.push('/(auth)/signup')}>
          Don't have an account? Sign up
        </Button>

        <Button variant="ghost" onPress={() => router.back()} style={{ marginTop: 16 }}>
          Choose a different role
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.lightBg },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  iconEmoji: { fontSize: 32 },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 8 },
  subtitle: { fontSize: fontSize.md, color: colors.lightTextSecondary, textAlign: 'center' },
});
