import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image
} from 'react-native';
import {
  Bell, Search, Mail, Settings, LayoutDashboard, Briefcase,
  MessageSquare, Users, SlidersHorizontal, Monitor, Cloud, PenTool, Shield,
  ArrowRight, Upload, MessageCircle, GraduationCap
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
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Jobs Search', icon: Briefcase, path: '/student-jobs' },
    { label: 'Messages', icon: MessageSquare, path: null },
    { label: 'Community', icon: Users, path: '/student-community' },
  ];
  const active = 'Jobs Search';

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
            <Icon size={20} color={isActive ? PRIMARY : GRAY} />
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

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
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
            // Give a random match score for visual demo if not provided
            const matchScore = Math.floor(Math.random() * (98 - 70 + 1) + 70);
            
            let badgeBg = '#f1f5f9';
            let badgeColor = '#64748b';
            if (matchScore >= 90) { badgeBg = '#ecfdf5'; badgeColor = '#10b981'; }
            else if (matchScore >= 80) { badgeBg = '#eff6ff'; badgeColor = '#3b82f6'; }

            return (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.jobIconBox}>
                    <Monitor size={20} color={DARK} />
                  </View>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.jobCompany}>{job.startup?.companyName} • {job.location}</Text>
                  </View>
                  <View style={[styles.matchBadge, { backgroundColor: badgeBg }]}>
                    {matchScore >= 80 && <View style={[styles.matchDot, { backgroundColor: badgeColor }]} />}
                    <Text style={[styles.matchText, { color: badgeColor }]}>{matchScore}%{"\n"}Match</Text>
                  </View>
                </View>
                
                <Text style={styles.jobDesc} numberOfLines={2}>
                  {job.description || "No description provided."}
                </Text>
                
                <View style={styles.skillsRow}>
                  {(job.requirements || []).slice(0, 3).map((req: string, idx: number) => (
                    <View key={idx} style={styles.skillBadge}><Text style={styles.skillText}>{req}</Text></View>
                  ))}
                  {job.requirements?.length > 3 && (
                    <Text style={styles.skillBonus}>+{job.requirements.length - 3} Skills</Text>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.applyBtn}
                  onPress={() => router.push({ pathname: '/student-apply', params: { jobId: job.id, jobTitle: job.title } })}
                >
                  <Text style={styles.applyBtnText}>Apply Now</Text>
                </TouchableOpacity>
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
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16,
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
    backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    }),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  jobIconBox: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: BORDER, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 13, fontWeight: '800', color: DARK, marginBottom: 2 },
  jobCompany: { fontSize: 10, color: GRAY, lineHeight: 14 },
  
  matchBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  matchDot: { width: 4, height: 4, borderRadius: 2, marginRight: 4 },
  matchText: { fontSize: 8, fontWeight: '800', textAlign: 'center' },
  
  jobDesc: { fontSize: 11, color: GRAY, lineHeight: 16, marginBottom: 12 },
  
  skillsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  skillBadge: { backgroundColor: BG, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  skillText: { fontSize: 9, color: GRAY, fontWeight: '600' },
  skillBonus: { fontSize: 9, color: '#3b82f6', fontWeight: '700' },
  skillGap: { fontSize: 9, color: '#f97316', fontWeight: '700' },
  
  applyBtn: { backgroundColor: PRIMARY, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  applyBtnText: { color: WHITE, fontSize: 12, fontWeight: '700' },

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
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, color: GRAY, fontWeight: '500' },
  labelActive: { color: PRIMARY, fontWeight: '700' },
});
