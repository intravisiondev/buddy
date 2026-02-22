import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { BookOpen, Users, Plus, Search } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, shadows } from '../../constants/theme';

export default function Rooms() {
  const router = useRouter();

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.headerRow}>
        <Text style={s.pageTitle}>Study Rooms</Text>
        <TouchableOpacity style={s.addBtn}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* My Rooms */}
      <Text style={s.sectionTitle}>My Rooms</Text>
      <Card style={s.emptyCard}>
        <View style={s.emptyInner}>
          <View style={s.emptyIcon}>
            <BookOpen size={32} color={colors.primary} />
          </View>
          <Text style={s.emptyTitle}>No rooms yet</Text>
          <Text style={s.emptyText}>Join or create a study room to collaborate with others</Text>
          <Button size="sm" style={{ marginTop: 16 }}>
            Browse Rooms
          </Button>
        </View>
      </Card>

      {/* Available Rooms */}
      <Text style={s.sectionTitle}>Available Rooms</Text>

      <Card style={{ marginBottom: 12 }}>
        <View style={s.roomRow}>
          <View style={[s.roomIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
            <BookOpen size={24} color={colors.primary} />
          </View>
          <View style={s.roomInfo}>
            <Text style={s.roomName}>Mathematics 101</Text>
            <Text style={s.roomDesc}>Advanced Calculus</Text>
          </View>
          <Badge variant="primary">Public</Badge>
        </View>
        <View style={s.roomMeta}>
          <Users size={14} color={colors.lightTextSecondary} />
          <Text style={s.roomMetaText}>24 members</Text>
        </View>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <View style={s.roomRow}>
          <View style={[s.roomIcon, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
            <BookOpen size={24} color={colors.success} />
          </View>
          <View style={s.roomInfo}>
            <Text style={s.roomName}>Physics Lab</Text>
            <Text style={s.roomDesc}>Quantum Mechanics</Text>
          </View>
          <Badge variant="success">Active</Badge>
        </View>
        <View style={s.roomMeta}>
          <Users size={14} color={colors.lightTextSecondary} />
          <Text style={s.roomMetaText}>18 members</Text>
        </View>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <View style={s.roomRow}>
          <View style={[s.roomIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
            <BookOpen size={24} color={colors.warning} />
          </View>
          <View style={s.roomInfo}>
            <Text style={s.roomName}>English Literature</Text>
            <Text style={s.roomDesc}>Shakespeare Studies</Text>
          </View>
          <Badge variant="warning">New</Badge>
        </View>
        <View style={s.roomMeta}>
          <Users size={14} color={colors.lightTextSecondary} />
          <Text style={s.roomMetaText}>12 members</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightBg },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: 56 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: fontWeight.bold, color: colors.lightTextPrimary },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.soft,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 12 },
  emptyCard: { marginBottom: 24 },
  emptyInner: { alignItems: 'center', paddingVertical: 24 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.lightTextPrimary, marginBottom: 4 },
  emptyText: { fontSize: fontSize.sm, color: colors.lightTextSecondary, textAlign: 'center' },
  roomRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  roomIcon: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  roomInfo: { flex: 1 },
  roomName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 2 },
  roomDesc: { fontSize: fontSize.sm, color: colors.lightTextSecondary },
  roomMeta: { flexDirection: 'row', alignItems: 'center', marginLeft: 60 },
  roomMetaText: { fontSize: fontSize.xs, color: colors.lightTextSecondary, marginLeft: 4 },
});
