import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { Bell, Search, Mail, Settings, GraduationCap } from 'lucide-react-native';
import NotificationModal from './NotificationModal';
import ProfileModal from './ProfileModal';
import EmailNotificationModal from './EmailNotificationModal';
import { userStore } from '../utils/userStore';

const PRIMARY = '#5A279B';
const BG = '#f4f5f7';
const WHITE = '#ffffff';
const DARK = '#0f172a';
const GRAY = '#6b7280';

export default function StudentHeader({ user }: { user?: { name: string, profilePhoto?: string | null, email?: string, phone?: string } }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const defaultUser = user || userStore;
  const firstLetter = defaultUser.name && defaultUser.name !== 'Student Name' ? defaultUser.name.charAt(0).toUpperCase() : 'S';

  return (
    <View style={navStyles.headerContainer}>
      <View style={navStyles.headerTop}>
        <View style={navStyles.logoRow}>
          <View style={navStyles.logoBox}>
            <GraduationCap size={14} color={WHITE} />
          </View>
          <Text style={navStyles.logoText}>Student Portal</Text>
        </View>
        <View style={navStyles.headerIcons}>
          <TouchableOpacity style={navStyles.bellWrapper} onPress={() => setShowNotifications(true)}>
            <Bell size={18} color={DARK} />
            <View style={navStyles.bellDot} />
          </TouchableOpacity>
          <TouchableOpacity style={navStyles.avatar} onPress={() => setShowProfile(true)}>
            {defaultUser.profilePhoto ? (
              <Image source={{ uri: defaultUser.profilePhoto }} style={navStyles.avatarImage} />
            ) : (
              <Text style={navStyles.avatarText}>{firstLetter}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={navStyles.searchRow}>
        <View style={navStyles.searchBar}>
          <Search size={14} color={GRAY} />
          <TextInput 
            style={navStyles.searchInput}
            placeholder="Search for jobs, companies..."
            placeholderTextColor={GRAY}
          />
        </View>
        <TouchableOpacity style={navStyles.iconBtn} onPress={() => setShowEmailModal(true)}>
          <Mail size={18} color={GRAY} />
        </TouchableOpacity>
        <TouchableOpacity style={navStyles.iconBtn}>
          <Settings size={18} color={GRAY} />
        </TouchableOpacity>
      </View>
      <NotificationModal visible={showNotifications} onClose={() => setShowNotifications(false)} role="student" />
      <EmailNotificationModal visible={showEmailModal} onClose={() => setShowEmailModal(false)} />
      
      <ProfileModal 
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        userType="STUDENT PORTAL"
        name={defaultUser.name}
        email={defaultUser.email || 'student@example.com'}
        phone={defaultUser.phone || '+91 9876543210'}
        profilePic={defaultUser.profilePhoto}
      />
    </View>
  );
}

const navStyles = StyleSheet.create({
  headerContainer: {
    backgroundColor: WHITE,
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 24, height: 24, borderRadius: 6, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 13, fontWeight: '800', color: DARK },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellWrapper: { position: 'relative' },
  bellDot: { position: 'absolute', top: 0, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', borderWidth: 1, borderColor: WHITE },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarText: { color: WHITE, fontSize: 12, fontWeight: '700' },
  avatarImage: { width: '100%', height: '100%' },
  
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: BG, borderRadius: 8, paddingHorizontal: 10, height: 36 },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 12, color: DARK },
  iconBtn: { padding: 4 },
});
