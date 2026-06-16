import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Platform } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';

interface EmailNotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EmailNotificationModal({ visible, onClose }: EmailNotificationModalProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>Email Notification</Text>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDark ? colors.primary + '20' : '#faf5ff' }]} onPress={onClose}>
              <X size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Content Box */}
          <View style={[styles.contentBox, { backgroundColor: isDark ? colors.primary + '10' : '#faf5ff' }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
              <Check size={16} color="#ffffff" />
            </View>
            <Text style={[styles.messageText, { color: colors.text }]}>
              You received new message on email so verify it quickly
            </Text>
          </View>

          {/* Verify Button */}
          <TouchableOpacity style={styles.verifyBtn} onPress={onClose}>
            <Text style={[styles.verifyBtnText, { color: colors.primary }]}>Verify Now</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  verifyBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  verifyBtnText: {
    fontSize: 14,
    fontWeight: '700',
  }
});
