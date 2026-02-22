import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { Trophy, Medal, Crown, Award } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, shadows } from '../../constants/theme';

export default function Leaderboard() {
  const topUsers = [
    { rank: 1, name: 'Alice Johnson', xp: 2500 },
    { rank: 2, name: 'Bob Smith', xp: 2300 },
    { rank: 3, name: 'Carol Davis', xp: 2100 },
    { rank: 4, name: 'David Lee', xp: 1900 },
    { rank: 5, name: 'Eva Martinez', xp: 1800 },
  ];

  const rankColors = ['#f59e0b', '#94a3b8', '#cd7f32'];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.pageTitle}>Leaderboard</Text>

      {/* Podium */}
      <View style={s.podiumWrap}>
        {/* 2nd place */}
        <View style={s.podiumItem}>
          <Avatar name={topUsers[1].name} size="lg" />
          <View style={[s.rankBadge, { backgroundColor: '#94a3b8' }]}>
            <Text style={s.rankNum}>2</Text>
          </View>
          <Text style={s.podiumName} numberOfLines={1}>{topUsers[1].name.split(' ')[0]}</Text>
          <Text style={s.podiumXP}>{topUsers[1].xp} XP</Text>
          <View style={[s.bar, { height: 60, backgroundColor: 'rgba(148,163,184,0.2)' }]} />
        </View>
        {/* 1st place */}
        <View style={s.podiumItem}>
          <Crown size={24} color="#f59e0b" style={{ marginBottom: 4 }} />
          <Avatar name={topUsers[0].name} size="xl" />
          <View style={[s.rankBadge, { backgroundColor: '#f59e0b' }]}>
            <Text style={s.rankNum}>1</Text>
          </View>
          <Text style={s.podiumName} numberOfLines={1}>{topUsers[0].name.split(' ')[0]}</Text>
          <Text style={s.podiumXP}>{topUsers[0].xp} XP</Text>
          <View style={[s.bar, { height: 80, backgroundColor: 'rgba(245,158,11,0.2)' }]} />
        </View>
        {/* 3rd place */}
        <View style={s.podiumItem}>
          <Avatar name={topUsers[2].name} size="lg" />
          <View style={[s.rankBadge, { backgroundColor: '#cd7f32' }]}>
            <Text style={s.rankNum}>3</Text>
          </View>
          <Text style={s.podiumName} numberOfLines={1}>{topUsers[2].name.split(' ')[0]}</Text>
          <Text style={s.podiumXP}>{topUsers[2].xp} XP</Text>
          <View style={[s.bar, { height: 40, backgroundColor: 'rgba(205,127,50,0.2)' }]} />
        </View>
      </View>

      {/* Full list */}
      <Card style={{ marginBottom: 24 }}>
        <View style={s.listHeader}>
          <Trophy size={20} color={colors.warning} />
          <Text style={s.listTitle}>Top Learners</Text>
        </View>
        {topUsers.map((user, idx) => (
          <View key={user.rank} style={[s.listRow, idx < topUsers.length - 1 && s.listRowBorder]}>
            <Text style={[s.listRank, user.rank <= 3 && { color: rankColors[user.rank - 1] }]}>{user.rank}</Text>
            <Avatar name={user.name} size="md" style={{ marginHorizontal: 12 }} />
            <Text style={s.listName} numberOfLines={1}>{user.name}</Text>
            <Badge variant={user.rank === 1 ? 'warning' : user.rank === 2 ? 'neutral' : user.rank === 3 ? 'accent' : 'primary'}>
              {user.xp} XP
            </Badge>
          </View>
        ))}
      </Card>

      {/* My Badges */}
      <Text style={s.sectionTitle}>My Badges</Text>
      <Card style={{ marginBottom: 24 }}>
        <View style={s.emptyInner}>
          <Award size={40} color={colors.lightBorder} />
          <Text style={s.emptyText}>No badges earned yet. Keep learning!</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightBg },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: 56 },
  pageTitle: { fontSize: 28, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 24 },
  podiumWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 32 },
  podiumItem: { flex: 1, alignItems: 'center' },
  rankBadge: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginTop: -12,
  },
  rankNum: { fontSize: 12, fontWeight: '700', color: '#fff' },
  podiumName: { fontSize: 13, fontWeight: '600', color: colors.lightTextPrimary, marginTop: 6 },
  podiumXP: { fontSize: 12, color: colors.lightTextSecondary, marginTop: 2, marginBottom: 8 },
  bar: { width: '70%', borderRadius: 8 },
  listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  listTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginLeft: 8 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.lightBorder },
  listRank: { fontSize: 20, fontWeight: '700', color: colors.lightTextSecondary, width: 28, textAlign: 'center' },
  listName: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.lightTextPrimary },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 12 },
  emptyInner: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: fontSize.sm, color: colors.lightTextSecondary, marginTop: 12 },
});
