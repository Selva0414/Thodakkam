import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Image, Platform, Modal, ScrollView } from 'react-native';
import { Bell, Search, Mail, Settings, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationModal from './NotificationModal';
import EmailNotificationModal from './EmailNotificationModal';
import { userStore } from '../utils/userStore';
import { useAppTheme } from '../context/ThemeContext';

export default function StudentHeader({ user }: { user?: { id?: string, name: string, profilePhoto?: string | null, email?: string, phone?: string } }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  
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
            const baseUrl = Platform.OS === 'android' ? 'https://thodakkam.onrender.com' : 'https://thodakkam.onrender.com';
            const res = await fetch(`${baseUrl}/api/user/${storedId}`);
            const data = await res.json();
            if (data.success && data.user) {
              let photo = data.user.profilePhoto;
              if (photo && photo.startsWith('file://')) {
                photo = null; // Invalid across devices, fallback to initials
              } else if (photo && !photo.startsWith('http') && !photo.startsWith('data:image')) {
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
    <View style={[navStyles.headerContainer, { backgroundColor: colors.card }]}>
      <View style={navStyles.headerTop}>
        <View style={navStyles.logoRow}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: colors.primary, marginRight: 8 }}>
            <Image source={require('../../assets/images/Thodakkam-circle.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
          <Text style={[navStyles.logoText, { color: colors.text }]}>Student Portal</Text>
        </View>
        <View style={navStyles.headerIcons}>
          <TouchableOpacity style={navStyles.bellWrapper} onPress={() => setShowNotifications(true)}>
            <Bell size={18} color={colors.text} />
            <View style={[navStyles.bellDot, { borderColor: colors.card }]} />
          </TouchableOpacity>
          <TouchableOpacity style={[navStyles.avatar, { backgroundColor: colors.primary }]} onPress={() => setShowProfileDropdown(!showProfileDropdown)}>
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
          <TouchableOpacity style={[navStyles.drawerOverlayBg, { backgroundColor: colors.overlay }]} onPress={() => setShowProfileDropdown(false)} activeOpacity={1} />
          <View style={[navStyles.drawerContent, { backgroundColor: colors.card }]}>
            <View>
              <View style={{ height: Platform.OS === 'ios' ? 120 : 100, backgroundColor: colors.primary, width: '100%', borderTopLeftRadius: 24 }} />
              <View style={{ paddingHorizontal: 20, paddingBottom: 20, marginTop: -40 }}>
                <TouchableOpacity onPress={() => { setShowProfileDropdown(false); router.push('/student-profile'); }}>
                  <View style={{ backgroundColor: colors.card, padding: 4, borderRadius: 40, alignSelf: 'flex-start', marginBottom: 12, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                    {localUser.profilePhoto ? (
                      <Image source={{ uri: localUser.profilePhoto }} style={navStyles.drawerAvatar} />
                    ) : (
                      <View style={[navStyles.drawerAvatarFallback, { backgroundColor: colors.primary }]}>
                        <Text style={navStyles.drawerAvatarText}>{firstLetter}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[navStyles.drawerName, { color: colors.text }]}>{localUser.name || 'Student'}</Text>
                  {localUser.email ? <Text style={[navStyles.drawerBio, { color: colors.textSecondary }]}>{localUser.email}</Text> : null}
                </TouchableOpacity>
              </View>
            </View>

            <View style={[navStyles.drawerDivider, { backgroundColor: colors.border }]} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }}>
              <TouchableOpacity style={navStyles.drawerMenuItem} onPress={() => { setShowProfileDropdown(false); router.push('/student-profile'); }}><Text style={[navStyles.drawerMenuText, { color: colors.text }]}>My profile</Text></TouchableOpacity>
              <TouchableOpacity style={navStyles.drawerMenuItem} onPress={() => { setShowProfileDropdown(false); router.push({ pathname: '/student-my-jobs' as any }); }}><Text style={[navStyles.drawerMenuText, { color: colors.text }]}>My Jobs</Text></TouchableOpacity>
              <TouchableOpacity style={navStyles.drawerMenuItem} onPress={() => { setShowProfileDropdown(false); router.push({ pathname: '/saved-posts' as any, params: { role: 'student', identifier: userStore.email } }); }}><Text style={[navStyles.drawerMenuText, { color: colors.text }]}>Saved posts</Text></TouchableOpacity>
              <TouchableOpacity style={navStyles.drawerMenuItem}><Text style={[navStyles.drawerMenuText, { color: colors.text }]}>My Network</Text></TouchableOpacity>
              <TouchableOpacity style={navStyles.drawerMenuItem}><Text style={[navStyles.drawerMenuText, { color: colors.text }]}>General</Text></TouchableOpacity>
              <TouchableOpacity style={navStyles.drawerMenuItem}><Text style={[navStyles.drawerMenuText, { color: colors.text }]}>Practice</Text></TouchableOpacity>
            </ScrollView>

            <View style={[navStyles.drawerDivider, { backgroundColor: colors.border }]} />

            <View style={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
              <TouchableOpacity style={navStyles.drawerFooterItem} onPress={() => { setShowProfileDropdown(false); router.push('/student-settings'); }}>
                <Settings size={22} color={colors.text} />
                <Text style={[navStyles.drawerFooterText, { color: colors.text }]}>Settings</Text>
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
                <LogOut size={22} color={colors.danger} />
                <Text style={[navStyles.drawerFooterText, { color: colors.danger }]}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={navStyles.searchRow}>
        <View style={[navStyles.searchBar, { backgroundColor: colors.inputBg }]}>
          <Search size={14} color={colors.textSecondary} />
          <TextInput 
            style={[navStyles.searchInput, { color: colors.text }]}
            placeholder="Search for jobs, companies..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <TouchableOpacity style={navStyles.iconBtn} onPress={() => setShowEmailModal(true)}>
          <Mail size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <NotificationModal visible={showNotifications} onClose={() => setShowNotifications(false)} role="student" />
      <EmailNotificationModal visible={showEmailModal} onClose={() => setShowEmailModal(false)} />
    </View>
  );
}

const navStyles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 44 : 32, paddingBottom: 12,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 22, fontWeight: '900' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellWrapper: { position: 'relative' },
  bellDot: { position: 'absolute', top: 0, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', borderWidth: 1 },
  avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  avatarImage: { width: '100%', height: '100%' },
  
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 10, height: 36 },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 12, ...Platform.select({ web: { outlineStyle: 'none' } as any }) },
  iconBtn: { padding: 4 },
  
  drawerOverlay: { flex: 1, flexDirection: 'row-reverse' },
  drawerOverlayBg: { flex: 1 },
  drawerContent: { width: '80%', maxWidth: 320, height: '100%', position: 'absolute', right: 0, top: 0, bottom: 0, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: -2, height: 0 }, borderTopLeftRadius: 24, borderBottomLeftRadius: 24 },
  drawerAvatar: { width: 72, height: 72, borderRadius: 36 },
  drawerAvatarFallback: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  drawerAvatarText: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  drawerName: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  drawerBio: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  drawerLocation: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  drawerDivider: { height: 1 },
  drawerMenuItem: { paddingHorizontal: 20, paddingVertical: 14 },
  drawerMenuText: { fontSize: 16, fontWeight: '700' },
  drawerFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  drawerFooterText: { fontSize: 16, fontWeight: '700' },
});
