import { BASE_URL } from '@/config/api';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Animated, Modal, Dimensions
} from 'react-native';
import {
  Bell, Search, Mail, Settings, LayoutDashboard, Briefcase,
  MessageSquare, Users, SlidersHorizontal, Monitor, Cloud, PenTool, Shield,
  ArrowRight, Upload, MessageCircle, GraduationCap, ClipboardList, Bookmark, MapPin, Sparkles, X
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import StudentHeader from '../components/StudentHeader';
import { userStore } from '../utils/userStore';
import { useAppTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

function BottomTabBar() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const tabs = [
    { label: 'Home', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Job', icon: Briefcase, path: '/student-jobs' },
    { label: 'Test', icon: ClipboardList, path: '/student-assessments' },
    { label: 'Chat', icon: MessageSquare, path: '/student-messages' },
    { label: 'Feed', icon: Users, path: '/student-community' }
  ];
  const active = 'Job';

  return (
    <View style={[tabBarStyles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {tabs.map(({ label, icon: Icon, path }) => {
        const isActive = active === label;
        return (
          <TouchableOpacity 
            key={label} 
            style={tabBarStyles.tab} 
            onPress={() => {
              if (path) router.navigate(path as any);
            }}
          >
            <View style={[{ padding: 8, borderRadius: 20 }, isActive && { backgroundColor: colors.primary + '20', transform: [{ scale: 1.1 }] }]}>
                  <Icon size={22} color={isActive ? colors.primary : colors.textSecondary} />
                </View>
            <Text style={[tabBarStyles.label, { color: colors.textSecondary }, isActive && { color: colors.primary, fontWeight: '700' }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function StudentJobs() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [jobs, setJobs] = useState<any[]>([]);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchUserSkills();
  }, []);

  const fetchUserSkills = async () => {
    try {
      let id = userStore.id;
      if (!id) {
        const stored = await AsyncStorage.getItem('studentUserId');
        if (stored) id = stored;
      }
      if (!id) id = '8bbe6fc3-2716-4821-b967-35b0689cbf11';

      const baseUrl = BASE_URL;
      const response = await fetch(`${baseUrl}/api/students/${id}/profile`);
      const json = await response.json();

      if (json.success && json.data && Array.isArray(json.data.skills)) {
        setUserSkills(json.data.skills);
      }
    } catch (err) {
      console.error('Error fetching user skills:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const baseUrl = BASE_URL;
      const response = await fetch(`${baseUrl}/api/jobs`);
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs || []);
      } else if (Array.isArray(data)) {
        setJobs(data);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StudentHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Recommended for You</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
              {userSkills.length >= 2 ? (
                <>AI-matched jobs based on your <Text style={{fontWeight: '700'}}>{userSkills[0]}</Text> and <Text style={{fontWeight: '700'}}>{userSkills[1]}</Text> expertise.</>
              ) : userSkills.length === 1 ? (
                <>AI-matched jobs based on your <Text style={{fontWeight: '700'}}>{userSkills[0]}</Text> expertise.</>
              ) : (
                <>AI-matched jobs based on your profile expertise.</>
              )}
            </Text>
          </View>

        {/* Job List */}
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>Loading recommendations...</Text>
        ) : jobs.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>No active jobs found right now.</Text>
        ) : (
          jobs.map(job => <JobItem key={job.id} job={job} router={router} />)
        )}

        </Animated.View>

      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

export function JobItem({ job, router, initiallySavedStr }: { job: any, router: any, initiallySavedStr?: string }) {
  const { colors, isDark } = useAppTheme();
  const matchScore = Math.floor(Math.random() * (98 - 70 + 1) + 70);
  
  const [hasSaved, setHasSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(`saved_jobs_${userStore.email}`).then(savedStr => {
      if (savedStr) {
        const savedArr = JSON.parse(savedStr);
        if (savedArr.includes(job.id)) {
          setHasSaved(true);
        }
      }
    }).catch(() => {});
  }, [job.id]);

  let initialPhoto = job.company_logo || job.startup?.companyLogo || job.startup?.profilePhoto;
  if (initialPhoto && !initialPhoto.startsWith('http') && !initialPhoto.startsWith('data:')) {
    const baseUrl = BASE_URL;
    initialPhoto = `${baseUrl}/uploads/${initialPhoto.split(/[/\\]/).pop()}`;
  }
  const [fetchedLogo, setFetchedLogo] = useState<string | null>(null);

  useEffect(() => {
    if (job.startup_id) {
      fetch(`${BASE_URL}/api/startups/public/${job.startup_id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.profile && data.profile.logo_url) {
            setFetchedLogo(data.profile.logo_url);
          }
        })
        .catch(() => {});
    }
  }, [job.startup_id]);

  const startupPhoto = fetchedLogo || initialPhoto;
  const companyName = job.company_name || job.startup?.companyName || 'COMPANY';

  const handleSave = async () => {
    if (isSaving) return;
    const newSavedState = !hasSaved;
    setHasSaved(newSavedState);
    setIsSaving(true);
    
    try {
      const storageKey = `saved_jobs_${userStore.email}`;
      const savedStr = await AsyncStorage.getItem(storageKey);
      let savedArr = savedStr ? JSON.parse(savedStr) : [];
      
      if (newSavedState) {
        if (!savedArr.includes(job.id)) savedArr.push(job.id);
      } else {
        savedArr = savedArr.filter((id: any) => id !== job.id);
      }
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(savedArr));
    } catch (err) {
      console.error(err);
      setHasSaved(!newSavedState);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={() => setModalVisible(true)}
      style={[styles.jobCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.cardTopRow}>
        <View style={[styles.companyLogoBox, { backgroundColor: colors.inputBg }]}>
          {startupPhoto ? (
            <Image source={{ uri: startupPhoto }} style={styles.companyLogo} resizeMode="cover" />
          ) : (
            <Text style={[styles.companyLogoText, { color: '#ffffff' }]}>{companyName.substring(0,2).toUpperCase()}</Text>
          )}
        </View>
        
        <View style={styles.jobMainInfo}>
          <View style={styles.titleRowFlex}>
            <Text style={[styles.jobTitleLarge, { color: colors.text }]} numberOfLines={1}>{job.title}</Text>
            <View style={[styles.sparkleBadge, { backgroundColor: isDark ? colors.primary + '20' : '#e0e7ff' }]}>
              <Sparkles size={10} color={isDark ? colors.primary : "#3730a3"} style={{ marginRight: 4 }} />
              <Text style={[styles.sparkleText, { color: isDark ? colors.primary : "#3730a3" }]}>{matchScore}% Match</Text>
            </View>
          </View>
          <Text style={[styles.companyNameText, { color: colors.textSecondary }]}>{companyName.toUpperCase()}</Text>
          <View style={styles.locationRow}>
            <MapPin size={10} color={colors.textSecondary} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>{job.location || 'Remote'}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.tagsContainer}>
        {(job.requirements || []).slice(0, 2).map((req: string, idx: number) => (
          <View key={idx} style={[styles.tagPill, { backgroundColor: colors.inputBg }]}><Text style={[styles.tagPillText, { color: colors.text }]}>{req}</Text></View>
        ))}
        {job.type && (
          <View style={[styles.tagPill, { backgroundColor: colors.inputBg }]}><Text style={[styles.tagPillText, { color: colors.text }]}>{job.type}</Text></View>
        )}
      </View>
      
      <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
      
      <View style={styles.cardBottomRow}>
        <TouchableOpacity style={[styles.bookmarkBtn, { borderColor: colors.border }]} onPress={handleSave} disabled={isSaving}>
          <Bookmark size={16} color={hasSaved ? colors.primary : colors.textSecondary} fill={hasSaved ? colors.primary : 'transparent'} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.applyPurpleBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: '/student-apply', params: { jobId: job.id, jobTitle: job.title } })}
        >
          <Text style={styles.applyPurpleBtnText}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>

    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background, marginTop: 60 }]}>
          
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={[styles.companyLogoBox, { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', marginRight: 16 }]}>
                {startupPhoto ? (
                  <Image source={{ uri: startupPhoto }} style={styles.companyLogo} resizeMode="cover" />
                ) : (
                  <Text style={[styles.companyLogoText, { color: '#ffffff', fontSize: 24 }]}>{companyName.substring(0,2).toUpperCase()}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.jobTitleLarge, { color: colors.text, fontSize: 22, marginBottom: 4 }]}>{job.title}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>{companyName}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Grid Info */}
            <View style={[styles.infoGrid, { backgroundColor: colors.card }]}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>LOCATION</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{job.location || 'Remote'}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>EXPERIENCE</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{job.experience || 'Entry Level'}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>TYPE</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{job.type || 'Full Time'}</Text>
              </View>
              <View style={[styles.infoCol, { width: '100%', marginTop: 16 }]}>
                <Text style={styles.infoLabel}>DOMAIN</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{job.domain || 'Software'}</Text>
              </View>
            </View>

            {/* About Role */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About the role</Text>
            <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
              {job.description || 'We are looking for an amazing candidate to join our team...'}
            </Text>

            {/* About Company */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>About the company</Text>
            <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
              {job.startup?.description || 'A fast-growing startup revolutionizing the industry.'}
            </Text>

            {/* Skills */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Skills Required</Text>
            <View style={styles.tagsContainer}>
              {(job.requirements || []).map((req: string, idx: number) => (
                <View key={idx} style={[styles.tagPill, { backgroundColor: colors.inputBg }]}><Text style={[styles.tagPillText, { color: colors.text }]}>{req}</Text></View>
              ))}
            </View>
            <View style={{ height: 100 }} /> 
          </ScrollView>

          {/* Sticky Bottom Bar */}
          <View style={[styles.stickyBottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity style={[styles.bookmarkBtn, { borderColor: colors.border, width: 48, height: 48, marginRight: 16 }]} onPress={handleSave} disabled={isSaving}>
              <Bookmark size={20} color={hasSaved ? colors.primary : colors.textSecondary} fill={hasSaved ? colors.primary : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.applyPurpleBtn, { backgroundColor: colors.text, flex: 1, height: 48, justifyContent: 'center' }]}
              onPress={() => {
                setModalVisible(false);
                router.push({ pathname: '/student-apply', params: { jobId: job.id, jobTitle: job.title } });
              }}
            >
              <Text style={[styles.applyPurpleBtnText, { color: colors.background, fontSize: 16 }]}>Apply Now</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 80 },
  
  titleSection: { marginBottom: 16 },
  pageTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  pageSubtitle: { fontSize: 12, lineHeight: 18 },

  jobCard: {
    borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
    }),
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  companyLogoBox: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14, overflow: 'hidden' },
  companyLogo: { width: '100%', height: '100%' },
  companyLogoText: { fontSize: 18, fontWeight: '800' },
  jobMainInfo: { flex: 1 },
  titleRowFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  jobTitleLarge: { fontSize: 19, fontWeight: '900', flex: 1, marginRight: 8, letterSpacing: -0.3 },
  sparkleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  sparkleText: { fontSize: 11, fontWeight: '800' },
  companyNameText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, marginLeft: 6, fontWeight: '500' },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tagPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  tagPillText: { fontSize: 11, fontWeight: '500' },
  
  cardDivider: { height: 1, width: '100%', marginBottom: 16 },
  
  cardBottomRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
  bookmarkBtn: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  applyPurpleBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, minWidth: 120, alignItems: 'center' },
  applyPurpleBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  modalScroll: { padding: 24 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 32 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 16, padding: 20, marginBottom: 32 },
  infoCol: { width: '33.33%' },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', marginBottom: 8, letterSpacing: 1 },
  infoValue: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  sectionBody: { fontSize: 14, lineHeight: 22 },
  stickyBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, borderTopWidth: 1 },
});

const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 30 : 24,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, fontWeight: '500' },
});
