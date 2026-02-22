import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { Users, TrendingUp, Clock, Target, Plus, Settings, UserPlus } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, shadows } from '../../constants/theme';

export default function ParentDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const stats = [
    { label: 'Children', value: '0', icon: Users, color: colors.primary, bg: 'rgba(99,102,241,0.12)' },
    { label: 'Study Hours', value: '0h', icon: Clock, color: colors.success, bg: 'rgba(16,185,129,0.12)' },
    { label: 'Progress', value: '0%', icon: TrendingUp, color: colors.accent, bg: 'rgba(139,92,246,0.12)' },
    { label: 'Goals Met', value: '0', icon: Target, color: colors.warning, bg: 'rgba(245,158,11,0.12)' },
  ];

  const actions = [
    { label: 'Add Child', icon: UserPlus, color: colors.primary },
    { label: 'View Activity Report', icon: TrendingUp, color: colors.success },
    { label: 'Set Goals', icon: Target, color: colors.accent },
  ];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>Parent Dashboard</Text>
          <Text style={s.subGreeting}>Welcome, {user?.name}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={{ marginRight: 12 }}>
          <Settings size={22} color={colors.lightTextSecondary} />
        </TouchableOpacity>
        <Avatar name={user?.name || 'Parent'} src={user?.avatar} size="lg" />
      </View>

      {/* Stats Grid */}
      <View style={s.statsGrid}>
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} style={s.statCard}>
              <View style={s.statRow}>
                <View>
                  <Text style={s.statLabel}>{item.label}</Text>
                  <Text style={s.statValue}>{item.value}</Text>
                </View>
                <View style={[s.statIcon, { backgroundColor: item.bg }]}>
                  <Icon size={22} color={item.color} />
                </View>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Children */}
      <Text style={s.sectionTitle}>My Children</Text>
      <Card style={s.emptyCard}>
        <View style={s.emptyInner}>
          <View style={[s.emptyIconWrap, { backgroundColor: 'rgba(99,102,241,0.1)' }]}>
            <Users size={32} color={colors.primary} />
          </View>
          <Text style={s.emptyTitle}>No children added yet</Text>
          <Text style={s.emptyText}>Add your child to monitor their learning progress</Text>
          <Button size="sm" style={{ marginTop: 16 }}>
            Add Child
          </Button>
        </View>
      </Card>

      {/* Quick Actions */}
      <Text style={s.sectionTitle}>Quick Actions</Text>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Card key={action.label} style={{ marginBottom: 10 }}>
            <View style={s.actionRow}>
              <View style={[s.actionIcon, { backgroundColor: `${action.color}1A` }]}>
                <Icon size={20} color={action.color} />
              </View>
              <Text style={s.actionLabel}>{action.label}</Text>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightBg },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: 56 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: fontWeight.bold, color: colors.lightTextPrimary },
  subGreeting: { fontSize: fontSize.sm, color: colors.lightTextSecondary, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', margin: 6 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statLabel: { fontSize: fontSize.xs, color: colors.lightTextSecondary, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: fontWeight.bold, color: colors.lightTextPrimary },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 12 },
  emptyCard: { marginBottom: 24 },
  emptyInner: { alignItems: 'center', paddingVertical: 24 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.lightTextPrimary, marginBottom: 4 },
  emptyText: { fontSize: fontSize.sm, color: colors.lightTextSecondary, textAlign: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  actionLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.lightTextPrimary },
});
