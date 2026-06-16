import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Animated, BackHandler, ActivityIndicator
} from 'react-native';
import {
  Bell, Search, Upload, Clock, CheckCircle, Video,
  Building2, MoreHorizontal, TrendingUp, Plus, Briefcase,
  MessageSquare, Users, LayoutDashboard, ChevronRight, Zap, FileText, GraduationCap,
  Mail, Settings, ClipboardList
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import StudentHeader from '../components/StudentHeader';
import { userStore, updateGlobalUser } from '../utils/userStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../context/ThemeContext';

// ─── Sub-components ────────────────────────────────────────────────────────────

function WelcomeSection({ user }: { user?: { name: string } }) {
  const { colors } = useAppTheme();
  const defaultUser = user || { name: 'Shabari' };
  return (
    <View style={welcomeStyles.container}>
      <Text style={[welcomeStyles.title, { color: colors.text }]}>Welcome back, {defaultUser.name}! 👋</Text>
      <Text style={[welcomeStyles.subtitle, { color: colors.textSecondary }]}>Here's what's happening with your applications today.</Text>
    </View>
  );
}

function StatCard({ icon: Icon, iconBg, label, value }: any) {
  const { colors } = useAppTheme();
  return (
    <View style={[statStyles.card, { backgroundColor: colors.background }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: iconBg + '20' }]}>
        <Icon size={18} color={iconBg} />
      </View>
      <Text style={[statStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function ApplicationOverview({ applications = [] }: { applications?: any[] }) {
  const { colors } = useAppTheme();
  const appliedCount = applications.length;
  const interviewingCount = applications.filter(a => a.status === 'INTERVIEW SCHEDULED').length;
  const offeredCount = applications.filter(a => a.status === 'OFFERED').length;

  return (
    <View style={[sectionCard.container, { backgroundColor: colors.card }]}>
      <View style={sectionCard.header}>
        <Text style={[sectionCard.title, { color: colors.text }]}>Application Overview</Text>
        <TouchableOpacity>
          <Text style={[sectionCard.link, { color: colors.primary }]}>View Details</Text>
        </TouchableOpacity>
      </View>
      <View style={overviewStyles.row}>
        <StatCard icon={Upload} iconBg={colors.primary} label="Applied" value={appliedCount} />
        <StatCard icon={Clock} iconBg="#f59e0b" label="Interviewing" value={interviewingCount} />
        <StatCard icon={CheckCircle} iconBg="#10b981" label="Offered" value={offeredCount} />
      </View>
    </View>
  );
}

function InterviewCard({ day, month, title, company, time, mode, modeColor }: any) {
  const { colors } = useAppTheme();
  return (
    <View style={[interviewStyles.card, { borderBottomColor: colors.border }]}>
      <View style={[interviewStyles.dateBox, { backgroundColor: colors.primary + '10' }]}>
        <Text style={[interviewStyles.month, { color: colors.primary }]}>{month}</Text>
        <Text style={[interviewStyles.day, { color: colors.primary }]}>{day}</Text>
      </View>
      <View style={interviewStyles.info}>
        <Text style={[interviewStyles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[interviewStyles.meta, { color: colors.textSecondary }]}>{company} • {time}</Text>
        <View style={[interviewStyles.badge, { backgroundColor: modeColor + '20' }]}>
          <Video size={11} color={modeColor} />
          <Text style={[interviewStyles.badgeText, { color: modeColor }]}>{mode}</Text>
        </View>
      </View>
    </View>
  );
}

function UpcomingInterviews({ applications = [] }: { applications?: any[] }) {
  const { colors } = useAppTheme();
  const upcomingApps = applications.filter(a => a.status === 'INTERVIEW SCHEDULED');
  
  if (upcomingApps.length === 0) {
    return (
      <View style={[sectionCard.container, { backgroundColor: colors.card }]}>
        <View style={sectionCard.header}>
          <Text style={[sectionCard.title, { color: colors.text }]}>Upcoming Interviews</Text>
        </View>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: 10 }}>No upcoming interviews scheduled yet.</Text>
      </View>
    );
  }

  return (
    <View style={[sectionCard.container, { backgroundColor: colors.card }]}>
      <View style={sectionCard.header}>
        <Text style={[sectionCard.title, { color: colors.text }]}>Upcoming Interviews</Text>
        <TouchableOpacity>
          <MoreHorizontal size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {upcomingApps.map((app, i) => {
        let day = '??';
        let month = '???';
        if (app.interviewDate) {
          const d = new Date(app.interviewDate);
          if (!isNaN(d.getTime())) {
            day = d.getDate().toString().padStart(2, '0');
            const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            month = monthNames[d.getMonth()];
          }
        }
        
        return (
          <InterviewCard 
            key={app.id || i}
            day={day} 
            month={month} 
            title={app.job?.title || 'Unknown Role'} 
            company={app.job?.startup?.companyName || 'Company'} 
            time={app.interviewTime || 'TBD'} 
            mode={'VIDEO CALL'} 
            modeColor={'#3b82f6'} 
          />
        );
      })}
    </View>
  );
}

function SkillBar({ label, pct, color }: any) {
  const { colors } = useAppTheme();
  return (
    <View style={skillStyles.row}>
      <View style={skillStyles.labelRow}>
        <Text style={[skillStyles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[skillStyles.pct, { color }]}>{pct}%</Text>
      </View>
      <View style={[skillStyles.track, { backgroundColor: colors.background }]}>
        <View style={[skillStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function SkillsInDemand() {
  const { colors } = useAppTheme();
  const skills = [
    { label: 'React & Next.js', pct: 90, color: colors.primary },
    { label: 'TypeScript', pct: 85, color: colors.primary },
    { label: 'Rust (Still Gap)', pct: 64, color: '#f59e0b' },
    { label: 'Kubernetes', pct: 48, color: colors.textSecondary },
  ];
  return (
    <View style={[sectionCard.container, { backgroundColor: colors.card }]}>
      <Text style={[sectionCard.title, { color: colors.text }]}>Skills in Demand</Text>
      <Text style={[skillStyles.subtitle, { color: colors.textSecondary }]}>Based on your matches and industry trends</Text>
      {skills.map((s, i) => <SkillBar key={i} {...s} />)}
      <TouchableOpacity style={[skillStyles.addBtn, { borderColor: colors.primary + '40' }]}>
        <Plus size={14} color={colors.primary} />
        <Text style={[skillStyles.addBtnText, { color: colors.primary }]}>Add New Skill</Text>
      </TouchableOpacity>
    </View>
  );
}

function FeedItem({ icon: Icon, iconBg, text, time }: any) {
  const { colors } = useAppTheme();
  return (
    <View style={[feedStyles.item, { borderBottomColor: colors.border }]}>
      <View style={[feedStyles.iconWrap, { backgroundColor: iconBg + '15' }]}>
        <Icon size={16} color={iconBg} />
      </View>
      <View style={feedStyles.content}>
        <Text style={[feedStyles.text, { color: colors.text }]}>{text}</Text>
        <Text style={[feedStyles.time, { color: colors.textSecondary }]}>{time}</Text>
      </View>
    </View>
  );
}

function ActivityFeed({ applications = [] }: { applications?: any[] }) {
  const { colors } = useAppTheme();
  const [tab, setTab] = useState('All');
  const tabs = ['All', 'Applied', 'Offers'];
  
  const feed = applications.map(app => {
    const company = app.job?.startup?.companyName || 'A company';
    const role = app.job?.title || 'a role';
    const date = new Date(app.updatedAt || app.createdAt);
    const timeString = isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString();

    let icon = Upload;
    let iconBg = '#10b981';
    let text = `You submitted an application for ${role} at ${company}.`;
    let type = 'Applied';

    if (app.status === 'INTERVIEW SCHEDULED') {
      icon = TrendingUp;
      iconBg = '#0ea5e9';
      text = `${company} advanced your application to the interview phase.`;
      type = 'All';
    } else if (app.status === 'OFFERED') {
      icon = FileText;
      iconBg = '#f59e0b';
      text = `${company} issued an offer letter for the ${role} position.`;
      type = 'Offers';
    } else if (app.status === 'ASSESSMENT SCHEDULED') {
      icon = ClipboardList;
      iconBg = '#8b5cf6';
      text = `${company} scheduled an assessment for the ${role} position.`;
      type = 'All';
    } else if (app.status === 'REJECTED') {
      icon = MessageSquare;
      iconBg = '#ef4444';
      text = `${company} updated the status of your application for ${role}.`;
      type = 'All';
    }

    return { icon, iconBg, text, time: timeString, type, timestamp: date.getTime() };
  });

  feed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const filteredFeed = feed.filter(f => {
    if (tab === 'All') return true;
    if (tab === 'Applied' && f.type === 'Applied') return true;
    if (tab === 'Offers' && f.type === 'Offers') return true;
    return false;
  });

  return (
    <View style={[sectionCard.container, { backgroundColor: colors.card }]}>
      <Text style={[sectionCard.title, { color: colors.text }]}>Activity Feed</Text>
      <View style={feedStyles.tabs}>
        {tabs.map(t => (
          <TouchableOpacity 
            key={t} 
            style={[feedStyles.tab, { backgroundColor: colors.background }, tab === t && { backgroundColor: colors.primary }]} 
            onPress={() => setTab(t)}
          >
            <Text style={[feedStyles.tabText, { color: colors.textSecondary }, tab === t && { color: '#ffffff' }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {filteredFeed.length > 0 ? (
        filteredFeed.map((f, i) => <FeedItem key={i} {...f} />)
      ) : (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: 10 }}>No activity to show in this category.</Text>
      )}
    </View>
  );
}

function AssessmentBanner({ router }: { router: any }) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity 
      style={[bannerStyles.assessmentBanner, { backgroundColor: colors.primary, ...Platform.select({ web: { boxShadow: `0 4px 20px ${colors.primary}60` } as any, default: { shadowColor: colors.primary } }) }]} 
      onPress={() => router.push('/student-assessments')}
    >
      <Zap size={20} color={'#ffffff'} />
      <View>
        <Text style={bannerStyles.bannerTitle}>Assessment is Live</Text>
        <Text style={bannerStyles.bannerSub}>Click here to start</Text>
      </View>
    </TouchableOpacity>
  );
}

function OfferBanner() {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity style={[bannerStyles.offerBanner, { backgroundColor: colors.card, borderColor: colors.primary + '25' }]}>
      <FileText size={20} color={colors.primary} />
      <View>
        <Text style={[bannerStyles.offerTitle, { color: colors.text }]}>View Offer Letter !</Text>
        <Text style={[bannerStyles.offerSub, { color: colors.textSecondary }]}>click here</Text>
      </View>
      <ChevronRight size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

function BottomTabBar() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [active, setActive] = useState('Home');
  const tabs = [
    { label: 'Home', icon: LayoutDashboard },
    { label: 'Jobs Board', icon: Briefcase, path: '/student-jobs' as any },
    { label: 'Tests', icon: ClipboardList, path: '/student-assessments' as any },
    { label: 'Chat', icon: MessageSquare, path: '/student-messages' },
    { label: 'Feed', icon: Users, path: '/student-community' },
  ];
  return (
    <View style={[tabBarStyles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {tabs.map(({ label, icon: Icon, path }) => {
        const isActive = active === label;
        return (
          <TouchableOpacity key={label} style={tabBarStyles.tab} onPress={() => {
            setActive(label);
            if (path) router.push(path);
          }}>
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

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(userStore);
  const [applications, setApplications] = useState<any[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

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
    async function fetchUser() {
      try {
        let userId = params.userId || userStore.id;
        
        if (!userId) {
          const storedId = await AsyncStorage.getItem('studentUserId');
          if (storedId) {
            userId = storedId;
          }
        }

        if (!userId) {
          if (params.userName) {
            const newUserData = {
              id: params.userId as string || '',
              name: (params.userName as string),
              profilePhoto: (params.profilePhoto as string) || null,
              email: '',
              phone: ''
            };
            setUserData(newUserData as any);
            updateGlobalUser(newUserData);
          }
          setLoading(false);
          return;
        }

        const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
        const response = await fetch(`${baseUrl}/api/user/${userId}`);
        const resJson = await response.json();

        if (resJson.success && resJson.user) {
          let photoUrl = resJson.user.profilePhoto;
          if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
            const filename = photoUrl.split(/[/\\]/).pop();
            photoUrl = `${baseUrl}/uploads/${filename}`;
          }

          const newUserData = {
            id: resJson.user.id,
            name: resJson.user.fullName,
            profilePhoto: photoUrl,
            email: resJson.user.email || '',
            phone: resJson.user.phone || ''
          };
          setUserData(newUserData as any);
          updateGlobalUser(newUserData);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
      
      let userIdToFetch = params.userId || userStore.id;
      if (!userIdToFetch) {
        const storedId = await AsyncStorage.getItem('studentUserId');
        if (storedId) userIdToFetch = storedId;
      }
      
      if (userIdToFetch) {
        try {
          const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
          const appRes = await fetch(`${baseUrl}/api/applications/user/${userIdToFetch}`);
          const appJson = await appRes.json();
          if (appJson.success && appJson.applications) {
            setApplications(appJson.applications);
          }
        } catch (err) {
          console.error('Failed to fetch applications:', err);
        }
      }
      
      setLoading(false);
    }

    fetchUser();
  }, [params.userId, params.userName, params.profilePhoto]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StudentHeader user={userData} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], gap: 16 }}>
            <WelcomeSection user={userData} />
          <ApplicationOverview applications={applications} />
          <UpcomingInterviews applications={applications} />
          <SkillsInDemand />
          <ActivityFeed applications={applications} />
          {applications.some((a: any) => a.status === 'ASSESSMENT SCHEDULED') && (
            <AssessmentBanner router={router} />
          )}
          {applications.some((a: any) => a.status === 'OFFERED') && (
            <OfferBanner />
          )}
            <View style={{ height: 8 }} />
          </Animated.View>
        )}
      </ScrollView>
      <BottomTabBar />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 32 },
});

const welcomeStyles = StyleSheet.create({
  container: { paddingVertical: 4 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 13, lineHeight: 18 },
});

const sectionCard = StyleSheet.create({
  container: {
    borderRadius: 16, padding: 16,
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    }),
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 15, fontWeight: '700' },
  link: { fontSize: 13, fontWeight: '600' },
});

const overviewStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1, borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 6,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  value: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '500' },
});

const interviewStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  dateBox: {
    width: 44, height: 50, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  month: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  day: { fontSize: 18, fontWeight: '800' },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 13, fontWeight: '700' },
  meta: { fontSize: 11 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
});

const skillStyles = StyleSheet.create({
  subtitle: { fontSize: 12, marginBottom: 14, marginTop: 2 },
  row: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '600' },
  pct: { fontSize: 12, fontWeight: '700' },
  track: { height: 6, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
    borderWidth: 1.5, borderRadius: 10, borderStyle: 'dashed',
    paddingVertical: 10, marginTop: 4,
  },
  addBtnText: { fontSize: 13, fontWeight: '600' },
});

const feedStyles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  tabText: { fontSize: 12, fontWeight: '600' },
  item: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  content: { flex: 1, gap: 2 },
  text: { fontSize: 12, lineHeight: 17 },
  time: { fontSize: 11 },
});

const bannerStyles = StyleSheet.create({
  assessmentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 20,
    ...Platform.select({
      default: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
    }),
  },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  bannerSub: { fontSize: 12, color: '#ffffffcc', marginTop: 2 },
  offerBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 20,
    borderWidth: 1.5,
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    }),
  },
  offerTitle: { fontSize: 15, fontWeight: '800' },
  offerSub: { fontSize: 12, marginTop: 2 },
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
