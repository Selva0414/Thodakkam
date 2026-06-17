import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, ActivityIndicator, Animated
} from 'react-native';
import {
  LayoutDashboard, Briefcase, MessageSquare, Users, ClipboardList, Clock, FileText, Play, CheckCircle, Code
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StudentHeader from '../components/StudentHeader';
import { userStore, updateGlobalUser } from '../utils/userStore';
import { useAppTheme } from '../context/ThemeContext';

function BottomTabBar({ activeTab }: { activeTab: string }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const tabs = [
    { label: 'Home', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Jobs Board', icon: Briefcase, path: '/student-jobs' },
    { label: 'Tests', icon: ClipboardList, path: '/student-assessments' },
    { label: 'Chat', icon: MessageSquare, path: '/student-messages' },
    { label: 'Feed', icon: Users, path: '/student-community' },
  ];
  return (
    <View style={[tabBarStyles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {tabs.map(({ label, icon: Icon, path }) => {
        const isActive = activeTab === label;
        return (
          <TouchableOpacity key={label} style={tabBarStyles.tab} onPress={() => {
            if (path && path !== '/student-assessments' && activeTab === 'Tests') {
               router.push(path as any);
            } else if (path && !isActive) {
               router.push(path as any);
            }
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

export default function StudentAssessments() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(userStore);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<Record<string, boolean>>({});
  const [timeOverrides, setTimeOverrides] = useState<Record<string, any>>({});
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});

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

        const baseUrl = Platform.OS === 'android' ? 'https://thodakkam.onrender.com' : 'https://thodakkam.onrender.com';
        
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
        
        const appRes = await fetch(`${baseUrl}/api/assessments/user/${userId}`);
        const appJson = await appRes.json();
        if (appJson.success && appJson.assessments) {
          setAssessments(appJson.assessments);
          
          const completedStates: Record<string, boolean> = {};
          const overrides: Record<string, any> = {};
          const requests: Record<string, boolean> = {};
          
          for (const assessment of appJson.assessments) {
            const isCompleted = await AsyncStorage.getItem(`assessment_completed_${assessment.id}`);
            if (isCompleted === 'true') {
              completedStates[assessment.id] = true;
            }
            
            const overrideStr = await AsyncStorage.getItem(`reschedule_override_${assessment.id}_${userId}`);
            if (overrideStr) {
              overrides[assessment.id] = JSON.parse(overrideStr);
            }
            
            // Check if request already sent
            const reqsStr = await AsyncStorage.getItem('reschedule_requests');
            if (reqsStr) {
               const reqs = JSON.parse(reqsStr);
               if (reqs.some((r: any) => r.assessmentId === assessment.id && r.studentId === userId)) {
                 requests[assessment.id] = true;
               }
            }
          }
          setCompletedAssessments(completedStates);
          setTimeOverrides(overrides);
          setSentRequests(requests);
        }

      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
      setLoading(false);
    }

    fetchUserAndAssessments();
  }, [params.userId, params.userName]);



  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StudentHeader user={userData} />
      
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>My Assessments</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Complete assessments assigned by companies</Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : assessments.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.inputBg }]}>
              <ClipboardList size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Assessments Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Companies will assign assessments when you apply for their positions</Text>
          </View>
        ) : (
          assessments.map((assessment, i) => {
            const isCoding = assessment.selectedRounds?.includes('coding');
            const isMcq = assessment.selectedRounds?.includes('mcq');
            
            const effectiveConfig = timeOverrides[assessment.id] || assessment.mcqConfig;
            const hasConfig = !!effectiveConfig;
            
            let timeString = 'Anytime';
            let isUpcoming = false;
            let isMissed = false;
            let isOngoing = true;
            let startDateStr = 'Unknown Date';
            
            if (hasConfig && effectiveConfig.startDate && effectiveConfig.endDate) {
              const startStr = `${effectiveConfig.startDate.split('T')[0]}T${effectiveConfig.startTime || '00:00'}:00`;
              const endStr = `${effectiveConfig.endDate.split('T')[0]}T${effectiveConfig.endTime || '23:59'}:00`;
              
              const start = new Date(startStr);
              const end = new Date(endStr);
              const now = new Date();
              
              if (now < start) { isUpcoming = true; isOngoing = false; }
              if (now > end) { isMissed = true; isOngoing = false; }
              
              startDateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const endDateStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const startTimeStr = effectiveConfig.startTime || '00:00';
              const endTimeStr = effectiveConfig.endTime || '00:00';
              timeString = `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
            }

            const badgeText = (isCoding && !isMcq) ? 'Coding Assessment' : (isMcq ? 'MCQ Assessment' : 'Assessment');
            const badgeIcon = (isCoding && !isMcq) ? <Code size={14} color={colors.primary} /> : <FileText size={14} color={colors.primary} />;
            
            const isCompleted = completedAssessments[assessment.id];
            
            let buttonText = 'Start';
            let buttonIcon = <Play size={14} color={'#ffffff'} style={{ marginRight: 4 }} />;
            let buttonDisabled = false;
            let buttonBg = colors.primary;
            let buttonAction = () => {
              if (isCoding && !isMcq) {
                router.push({ pathname: '/student-coding-exam' as any, params: { assessmentId: assessment.id } });
              } else {
                router.push({ pathname: '/student-exam' as any, params: { assessmentId: assessment.id } });
              }
            };

            if (isCompleted) {
               buttonText = 'Completed';
               buttonIcon = <CheckCircle size={14} color={'#ffffff'} style={{ marginRight: 4 }} />;
               buttonBg = isDark ? colors.success : '#10b981';
            } else if (isUpcoming) {
               buttonText = `Starts ${startDateStr}`;
               buttonIcon = <Clock size={14} color={'#ffffff'} style={{ marginRight: 4 }} />;
               buttonBg = colors.textSecondary;
               buttonDisabled = true;
            } else if (isMissed) {
               if (sentRequests[assessment.id]) {
                 buttonText = 'Reschedule Requested';
                 buttonIcon = <Clock size={14} color={'#ffffff'} style={{ marginRight: 4 }} />;
                 buttonBg = colors.textSecondary;
                 buttonDisabled = true;
               } else {
                 buttonText = 'Request Reschedule';
                 buttonIcon = <MessageSquare size={14} color={'#ffffff'} style={{ marginRight: 4 }} />;
                 buttonBg = '#f59e0b';
                 buttonAction = async () => {
                    const reqsStr = await AsyncStorage.getItem('reschedule_requests');
                    let reqs = reqsStr ? JSON.parse(reqsStr) : [];
                    reqs.push({
                      id: Date.now().toString(),
                      studentId: (userData as any).id,
                      studentName: userData.name,
                      studentEmail: userData.email,
                      assessmentId: assessment.id,
                      assessmentTitle: assessment.title || assessment.job?.title || 'Assessment',
                      startupId: assessment.startupId || assessment.job?.startupId,
                      requestedAt: new Date().toISOString()
                    });
                    await AsyncStorage.setItem('reschedule_requests', JSON.stringify(reqs));
                    setSentRequests(prev => ({...prev, [assessment.id]: true}));
                 };
               }
            }
            
            return (
              <View key={i} style={[styles.assessmentCard, { backgroundColor: colors.card }]}>
                <View style={[styles.cardLeftBorder, { backgroundColor: isDark ? colors.primary : '#c4b5fd' }, isCompleted && { backgroundColor: isDark ? colors.success : '#10b981' }]} />
                <View style={styles.cardContent}>
                  <View style={styles.headerRow}>
                    <Text style={[styles.assessmentTitle, { color: colors.text }]} numberOfLines={2}>{assessment.title || assessment.job?.title || 'Assessment'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: isDark ? colors.primary + '20' : '#e0e7ff' }, isCompleted && { backgroundColor: isDark ? colors.success + '20' : '#d1fae5' }]}>
                      <Text style={[styles.statusBadgeText, { color: isDark ? colors.primary : '#3b82f6' }, isCompleted && { color: isDark ? colors.success : '#059669' }]}>
                        {isCompleted ? 'COMPLETED' : (isMissed ? 'MISSED' : 'IN PROGRESS')}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.companyName, { color: colors.primary }]} numberOfLines={1}>{(assessment.startup?.companyName || assessment.job?.startup?.companyName || 'Startup').toUpperCase()}</Text>
                  
                  <View style={styles.timeRow}>
                    <Clock size={14} color={colors.text} />
                    <Text style={[styles.timeText, { color: colors.text }]} numberOfLines={1}>{timeString}</Text>
                  </View>
                
                  <View style={styles.cardActions}>
                    <View style={[styles.typeBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      {badgeIcon}
                      <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{badgeText}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.continueBtn, { backgroundColor: buttonBg }, buttonDisabled && { opacity: 0.7 }]}
                      onPress={buttonAction}
                      disabled={buttonDisabled}
                    >
                      {buttonIcon}
                      <Text style={styles.continueBtnText}>{buttonText}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
        </Animated.View>
      </ScrollView>

      <BottomTabBar activeTab="Tests" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15 },

  emptyCard: { borderRadius: 24, padding: 40, alignItems: 'center', justifyContent: 'center', minHeight: 280, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  assessmentCard: { borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3, flexDirection: 'row', overflow: 'hidden' },
  cardLeftBorder: { width: 4, height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0 },
  cardContent: { flex: 1, padding: 16, paddingLeft: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 },
  assessmentTitle: { fontSize: 16, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  companyName: { fontSize: 13, fontWeight: '600', marginBottom: 12, letterSpacing: 0.5 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  timeText: { fontSize: 13 },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12, flexWrap: 'wrap' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6, borderWidth: 1 },
  typeBadgeText: { fontSize: 12, fontWeight: '600' },
  continueBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  continueBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});

const tabBarStyles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Platform.OS === 'ios' ? 80 : 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: Platform.OS === 'ios' ? 20 : 0, borderTopWidth: 1 },
  tab: { alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' },
  label: { fontSize: 10, marginTop: 4, fontWeight: '500' },
});
