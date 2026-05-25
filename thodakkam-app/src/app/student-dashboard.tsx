import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image
} from 'react-native';
import {
  Bell, Search, Upload, Clock, CheckCircle, Video,
  Building2, MoreHorizontal, TrendingUp, Plus, Briefcase,
  MessageSquare, Users, LayoutDashboard, ChevronRight, Zap, FileText, GraduationCap,
  Mail, Settings
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const PRIMARY = '#5A279B';
const BG = '#f4f5f7';
const WHITE = '#ffffff';
const DARK = '#0f172a';
const GRAY = '#6b7280';

// ─── Sub-components ────────────────────────────────────────────────────────────

function TopNav({ user }: { user?: { name: string, profilePhoto?: string | null } }) {
  const defaultUser = user || { name: 'Shabari', profilePhoto: null };
  const firstLetter = defaultUser.name ? defaultUser.name.charAt(0).toUpperCase() : 'S';

  return (
    <View style={navStyles.headerContainer}>
      <View style={navStyles.headerTop}>
        <View style={navStyles.logoRow}>
          <View style={navStyles.logoBox}>
            <GraduationCap size={14} color={WHITE} />
          </View>
          <Text style={navStyles.logoText}>Student Portal</Text>
        </View>
        <View style={navStyles.headerIcons}>
          <View style={navStyles.bellWrapper}>
            <Bell size={18} color={DARK} />
            <View style={navStyles.bellDot} />
          </View>
          <View style={navStyles.avatar}>
            {defaultUser.profilePhoto ? (
              <Image source={{ uri: defaultUser.profilePhoto }} style={navStyles.avatarImage} />
            ) : (
              <Text style={navStyles.avatarText}>{firstLetter}</Text>
            )}
          </View>
        </View>
      </View>

      <View style={navStyles.searchRow}>
        <View style={navStyles.searchBar}>
          <Search size={14} color={GRAY} />
          <TextInput 
            style={navStyles.searchInput}
            placeholder="Search for jobs, companies..."
            placeholderTextColor={GRAY}
          />
        </View>
        <TouchableOpacity style={navStyles.iconBtn}>
          <Mail size={18} color={GRAY} />
        </TouchableOpacity>
        <TouchableOpacity style={navStyles.iconBtn}>
          <Settings size={18} color={GRAY} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

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

function ApplicationOverview() {
  return (
    <View style={sectionCard.container}>
      <View style={sectionCard.header}>
        <Text style={sectionCard.title}>Application Overview</Text>
        <TouchableOpacity>
          <Text style={sectionCard.link}>View Details</Text>
        </TouchableOpacity>
      </View>
      <View style={overviewStyles.row}>
        <StatCard icon={Upload} iconBg="#5A279B" label="Applied" value={3} />
        <StatCard icon={Clock} iconBg="#f59e0b" label="Interviewing" value={1} />
        <StatCard icon={CheckCircle} iconBg="#10b981" label="Offered" value={0} />
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

function UpcomingInterviews() {
  const interviews = [
    { day: '19', month: 'AUG', title: 'Senior Frontend Architect', company: 'Uber', time: '$120-80 PST', mode: 'VIDEO CALL', modeColor: '#3b82f6' },
    { day: '20', month: 'AUG', title: 'Backend Engineer (AI)', company: 'Uber', time: '$120-80 PST', mode: 'ON-SITE', modeColor: '#10b981' },
    { day: '22', month: 'AUG', title: 'Security Engineer', company: 'Uber', time: '11:00 AM PST', mode: 'VIDEO CALL', modeColor: '#3b82f6' },
  ];
  return (
    <View style={sectionCard.container}>
      <View style={sectionCard.header}>
        <Text style={sectionCard.title}>Upcoming Interviews</Text>
        <TouchableOpacity>
          <MoreHorizontal size={20} color={GRAY} />
        </TouchableOpacity>
      </View>
      {interviews.map((iv, i) => (
        <InterviewCard key={i} {...iv} />
      ))}
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

function ActivityFeed() {
  const [tab, setTab] = useState('All');
  const tabs = ['All', 'Applied', 'Offers'];
  const feed = [
    { icon: TrendingUp, iconBg: '#0ea5e9', text: 'LinkedIn exceeded your application to Technical interview phase.', time: 'A few hours ago' },
    { icon: Upload, iconBg: '#10b981', text: 'LinkedIn submitted an application for Lead Product Designer at Figma.', time: 'A few hours ago' },
    { icon: MessageSquare, iconBg: '#f59e0b', text: 'New message from Recruiter at Stripe regarding your application.', time: 'Yesterday' },
  ];
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
      {feed.map((f, i) => <FeedItem key={i} {...f} />)}
    </View>
  );
}

function AssessmentBanner() {
  return (
    <TouchableOpacity style={bannerStyles.assessmentBanner}>
      <Zap size={20} color={WHITE} />
      <View>
        <Text style={bannerStyles.bannerTitle}>Assessment is Live</Text>
        <Text style={bannerStyles.bannerSub}>click here</Text>
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
    { label: 'Messages', icon: MessageSquare },
    { label: 'Community', icon: Users },
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
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ name: 'Student', profilePhoto: null as string | null });

  useEffect(() => {
    async function fetchUser() {
      try {
        const userId = params.userId;
        if (!userId) {
          // If no ID is passed, fallback to params if they exist, or defaults
          setUserData({
            name: (params.userName as string) || 'Student',
            profilePhoto: (params.profilePhoto as string) || null,
          });
          setLoading(false);
          return;
        }

        const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/user/${userId}`);
        const resJson = await response.json();
        
        if (resJson.success && resJson.user) {
          let photoUrl = resJson.user.profilePhoto;
          if (photoUrl && !photoUrl.startsWith('http')) {
            // Handle both absolute and relative file paths saved in the DB
            const filename = photoUrl.split(/[/\\]/).pop();
            photoUrl = `${baseUrl}/uploads/${filename}`;
          }
          
          setUserData({
            name: resJson.user.fullName,
            profilePhoto: photoUrl
          });
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
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
      <TopNav user={userData} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <WelcomeSection user={userData} />
        <ApplicationOverview />
        <UpcomingInterviews />
        <SkillsInDemand />
        <ActivityFeed />
        <AssessmentBanner />
        <OfferBanner />
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

const navStyles = StyleSheet.create({
  headerContainer: {
    backgroundColor: WHITE,
    borderBottomWidth: 3, borderBottomColor: '#3b82f6',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 24, height: 24, borderRadius: 6, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 13, fontWeight: '800', color: DARK },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellWrapper: { position: 'relative' },
  bellDot: { position: 'absolute', top: 0, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', borderWidth: 1, borderColor: WHITE },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarText: { color: WHITE, fontSize: 12, fontWeight: '700' },
  avatarImage: { width: '100%', height: '100%' },
  
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: BG, borderRadius: 8, paddingHorizontal: 10, height: 36 },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 12, color: DARK },
  iconBtn: { padding: 4 },
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
