import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import Button from '../../components/ui/Button';
import { Calendar, Target, Plus, Sparkles } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, shadows } from '../../constants/theme';

export default function StudyPlans() {
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.headerRow}>
        <Text style={s.pageTitle}>Study Plans</Text>
        <TouchableOpacity style={s.addBtn}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* AI Suggestion */}
      <Card style={s.aiCard}>
        <View style={s.aiRow}>
          <View style={s.aiIcon}>
            <Sparkles size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.aiTitle}>AI Smart Plan</Text>
            <Text style={s.aiText}>Let AI create a personalized study plan based on your goals</Text>
          </View>
        </View>
        <Button size="sm" style={{ marginTop: 12 }}>
          Generate Plan
        </Button>
      </Card>

      {/* Active Plans */}
      <Text style={s.sectionTitle}>Active Plans</Text>

      <Card style={{ marginBottom: 12 }}>
        <View style={s.planRow}>
          <View style={[s.planIcon, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
            <Calendar size={24} color={colors.accent} />
          </View>
          <View style={s.planInfo}>
            <Text style={s.planName}>Exam Preparation</Text>
            <Text style={s.planDesc}>Mathematics Final</Text>
          </View>
          <Badge variant="success">Active</Badge>
        </View>
        <ProgressBar value={45} showLabel style={{ marginTop: 12, marginBottom: 8 }} />
        <View style={s.planMeta}>
          <Target size={14} color={colors.lightTextSecondary} />
          <Text style={s.planMetaText}>3 milestones  ·  15 days left</Text>
        </View>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <View style={s.planRow}>
          <View style={[s.planIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
            <Calendar size={24} color={colors.primary} />
          </View>
          <View style={s.planInfo}>
            <Text style={s.planName}>SAT Prep</Text>
            <Text style={s.planDesc}>Reading & Writing</Text>
          </View>
          <Badge variant="primary">Active</Badge>
        </View>
        <ProgressBar value={20} showLabel variant="primary" style={{ marginTop: 12, marginBottom: 8 }} />
        <View style={s.planMeta}>
          <Target size={14} color={colors.lightTextSecondary} />
          <Text style={s.planMetaText}>5 milestones  ·  30 days left</Text>
        </View>
      </Card>

      {/* Completed */}
      <Text style={s.sectionTitle}>Completed</Text>
      <Card style={s.emptyCard}>
        <View style={s.emptyInner}>
          <Text style={s.emptyText}>No completed plans yet. Keep going!</Text>
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
  aiCard: { marginBottom: 24, borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
  aiRow: { flexDirection: 'row', alignItems: 'center' },
  aiIcon: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  aiTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 2 },
  aiText: { fontSize: fontSize.sm, color: colors.lightTextSecondary },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 12 },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planIcon: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  planInfo: { flex: 1 },
  planName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 2 },
  planDesc: { fontSize: fontSize.sm, color: colors.lightTextSecondary },
  planMeta: { flexDirection: 'row', alignItems: 'center' },
  planMetaText: { fontSize: fontSize.xs, color: colors.lightTextSecondary, marginLeft: 4 },
  emptyCard: { marginBottom: 24 },
  emptyInner: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: fontSize.sm, color: colors.lightTextSecondary, textAlign: 'center' },
});
