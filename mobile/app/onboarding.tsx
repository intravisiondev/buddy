import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../components/ui/Card';
import { GraduationCap, Users, BookOpen, ChevronRight } from 'lucide-react-native';
import { storage } from '../utils/storage';
import { colors, spacing, fontSize, fontWeight } from '../constants/theme';

export default function Onboarding() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRoleSelect = async (role: 'student' | 'parent' | 'teacher') => {
    setSelectedRole(role);
    await storage.setRole(role);
    router.push('/(auth)/login');
  };

  const roles = [
    {
      id: 'student' as const,
      title: 'Student',
      description: 'Learn, collaborate, and achieve your academic goals',
      icon: GraduationCap,
      color: colors.primary,
    },
    {
      id: 'parent' as const,
      title: 'Parent',
      description: "Monitor your child's progress and support their learning",
      icon: Users,
      color: colors.success,
    },
    {
      id: 'teacher' as const,
      title: 'Teacher',
      description: 'Guide students and manage learning resources',
      icon: BookOpen,
      color: colors.warning,
    },
  ];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* Hero */}
      <View style={s.hero}>
        <View style={s.logoCircle}>
          <GraduationCap size={48} color="#ffffff" />
        </View>
        <Text style={s.title}>Welcome to Buddy</Text>
        <Text style={s.subtitle}>
          Your AI-powered learning companion for focused study, collaboration, and academic success
        </Text>
      </View>

      {/* Role Selection */}
      <Text style={s.sectionTitle}>I am a...</Text>

      {roles.map((role) => {
        const Icon = role.icon;
        const isSelected = selectedRole === role.id;
        return (
          <Card
            key={role.id}
            onPress={() => handleRoleSelect(role.id)}
            style={[
              s.roleCard,
              isSelected && { borderColor: role.color, borderWidth: 2 },
            ]}
          >
            <View style={s.roleRow}>
              <View style={[s.roleIcon, { backgroundColor: `${role.color}18` }]}>
                <Icon size={28} color={role.color} />
              </View>
              <View style={s.roleInfo}>
                <Text style={s.roleTitle}>{role.title}</Text>
                <Text style={s.roleDesc}>{role.description}</Text>
              </View>
              <ChevronRight size={20} color={colors.lightTextSecondary} />
            </View>
          </Card>
        );
      })}

      <Text style={s.legal}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightBg },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: 72 },
  hero: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: { fontSize: 28, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 10 },
  subtitle: { fontSize: fontSize.md, color: colors.lightTextSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 },
  sectionTitle: { fontSize: 20, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 16 },
  roleCard: { marginBottom: 14 },
  roleRow: { flexDirection: 'row', alignItems: 'center' },
  roleIcon: {
    width: 56, height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 3 },
  roleDesc: { fontSize: fontSize.sm, color: colors.lightTextSecondary, lineHeight: 19 },
  legal: { fontSize: 11, color: colors.lightTextSecondary, textAlign: 'center', marginTop: 32, marginBottom: 16 },
});
