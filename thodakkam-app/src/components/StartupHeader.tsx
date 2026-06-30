import { BASE_URL } from '@/config/api';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Platform, Image, Modal, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Search, Mail, Menu, Users, Settings, MessageSquare, LogOut } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationModal from './NotificationModal';
import EmailNotificationModal from './EmailNotificationModal';
import StartupProfileModal from './StartupProfileModal';
import StartupSettingsModal from './StartupSettingsModal';
import StartupNetworkModal from './StartupNetworkModal';
import { useAppTheme } from '../context/ThemeContext';

export default function StartupHeader({ companyName = 'Echo Digital' }: { companyName?: string }) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [founderName, setFounderName] = useState<string>('');
  const [founderEmail, setFounderEmail] = useState<string>('');

  const slideAnim = React.useRef(new Animated.Value(400)).current;

  const openMenu = () => {
    setShowMenu(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowMenu(false));
  };

  useEffect(() => {
    if (companyName) {
      const baseUrl = BASE_URL;
      const getTokenAndFetch = async () => {
        try {
          const token = await AsyncStorage.getItem('startupToken');
          const res = await fetch(`${baseUrl}/api/startup/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.user) {
            if (data.user.logo_url || data.user.logoUrl) setCompanyLogo(data.user.logo_url || data.user.logoUrl);
            if (data.user.founderName) setFounderName(data.user.founderName);
            if (data.user.email) setFounderEmail(data.user.email);
          }
        } catch (err) {
          console.log('Error fetching logo/profile:', err);
        }
      };
      getTokenAndFetch();
    }
  }, [companyName]);

  const getInitials = (name: string) => {
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toLowerCase();
    if (words.length === 1 && words[0].length >= 4) return words[0].substring(0, 4).toLowerCase();
    return name.substring(0, 2).toLowerCase();
  };

  const companyInitials = getInitials(companyName);

  return (
    <View style={[styles.headerCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.headerTop}>
        <View style={styles.adminInfo}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: colors.primary, marginRight: 12 }}>
            {companyLogo ? (
              <Image source={{ uri: companyLogo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textSecondary }}>{companyInitials}</Text>
            )}
          </View>
          <View>
            <Text style={[styles.companyTitle, { color: colors.text }]}>{companyName}</Text>
            <Text style={[styles.companySubtitle, { color: colors.primary }]}>PREMIUM PLAN</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionIcon} onPress={() => setShowEmailModal(true)}>
            <Mail size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={() => setShowNotifications(true)}>
            <Bell size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} onPress={openMenu}>
            <Menu size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.searchBar, { flex: 1, backgroundColor: colors.inputBg, borderColor: colors.border, borderWidth: 1 }]}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search analytics, candidates..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <TouchableOpacity 
          style={{ marginLeft: 12, padding: 10, backgroundColor: colors.primary, borderRadius: 12 }} 
          onPress={() => router.push({ pathname: '/startup-messages' as any, params: { companyName } })}
        >
          <MessageSquare size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
      
      <NotificationModal visible={showNotifications} onClose={() => setShowNotifications(false)} role="startup" />
      <EmailNotificationModal visible={showEmailModal} onClose={() => setShowEmailModal(false)} />

      <Modal transparent visible={showMenu} animationType="none" onRequestClose={closeMenu}>
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={styles.drawerOverlayBg} onPress={closeMenu} activeOpacity={1} />
          <Animated.View style={[styles.drawerContent, { backgroundColor: colors.card, transform: [{ translateX: slideAnim }] }]}>
            <View>
              <View style={{ height: 100, backgroundColor: colors.primary, width: '100%', borderTopLeftRadius: 24 }} />
              <View style={{ paddingHorizontal: 20, paddingBottom: 20, marginTop: -36 }}>
                <TouchableOpacity onPress={() => { closeMenu(); router.push({ pathname: '/startup-profile' as any, params: { companyName } }); }}>
                  <View style={{ backgroundColor: colors.card, padding: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 12 }}>
                    {companyLogo ? (
                      <Image source={{ uri: companyLogo }} style={{ width: 72, height: 72, borderRadius: 16 }} />
                    ) : (
                      <View style={[styles.drawerAvatarFallback, { backgroundColor: colors.primary, borderRadius: 16, marginBottom: 0 }]}>
                        <Text style={styles.drawerAvatarText}>{companyInitials}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.drawerName, { color: colors.text }]}>{founderName || companyName}</Text>
                  {founderEmail ? <Text style={[styles.drawerEmail, { color: colors.text }]}>{founderEmail}</Text> : null}
                  {founderName ? <Text style={[styles.drawerCompanyText, { color: colors.textSecondary }]}>{companyName}</Text> : null}
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.drawerDivider, { backgroundColor: colors.border }]} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }}>
              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { closeMenu(); router.push({ pathname: '/startup-profile' as any, params: { companyName } }); }}>
                <Text style={[styles.drawerMenuText, { color: colors.text }]}>My profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { closeMenu(); router.push({ pathname: '/saved-posts' as any, params: { role: 'startup', identifier: companyName } }); }}>
                <Text style={[styles.drawerMenuText, { color: colors.text }]}>Saved posts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { closeMenu(); router.push({ pathname: '/startup-jobs' as any, params: { companyName, mode: 'Tracking' } }); }}>
                <Text style={[styles.drawerMenuText, { color: colors.text }]}>Tracking</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { closeMenu(); router.push('/startup-subscription'); }}>
                <Text style={[styles.drawerMenuText, { color: colors.text }]}>Subscription</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { closeMenu(); setShowNetworkModal(true); }}>
                <Text style={[styles.drawerMenuText, { color: colors.text }]}>My Network</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerMenuItem} onPress={() => { closeMenu(); router.push('/startup-reschedule'); }}>
                <Text style={[styles.drawerMenuText, { color: colors.text }]}>Reschedule</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={[styles.drawerDivider, { backgroundColor: colors.border }]} />

            <View style={{ paddingHorizontal: 20, paddingVertical: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
              <TouchableOpacity style={styles.drawerFooterItem} onPress={() => { closeMenu(); setShowSettingsModal(true); }}>
                <Settings size={22} color={colors.text} />
                <Text style={[styles.drawerFooterText, { color: colors.text }]}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.drawerFooterItem, { marginTop: 24 }]} onPress={async () => { 
                closeMenu();
                setTimeout(async () => {
                  await AsyncStorage.removeItem('startupId');
                  router.replace('/startup-login');
                }, 300);
              }}>
                <LogOut size={22} color={isDark ? colors.danger : "#ef4444"} />
                <Text style={[styles.drawerFooterText, { color: isDark ? colors.danger : '#ef4444' }]}>Log out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>


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
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 44 : 32, paddingBottom: 12,
    marginBottom: 16, borderBottomWidth: 1,
    zIndex: 50, elevation: 50
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  adminInfo: { flexDirection: 'row', alignItems: 'center' },
  companyTitle: { fontSize: 15, fontWeight: '800' },
  companySubtitle: { fontSize: 9, letterSpacing: 0.5, fontWeight: '700', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { padding: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
  drawerOverlay: { flex: 1, flexDirection: 'row-reverse' },
  drawerOverlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  drawerContent: { width: '80%', maxWidth: 320, height: '100%', position: 'absolute', right: 0, top: 0, bottom: 0, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: -2, height: 0 }, borderTopLeftRadius: 24, borderBottomLeftRadius: 24, overflow: 'hidden' },
  drawerAvatarFallback: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  drawerAvatarText: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  drawerName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  drawerEmail: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  drawerCompanyText: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  drawerDivider: { height: 1 },
  drawerMenuItem: { paddingHorizontal: 20, paddingVertical: 14 },
  drawerMenuText: { fontSize: 16, fontWeight: '700' },
  drawerFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  drawerFooterText: { fontSize: 16, fontWeight: '700' },
});
