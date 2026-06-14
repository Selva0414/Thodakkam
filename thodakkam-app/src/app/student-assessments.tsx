import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, ActivityIndicator, Animated
} from 'react-native';
import {
  LayoutDashboard, Briefcase, MessageSquare, Users, ClipboardList, Clock, FileText, Play, CheckCircle
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(userStore);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<Record<string, boolean>>({});

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
    async function fetchUserAndAssessments() {
      try {
        const userId = params.userId || (userStore as any).id;
        
        if (!userId) {
          if (params.userName) {
            const newUserData = {
              id: userId as string,
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
        
        // Fetch Assessments assigned to this user
        const appRes = await fetch(`${baseUrl}/api/assessments/user/${userId}`);
        const appJson = await appRes.json();
        if (appJson.success && appJson.assessments) {
          setAssessments(appJson.assessments);
          
          // Check completed states from local storage
          const completedStates: Record<string, boolean> = {};
          for (const assessment of appJson.assessments) {
            const isCompleted = await AsyncStorage.getItem(`assessment_completed_${assessment.id}`);
            if (isCompleted === 'true') {
              completedStates[assessment.id] = true;
            }
          }
          setCompletedAssessments(completedStates);
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
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
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
          assessments.map((assessment, i) => {
            const startDate = assessment.mcqConfig?.startDate ? new Date(assessment.mcqConfig.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown Date';
            const endDate = assessment.mcqConfig?.endDate ? new Date(assessment.mcqConfig.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : startDate;
            const startTime = assessment.mcqConfig?.startTime || '00:00';
            const endTime = assessment.mcqConfig?.endTime || '00:00';
            const timeString = `${startDate}, ${startTime} - ${endDate}, ${endTime}`;
            
            const isCompleted = completedAssessments[assessment.id];
            
            return (
              <View key={i} style={styles.assessmentCard}>
                <View style={[styles.cardLeftBorder, isCompleted && { backgroundColor: '#10b981' }]} />
                <View style={styles.cardContent}>
                  <View style={styles.headerRow}>
                    <Text style={styles.assessmentTitle} numberOfLines={2}>{assessment.title || assessment.job?.title || 'Assessment'}</Text>
                    <View style={[styles.statusBadge, isCompleted && { backgroundColor: '#d1fae5' }]}>
                      <Text style={[styles.statusBadgeText, isCompleted && { color: '#059669' }]}>
                        {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.companyName} numberOfLines={1}>{(assessment.startup?.companyName || assessment.job?.startup?.companyName || 'Startup').toUpperCase()}</Text>
                  
                  <View style={styles.timeRow}>
                    <Clock size={14} color={TEXT_DARK} />
                    <Text style={styles.timeText} numberOfLines={1}>{timeString}</Text>
                  </View>
                
                  <View style={styles.cardActions}>
                    <View style={styles.typeBadge}>
                      <FileText size={14} color={PRIMARY} />
                      <Text style={styles.typeBadgeText}>MCQ Assessment</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.continueBtn, isCompleted && { backgroundColor: '#10b981' }]}
                      onPress={() => router.push({ pathname: '/student-exam' as any, params: { assessmentId: assessment.id } })}
                    >
                      {isCompleted ? <CheckCircle size={14} color={WHITE} style={{ marginRight: 4 }} /> : <Play size={14} color={WHITE} style={{ marginRight: 4 }} />}
                      <Text style={styles.continueBtnText}>{isCompleted ? 'Completed' : 'Start'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
        </Animated.View>
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

  assessmentCard: { backgroundColor: CARD_BG, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3, flexDirection: 'row', overflow: 'hidden' },
  cardLeftBorder: { width: 4, height: '100%', backgroundColor: '#c4b5fd', position: 'absolute', left: 0, top: 0, bottom: 0 },
  cardContent: { flex: 1, padding: 16, paddingLeft: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 },
  assessmentTitle: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  statusBadge: { backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { color: '#3b82f6', fontSize: 10, fontWeight: '700' },
  companyName: { fontSize: 13, fontWeight: '600', color: PRIMARY, marginBottom: 12, letterSpacing: 0.5 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  timeText: { fontSize: 13, color: TEXT_DARK },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12, flexWrap: 'wrap' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3e8ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: '#e9d5ff' },
  typeBadgeText: { color: PRIMARY, fontSize: 12, fontWeight: '600' },
  continueBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8b5cf6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  continueBtnText: { color: WHITE, fontSize: 14, fontWeight: '700' },
});

const tabBarStyles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Platform.OS === 'ios' ? 80 : 70, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: Platform.OS === 'ios' ? 20 : 0, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  tab: { alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' },
  label: { fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: '500' },
  labelActive: { color: PRIMARY, fontWeight: '700' },
});
