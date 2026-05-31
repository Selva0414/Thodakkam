import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { Bell, Search, Mail, ShieldCheck } from 'lucide-react-native';
import NotificationModal from './NotificationModal';
import EmailNotificationModal from './EmailNotificationModal';

const PRIMARY = '#5A279B'; 
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function AdminHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  return (
    <View style={styles.headerCard}>
      <View style={styles.headerTop}>
        <View style={styles.adminInfo}>
          <View style={styles.shieldIconBox}>
            <ShieldCheck size={18} color={WHITE} />
          </View>
          <View>
            <Text style={styles.adminTitle}>Master Admin</Text>
            <Text style={styles.adminSubtitle}>MANAGEMENT</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionIcon} onPress={() => setShowEmailModal(true)}>
            <Mail size={20} color={TEXT_GRAY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => setShowNotifications(true)}>
            <Bell size={20} color={TEXT_GRAY} />
          </TouchableOpacity>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
            style={styles.profilePic} 
          />
        </View>
      </View>
      
      <View style={styles.searchBar}>
        <Search size={16} color={TEXT_GRAY} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search startups, students, or data..."
          placeholderTextColor={TEXT_GRAY}
        />
      </View>
      <NotificationModal visible={showNotifications} onClose={() => setShowNotifications(false)} role="admin" />
      <EmailNotificationModal visible={showEmailModal} onClose={() => setShowEmailModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: WHITE,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    marginBottom: 20,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  adminInfo: { flexDirection: 'row', alignItems: 'center' },
  shieldIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  adminTitle: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  adminSubtitle: { fontSize: 10, color: TEXT_GRAY, letterSpacing: 0.5, fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { padding: 4 },
  profilePic: { width: 32, height: 32, borderRadius: 16, marginLeft: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: TEXT_DARK },
});
