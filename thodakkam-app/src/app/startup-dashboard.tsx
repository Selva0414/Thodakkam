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

const PRIMARY = '#662483';
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function StartupDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('Home');
  const companyName = (params.companyName as string) || 'Echo Digital';
  
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [chartDuration, setChartDuration] = useState(30);
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setActiveTab('Home');
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    async function fetchApps() {
      try {
        const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
        const res = await fetch(`${baseUrl}/api/applications/startup/${encodeURIComponent(companyName)}`);
        const data = await res.json();
        if (data.success && data.applications) {
          setApplications(data.applications);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchApps();
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
    <SafeAreaView style={styles.safeArea}>
      <StartupHeader companyName={companyName} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          {/* Stat 1 */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Applications</Text>
            <View style={styles.statValRow}>
              <Text style={styles.statValue}>{loading ? '-' : totalApps}</Text>
            </View>
            <Text style={styles.statSub}>all time</Text>
          </View>
          
          {/* Stat 2 */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Interviewing</Text>
            <View style={styles.statValRow}>
              <Text style={styles.statValue}>{loading ? '-' : interviewing}</Text>
            </View>
            <Text style={styles.statSub}>active pipeline</Text>
          </View>

          {/* Stat 3 */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Hires/Offers</Text>
            <View style={styles.statValRow}>
              <Text style={styles.statValue}>{loading ? '-' : totalHires}</Text>
            </View>
            <Text style={styles.statSub}>successful candidates</Text>
          </View>
        </ScrollView>

        {/* Candidate Growth Chart */}
        <View style={[styles.chartCard, { zIndex: 50, elevation: 5 }]}>
          <View style={[styles.cardHeader, { zIndex: 50, elevation: 5 }]}>
            <Text style={styles.cardTitle}>Candidate Growth</Text>
            <View style={{ zIndex: 50, elevation: 5 }}>
              <TouchableOpacity 
                style={styles.dropdownBtn}
                onPress={() => setIsChartDropdownOpen(!isChartDropdownOpen)}
              >
                <Text style={styles.dropdownText}>
                  {chartDuration === 7 ? 'Last 1 Week' : chartDuration === 30 ? 'Last 1 Month' : chartDuration === 90 ? 'Last 3 Months' : `Last ${chartDuration} Days`} v
                </Text>
              </TouchableOpacity>
              {isChartDropdownOpen && (
                <View style={[styles.dropdownMenu, { position: 'absolute', top: 35, right: 0, width: 140, zIndex: 20 }]}>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => { setChartDuration(7); setIsChartDropdownOpen(false); }}>
                    <Text style={styles.dropdownItemText}>Last 1 Week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => { setChartDuration(30); setIsChartDropdownOpen(false); }}>
                    <Text style={styles.dropdownItemText}>Last 1 Month</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => { setChartDuration(90); setIsChartDropdownOpen(false); }}>
                    <Text style={styles.dropdownItemText}>Last 3 Months</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.lineChartContainer, { zIndex: 1, elevation: 1 }]}>
            <View collapsable={false}><Svg height="120" width="100%" viewBox="0 0 300 120">
              <Path 
                d={chartData.fillD} 
                fill="#fdf4ff" 
              />
              <Path 
                d={chartData.d} 
                fill="none" 
                stroke="#0f172a" 
                strokeWidth="2.5" 
              />
            </Svg></View>
            <View style={styles.chartXAxis}>
              {chartData.labels.map((lbl, idx) => (
                 <Text key={idx} style={styles.xAxisLabel}>{lbl}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Profile Completion */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View>
              <Text style={styles.profileTitle}>Profile Completion</Text>
              <Text style={styles.profileSub}>completed</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>100%</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.completedBtn}>
            <Text style={styles.completedBtnText}>Completed</Text>
          </TouchableOpacity>
        </View>

        {/* Department Distribution */}
        <View style={styles.deptCard}>
          <Text style={styles.cardTitle}>Department Distribution</Text>
          <View style={styles.deptList}>
            {[
              { label: 'ENG', val: 42, flex: 0.8 },
              { label: 'DES', val: 18, flex: 0.4 },
              { label: 'SAL', val: 24, flex: 0.55 },
              { label: 'HR',  val: 12, flex: 0.3 },
              { label: 'OPS', val: 10, flex: 0.25 },
            ].map(item => (
              <View key={item.label} style={styles.deptRow}>
                <Text style={styles.deptLabel}>{item.label}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { flex: item.flex }]} />
                  <View style={{ flex: 1 - item.flex }} />
                </View>
                <Text style={styles.deptVal}>{item.val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityList}>
            {loading ? (
               <ActivityIndicator color={PRIMARY} style={{ marginVertical: 20 }} />
            ) : applications.length === 0 ? (
               <Text style={{ textAlign: 'center', color: TEXT_GRAY, marginVertical: 20 }}>No recent activity.</Text>
            ) : (
               applications.slice(0, 5).map((app, i) => {
                 const dateStr = new Date(app.updatedAt || app.appliedAt).toLocaleDateString();
                 const isScheduled = app.status === 'INTERVIEW SCHEDULED';
                 return (
                   <View key={app.id || i} style={styles.activityItem}>
                     <View style={[styles.activityDot, { backgroundColor: isScheduled ? '#10b981' : '#0f172a' }]} />
                     <View>
                       {isScheduled ? (
                         <Text style={styles.activityText}>Interview scheduled with <Text style={styles.bold}>{app.fullName}</Text></Text>
                       ) : (
                         <Text style={styles.activityText}>New application for <Text style={styles.bold}>{app.jobTitle}</Text></Text>
                       )}
                       <Text style={styles.activityTime}>{dateStr}</Text>
                     </View>
                   </View>
                 );
               })
            )}
          </View>
        </View>

      </ScrollView>



      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { label: 'Home', icon: LayoutGrid },
          { label: 'Jobs', icon: Briefcase },
          { label: 'Candidates', icon: Users },
          { label: 'Interviews', icon: Calendar },
          { label: 'Feed', icon: Users }
        ].map(item => {
          const isActive = activeTab === item.label;
          const Icon = item.icon;
          return (
            <TouchableOpacity 
              key={item.label} 
              style={styles.navItem}
              onPress={() => {
                if (item.label === 'Home') {
                  setActiveTab('Home');
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
              <View style={[{ padding: 8, borderRadius: 20 }, isActive && { backgroundColor: PRIMARY + '20', transform: [{ scale: 1.1 }] }]}>
                  <Icon size={22} color={isActive ? PRIMARY : '#94a3b8'} />
                </View>
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
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
  safeArea: { flex: 1, backgroundColor: WHITE },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 80, backgroundColor: BG },
  
  headerCard: {
    backgroundColor: WHITE,
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20,
    marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  adminInfo: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#336155', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logoText: { color: WHITE, fontSize: 13, fontWeight: '700' },
  companyTitle: { fontSize: 15, fontWeight: '800', color: TEXT_DARK },
  companySubtitle: { fontSize: 9, color: TEXT_GRAY, letterSpacing: 0.5, fontWeight: '700', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { padding: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: TEXT_DARK },
  
  statsScroll: { paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statCard: { backgroundColor: WHITE, padding: 16, borderRadius: 12, minWidth: 130, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  statLabel: { fontSize: 11, color: TEXT_GRAY, marginBottom: 8 },
  statValRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: TEXT_DARK, marginRight: 6 },
  statGrowthGreen: { fontSize: 10, fontWeight: '700', color: '#16a34a' },
  statGrowthGray: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  statSub: { fontSize: 10, color: '#94a3b8' },

  chartCard: { backgroundColor: WHITE, marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: TEXT_DARK },
  dropdownBtn: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  dropdownText: { fontSize: 10, color: TEXT_GRAY, fontWeight: '500' },
  dropdownMenu: { backgroundColor: WHITE, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemText: { fontSize: 11, color: TEXT_DARK },
  lineChartContainer: { marginTop: 10 },
  chartXAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 },
  xAxisLabel: { fontSize: 10, color: '#94a3b8' },

  profileCard: { backgroundColor: PRIMARY, marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  profileTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  profileTitle: { fontSize: 15, fontWeight: '700', color: WHITE, marginBottom: 4 },
  profileSub: { fontSize: 12, color: '#d8b4e2' },
  progressCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: WHITE, justifyContent: 'center', alignItems: 'center' },
  progressText: { color: WHITE, fontSize: 12, fontWeight: '700' },
  completedBtn: { backgroundColor: '#8b4cb5', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  completedBtnText: { color: WHITE, fontSize: 13, fontWeight: '600' },

  deptCard: { backgroundColor: WHITE, marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  deptList: { marginTop: 12 },
  deptRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  deptLabel: { width: 32, fontSize: 10, fontWeight: '700', color: TEXT_GRAY },
  barTrack: { flex: 1, height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, flexDirection: 'row', marginHorizontal: 12 },
  barFill: { backgroundColor: '#1e293b', borderRadius: 3 },
  deptVal: { width: 24, fontSize: 11, fontWeight: '700', color: TEXT_DARK, textAlign: 'right' },

  activityCard: { backgroundColor: WHITE, marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  viewAllText: { fontSize: 11, fontWeight: '700', color: TEXT_DARK },
  activityList: { marginTop: 8 },
  activityItem: { flexDirection: 'row', marginBottom: 16, paddingRight: 20 },
  activityDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, marginRight: 12 },
  activityText: { fontSize: 12, color: TEXT_DARK, lineHeight: 18 },
  bold: { fontWeight: '700' },
  activityTime: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  floatingContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 90 : 70, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10, pointerEvents: 'box-none' },
  msgPill: { backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  msgText: { color: WHITE, fontSize: 13, fontWeight: '600' },
  botBtn: { backgroundColor: PRIMARY, width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: WHITE, borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  navTextActive: { color: PRIMARY, fontWeight: '700' },
});
