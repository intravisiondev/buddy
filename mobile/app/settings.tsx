import { View, Text, ScrollView, Switch, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { Moon, Sun, LogOut, ChevronRight, Bell, Shield, HelpCircle, Info } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight } from '../constants/theme';

export default function Settings() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  const menuItems = [
    { label: 'Notifications', icon: Bell, color: colors.primary },
    { label: 'Privacy & Security', icon: Shield, color: colors.success },
    { label: 'Help & Support', icon: HelpCircle, color: colors.accent },
    { label: 'About', icon: Info, color: colors.warning },
  ];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.pageTitle}>Settings</Text>

      {/* Profile Card */}
      <Card style={s.profileCard}>
        <View style={s.profileRow}>
          <Avatar name={user?.name || 'User'} src={user?.avatar} size="xl" />
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{user?.name}</Text>
            <Text style={s.profileEmail}>{user?.email}</Text>
            <Badge variant={user?.role === 'teacher' ? 'warning' : user?.role === 'parent' ? 'success' : 'primary'} style={{ marginTop: 6 }}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student'}
            </Badge>
          </View>
        </View>
      </Card>

      {/* Preferences */}
      <Text style={s.sectionTitle}>Preferences</Text>

      <Card style={{ marginBottom: 12 }}>
        <View style={s.menuRow}>
          <View style={[s.menuIcon, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(245,158,11,0.12)' }]}>
            {isDark ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.warning} />}
          </View>
          <Text style={s.menuLabel}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#e5e7eb', true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </Card>

      {/* Menu Items */}
      <Text style={s.sectionTitle}>General</Text>
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} style={{ marginBottom: 8 }}>
            <View style={s.menuRow}>
              <View style={[s.menuIcon, { backgroundColor: `${item.color}1A` }]}>
                <Icon size={20} color={item.color} />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <ChevronRight size={20} color={colors.lightTextSecondary} />
            </View>
          </Card>
        );
      })}

      {/* Logout */}
      <View style={s.logoutWrap}>
        <Button
          variant="error"
          onPress={handleLogout}
          icon={<LogOut size={18} color="#ffffff" />}
        >
          Logout
        </Button>
      </View>

      <Text style={s.version}>Buddy v1.0.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightBg },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: 56 },
  pageTitle: { fontSize: 28, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 24 },
  profileCard: { marginBottom: 24 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.lightTextPrimary },
  profileEmail: { fontSize: fontSize.sm, color: colors.lightTextSecondary, marginTop: 2 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.lightTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.lightTextPrimary },
  logoutWrap: { marginTop: 24, marginBottom: 16 },
  version: { fontSize: fontSize.xs, color: colors.lightTextSecondary, textAlign: 'center', marginBottom: 32 },
});
