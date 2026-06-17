import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { X, Volume2, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react-native';
import { globalNotificationStore, Notification } from '../utils/notificationStore';
import { useAppTheme } from '../context/ThemeContext';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  role?: 'student' | 'startup' | 'admin';
}

export default function NotificationModal({ visible, onClose, role }: NotificationModalProps) {
  const { colors, isDark } = useAppTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchNotifs = () => {
      const all = globalNotificationStore.getNotifications();
      if (role) {
        setNotifications(all.filter(n => n.targetRole === role || !n.targetRole));
      } else {
        setNotifications(all);
      }
    };

    fetchNotifs();
    
    const unsubscribe = globalNotificationStore.subscribe(() => {
      fetchNotifs();
    });
    
    return () => unsubscribe();
  }, [role]);

  const handleClose = () => {
    setShowAll(false);
    onClose();
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'success':
        return <CheckCircle2 size={16} color={isDark ? colors.success : "#10b981"} />;
      case 'alert':
        return <AlertTriangle size={16} color="#f59e0b" />;
      default:
        return <Volume2 size={16} color="#3b82f6" />;
    }
  };

  const getIconBg = (type: string) => {
    switch(type) {
      case 'success':
        return isDark ? colors.success + '20' : '#dcfce7';
      case 'alert':
        return isDark ? '#f59e0b20' : '#fef3c7';
      default:
        return isDark ? '#3b82f620' : '#e0f2fe';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        
        <View style={[styles.card, showAll && styles.cardExpanded, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>{showAll ? 'All Notifications' : 'Notifications'}</Text>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDark ? colors.primary + '20' : '#f3e8ff' }]} onPress={handleClose}>
              <X size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* List */}
          <ScrollView style={[styles.list, showAll && styles.listExpanded]} showsVerticalScrollIndicator={showAll}>
            {notifications.length === 0 ? (
              <Text style={{ textAlign: 'center', color: colors.textSecondary, marginVertical: 20 }}>No new notifications.</Text>
            ) : (
              notifications.map((notif) => (
                <View style={styles.item} key={notif.id}>
                  <View style={[styles.iconBox, { backgroundColor: getIconBg(notif.type) }]}>
                    {getIcon(notif.type)}
                  </View>
                  <View style={styles.content}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.itemTitle, { color: colors.text }]}>{notif.title}</Text>
                      <Text style={[styles.itemTime, { color: colors.textSecondary }]}>{notif.time}</Text>
                    </View>
                    <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>{notif.description}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          {!showAll && (
            <TouchableOpacity style={styles.footer} onPress={() => setShowAll(true)}>
              <Text style={[styles.footerText, { color: colors.primary }]}>View all notifications</Text>
              <ArrowRight size={14} color={colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      web: { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 10 },
    }),
  },
  cardExpanded: {
    maxHeight: '90%',
  },
  header: {
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
  list: {
    maxHeight: 300,
  },
  listExpanded: {
    maxHeight: undefined,
  },
  item: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  itemTime: {
    fontSize: 10,
    marginTop: 2,
  },
  itemDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
