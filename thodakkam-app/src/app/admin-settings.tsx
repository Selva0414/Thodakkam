import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Image, Platform, Switch
} from 'react-native';
import {
  Search, Mail, Bell, ShieldCheck, Rocket, Users,
  BarChart2, Settings, Home, Pencil, Sun, Moon, HelpCircle, ChevronDown
} from 'lucide-react-native';
import { router } from 'expo-router';
import AdminHeader from '../components/AdminHeader';

const PRIMARY = '#5A279B'; 
const BG = '#ffffff';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('Settings');
  const [pageTab, setPageTab] = useState('Profile');
  
  // Form State
  const [name, setName] = useState('Shabari E S');
  const [email, setEmail] = useState('shabari@example.com');
  const [bio, setBio] = useState('Experienced platform administrator managing core operational data.');
  
  // Toggles State
  const [notifNewReg, setNotifNewReg] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(false);
  const [notifInvestor, setNotifInvestor] = useState(true);

  const handleTabPress = (label: string) => {
    setActiveTab(label);
    if (label === 'Home') {
      router.navigate('/admin-dashboard' as any);
    } else if (label === 'Startups') {
      router.navigate('/admin-startups' as any);
    } else if (label === 'Students') {
      router.navigate('/admin-students' as any);
    } else if (label === 'Analytics') {
      router.navigate('/admin-analytics' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AdminHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        


        {/* Page Title & Tabs */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Settings</Text>
          <Text style={styles.pageSubtitle}>Manage your account settings and preferences</Text>
          
          <View style={styles.pageTabsContainer}>
            {['Profile', 'Security', 'Billing'].map(tab => (
              <TouchableOpacity 
                key={tab} 
                style={[styles.pageTab, pageTab === tab && styles.pageTabActive]}
                onPress={() => setPageTab(tab)}
              >
                <Text style={[styles.pageTabText, pageTab === tab && styles.pageTabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: 'https://i.pravatar.cc/150?img=11' }} style={styles.largeAvatar} />
              <View style={styles.editBadge}>
                <Pencil size={10} color={WHITE} />
              </View>
            </View>
            <View style={styles.avatarButtons}>
              <TouchableOpacity style={styles.uploadBtn}>
                <Text style={styles.uploadBtnText}>Upload New</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Role</Text>
            <TouchableOpacity style={styles.dropdownInput}>
              <Text style={styles.dropdownText}>Super Admin</Text>
              <ChevronDown size={18} color={TEXT_GRAY} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Timezone</Text>
            <TouchableOpacity style={styles.dropdownInput}>
              <Text style={styles.dropdownText}>Pacific Time (PT)</Text>
              <ChevronDown size={18} color={TEXT_GRAY} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={bio} 
              onChangeText={setBio} 
              multiline 
              numberOfLines={3} 
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <Text style={styles.label}>Appearance</Text>
          <View style={styles.appearanceToggle}>
            <TouchableOpacity style={styles.appearanceBtnActive}>
              <Sun size={14} color={TEXT_DARK} style={{ marginRight: 6 }} />
              <Text style={styles.appearanceBtnTextActive}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.appearanceBtnInactive}>
              <Moon size={14} color={TEXT_GRAY} style={{ marginRight: 6 }} />
              <Text style={styles.appearanceBtnTextInactive}>Dark</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { fontSize: 10, letterSpacing: 1, marginTop: 24, marginBottom: 16 }]}>SYSTEM NOTIFICATIONS</Text>

          <View style={styles.notificationRow}>
            <View style={styles.notificationTextCol}>
              <Text style={styles.notifTitle}>New Registrations</Text>
              <Text style={styles.notifSub}>Notify when a new user signs up</Text>
            </View>
            <Switch 
              trackColor={{ false: '#cbd5e1', true: PRIMARY }} 
              thumbColor={WHITE}
              ios_backgroundColor="#cbd5e1"
              onValueChange={setNotifNewReg} 
              value={notifNewReg} 
            />
          </View>

          <View style={styles.notificationRow}>
            <View style={styles.notificationTextCol}>
              <Text style={styles.notifTitle}>Weekly Reports</Text>
              <Text style={styles.notifSub}>Receive weekly system health reports</Text>
            </View>
            <Switch 
              trackColor={{ false: '#cbd5e1', true: PRIMARY }} 
              thumbColor={WHITE}
              ios_backgroundColor="#cbd5e1"
              onValueChange={setNotifWeekly} 
              value={notifWeekly} 
            />
          </View>

          <View style={styles.notificationRow}>
            <View style={styles.notificationTextCol}>
              <Text style={styles.notifTitle}>Investor Activity</Text>
              <Text style={styles.notifSub}>Alert on significant investment rounds</Text>
            </View>
            <Switch 
              trackColor={{ false: '#cbd5e1', true: PRIMARY }} 
              thumbColor={WHITE}
              ios_backgroundColor="#cbd5e1"
              onValueChange={setNotifInvestor} 
              value={notifInvestor} 
            />
          </View>
        </View>

        {/* Support Card */}
        <View style={styles.supportCard}>
          <View style={styles.supportHeader}>
            <HelpCircle size={18} color={TEXT_DARK} style={{ marginRight: 8 }} />
            <Text style={styles.supportTitle}>Need assistance?</Text>
          </View>
          <Text style={styles.supportText}>
            Our dedicated support team is here to help you with any configuration issues.
          </Text>
          <TouchableOpacity style={styles.supportBtn}>
            <Text style={styles.supportBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { label: 'Home', icon: Home },
          { label: 'Startups', icon: Rocket },
          { label: 'Students', icon: Users },
          { label: 'Analytics', icon: BarChart2 },
          { label: 'Settings', icon: Settings }
        ].map(item => {
          const isActive = activeTab === item.label;
          const Icon = item.icon;
          return (
            <TouchableOpacity 
              key={item.label} 
              style={styles.navItem}
              onPress={() => handleTabPress(item.label)}
            >
              <View style={[{ padding: 8, borderRadius: 20 }, isActive && { backgroundColor: PRIMARY + '20', transform: [{ scale: 1.1 }] }]}>
                  <Icon size={22} color={isActive ? PRIMARY : '#94a3b8'} />
                </View>
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20, backgroundColor: BG },
  
  headerCard: {
    backgroundColor: WHITE,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20,
    marginBottom: 12,
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
  
  titleSection: { paddingHorizontal: 20, marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: '300', color: TEXT_DARK, marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: TEXT_GRAY, marginBottom: 16 },
  
  pageTabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  pageTab: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  pageTabActive: { borderBottomColor: PRIMARY },
  pageTabText: { fontSize: 13, color: TEXT_GRAY, fontWeight: '500' },
  pageTabTextActive: { color: TEXT_DARK, fontWeight: '700' },

  sectionContainer: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 13, color: TEXT_GRAY, marginBottom: 16 },
  
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  largeAvatar: { width: 80, height: 80, borderRadius: 40 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0f172a', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: WHITE },
  avatarButtons: { flexDirection: 'row', gap: 12 },
  uploadBtn: { backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  uploadBtnText: { color: WHITE, fontSize: 11, fontWeight: '600' },
  removeBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  removeBtnText: { color: TEXT_DARK, fontSize: 11, fontWeight: '500' },

  formGroup: { marginBottom: 16 },
  label: { fontSize: 11, color: TEXT_GRAY, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: TEXT_DARK },
  dropdownInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  dropdownText: { fontSize: 13, color: TEXT_DARK, fontWeight: '500' },
  textArea: { height: 80, paddingTop: 12 },

  appearanceToggle: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4, width: '60%' },
  appearanceBtnActive: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: WHITE, paddingVertical: 8, borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  appearanceBtnInactive: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  appearanceBtnTextActive: { fontSize: 12, fontWeight: '600', color: TEXT_DARK },
  appearanceBtnTextInactive: { fontSize: 12, fontWeight: '500', color: TEXT_GRAY },

  notificationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  notificationTextCol: { flex: 1, paddingRight: 16 },
  notifTitle: { fontSize: 13, fontWeight: '600', color: TEXT_DARK, marginBottom: 2 },
  notifSub: { fontSize: 11, color: TEXT_GRAY },

  supportCard: { backgroundColor: '#ffedd5', marginHorizontal: 20, padding: 20, borderRadius: 12, marginBottom: 24 },
  supportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  supportTitle: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  supportText: { fontSize: 12, color: TEXT_GRAY, lineHeight: 18, marginBottom: 16 },
  supportBtn: { borderWidth: 1, borderColor: TEXT_DARK, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  supportBtnText: { fontSize: 13, fontWeight: '600', color: TEXT_DARK },

  bottomActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: TEXT_DARK },
  saveBtn: { flex: 1, backgroundColor: PRIMARY, borderRadius: 8, paddingVertical: 14, alignItems: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: WHITE },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: WHITE, borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  navTextActive: { color: PRIMARY, fontWeight: '700' },
});
