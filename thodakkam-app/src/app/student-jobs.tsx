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
  const active = 'Jobs';

  return (
    <View style={tabBarStyles.container}>
      {tabs.map(({ label, icon: Icon, path }) => {
        const isActive = active === label;
        return (
          <TouchableOpacity 
            key={label} 
            style={tabBarStyles.tab} 
            onPress={() => {
              if (path) router.replace(path as any);
            }}
          >
            <View style={[{ padding: 8, borderRadius: 20 }, isActive && { backgroundColor: PRIMARY + '20', transform: [{ scale: 1.1 }] }]}>
                  <Icon size={22} color={isActive ? PRIMARY : GRAY} />
                </View>
            <Text style={[tabBarStyles.label, isActive && tabBarStyles.labelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function StudentJobs() {
  const router = useRouter();
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
    <SafeAreaView style={styles.safeArea}>
      <StudentHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>Recommended for You</Text>
            <Text style={styles.pageSubtitle}>
              AI-matched jobs based on your <Text style={{fontWeight: '700'}}>Python</Text> and <Text style={{fontWeight: '700'}}>React</Text> expertise.
            </Text>
          </View>

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <TouchableOpacity style={styles.filterBtn}>
            <SlidersHorizontal size={14} color={DARK} />
            <Text style={styles.filterBtnText}>Filters</Text>
          </TouchableOpacity>
          <Text style={styles.sortText}>Sort by: <Text style={styles.sortTextBold}>Match Score</Text></Text>
        </View>

        {/* Job List */}
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: GRAY }}>Loading recommendations...</Text>
        ) : jobs.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: GRAY }}>No active jobs found right now.</Text>
        ) : (
          jobs.map(job => {
            const matchScore = Math.floor(Math.random() * (98 - 70 + 1) + 70);
            
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
                      <View style={styles.sparkleBadge}>
                        <Sparkles size={10} color="#3730a3" style={{ marginRight: 4 }} />
                        <Text style={styles.sparkleText}>{matchScore}% Match</Text>
                      </View>
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
                  {job.type && (
                    <View style={styles.tagPill}><Text style={styles.tagPillText}>{job.type}</Text></View>
                  )}
                </View>
                
                <View style={styles.cardDivider} />
                
                <View style={styles.cardBottomRow}>
                  <TouchableOpacity style={styles.bookmarkBtn}>
                    <Bookmark size={16} color={DARK} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.applyPurpleBtn}
                    onPress={() => router.push({ pathname: '/student-apply', params: { jobId: job.id, jobTitle: job.title } })}
                  >
                    <Text style={styles.applyPurpleBtnText}>Apply Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* AI Promo Card */}
        <View style={styles.aiPromoCard}>
          <Text style={styles.aiPromoTitle}>Want better matches?</Text>
          <Text style={styles.aiPromoSub}>
            Our AI model analyzes your profile, skills, and experience to find the most relevant opportunities for your career path.
          </Text>
          
          <View style={styles.aiStatsRow}>
            <View style={styles.aiStatBox}>
              <Text style={styles.aiStatNum}>12</Text>
              <Text style={styles.aiStatLabel}>NEW MATCHES</Text>
            </View>
            <View style={styles.aiStatBox}>
              <Text style={styles.aiStatNum}>4</Text>
              <Text style={styles.aiStatLabel}>INTERVIEWS</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.analyzeBtn}>
            <Text style={styles.analyzeBtnText}>ANALYZE</Text>
            <ArrowRight size={14} color={DARK} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.uploadBtn}>
            <Upload size={14} color={WHITE} style={{ marginRight: 6 }} />
            <Text style={styles.uploadBtnText}>Upload Resume</Text>
          </TouchableOpacity>
        </View>
        </Animated.View>

      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <MessageCircle size={18} color={WHITE} style={{ marginRight: 6 }} />
        <Text style={styles.fabText}>Respond to Request</Text>
      </TouchableOpacity>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  
  headerContainer: {
    backgroundColor: WHITE,
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 16,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 24, height: 24, borderRadius: 6, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 13, fontWeight: '800', color: DARK },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellWrapper: { position: 'relative' },
  bellDot: { position: 'absolute', top: 0, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', borderWidth: 1, borderColor: WHITE },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: BG, borderRadius: 8, paddingHorizontal: 10, height: 36 },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 12, color: DARK },
  iconBtn: { padding: 4 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 80 },
  
  titleSection: { marginBottom: 16 },
  pageTitle: { fontSize: 18, fontWeight: '800', color: DARK, marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: GRAY, lineHeight: 18 },
  
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: BORDER },
  filterBtnText: { fontSize: 11, fontWeight: '700', color: DARK, marginLeft: 6 },
  sortText: { fontSize: 11, color: GRAY },
  sortTextBold: { fontWeight: '700', color: DARK },

  jobCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    }),
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  companyLogoBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: WHITE, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  companyLogo: { width: '80%', height: '80%' },
  companyLogoText: { fontSize: 16, fontWeight: '800', color: PRIMARY },
  jobMainInfo: { flex: 1 },
  titleRowFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  jobTitleLarge: { fontSize: 18, fontWeight: '800', color: DARK, flex: 1, marginRight: 8 },
  sparkleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  sparkleText: { fontSize: 10, fontWeight: '700', color: '#3730a3' },
  companyNameText: { fontSize: 12, color: '#475569', letterSpacing: 0.5, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, color: GRAY, marginLeft: 4 },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tagPill: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  tagPillText: { fontSize: 11, color: DARK, fontWeight: '500' },
  
  cardDivider: { height: 1, backgroundColor: '#f1f5f9', width: '100%', marginBottom: 16 },
  
  cardBottomRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
  bookmarkBtn: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  applyPurpleBtn: { backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, minWidth: 120, alignItems: 'center' },
  applyPurpleBtnText: { color: WHITE, fontSize: 13, fontWeight: '700' },

  aiPromoCard: { backgroundColor: PRIMARY, borderRadius: 16, padding: 20, marginTop: 8 },
  aiPromoTitle: { fontSize: 16, fontWeight: '800', color: WHITE, marginBottom: 6 },
  aiPromoSub: { fontSize: 12, color: WHITE + 'dd', lineHeight: 18, marginBottom: 20 },
  aiStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  aiStatBox: { flex: 1, backgroundColor: '#4a154b', borderRadius: 8, padding: 12, alignItems: 'center' },
  aiStatNum: { fontSize: 18, fontWeight: '800', color: WHITE, marginBottom: 2 },
  aiStatLabel: { fontSize: 9, color: WHITE + 'aa', fontWeight: '700', letterSpacing: 0.5 },
  analyzeBtn: { flexDirection: 'row', backgroundColor: WHITE, borderRadius: 8, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  analyzeBtnText: { fontSize: 11, fontWeight: '800', color: DARK },
  uploadBtn: { flexDirection: 'row', backgroundColor: '#4a154b', borderRadius: 8, paddingVertical: 12, justifyContent: 'center', alignItems: 'center' },
  uploadBtnText: { fontSize: 11, fontWeight: '700', color: WHITE },

  fab: {
    position: 'absolute', bottom: 80, right: 16,
    flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(106,27,154,0.4)' },
      default: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
    }),
  },
  fabText: { color: WHITE, fontSize: 12, fontWeight: '700' },
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
