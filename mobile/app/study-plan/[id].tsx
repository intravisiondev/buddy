import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import { ArrowLeft, Calendar, Target, Play, CheckCircle, Circle } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

export default function StudyPlanDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const milestones = [
    { name: 'Complete Chapter 1', progress: 100, status: 'done' },
    { name: 'Practice Problems Set A', progress: 60, status: 'active' },
    { name: 'Review & Summary', progress: 0, status: 'pending' },
  ];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* Header */}
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <ArrowLeft size={20} color={colors.lightTextPrimary} />
        <Text style={s.backText}>Back</Text>
      </TouchableOpacity>

      {/* Plan Info */}
      <Card style={s.infoCard}>
        <View style={s.infoRow}>
          <View style={s.planAvatar}>
            <Calendar size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.planName}>Exam Preparation</Text>
            <Text style={s.planDesc}>Mathematics Final</Text>
          </View>
          <Badge variant="success">Active</Badge>
        </View>
      </Card>

      <Text style={s.idText}>Plan ID: {id}</Text>

      {/* Overall Progress */}
      <Card style={s.progressCard}>
        <Text style={s.progressTitle}>Overall Progress</Text>
        <ProgressBar value={45} showLabel variant="accent" style={{ marginBottom: 16 }} />
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Calendar size={14} color={colors.lightTextSecondary} />
            <Text style={s.metaText}>15 days left</Text>
          </View>
          <View style={s.metaItem}>
            <Target size={14} color={colors.lightTextSecondary} />
            <Text style={s.metaText}>3 milestones</Text>
          </View>
        </View>
      </Card>

      {/* Start Session */}
      <Button icon={<Play size={18} color="#fff" />} style={{ marginBottom: 24 }}>
        Start Study Session
      </Button>

      {/* Milestones */}
      <Text style={s.sectionTitle}>Milestones</Text>
      {milestones.map((m, idx) => (
        <Card key={idx} style={{ marginBottom: 12 }}>
          <View style={s.milestoneRow}>
            {m.status === 'done' ? (
              <CheckCircle size={22} color={colors.success} />
            ) : (
              <Circle size={22} color={m.status === 'active' ? colors.primary : colors.lightBorder} />
            )}
            <View style={s.milestoneInfo}>
              <View style={s.milestoneHeader}>
                <Text style={[s.milestoneName, m.status === 'done' && s.milestoneNameDone]}>{m.name}</Text>
                <Badge
                  variant={m.status === 'done' ? 'success' : m.status === 'active' ? 'primary' : 'neutral'}
                  size="sm"
                >
                  {m.status === 'done' ? 'Done' : m.status === 'active' ? 'Active' : 'Pending'}
                </Badge>
              </View>
              <ProgressBar
                value={m.progress}
                variant={m.status === 'done' ? 'success' : m.status === 'active' ? 'primary' : 'neutral'}
                height="sm"
                style={{ marginTop: 8 }}
              />
              <Text style={s.milestoneProgress}>{m.progress}% complete</Text>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightBg },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: 56 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { fontSize: fontSize.md, color: colors.lightTextPrimary, marginLeft: 8, fontWeight: fontWeight.medium },
  infoCard: { marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  planAvatar: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  planName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 2 },
  planDesc: { fontSize: fontSize.sm, color: colors.lightTextSecondary },
  idText: { fontSize: fontSize.xs, color: colors.lightTextSecondary, marginBottom: 20 },
  progressCard: { marginBottom: 20 },
  progressTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: fontSize.sm, color: colors.lightTextSecondary, marginLeft: 6 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 12 },
  milestoneRow: { flexDirection: 'row', alignItems: 'flex-start' },
  milestoneInfo: { flex: 1, marginLeft: 12 },
  milestoneHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  milestoneName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.lightTextPrimary, flex: 1, marginRight: 8 },
  milestoneNameDone: { textDecorationLine: 'line-through', color: colors.lightTextSecondary },
  milestoneProgress: { fontSize: fontSize.xs, color: colors.lightTextSecondary, marginTop: 4 },
});
