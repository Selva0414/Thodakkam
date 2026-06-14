import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Platform, Image } from 'react-native';
import { Bell, Search, Mail, Menu, Users, Settings } from 'lucide-react-native';
import NotificationModal from './NotificationModal';
import EmailNotificationModal from './EmailNotificationModal';
import StartupProfileModal from './StartupProfileModal';
import StartupSettingsModal from './StartupSettingsModal';
import StartupNetworkModal from './StartupNetworkModal';

const PRIMARY = '#662483';
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function StartupHeader({ companyName = 'Echo Digital' }: { companyName?: string }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    if (companyName) {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      fetch(`${baseUrl}/api/startup/profile/${encodeURIComponent(companyName)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.startup?.companyLogo) {
            setCompanyLogo(data.startup.companyLogo);
          }
        })
        .catch(err => console.log('Error fetching logo:', err));
    }
  }, [companyName]);

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
          <View style={[styles.logoBox, companyLogo && { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#e2e8f0' }]}>
            {companyLogo ? (
              <Image source={{ uri: companyLogo }} style={{ width: '100%', height: '100%', borderRadius: 10, resizeMode: 'cover' }} />
            ) : (
              <Text style={styles.logoText}>{companyInitials}</Text>
            )}
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
          <TouchableOpacity style={styles.actionIcon} onPress={() => setShowMenu(!showMenu)}>
            <Menu size={20} color={TEXT_GRAY} />
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

      {showMenu && (
        <View style={styles.menuDropdown}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); setShowProfileModal(true); }}>
            <Users size={16} color={TEXT_DARK} style={styles.menuIcon} />
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); setShowNetworkModal(true); }}>
            <Users size={16} color={TEXT_DARK} style={styles.menuIcon} />
            <Text style={styles.menuText}>My Network</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); setShowSettingsModal(true); }}>
            <Settings size={16} color={TEXT_DARK} style={styles.menuIcon} />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      <StartupProfileModal 
        visible={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        companyName={companyName} 
      />
      <StartupSettingsModal 
        visible={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />
      <StartupNetworkModal
        visible={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        companyName={companyName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: WHITE,
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20,
    marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    zIndex: 50, elevation: 50
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
  menuDropdown: { position: 'absolute', top: Platform.OS === 'ios' ? 100 : 80, right: 20, backgroundColor: WHITE, borderRadius: 12, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, minWidth: 160, zIndex: 100 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  menuIcon: { marginRight: 10 },
  menuText: { fontSize: 14, fontWeight: '600', color: TEXT_DARK },
});
