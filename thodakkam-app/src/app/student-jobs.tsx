import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Animated
} from 'react-native';
import {
  Bell, Search, Mail, Settings, LayoutDashboard, Briefcase,
  MessageSquare, Users, SlidersHorizontal, Monitor, Cloud, PenTool, Shield,
  ArrowRight, Upload, MessageCircle, GraduationCap, ClipboardList, Bookmark, MapPin, Sparkles
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import StudentHeader from '../components/StudentHeader';
import { userStore } from '../utils/userStore';
import { useAppTheme } from '../context/ThemeContext';

function BottomTabBar() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const tabs = [
    { label: 'Home', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Jobs', icon: Briefcase, path: '/student-jobs' },
    { label: 'Tests', icon: ClipboardList, path: '/student-assessments' },
    { label: 'Chat', icon: MessageSquare, path: '/student-messages' },
    { label: 'Feed', icon: Users, path: '/student-community' },
  ];
  const active = 'Jobs';

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
  }, []);

  const fetchJobs = async () => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      const response = await fetch(`${baseUrl}/api/jobs`);
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
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
              AI-matched jobs based on your <Text style={{fontWeight: '700'}}>Python</Text> and <Text style={{fontWeight: '700'}}>React</Text> expertise.
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

function JobItem({ job, router }: { job: any, router: any }) {
  const { colors, isDark } = useAppTheme();
  const matchScore = Math.floor(Math.random() * (98 - 70 + 1) + 70);
  
  const initiallySaved = job.savedBy ? job.savedBy.some((s: any) => s.user?.email === userStore.email) : false;
  const [hasSaved, setHasSaved] = useState(initiallySaved);
  const [isSaving, setIsSaving] = useState(false);

  let startupPhoto = job.startup?.companyLogo || job.startup?.profilePhoto;
  if (startupPhoto && !startupPhoto.startsWith('http') && !startupPhoto.startsWith('data:')) {
    const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
    startupPhoto = `${baseUrl}/uploads/${startupPhoto.split(/[/\\]/).pop()}`;
  }

  const handleSave = async () => {
    if (isSaving) return;
    const newSavedState = !hasSaved;
    setHasSaved(newSavedState);
    setIsSaving(true);
    
    try {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      const res = await fetch(`${baseUrl}/api/jobs/${job.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userStore.email })
      });
      const data = await res.json();
      if (!data.success) {
        setHasSaved(!newSavedState);
      }
    } catch (err) {
      console.error(err);
      setHasSaved(!newSavedState);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.jobCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardTopRow}>
        <View style={[styles.companyLogoBox, { backgroundColor: colors.inputBg }]}>
          {startupPhoto ? (
            <Image source={{ uri: startupPhoto }} style={styles.companyLogo} resizeMode="contain" />
          ) : (
            <Text style={[styles.companyLogoText, { color: colors.primary }]}>{(job.startup?.companyName || 'C').substring(0,2).toUpperCase()}</Text>
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
          <Text style={[styles.companyNameText, { color: colors.textSecondary }]}>{job.startup?.companyName?.toUpperCase() || 'COMPANY'}</Text>
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
    </View>
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
    borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    }),
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  companyLogoBox: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  companyLogo: { width: '80%', height: '80%' },
  companyLogoText: { fontSize: 16, fontWeight: '800' },
  jobMainInfo: { flex: 1 },
  titleRowFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  jobTitleLarge: { fontSize: 18, fontWeight: '800', flex: 1, marginRight: 8 },
  sparkleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  sparkleText: { fontSize: 10, fontWeight: '700' },
  companyNameText: { fontSize: 12, letterSpacing: 0.5, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, marginLeft: 4 },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tagPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  tagPillText: { fontSize: 11, fontWeight: '500' },
  
  cardDivider: { height: 1, width: '100%', marginBottom: 16 },
  
  cardBottomRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
  bookmarkBtn: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  applyPurpleBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, minWidth: 120, alignItems: 'center' },
  applyPurpleBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
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
