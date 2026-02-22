import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import { Zap, Gem, Clock, Target, ChevronRight, Settings, Sparkles, BookOpen, Calendar } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, shadows } from '../../constants/theme';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const stats = [
    { label: 'XP', value: user?.xp || 0, icon: Zap, color: colors.primary, bg: 'rgba(99,102,241,0.12)' },
    { label: 'Gems', value: user?.gems || 0, icon: Gem, color: colors.success, bg: 'rgba(16,185,129,0.12)' },
    { label: 'Level', value: user?.level || 1, icon: Target, color: colors.accent, bg: 'rgba(139,92,246,0.12)' },
    { label: 'Study Time', value: '0h', icon: Clock, color: colors.warning, bg: 'rgba(245,158,11,0.12)' },
  ];

  const quickActions = [
    { label: 'Start Study Session', icon: Clock, color: colors.primary },
    { label: 'Join a Room', icon: BookOpen, color: colors.success },
    { label: 'Create Study Plan', icon: Calendar, color: colors.accent },
  ];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>Welcome back,</Text>
          <Text style={s.name}>{user?.name || 'Student'}!</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={{ marginRight: 12 }}>
          <Settings size={22} color={colors.lightTextSecondary} />
        </TouchableOpacity>
        <Avatar name={user?.name || 'User'} src={user?.avatar} size="lg" />
      </View>

      {/* Level Progress */}
      <Card style={s.levelCard}>
        <View style={s.levelRow}>
          <Sparkles size={20} color={colors.primary} />
          <Text style={s.levelLabel}>Level {user?.level || 1}</Text>
          <Text style={s.levelXP}>{user?.xp || 0} / {((user?.level || 1) + 1) * 500} XP</Text>
        </View>
        <ProgressBar value={(user?.xp || 0) % 500} max={500} variant="primary" height="sm" style={{ marginTop: 8 }} />
      </Card>

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

      {/* Today's Goals */}
      <Card style={s.goalsCard}>
        <View style={s.goalsHeader}>
          <Text style={s.sectionTitle}>Today's Goals</Text>
          <TouchableOpacity>
            <Text style={s.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={s.emptyInner}>
          <Target size={36} color={colors.lightBorder} />
          <Text style={s.emptyText}>No goals for today</Text>
          <Text style={s.emptyHint}>Tap "Create Study Plan" below to get started</Text>
        </View>
      </Card>

      {/* Quick Actions */}
      <Text style={s.sectionTitle}>Quick Actions</Text>
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Card key={action.label} style={{ marginBottom: 10 }}>
            <View style={s.actionRow}>
              <View style={[s.actionIcon, { backgroundColor: `${action.color}1A` }]}>
                <Icon size={20} color={action.color} />
              </View>
              <Text style={s.actionLabel}>{action.label}</Text>
              <ChevronRight size={18} color={colors.lightTextSecondary} />
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
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: fontSize.md, color: colors.lightTextSecondary },
  name: { fontSize: 26, fontWeight: fontWeight.bold, color: colors.lightTextPrimary },
  levelCard: { marginBottom: 20, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  levelRow: { flexDirection: 'row', alignItems: 'center' },
  levelLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginLeft: 8, flex: 1 },
  levelXP: { fontSize: fontSize.sm, color: colors.lightTextSecondary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 20 },
  statCard: { flex: 1, minWidth: '45%', margin: 6 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statLabel: { fontSize: fontSize.xs, color: colors.lightTextSecondary, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: fontWeight.bold, color: colors.lightTextPrimary },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalsCard: { marginBottom: 20 },
  goalsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 12 },
  seeAll: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
  emptyInner: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.lightTextSecondary, marginTop: 8 },
  emptyHint: { fontSize: fontSize.sm, color: colors.lightTextSecondary, marginTop: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  actionLabel: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.lightTextPrimary },
});
