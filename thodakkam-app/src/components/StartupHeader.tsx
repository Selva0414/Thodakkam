import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Bell, Search, Mail, Settings } from 'lucide-react-native';
import NotificationModal from './NotificationModal';
import EmailNotificationModal from './EmailNotificationModal';

const PRIMARY = '#662483';
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function StartupHeader({ companyName = 'Echo Digital' }: { companyName?: string }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Extract initials (max 2 characters) for the logo placeholder
  const getInitials = (name: string) => {
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toLowerCase();
    if (words.length === 1 && words[0].length >= 4) return words[0].substring(0, 4).toLowerCase();
    return name.substring(0, 2).toLowerCase();
  };

  const companyInitials = getInitials(companyName);

  return (
    <View style={styles.headerCard}>
      <View style={styles.headerTop}>
        <View style={styles.adminInfo}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>{companyInitials}</Text>
          </View>
          <View>
            <Text style={styles.companyTitle}>{companyName}</Text>
            <Text style={styles.companySubtitle}>PREMIUM PLAN</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionIcon} onPress={() => setShowEmailModal(true)}>
            <Mail size={20} color={TEXT_GRAY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => setShowNotifications(true)}>
            <Bell size={20} color={TEXT_GRAY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <Settings size={20} color={TEXT_GRAY} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchBar}>
        <Search size={16} color={TEXT_GRAY} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search analytics, candidates..."
          placeholderTextColor={TEXT_GRAY}
        />
      </View>
      <NotificationModal visible={showNotifications} onClose={() => setShowNotifications(false)} role="startup" />
      <EmailNotificationModal visible={showEmailModal} onClose={() => setShowEmailModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: WHITE,
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20,
    marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  adminInfo: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#336155', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logoText: { color: WHITE, fontSize: 13, fontWeight: '700' },
  companyTitle: { fontSize: 15, fontWeight: '800', color: TEXT_DARK },
  companySubtitle: { fontSize: 9, color: TEXT_GRAY, letterSpacing: 0.5, fontWeight: '700', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { padding: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: TEXT_DARK },
});
