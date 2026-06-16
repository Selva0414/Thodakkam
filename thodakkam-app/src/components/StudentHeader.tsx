import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, Platform, Modal, ScrollView, Animated } from 'react-native';
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

export default function StudentHeader({ user }: { user?: { id?: string, name: string, profilePhoto?: string | null, email?: string, phone?: string } }) {
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
            const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
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
          <Image source={require('../../assets/images/Thodakkam logo.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
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
      
      {/* Profile Drawer */}
      <Modal transparent visible={showProfileDropdown} animationType="fade" onRequestClose={() => setShowProfileDropdown(false)}>
        <View style={navStyles.drawerOverlay}>
          <TouchableOpacity style={navStyles.drawerOverlayBg} onPress={() => setShowProfileDropdown(false)} activeOpacity={1} />
          <View style={navStyles.drawerContent}>
            <View>
              <View style={{ height: Platform.OS === 'ios' ? 120 : 100, backgroundColor: PRIMARY, width: '100%', borderTopLeftRadius: 24 }} />
              <View style={{ paddingHorizontal: 20, paddingBottom: 20, marginTop: -40 }}>
                <TouchableOpacity onPress={() => { setShowProfileDropdown(false); router.push('/student-profile'); }}>
                  <View style={{ backgroundColor: WHITE, padding: 4, borderRadius: 40, alignSelf: 'flex-start', marginBottom: 12, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                    {localUser.profilePhoto ? (
                      <Image source={{ uri: localUser.profilePhoto }} style={navStyles.drawerAvatar} />
                    ) : (
                      <View style={navStyles.drawerAvatarFallback}>
                        <Text style={navStyles.drawerAvatarText}>{firstLetter}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={navStyles.drawerName}>{localUser.name || 'Student'}</Text>
                  {localUser.email ? <Text style={navStyles.drawerBio}>{localUser.email}</Text> : null}
                </TouchableOpacity>
              </View>
            </View>

            <View style={navStyles.drawerDivider} />



            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }}>
              <TouchableOpacity style={navStyles.drawerMenuItem} onPress={() => { setShowProfileDropdown(false); router.push('/student-profile'); }}><Text style={navStyles.drawerMenuText}>My profile</Text></TouchableOpacity>
              <TouchableOpacity style={navStyles.drawerMenuItem} onPress={() => { setShowProfileDropdown(false); router.push({ pathname: '/student-my-jobs' as any }); }}><Text style={navStyles.drawerMenuText}>My Jobs</Text></TouchableOpacity>
              <TouchableOpacity style={navStyles.drawerMenuItem} onPress={() => { setShowProfileDropdown(false); router.push({ pathname: '/saved-posts' as any, params: { role: 'student', identifier: userStore.email } }); }}><Text style={navStyles.drawerMenuText}>Saved posts</Text></TouchableOpacity>
              <TouchableOpacity style={navStyles.drawerMenuItem}><Text style={navStyles.drawerMenuText}>My Network</Text></TouchableOpacity>
              <TouchableOpacity style={navStyles.drawerMenuItem}><Text style={navStyles.drawerMenuText}>General</Text></TouchableOpacity>
              <TouchableOpacity style={navStyles.drawerMenuItem}><Text style={navStyles.drawerMenuText}>Practice</Text></TouchableOpacity>
            </ScrollView>

            <View style={navStyles.drawerDivider} />

            <View style={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
              <TouchableOpacity style={navStyles.drawerFooterItem} onPress={() => setShowProfileDropdown(false)}>
                <Settings size={22} color={DARK} />
                <Text style={navStyles.drawerFooterText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[navStyles.drawerFooterItem, { marginTop: 24 }]} onPress={async () => {
                setShowProfileDropdown(false);
                await AsyncStorage.removeItem('studentUserId');
                userStore.id = '';
                userStore.name = '';
                userStore.email = '';
                userStore.profilePhoto = null;
                router.replace('/login');
              }}>
                <LogOut size={22} color="#ef4444" />
                <Text style={[navStyles.drawerFooterText, { color: '#ef4444' }]}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
      </View>
      <NotificationModal visible={showNotifications} onClose={() => setShowNotifications(false)} role="student" />
      <EmailNotificationModal visible={showEmailModal} onClose={() => setShowEmailModal(false)} />
    </View>
  );
}

const navStyles = StyleSheet.create({
  headerContainer: {
    backgroundColor: WHITE,
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 44 : 32, paddingBottom: 12,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 24, height: 24, borderRadius: 6, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 22, fontWeight: '900', color: DARK },
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
  
  drawerOverlay: { flex: 1, flexDirection: 'row-reverse' },
  drawerOverlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawerContent: { width: '80%', maxWidth: 320, backgroundColor: WHITE, height: '100%', position: 'absolute', right: 0, top: 0, bottom: 0, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: -2, height: 0 }, borderTopLeftRadius: 24, borderBottomLeftRadius: 24 },
  drawerAvatar: { width: 72, height: 72, borderRadius: 36 },
  drawerAvatarFallback: { width: 72, height: 72, borderRadius: 36, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  drawerAvatarText: { color: WHITE, fontSize: 24, fontWeight: '700' },
  drawerName: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  drawerBio: { fontSize: 14, color: '#0f172a', fontWeight: '500', marginBottom: 4 },
  drawerLocation: { fontSize: 14, color: '#475569', fontWeight: '500', marginBottom: 4 },
  drawerDivider: { height: 1, backgroundColor: '#e2e8f0' },
  drawerMenuItem: { paddingHorizontal: 20, paddingVertical: 14 },
  drawerMenuText: { fontSize: 16, fontWeight: '700', color: DARK },
  drawerFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  drawerFooterText: { fontSize: 16, fontWeight: '700', color: DARK },
});
