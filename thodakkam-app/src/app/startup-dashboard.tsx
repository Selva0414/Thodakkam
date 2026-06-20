import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, ActivityIndicator, BackHandler
} from 'react-native';
import {
  Search, Mail, Bell, Settings, Briefcase, Users,
  Calendar, MessageSquare, LayoutGrid
} from 'lucide-react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import StartupHeader from '../components/StartupHeader';
import { useAppTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StartupDashboard() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const companyName = (params.companyName as string) || 'Echo Digital';
  
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  
  const [chartDuration, setChartDuration] = useState(30);
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setActiveTab('Dashboard');
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-1.onrender.com' : 'https://thodakkam-1.onrender.com';
        const res = await fetch(`${baseUrl}/api/applications/startup/${encodeURIComponent(companyName)}`);
        const data = await res.json();
        if (data.success && data.applications) {
          setApplications(data.applications);
        }

        // Fetch profile data to calculate completion
        const profileRes = await fetch(`${baseUrl}/api/startup/profile/${encodeURIComponent(companyName)}`);
        const profileData = await profileRes.json();
        let filledCount = 0;
        let totalFields = 10;
        
        if (profileData.success && profileData.startup) {
          const dbData = profileData.startup;
          if (dbData.founderName) filledCount++;
          if (dbData.email) filledCount++;
          if (dbData.bio) filledCount++;
          if (dbData.founderImage || dbData.profilePhoto) filledCount++;
        }
        
        const localDataStr = await AsyncStorage.getItem(`startup_extra_${companyName}`);
        if (localDataStr) {
          const localData = JSON.parse(localDataStr);
          if (localData.industry) filledCount++;
          if (localData.companySize) filledCount++;
          if (localData.foundedYear) filledCount++;
          if (localData.location) filledCount++;
          if (localData.website) filledCount++;
          if (localData.workMode) filledCount++;
        }
        
        setProfileCompletion(Math.round((filledCount / totalFields) * 100));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [companyName]);

  const totalHires = applications.filter(a => a.status === 'HIRED' || a.status === 'OFFERED').length;
  const interviewing = applications.filter(a => a.status === 'INTERVIEW SCHEDULED').length;
  const totalApps = applications.length;

  const chartData = useMemo(() => {
    const xVals = [10, 80, 150, 220, 290];
    const bins = [0, 0, 0, 0, 0];
    const now = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const intervalDays = chartDuration / 5;
    
    applications.forEach(app => {
      const appTime = new Date(app.appliedAt).getTime();
      const daysAgo = Math.floor((now - appTime) / dayMs);
      if (daysAgo >= 0 && daysAgo < chartDuration) {
        const binIndex = 4 - Math.floor(daysAgo / intervalDays);
        if (binIndex >= 0 && binIndex <= 4) {
          bins[binIndex]++;
        }
      }
    });

    const maxBin = Math.max(...bins, 1);
    const yVals = bins.map(count => 100 - (count / maxBin) * 60);
    
    const d = `M${xVals[0]},${yVals[0]} Q${(xVals[0] + xVals[1])/2},${yVals[0]} ${xVals[1]},${yVals[1]} T${xVals[2]},${yVals[2]} T${xVals[3]},${yVals[3]} T${xVals[4]},${yVals[4]}`;
    const fillD = `${d} L${xVals[4]},120 L${xVals[0]},120 Z`;
    
    const labels = [];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for(let i=0; i<4; i++) {
       const step = chartDuration / 4;
       const daysBack = Math.max(0, Math.round(chartDuration - (i * step) - step/2));
       const dObj = new Date(now - daysBack * dayMs);
       labels.push(`${dObj.getDate()} ${months[dObj.getMonth()]}`);
    }

    return { d, fillD, labels };
  }, [applications, chartDuration]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StartupHeader companyName={companyName} />
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        
        {/* Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          {/* Stat 1 */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Applications</Text>
            <View style={styles.statValRow}>
              <Text style={[styles.statValue, { color: colors.text }]}>{loading ? '-' : totalApps}</Text>
            </View>
            <Text style={[styles.statSub, { color: colors.textSecondary }]}>all time</Text>
          </View>
          
          {/* Stat 2 */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Interviewing</Text>
            <View style={styles.statValRow}>
              <Text style={[styles.statValue, { color: colors.text }]}>{loading ? '-' : interviewing}</Text>
            </View>
            <Text style={[styles.statSub, { color: colors.textSecondary }]}>active pipeline</Text>
          </View>

          {/* Stat 3 */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Hires/Offers</Text>
            <View style={styles.statValRow}>
              <Text style={[styles.statValue, { color: colors.text }]}>{loading ? '-' : totalHires}</Text>
            </View>
            <Text style={[styles.statSub, { color: colors.textSecondary }]}>successful candidates</Text>
          </View>
        </ScrollView>

        {/* Candidate Growth Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, zIndex: 50, elevation: 5 }]}>
          <View style={[styles.cardHeader, { zIndex: 50, elevation: 5 }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Candidate Growth</Text>
            <View style={{ zIndex: 50, elevation: 5 }}>
              <TouchableOpacity 
                style={[styles.dropdownBtn, { borderColor: colors.border }]}
                onPress={() => setIsChartDropdownOpen(!isChartDropdownOpen)}
              >
                <Text style={[styles.dropdownText, { color: colors.textSecondary }]}>
                  {chartDuration === 7 ? 'Last 1 Week' : chartDuration === 30 ? 'Last 1 Month' : chartDuration === 90 ? 'Last 3 Months' : `Last ${chartDuration} Days`} v
                </Text>
              </TouchableOpacity>
              {isChartDropdownOpen && (
                <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border, position: 'absolute', top: 35, right: 0, width: 140, zIndex: 20 }]}>
                  <TouchableOpacity style={[styles.dropdownItem, { borderBottomColor: colors.border }]} onPress={() => { setChartDuration(7); setIsChartDropdownOpen(false); }}>
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>Last 1 Week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.dropdownItem, { borderBottomColor: colors.border }]} onPress={() => { setChartDuration(30); setIsChartDropdownOpen(false); }}>
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>Last 1 Month</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.dropdownItem, { borderBottomWidth: 0 }]} onPress={() => { setChartDuration(90); setIsChartDropdownOpen(false); }}>
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>Last 3 Months</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.lineChartContainer, { zIndex: 1, elevation: 1 }]}>
            <View collapsable={false}><Svg height="120" width="100%" viewBox="0 0 300 120">
              <Path 
                d={chartData.fillD} 
                fill={isDark ? colors.primary + '20' : "#fdf4ff"} 
              />
              <Path 
                d={chartData.d} 
                fill="none" 
                stroke={isDark ? colors.text : "#0f172a"} 
                strokeWidth="2.5" 
              />
            </Svg></View>
            <View style={styles.chartXAxis}>
              {chartData.labels.map((lbl, idx) => (
                 <Text key={idx} style={[styles.xAxisLabel, { color: colors.textSecondary }]}>{lbl}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Profile Completion */}
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <View style={styles.profileTopRow}>
            <View>
              <Text style={styles.profileTitle}>Profile Completion</Text>
              <Text style={styles.profileSub}>{profileCompletion === 100 ? 'completed' : 'action required'}</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>{profileCompletion}%</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.completedBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#8b4cb5' }]}
            onPress={() => {
              if (profileCompletion < 100) {
                router.push({ pathname: '/startup-profile' as any, params: { companyName } });
              }
            }}
          >
            <Text style={styles.completedBtnText}>{profileCompletion === 100 ? 'Completed' : 'Complete Profile'}</Text>
          </TouchableOpacity>
        </View>

        {/* Department Distribution */}
        <View style={[styles.deptCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Department Distribution</Text>
          <View style={styles.deptList}>
            {[
              { label: 'ENG', val: 42, flex: 0.8 },
              { label: 'DES', val: 18, flex: 0.4 },
              { label: 'SAL', val: 24, flex: 0.55 },
              { label: 'HR',  val: 12, flex: 0.3 },
              { label: 'OPS', val: 10, flex: 0.25 },
            ].map(item => (
              <View key={item.label} style={styles.deptRow}>
                <Text style={[styles.deptLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                <View style={[styles.barTrack, { backgroundColor: colors.inputBg }]}>
                  <View style={[styles.barFill, { flex: item.flex, backgroundColor: isDark ? colors.primary : '#1e293b' }]} />
                  <View style={{ flex: 1 - item.flex }} />
                </View>
                <Text style={[styles.deptVal, { color: colors.text }]}>{item.val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: colors.text }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityList}>
            {loading ? (
               <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : applications.length === 0 ? (
               <Text style={{ textAlign: 'center', color: colors.textSecondary, marginVertical: 20 }}>No recent activity.</Text>
            ) : (
               applications.slice(0, 5).map((app, i) => {
                 const dateStr = new Date(app.updatedAt || app.appliedAt).toLocaleDateString();
                 const isScheduled = app.status === 'INTERVIEW SCHEDULED';
                 return (
                   <View key={app.id || i} style={styles.activityItem}>
                     <View style={[styles.activityDot, { backgroundColor: isScheduled ? (isDark ? colors.success : '#10b981') : (isDark ? colors.text : '#0f172a') }]} />
                     <View>
                       {isScheduled ? (
                         <Text style={[styles.activityText, { color: colors.text }]}>Interview scheduled with <Text style={styles.bold}>{app.fullName}</Text></Text>
                       ) : (
                         <Text style={[styles.activityText, { color: colors.text }]}>New application for <Text style={styles.bold}>{app.jobTitle}</Text></Text>
                       )}
                       <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{dateStr}</Text>
                     </View>
                   </View>
                 );
               })
            )}
          </View>
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {[
          { label: 'Dashboard', icon: LayoutGrid },
          { label: 'Jobs', icon: Briefcase },
          { label: 'Candidates', icon: Users },
          { label: 'Interviews', icon: Calendar },
          { label: 'Feed', icon: MessageSquare }
        ].map(item => {
          const isActive = activeTab === item.label;
          const Icon = item.icon;
          return (
            <TouchableOpacity 
              key={item.label} 
              style={styles.navItem}
              onPress={() => {
                if (item.label === 'Dashboard') {
                  setActiveTab('Dashboard');
                } else if (item.label === 'Jobs') {
                  router.navigate({ pathname: '/startup-jobs' as any, params: { companyName } });
                } else if (item.label === 'Candidates') {
                  router.navigate({ pathname: '/startup-candidates' as any, params: { companyName } });
                } else if (item.label === 'Interviews') {
                  router.navigate({ pathname: '/startup-interviews' as any, params: { companyName } });
                } else if (item.label === 'Feed') {
                  router.navigate({ pathname: '/startup-community' as any, params: { companyName } });
                }
              }}
            >
              <View style={[{ padding: 8, borderRadius: 20 }, isActive && { backgroundColor: isDark ? colors.primary + '30' : colors.primary + '20', transform: [{ scale: 1.1 }] }]}>
                  <Icon size={22} color={isActive ? colors.primary : colors.textSecondary} />
                </View>
              <Text style={[styles.navText, { color: colors.textSecondary }, isActive && { color: colors.primary, fontWeight: '700' }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  
  statsScroll: { paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statCard: { padding: 16, borderRadius: 12, minWidth: 130, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  statLabel: { fontSize: 11, marginBottom: 8 },
  statValRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', marginRight: 6 },
  statSub: { fontSize: 10 },

  chartCard: { marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  dropdownBtn: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  dropdownText: { fontSize: 10, fontWeight: '500' },
  dropdownMenu: { borderRadius: 8, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1 },
  dropdownItemText: { fontSize: 11 },
  lineChartContainer: { marginTop: 10 },
  chartXAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 },
  xAxisLabel: { fontSize: 10 },

  profileCard: { marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  profileTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  profileTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  profileSub: { fontSize: 12, color: '#d8b4e2' },
  progressCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
  progressText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  completedBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  completedBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },

  deptCard: { marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  deptList: { marginTop: 12 },
  deptRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  deptLabel: { width: 32, fontSize: 10, fontWeight: '700' },
  barTrack: { flex: 1, height: 6, borderRadius: 3, flexDirection: 'row', marginHorizontal: 12 },
  barFill: { borderRadius: 3 },
  deptVal: { width: 24, fontSize: 11, fontWeight: '700', textAlign: 'right' },

  activityCard: { marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  viewAllText: { fontSize: 11, fontWeight: '700' },
  activityList: { marginTop: 8 },
  activityItem: { flexDirection: 'row', marginBottom: 16, paddingRight: 20 },
  activityDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, marginRight: 12 },
  activityText: { fontSize: 12, lineHeight: 18 },
  bold: { fontWeight: '700' },
  activityTime: { fontSize: 10, marginTop: 2 },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 10, fontWeight: '500' },
});
