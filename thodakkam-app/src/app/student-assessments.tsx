import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, ActivityIndicator
} from 'react-native';
import {
  LayoutDashboard, Briefcase, MessageSquare, Users, ClipboardList
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import StudentHeader from '../components/StudentHeader';
import { userStore, updateGlobalUser } from '../utils/userStore';

const PRIMARY = '#5A279B';
const BG = '#f4f5f7';
const CARD_BG = '#ffffff';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#6b7280';

function BottomTabBar({ activeTab }: { activeTab: string }) {
  const router = useRouter();
  const tabs = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Jobs Board', icon: Briefcase, path: '/student-jobs' },
    { label: 'Assessments', icon: ClipboardList, path: '/student-assessments' },
    { label: 'Messages', icon: MessageSquare, path: '/student-messages' },
    { label: 'Community', icon: Users, path: '/student-community' },
  ];
  return (
    <View style={tabBarStyles.container}>
      {tabs.map(({ label, icon: Icon, path }) => {
        const isActive = activeTab === label;
        return (
          <TouchableOpacity key={label} style={tabBarStyles.tab} onPress={() => {
            if (path && path !== '/student-assessments' && activeTab === 'Assessments') {
               // Navigation logic
               router.push(path as any);
            } else if (path && !isActive) {
               router.push(path as any);
            }
          }}>
            <Icon size={22} color={isActive ? PRIMARY : TEXT_GRAY} />
            <Text style={[tabBarStyles.label, isActive && tabBarStyles.labelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function StudentAssessments() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(userStore);
  const [assessments, setAssessments] = useState<any[]>([]);

  useEffect(() => {
    async function fetchUserAndAssessments() {
      try {
        const userId = params.userId || (userStore as any).id;
        
        if (!userId) {
          if (params.userName) {
            const newUserData = {
              name: (params.userName as string),
              profilePhoto: (params.profilePhoto as string) || null,
              email: '',
              phone: ''
            };
            setUserData(newUserData as any);
          }
          setLoading(false);
          return;
        }

        const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
        
        // Fetch User
        const response = await fetch(`${baseUrl}/api/user/${userId}`);
        const resJson = await response.json();

        if (resJson.success && resJson.user) {
          let photoUrl = resJson.user.profilePhoto;
          if (photoUrl && !photoUrl.startsWith('http')) {
            const filename = photoUrl.split(/[/\\]/).pop();
            photoUrl = `${baseUrl}/uploads/${filename}`;
          }

          const newUserData = {
            name: resJson.user.fullName,
            profilePhoto: photoUrl,
            email: resJson.user.email || '',
            phone: resJson.user.phone || ''
          };
          setUserData(newUserData as any);
          updateGlobalUser(newUserData);
        }
        
        // Fetch Assessments (Applications with ASSESSMENTS status)
        const appRes = await fetch(`${baseUrl}/api/applications/user/${userId}`);
        const appJson = await appRes.json();
        if (appJson.success && appJson.applications) {
          const scheduledAssessments = appJson.applications.filter((app: any) => app.status === 'ASSESSMENT SCHEDULED');
          setAssessments(scheduledAssessments);
        }

      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
      setLoading(false);
    }

    fetchUserAndAssessments();
  }, [params.userId, params.userName]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentHeader user={userData} />
      
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Assessments</Text>
          <Text style={styles.subtitle}>Complete assessments assigned by companies</Text>
        </View>

        {assessments.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <ClipboardList size={32} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No Assessments Yet</Text>
            <Text style={styles.emptySubtitle}>Companies will assign assessments when you apply for their positions</Text>
          </View>
        ) : (
          assessments.map((assessment, i) => (
            <View key={i} style={styles.assessmentCard}>
              <View style={styles.assessmentHeader}>
                <Text style={styles.assessmentCompany}>{assessment.job?.startup?.companyName}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Pending</Text>
                </View>
              </View>
              <Text style={styles.assessmentRole}>{assessment.job?.title}</Text>
              <TouchableOpacity style={styles.startBtn}>
                <Text style={styles.startBtnText}>Start Assessment</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <BottomTabBar activeTab="Assessments" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: TEXT_DARK, marginBottom: 8 },
  subtitle: { fontSize: 15, color: TEXT_GRAY },

  emptyCard: { backgroundColor: CARD_BG, borderRadius: 24, padding: 40, alignItems: 'center', justifyContent: 'center', minHeight: 280, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: TEXT_DARK, marginBottom: 12 },
  emptySubtitle: { fontSize: 14, color: TEXT_GRAY, textAlign: 'center', lineHeight: 22 },

  assessmentCard: { backgroundColor: CARD_BG, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  assessmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  assessmentCompany: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  badge: { backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#f59e0b', fontSize: 12, fontWeight: '600' },
  assessmentRole: { fontSize: 14, color: TEXT_GRAY, marginBottom: 20 },
  startBtn: { backgroundColor: PRIMARY, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  startBtnText: { color: WHITE, fontSize: 15, fontWeight: '700' },
});

const tabBarStyles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Platform.OS === 'ios' ? 80 : 70, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: Platform.OS === 'ios' ? 20 : 0, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  tab: { alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' },
  label: { fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: '500' },
  labelActive: { color: PRIMARY, fontWeight: '700' },
});
