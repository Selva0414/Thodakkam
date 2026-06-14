import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, Platform, Modal } from 'react-native';
import { Bell, Search, Mail, Settings, GraduationCap, User, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationModal from './NotificationModal';
import EmailNotificationModal from './EmailNotificationModal';
import { userStore } from '../utils/userStore';

const PRIMARY = '#5A279B';
const BG = '#f4f5f7';
const WHITE = '#ffffff';
const DARK = '#0f172a';
const GRAY = '#6b7280';

export default function StudentHeader({ user }: { user?: { name: string, profilePhoto?: string | null, email?: string, phone?: string } }) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  const [localUser, setLocalUser] = useState(user || userStore);

  useEffect(() => {
    async function checkUser() {
      if (!localUser.id) {
        const storedId = await AsyncStorage.getItem('studentUserId');
        if (storedId) {
          try {
            const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
            const res = await fetch(`${baseUrl}/api/user/${storedId}`);
            const data = await res.json();
            if (data.success && data.user) {
              let photo = data.user.profilePhoto;
              if (photo && !photo.startsWith('http') && !photo.startsWith('data:image')) {
                photo = `${baseUrl}/uploads/${photo.split(/[/\\]/).pop()}`;
              }
              const u = {
                id: data.user.id,
                name: data.user.fullName,
                email: data.user.email,
                profilePhoto: photo,
                phone: data.user.phone
              };
              userStore.id = u.id;
              userStore.name = u.name;
              userStore.email = u.email;
              userStore.profilePhoto = u.profilePhoto;
              setLocalUser(u as any);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
    checkUser();
  }, [localUser.id]);

  const firstLetter = localUser.name ? localUser.name.charAt(0).toUpperCase() : 'S';

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
          <TouchableOpacity style={navStyles.avatar} onPress={() => setShowProfileDropdown(!showProfileDropdown)}>
            {localUser.profilePhoto ? (
              <Image source={{ uri: localUser.profilePhoto }} style={navStyles.avatarImage} />
            ) : (
              <Text style={navStyles.avatarText}>{firstLetter}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Profile Dropdown */}
      {showProfileDropdown && (
        <Modal transparent visible={true} animationType="fade" onRequestClose={() => setShowProfileDropdown(false)}>
          <TouchableOpacity style={navStyles.dropdownOverlay} onPress={() => setShowProfileDropdown(false)} activeOpacity={1}>
            <View style={navStyles.dropdownMenu}>
              <TouchableOpacity style={navStyles.dropdownItem} onPress={() => { setShowProfileDropdown(false); router.push('/student-profile'); }}>
                <User size={16} color={DARK} />
                <Text style={navStyles.dropdownItemText}>My Profile</Text>
              </TouchableOpacity>
              <View style={navStyles.dropdownDivider} />
              <TouchableOpacity style={navStyles.dropdownItem} onPress={async () => {
                setShowProfileDropdown(false);
                await AsyncStorage.removeItem('studentUserId');
                userStore.id = '';
                userStore.name = '';
                userStore.email = '';
                userStore.profilePhoto = null;
                router.replace('/login');
              }}>
                <LogOut size={16} color="#ef4444" />
                <Text style={[navStyles.dropdownItemText, { color: '#ef4444' }]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

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
  
  dropdownOverlay: { flex: 1, backgroundColor: 'transparent' },
  dropdownMenu: {
    position: 'absolute', top: Platform.OS === 'ios' ? 90 : 60, right: 16,
    backgroundColor: WHITE, borderRadius: 12, paddingVertical: 8, width: 160,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 }
    })
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, gap: 10 },
  dropdownItemText: { fontSize: 13, fontWeight: '600', color: DARK },
  dropdownDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 4 }
});
