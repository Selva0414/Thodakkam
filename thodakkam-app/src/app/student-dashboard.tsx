import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image
} from 'react-native';
import {
  Bell, Search, Upload, Clock, CheckCircle, Video,
  Building2, MoreHorizontal, TrendingUp, Plus, Briefcase,
  MessageSquare, Users, LayoutDashboard, ChevronRight, Zap, FileText, GraduationCap,
  Mail, Settings, ClipboardList
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import StudentHeader from '../components/StudentHeader';
import { userStore, updateGlobalUser } from '../utils/userStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY = '#5A279B';
const BG = '#f4f5f7';
const WHITE = '#ffffff';
const DARK = '#0f172a';
const GRAY = '#6b7280';

// ─── Sub-components ────────────────────────────────────────────────────────────

// ─── Sub-components ────────────────────────────────────────────────────────────

function WelcomeSection({ user }: { user?: { name: string } }) {
  const defaultUser = user || { name: 'Shabari' };
  return (
    <View style={welcomeStyles.container}>
      <Text style={welcomeStyles.title}>Welcome back, {defaultUser.name}! 👋</Text>
      <Text style={welcomeStyles.subtitle}>Here's what's happening with your applications today.</Text>
    </View>
  );
}

function StatCard({ icon: Icon, iconBg, label, value }: any) {
  return (
    <View style={statStyles.card}>
      <View style={[statStyles.iconWrap, { backgroundColor: iconBg + '20' }]}>
        <Icon size={18} color={iconBg} />
      </View>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function ApplicationOverview({ applications = [] }: { applications?: any[] }) {
  const appliedCount = applications.length;
  const interviewingCount = applications.filter(a => a.status === 'INTERVIEW SCHEDULED').length;
  const offeredCount = applications.filter(a => a.status === 'OFFERED').length;

  return (
    <View style={sectionCard.container}>
      <View style={sectionCard.header}>
        <Text style={sectionCard.title}>Application Overview</Text>
        <TouchableOpacity>
          <Text style={sectionCard.link}>View Details</Text>
        </TouchableOpacity>
      </View>
      <View style={overviewStyles.row}>
        <StatCard icon={Upload} iconBg="#5A279B" label="Applied" value={appliedCount} />
        <StatCard icon={Clock} iconBg="#f59e0b" label="Interviewing" value={interviewingCount} />
        <StatCard icon={CheckCircle} iconBg="#10b981" label="Offered" value={offeredCount} />
      </View>
    </View>
  );
}

function InterviewCard({ day, month, title, company, time, mode, modeColor }: any) {
  return (
    <View style={interviewStyles.card}>
      <View style={interviewStyles.dateBox}>
        <Text style={interviewStyles.month}>{month}</Text>
        <Text style={interviewStyles.day}>{day}</Text>
      </View>
      <View style={interviewStyles.info}>
        <Text style={interviewStyles.title}>{title}</Text>
        <Text style={interviewStyles.meta}>{company} • {time}</Text>
        <View style={[interviewStyles.badge, { backgroundColor: modeColor + '20' }]}>
          <Video size={11} color={modeColor} />
          <Text style={[interviewStyles.badgeText, { color: modeColor }]}>{mode}</Text>
        </View>
      </View>
    </View>
  );
}

function UpcomingInterviews({ applications = [] }: { applications?: any[] }) {
  const upcomingApps = applications.filter(a => a.status === 'INTERVIEW SCHEDULED');
  
  if (upcomingApps.length === 0) {
    return (
      <View style={sectionCard.container}>
        <View style={sectionCard.header}>
          <Text style={sectionCard.title}>Upcoming Interviews</Text>
        </View>
        <Text style={{ color: GRAY, textAlign: 'center', marginVertical: 10 }}>No upcoming interviews scheduled yet.</Text>
      </View>
    );
  }

  return (
    <View style={sectionCard.container}>
      <View style={sectionCard.header}>
        <Text style={sectionCard.title}>Upcoming Interviews</Text>
        <TouchableOpacity>
          <MoreHorizontal size={20} color={GRAY} />
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
  return (
    <View style={skillStyles.row}>
      <View style={skillStyles.labelRow}>
        <Text style={skillStyles.label}>{label}</Text>
        <Text style={[skillStyles.pct, { color }]}>{pct}%</Text>
      </View>
      <View style={skillStyles.track}>
        <View style={[skillStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function SkillsInDemand() {
  const skills = [
    { label: 'React & Next.js', pct: 90, color: PRIMARY },
    { label: 'TypeScript', pct: 85, color: PRIMARY },
    { label: 'Rust (Still Gap)', pct: 64, color: '#f59e0b' },
    { label: 'Kubernetes', pct: 48, color: GRAY },
  ];
  return (
    <View style={sectionCard.container}>
      <Text style={sectionCard.title}>Skills in Demand</Text>
      <Text style={skillStyles.subtitle}>Based on your matches and industry trends</Text>
      {skills.map((s, i) => <SkillBar key={i} {...s} />)}
      <TouchableOpacity style={skillStyles.addBtn}>
        <Plus size={14} color={PRIMARY} />
        <Text style={skillStyles.addBtnText}>Add New Skill</Text>
      </TouchableOpacity>
    </View>
  );
}

function FeedItem({ icon: Icon, iconBg, text, time }: any) {
  return (
    <View style={feedStyles.item}>
      <View style={[feedStyles.iconWrap, { backgroundColor: iconBg + '15' }]}>
        <Icon size={16} color={iconBg} />
      </View>
      <View style={feedStyles.content}>
        <Text style={feedStyles.text}>{text}</Text>
        <Text style={feedStyles.time}>{time}</Text>
      </View>
    </View>
  );
}

function ActivityFeed({ applications = [] }: { applications?: any[] }) {
  const [tab, setTab] = useState('All');
  const tabs = ['All', 'Applied', 'Offers'];
  
  // Generate feed from applications
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
      type = 'All'; // Or Interview, but we only have All, Applied, Offers
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

  // Sort feed descending by time
  feed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // Filter based on tab
  const filteredFeed = feed.filter(f => {
    if (tab === 'All') return true;
    if (tab === 'Applied' && f.type === 'Applied') return true;
    if (tab === 'Offers' && f.type === 'Offers') return true;
    return false;
  });

  return (
    <View style={sectionCard.container}>
      <Text style={sectionCard.title}>Activity Feed</Text>
      <View style={feedStyles.tabs}>
        {tabs.map(t => (
          <TouchableOpacity key={t} style={[feedStyles.tab, tab === t && feedStyles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[feedStyles.tabText, tab === t && feedStyles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {filteredFeed.length > 0 ? (
        filteredFeed.map((f, i) => <FeedItem key={i} {...f} />)
      ) : (
        <Text style={{ color: GRAY, textAlign: 'center', marginVertical: 10 }}>No activity to show in this category.</Text>
      )}
    </View>
  );
}

function AssessmentBanner({ router }: { router: any }) {
  return (
    <TouchableOpacity style={bannerStyles.assessmentBanner} onPress={() => router.push('/student-assessments')}>
      <Zap size={20} color={WHITE} />
      <View>
        <Text style={bannerStyles.bannerTitle}>Assessment is Live</Text>
        <Text style={bannerStyles.bannerSub}>Click here to start</Text>
      </View>
    </TouchableOpacity>
  );
}

function OfferBanner() {
  return (
    <TouchableOpacity style={bannerStyles.offerBanner}>
      <FileText size={20} color={PRIMARY} />
      <View>
        <Text style={bannerStyles.offerTitle}>View Offer Letter !</Text>
        <Text style={bannerStyles.offerSub}>click here</Text>
      </View>
      <ChevronRight size={18} color={PRIMARY} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

function BottomTabBar() {
  const router = useRouter();
  const [active, setActive] = useState('Dashboard');
  const tabs = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Jobs Board', icon: Briefcase, path: '/student-jobs' as any },
    { label: 'Assessments', icon: ClipboardList, path: '/student-assessments' as any },
    { label: 'Messages', icon: MessageSquare, path: '/student-messages' },
    { label: 'Community', icon: Users, path: '/student-community' },
  ];
  return (
    <View style={tabBarStyles.container}>
      {tabs.map(({ label, icon: Icon, path }) => {
        const isActive = active === label;
        return (
          <TouchableOpacity key={label} style={tabBarStyles.tab} onPress={() => {
            setActive(label);
            if (path) router.push(path);
          }}>
            <Icon size={22} color={isActive ? PRIMARY : GRAY} />
            <Text style={[tabBarStyles.label, isActive && tabBarStyles.labelActive]}>{label}</Text>
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
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(userStore);
  const [applications, setApplications] = useState<any[]>([]);

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
          // If no ID is passed, fallback to params if they exist, or defaults
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

        const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/user/${userId}`);
        const resJson = await response.json();

        if (resJson.success && resJson.user) {
          let photoUrl = resJson.user.profilePhoto;
          if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
            // Handle both absolute and relative file paths saved in the DB
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
          const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentHeader user={userData} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
        <View style={{ height: 24 }} />
      </ScrollView>
      <BottomTabBar />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 32 },
});



const welcomeStyles = StyleSheet.create({
  container: { paddingVertical: 4 },
  title: { fontSize: 20, fontWeight: '800', color: DARK, marginBottom: 4 },
  subtitle: { fontSize: 13, color: GRAY, lineHeight: 18 },
});

const sectionCard = StyleSheet.create({
  container: {
    backgroundColor: WHITE, borderRadius: 16, padding: 16,
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    }),
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 15, fontWeight: '700', color: DARK },
  link: { fontSize: 13, fontWeight: '600', color: PRIMARY },
});

const overviewStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: BG, borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 6,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  value: { fontSize: 22, fontWeight: '800', color: DARK },
  label: { fontSize: 11, color: GRAY, fontWeight: '500' },
});

const interviewStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  dateBox: {
    width: 44, height: 50, borderRadius: 10, backgroundColor: PRIMARY + '10',
    alignItems: 'center', justifyContent: 'center',
  },
  month: { fontSize: 9, fontWeight: '700', color: PRIMARY, letterSpacing: 0.5 },
  day: { fontSize: 18, fontWeight: '800', color: PRIMARY },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 13, fontWeight: '700', color: DARK },
  meta: { fontSize: 11, color: GRAY },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
});

const skillStyles = StyleSheet.create({
  subtitle: { fontSize: 12, color: GRAY, marginBottom: 14, marginTop: 2 },
  row: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '600', color: DARK },
  pct: { fontSize: 12, fontWeight: '700' },
  track: { height: 6, backgroundColor: BG, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
    borderWidth: 1.5, borderColor: PRIMARY + '40', borderRadius: 10, borderStyle: 'dashed',
    paddingVertical: 10, marginTop: 4,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: PRIMARY },
});

const feedStyles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: BG,
  },
  tabActive: { backgroundColor: PRIMARY },
  tabText: { fontSize: 12, fontWeight: '600', color: GRAY },
  tabTextActive: { color: WHITE },
  item: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  iconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  content: { flex: 1, gap: 2 },
  text: { fontSize: 12, color: DARK, lineHeight: 17 },
  time: { fontSize: 11, color: GRAY },
});

const bannerStyles = StyleSheet.create({
  assessmentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: PRIMARY, borderRadius: 16, padding: 20,
    ...Platform.select({
      web: { boxShadow: `0 4px 20px ${PRIMARY}60` },
      default: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
    }),
  },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: WHITE },
  bannerSub: { fontSize: 12, color: WHITE + 'cc', marginTop: 2 },
  offerBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: WHITE, borderRadius: 16, padding: 20,
    borderWidth: 1.5, borderColor: PRIMARY + '25',
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    }),
  },
  offerTitle: { fontSize: 15, fontWeight: '800', color: DARK },
  offerSub: { fontSize: 12, color: GRAY, marginTop: 2 },
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
