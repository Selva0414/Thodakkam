import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Platform } from 'react-native';
import { X, Check } from 'lucide-react-native';

const PRIMARY = '#5A279B'; // Matches the branding
const WHITE = '#ffffff';
const DARK = '#0f172a';
const LIGHT_PURPLE_BG = '#faf5ff';

interface EmailNotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EmailNotificationModal({ visible, onClose }: EmailNotificationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Email Notification</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={16} color={PRIMARY} />
            </TouchableOpacity>
          </View>

          {/* Content Box */}
          <View style={styles.contentBox}>
            <View style={styles.iconCircle}>
              <Check size={16} color={WHITE} />
            </View>
            <Text style={styles.messageText}>
              You received new message on email so verify it quickly
            </Text>
          </View>

          {/* Verify Button */}
          <TouchableOpacity style={styles.verifyBtn} onPress={onClose}>
            <Text style={styles.verifyBtnText}>Verify Now</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: WHITE,
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
    color: PRIMARY,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: LIGHT_PURPLE_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_PURPLE_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6', // A brighter purple for the checkmark circle as seen in the screenshot
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  verifyBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  verifyBtnText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '700',
  }
});
