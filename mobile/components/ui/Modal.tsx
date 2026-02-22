import { Modal as RNModal, View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import { X } from 'lucide-react-native';
import { colors, borderRadius, shadows } from '../../constants/theme';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  const screenWidth = Dimensions.get('window').width;
  const widthMap: Record<string, number> = {
    sm: Math.min(screenWidth * 0.8, 400),
    md: Math.min(screenWidth * 0.85, 500),
    lg: Math.min(screenWidth * 0.9, 600),
    xl: Math.min(screenWidth * 0.95, 800),
  };

  return (
    <RNModal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { width: widthMap[size] }]}>
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.neutral} />
              </TouchableOpacity>
            </View>
          )}
          <ScrollView style={styles.body}>{children}</ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: colors.lightCard,
    borderRadius: borderRadius.lg,
    maxHeight: '90%',
    ...shadows.strong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.lightTextPrimary, flex: 1 },
  closeBtn: { padding: 8 },
  body: { padding: 16 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.lightBorder },
});
