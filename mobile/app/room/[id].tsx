import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { ArrowLeft, MessageCircle, FileText, Gamepad2, Bot, Users, Settings } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, shadows } from '../../constants/theme';

export default function RoomDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const sections = [
    { label: 'Chat', desc: 'Discuss with room members', icon: MessageCircle, color: colors.primary },
    { label: 'Resources', desc: 'Shared study materials', icon: FileText, color: colors.success },
    { label: 'Games', desc: 'Educational games', icon: Gamepad2, color: colors.warning },
    { label: 'AI Coach', desc: 'Get AI-powered help', icon: Bot, color: colors.accent },
  ];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* Header */}
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <ArrowLeft size={20} color={colors.lightTextPrimary} />
        <Text style={s.backText}>Back</Text>
      </TouchableOpacity>

      {/* Room Info */}
      <Card style={s.infoCard}>
        <View style={s.infoRow}>
          <View style={s.roomAvatar}>
            <Text style={s.roomAvatarText}>M</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.roomName}>Mathematics 101</Text>
            <Text style={s.roomDesc}>Advanced Calculus</Text>
          </View>
          <Badge variant="primary">Public</Badge>
        </View>
        <View style={s.memberRow}>
          <Users size={16} color={colors.lightTextSecondary} />
          <Text style={s.memberText}>24 members</Text>
          <View style={s.avatarStack}>
            <Avatar name="Alice" size="sm" style={{ marginLeft: -4 }} />
            <Avatar name="Bob" size="sm" style={{ marginLeft: -8 }} />
            <Avatar name="Carol" size="sm" style={{ marginLeft: -8 }} />
          </View>
        </View>
      </Card>

      {/* Room ID */}
      <Text style={s.idText}>Room ID: {id}</Text>

      {/* Sections */}
      {sections.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} style={{ marginBottom: 12 }}>
            <View style={s.sectionRow}>
              <View style={[s.sectionIcon, { backgroundColor: `${item.color}1A` }]}>
                <Icon size={22} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionLabel}>{item.label}</Text>
                <Text style={s.sectionDesc}>{item.desc}</Text>
              </View>
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
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { fontSize: fontSize.md, color: colors.lightTextPrimary, marginLeft: 8, fontWeight: fontWeight.medium },
  infoCard: { marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  roomAvatar: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  roomAvatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  roomName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.lightTextPrimary, marginBottom: 2 },
  roomDesc: { fontSize: fontSize.sm, color: colors.lightTextSecondary },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  memberText: { fontSize: fontSize.sm, color: colors.lightTextSecondary, marginLeft: 6, marginRight: 12 },
  avatarStack: { flexDirection: 'row' },
  idText: { fontSize: fontSize.xs, color: colors.lightTextSecondary, marginBottom: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center' },
  sectionIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  sectionLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.lightTextPrimary, marginBottom: 2 },
  sectionDesc: { fontSize: fontSize.sm, color: colors.lightTextSecondary },
});
