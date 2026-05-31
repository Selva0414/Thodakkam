import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform
} from 'react-native';
import {
  Search, Mail, Bell, Settings, Briefcase, Users,
  Calendar, MessageSquare, LayoutGrid
} from 'lucide-react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import StartupHeader from '../components/StartupHeader';

const PRIMARY = '#662483';
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function StartupDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const companyName = (params.companyName as string) || 'Echo Digital';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StartupHeader companyName={companyName} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          {/* Stat 1 */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Hires</Text>
            <View style={styles.statValRow}>
              <Text style={styles.statValue}>128</Text>
              <Text style={styles.statGrowthGreen}>+12%</Text>
            </View>
            <Text style={styles.statSub}>vs last month</Text>
          </View>
          
          {/* Stat 2 */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Open Roles</Text>
            <View style={styles.statValRow}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statGrowthGray}>0%</Text>
            </View>
            <Text style={styles.statSub}>same as last week</Text>
          </View>

          {/* Stat 3 */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Interview Rate</Text>
            <View style={styles.statValRow}>
              <Text style={styles.statValue}>18%</Text>
              <Text style={styles.statGrowthGreen}>+2%</Text>
            </View>
            <Text style={styles.statSub}>avg. improvement</Text>
          </View>
        </ScrollView>

        {/* Candidate Growth Chart */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Candidate Growth</Text>
            <View style={styles.dropdownBtn}>
              <Text style={styles.dropdownText}>Last 30 Days v</Text>
            </View>
          </View>
          <View style={styles.lineChartContainer}>
            <Svg height="120" width="100%" viewBox="0 0 300 120">
              <Path 
                d="M10,100 Q40,90 80,70 T150,75 T220,40 T290,60 L290,120 L10,120 Z" 
                fill="#fdf4ff" 
              />
              <Path 
                d="M10,100 Q40,90 80,70 T150,75 T220,40 T290,60" 
                fill="none" 
                stroke="#0f172a" 
                strokeWidth="2.5" 
              />
            </Svg>
            <View style={styles.chartXAxis}>
              <Text style={styles.xAxisLabel}>1 May</Text>
              <Text style={styles.xAxisLabel}>10 May</Text>
              <Text style={styles.xAxisLabel}>20 May</Text>
              <Text style={styles.xAxisLabel}>30 May</Text>
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
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#0f172a' }]} />
              <View>
                <Text style={styles.activityText}>New application for <Text style={styles.bold}>Senior Product Designer</Text></Text>
                <Text style={styles.activityTime}>2 minutes ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#cbd5e1' }]} />
              <View>
                <Text style={styles.activityText}>Interview scheduled with <Text style={styles.bold}>Sarah Chen</Text></Text>
                <Text style={styles.activityTime}>1 hour ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#cbd5e1' }]} />
              <View>
                <Text style={styles.activityText}>New hire: <Text style={styles.bold}>James Wilson</Text> joined Engineering</Text>
                <Text style={styles.activityTime}>3 hours ago</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#eab308' }]} />
              <View>
                <Text style={styles.activityText}>Job post <Text style={styles.bold}>"Sales Lead"</Text> is expiring soon</Text>
                <Text style={styles.activityTime}>5 hours ago</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Floating Elements */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity style={styles.msgPill}>
          <MessageSquare size={16} color={WHITE} style={{ marginRight: 6 }} />
          <Text style={styles.msgText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botBtn}>
          <MessageSquare size={20} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { label: 'Dashboard', icon: LayoutGrid },
          { label: 'Jobs', icon: Briefcase },
          { label: 'Candidates', icon: Users },
          { label: 'Interviews', icon: Calendar },
          { label: 'Community', icon: Users }
        ].map(item => {
          const isActive = activeTab === item.label;
          const Icon = item.icon;
          return (
            <TouchableOpacity 
              key={item.label} 
              style={styles.navItem}
              onPress={() => {
                setActiveTab(item.label);
                if (item.label === 'Jobs') {
                  router.replace({ pathname: '/startup-jobs' as any, params: { companyName } });
                } else if (item.label === 'Candidates') {
                  router.replace({ pathname: '/startup-candidates' as any, params: { companyName } });
                } else if (item.label === 'Interviews') {
                  router.replace({ pathname: '/startup-interviews' as any, params: { companyName } });
                } else if (item.label === 'Community') {
                  router.replace({ pathname: '/startup-community' as any, params: { companyName } });
                }
              }}
            >
              <Icon size={20} color={isActive ? PRIMARY : '#94a3b8'} />
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
