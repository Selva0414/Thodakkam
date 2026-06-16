import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, Image, Animated
} from 'react-native';
import {
  LayoutDashboard, Briefcase, MessageSquare, Users, ClipboardList, Bookmark, MapPin, Sparkles, ArrowLeft
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import StudentHeader from '../components/StudentHeader';
import { userStore } from '../utils/userStore';

const PRIMARY = '#6a1b9a';
const BG = '#f4f5f7';
const WHITE = '#ffffff';
const DARK = '#0f172a';
const GRAY = '#6b7280';
const BORDER = '#e2e8f0';

function BottomTabBar() {
  const router = useRouter();
  const tabs = [
    { label: 'Home', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Jobs', icon: Briefcase, path: '/student-jobs' },
    { label: 'Tests', icon: ClipboardList, path: '/student-assessments' },
    { label: 'Chat', icon: MessageSquare, path: '/student-messages' },
    { label: 'Feed', icon: Users, path: '/student-community' },
  ];
  return (
    <View style={tabBarStyles.container}>
      {tabs.map(({ label, icon: Icon, path }) => (
        <TouchableOpacity key={label} style={tabBarStyles.tab} onPress={() => { if (path) router.navigate(path as any); }}>
          <View style={{ padding: 8, borderRadius: 20 }}>
            <Icon size={22} color={GRAY} />
          </View>
          <Text style={tabBarStyles.label}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function StudentMyJobs() {
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Saved');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      const response = await fetch(`${baseUrl}/api/jobs/my-jobs/${encodeURIComponent(userStore.email)}`);
      const data = await response.json();
      if (data.success) {
        setSavedJobs(data.savedJobs || []);
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching my jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId: string) => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      const res = await fetch(`${baseUrl}/api/jobs/${jobId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userStore.email })
      });
      const data = await res.json();
      if (data.success) {
        setSavedJobs(prev => prev.filter(j => j.id !== jobId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const interviewing = applications.filter(a => a.status === 'INTERVIEWING' || a.status === 'REVIEWING');
  const offered = applications.filter(a => a.status === 'OFFERED');

  const tabs = [
    { id: 'Saved', label: `Saved (${savedJobs.length})` },
    { id: 'Applied', label: `Applied (${applications.length})` },
    { id: 'Interviewing', label: `Interviewing (${interviewing.length})` },
    { id: 'Offered', label: `Offered (${offered.length})` },
  ];

  const renderList = () => {
    let list: any[] = [];
    if (activeTab === 'Saved') list = savedJobs;
    else if (activeTab === 'Applied') list = applications.map((a: any) => ({ ...a.job, application: a }));
    else if (activeTab === 'Interviewing') list = interviewing.map((a: any) => ({ ...a.job, application: a }));
    else if (activeTab === 'Offered') list = offered.map((a: any) => ({ ...a.job, application: a }));

    if (loading) return <Text style={{ textAlign: 'center', marginTop: 40, color: GRAY }}>Loading your jobs...</Text>;

    if (list.length === 0) {
      return (
        <View style={{ alignItems: 'center', marginTop: 80 }}>
          <Bookmark size={48} color={'#cbd5e1'} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: DARK, marginBottom: 8 }}>No {activeTab.toLowerCase()} jobs</Text>
          <Text style={{ fontSize: 13, color: GRAY }}>Jobs you {activeTab === 'Saved' ? 'bookmark' : 'apply to'} will appear here.</Text>
        </View>
      );
    }

    return list.map((job: any) => {
      let startupPhoto = job.startup?.companyLogo || job.startup?.profilePhoto;
      if (startupPhoto && !startupPhoto.startsWith('http') && !startupPhoto.startsWith('data:')) {
        const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
        startupPhoto = `${baseUrl}/uploads/${startupPhoto.split(/[/\\]/).pop()}`;
      }

      return (
        <View key={job.id} style={styles.jobCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.companyLogoBox}>
              {startupPhoto ? (
                <Image source={{ uri: startupPhoto }} style={styles.companyLogo} resizeMode="contain" />
              ) : (
                <Text style={styles.companyLogoText}>{(job.startup?.companyName || 'C').substring(0,2).toUpperCase()}</Text>
              )}
            </View>
            <View style={styles.jobMainInfo}>
              <View style={styles.titleRowFlex}>
                <Text style={styles.jobTitleLarge} numberOfLines={1}>{job.title}</Text>
              </View>
              <Text style={styles.companyNameText}>{job.startup?.companyName?.toUpperCase() || 'COMPANY'}</Text>
              <View style={styles.locationRow}>
                <MapPin size={10} color={GRAY} />
                <Text style={styles.locationText}>{job.location || 'Remote'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.tagsContainer}>
            {(job.requirements || []).slice(0, 2).map((req: string, idx: number) => (
              <View key={idx} style={styles.tagPill}><Text style={styles.tagPillText}>{req}</Text></View>
            ))}
            {job.type && <View style={styles.tagPill}><Text style={styles.tagPillText}>{job.type}</Text></View>}
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.cardBottomRow}>
            {activeTab === 'Saved' ? (
              <TouchableOpacity style={styles.bookmarkBtn} onPress={() => handleUnsave(job.id)}>
                <Bookmark size={16} color={PRIMARY} fill={PRIMARY} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.statusBadge, job.application?.status === 'OFFERED' ? { backgroundColor: '#dcfce7' } : {}]}>
                <Text style={[styles.statusText, job.application?.status === 'OFFERED' ? { color: '#166534' } : {}]}>{job.application?.status}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.applyPurpleBtn} onPress={() => router.push({ pathname: '/student-apply', params: { jobId: job.id, jobTitle: job.title } })}>
              <Text style={styles.applyPurpleBtnText}>View Job</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.titleSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
                <ArrowLeft size={24} color={DARK} />
              </TouchableOpacity>
              <Text style={styles.pageTitle}>My Jobs</Text>
            </View>
            <Text style={styles.pageSubtitle}>Track your job applications and saved opportunities.</Text>
          </View>

          <View style={styles.tabsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity key={tab.id} style={[styles.tabBtn, isActive && styles.tabBtnActive]} onPress={() => setActiveTab(tab.id)}>
                    <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {renderList()}
        </Animated.View>
      </ScrollView>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 80 },

  titleSection: { marginBottom: 24, paddingLeft: 4 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: DARK },
  pageSubtitle: { fontSize: 13, color: GRAY, lineHeight: 20 },

  tabsWrapper: { borderBottomWidth: 1, borderBottomColor: BORDER, marginBottom: 24 },
  tabsScroll: { paddingRight: 16 },
  tabBtn: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: PRIMARY },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: GRAY },
  tabBtnTextActive: { color: PRIMARY },

  jobCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    }),
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  companyLogoBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  companyLogo: { width: '80%', height: '80%' },
  companyLogoText: { fontSize: 16, fontWeight: '800', color: PRIMARY },
  jobMainInfo: { flex: 1 },
  titleRowFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  jobTitleLarge: { fontSize: 16, fontWeight: '800', color: DARK, flex: 1 },
  companyNameText: { fontSize: 12, fontWeight: '700', color: PRIMARY, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 11, color: GRAY, marginLeft: 4 },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tagPill: { backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  tagPillText: { fontSize: 11, fontWeight: '600', color: DARK },

  cardDivider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 16 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookmarkBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: BORDER, justifyContent: 'center', alignItems: 'center' },
  applyPurpleBtn: { backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  applyPurpleBtnText: { color: WHITE, fontWeight: '700', fontSize: 13 },

  statusBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', color: GRAY },
});

const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
    paddingBottom: Platform.OS === 'ios' ? 30 : 24,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, color: GRAY, fontWeight: '500' },
  labelActive: { color: PRIMARY, fontWeight: '700' },
});
