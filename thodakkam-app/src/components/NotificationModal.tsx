import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { X, Volume2, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react-native';
import { globalNotificationStore, Notification } from '../utils/notificationStore';

const PRIMARY = '#6a1b9a';
const WHITE = '#ffffff';
const DARK = '#0f172a';
const GRAY = '#6b7280';
const BORDER = '#e2e8f0';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  role?: 'student' | 'startup' | 'admin';
}

export default function NotificationModal({ visible, onClose, role }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifs = () => {
      const all = globalNotificationStore.getNotifications();
      if (role) {
        setNotifications(all.filter(n => n.targetRole === role || !n.targetRole));
      } else {
        setNotifications(all);
      }
    };

    // Initial fetch
    fetchNotifs();
    
    // Subscribe to changes
    const unsubscribe = globalNotificationStore.subscribe(() => {
      fetchNotifs();
    });
    
    return () => unsubscribe();
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'success':
        return <CheckCircle2 size={16} color="#10b981" />;
      case 'alert':
        return <AlertTriangle size={16} color="#f59e0b" />;
      default:
        return <Volume2 size={16} color="#3b82f6" />;
    }
  };

  const getIconBg = (type: string) => {
    switch(type) {
      case 'success':
        return '#dcfce7';
      case 'alert':
        return '#fef3c7';
      default:
        return '#e0f2fe';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={16} color={PRIMARY} />
            </TouchableOpacity>
          </View>

          {/* List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <Text style={{ textAlign: 'center', color: GRAY, marginVertical: 20 }}>No new notifications.</Text>
            ) : (
              notifications.map((notif) => (
                <View style={styles.item} key={notif.id}>
                  <View style={[styles.iconBox, { backgroundColor: getIconBg(notif.type) }]}>
                    {getIcon(notif.type)}
                  </View>
                  <View style={styles.content}>
                    <View style={styles.titleRow}>
                      <Text style={styles.itemTitle}>{notif.title}</Text>
                      <Text style={styles.itemTime}>{notif.time}</Text>
                    </View>
                    <Text style={styles.itemDesc}>{notif.description}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          <TouchableOpacity style={styles.footer} onPress={onClose}>
            <Text style={styles.footerText}>View all notifications</Text>
            <ArrowRight size={14} color={PRIMARY} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      web: { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 10 },
    }),
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
    color: PRIMARY,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    maxHeight: 300,
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
    color: DARK,
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  itemTime: {
    fontSize: 10,
    color: GRAY,
    marginTop: 2,
  },
  itemDesc: {
    fontSize: 11,
    color: GRAY,
    lineHeight: 16,
  },
  itemTimeBottom: {
    fontSize: 10,
    color: GRAY,
    marginTop: 8,
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
    color: PRIMARY,
  },
});
