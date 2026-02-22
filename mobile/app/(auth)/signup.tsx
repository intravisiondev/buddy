import { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../utils/storage';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

export default function Signup() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !age) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }
    setLoading(true);
    try {
      const role = await storage.getRole();
      const response = await signup(email, password, name, ageNum, role || 'student');
      const userRole = response?.user?.role ?? role;
      if (userRole === 'teacher') {
        router.replace('/(teacher)/dashboard');
      } else if (userRole === 'parent') {
        router.replace('/(parent)/dashboard');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <View style={s.header}>
          <View style={s.iconCircle}>
            <Text style={s.iconText}>+</Text>
          </View>
          <Text style={s.title}>Create Account</Text>
          <Text style={s.subtitle}>Join Buddy and start your learning journey</Text>
        </View>

        <Input label="Full Name" value={name} onChangeText={setName} placeholder="Enter your name" autoComplete="name" />
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Input label="Password" value={password} onChangeText={setPassword} placeholder="Create a password" secureTextEntry autoComplete="password" />
        <Input label="Age" value={age} onChangeText={setAge} placeholder="Enter your age" keyboardType="numeric" />

        <Button onPress={handleSignup} loading={loading} style={{ marginTop: 8, marginBottom: 16 }}>
          Create Account
        </Button>

        <Button variant="ghost" onPress={() => router.push('/(auth)/login')}>
          Already have an account? Sign in
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
    backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 8 },
  subtitle: { fontSize: fontSize.md, color: colors.lightTextSecondary, textAlign: 'center' },
});
