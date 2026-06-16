import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Image, Platform
} from 'react-native';
import {
  Search, Mail, Bell, ShieldCheck, Rocket, Users,
  BarChart2, Settings, Home, Calendar, UserPlus, TrendingDown
} from 'lucide-react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { router } from 'expo-router';
import AdminHeader from '../components/AdminHeader';

const PRIMARY = '#5A279B'; 
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState('Analytics');
  const [timeFilter, setTimeFilter] = useState('7 Days');

  const handleTabPress = (label: string) => {
    if (label === 'Home') {
      router.navigate('/admin-dashboard' as any);
    } else if (label === 'Startups') {
      router.navigate('/admin-startups' as any);
    } else if (label === 'Students') {
      router.navigate('/admin-students' as any);
    } else if (label === 'Settings') {
      router.navigate('/admin-settings' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AdminHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        


        {/* Page Title */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Performance Overview</Text>
          
          {/* Time Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {['7 Days', '30 Days', '90 Days', '1 Year'].map(filter => (
              <TouchableOpacity 
                key={filter} 
                style={[styles.filterChip, timeFilter === filter && styles.filterChipActive]}
                onPress={() => setTimeFilter(filter)}
              >
                <Text style={[styles.filterChipText, timeFilter === filter && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.calendarBtn}>
              <Calendar size={14} color={TEXT_GRAY} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Vertical Stat Cards */}
        <View style={styles.statsContainer}>
          {/* Stat 1 */}
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.iconBox, { backgroundColor: '#ffedd5' }]}>
                <UserPlus size={18} color="#ea580c" />
              </View>
              <View style={styles.statTextGroup}>
                <Text style={styles.statLabel}>Total Registrations</Text>
                <Text style={styles.statValue}>50+</Text>
              </View>
            </View>
            <Text style={[styles.statGrowth, { color: '#16a34a' }]}>+5.2%</Text>
          </View>

          {/* Stat 2 */}
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
                <Rocket size={18} color="#4f46e5" />
              </View>
              <View style={styles.statTextGroup}>
                <Text style={styles.statLabel}>Active Startups</Text>
                <Text style={styles.statValue}>20+</Text>
              </View>
            </View>
            <Text style={[styles.statGrowth, { color: '#16a34a' }]}>+3.1%</Text>
          </View>

          {/* Stat 3 */}
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                <TrendingDown size={18} color="#ef4444" />
              </View>
              <View style={styles.statTextGroup}>
                <Text style={styles.statLabel}>Bounce Rate</Text>
                <Text style={styles.statValue}>24.5%</Text>
              </View>
            </View>
            <Text style={[styles.statGrowth, { color: '#ef4444' }]}>-1.4%</Text>
          </View>
        </View>

        {/* Registration Trends Line Chart */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Registration Trends</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#0f172a' }]} />
                <Text style={styles.legendText}>Current</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#94a3b8' }]} />
                <Text style={styles.legendText}>Previous</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.lineChartContainer}>
            <View collapsable={false}><Svg height="120" width="100%" viewBox="0 0 300 120">
              {/* Grid Lines */}
              <Path d="M0,20 L300,20" stroke="#f1f5f9" strokeWidth="1" />
              <Path d="M0,60 L300,60" stroke="#f1f5f9" strokeWidth="1" />
              <Path d="M0,100 L300,100" stroke="#f1f5f9" strokeWidth="1" />
              
              {/* Previous Line */}
              <Path d="M10,110 Q50,80 100,90 T200,90 T290,70" fill="none" stroke="#94a3b8" strokeWidth="3" />
              
              {/* Current Line */}
              <Path d="M10,100 Q60,40 120,70 T230,10 L290,100" fill="none" stroke="#0f172a" strokeWidth="3" />
            </Svg></View>
            <View style={styles.chartXAxis}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <Text key={day} style={styles.xAxisLabel}>{day}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Startup Categories Donut Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Startup Categories</Text>
          <View style={styles.donutContainer}>
            <View style={styles.donutBox}>
              <View collapsable={false}><Svg height="120" width="120" viewBox="0 0 100 100">
                {/* Background Ring */}
                <Circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                {/* Fintech 45% */}
                <Circle cx="50" cy="50" r="40" stroke="#0f172a" strokeWidth="12" strokeDasharray="113 251" strokeDashoffset="25" fill="none" strokeLinecap="round" />
                {/* HealthTech 30% */}
                <Circle cx="50" cy="50" r="40" stroke="#3b82f6" strokeWidth="12" strokeDasharray="75 251" strokeDashoffset="-88" fill="none" strokeLinecap="round" />
                {/* SaaS 15% */}
                <Circle cx="50" cy="50" r="40" stroke="#22c55e" strokeWidth="12" strokeDasharray="37 251" strokeDashoffset="-163" fill="none" strokeLinecap="round" />
                {/* EdTech 10% */}
                <Circle cx="50" cy="50" r="40" stroke="#94a3b8" strokeWidth="12" strokeDasharray="25 251" strokeDashoffset="-200" fill="none" strokeLinecap="round" />
              </Svg></View>
              <View style={styles.donutCenter}>
                <Text style={styles.donutCenterText}>100%</Text>
              </View>
            </View>

            <View style={styles.donutLegend}>
              <View style={styles.donutLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#0f172a' }]} />
                <Text style={styles.legendText}>Fintech 45%</Text>
              </View>
              <View style={styles.donutLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.legendText}>HealthTech 30%</Text>
              </View>
              <View style={styles.donutLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.legendText}>SaaS 15%</Text>
              </View>
              <View style={styles.donutLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#94a3b8' }]} />
                <Text style={styles.legendText}>EdTech 10%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity Table */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol1, styles.tableHeaderTxt]}>STARTUP</Text>
            <Text style={[styles.tableCol2, styles.tableHeaderTxt, { textAlign: 'center' }]}>STATUS</Text>
            <Text style={[styles.tableCol3, styles.tableHeaderTxt, { textAlign: 'right' }]}>GROWTH</Text>
          </View>

          {/* Row 1 */}
          <View style={styles.tableRow}>
            <View style={styles.tableCol1}>
              <Text style={styles.rowTitle}>Lumina Flow</Text>
              <Text style={styles.rowSub}>SaaS</Text>
            </View>
            <View style={[styles.tableCol2, { alignItems: 'center' }]}>
              <View style={styles.badgeGreen}><Text style={styles.badgeGreenTxt}>Active</Text></View>
            </View>
            <View style={styles.tableCol3}>
              <Text style={styles.growthGreen}>+12.4%</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.tableRow}>
            <View style={styles.tableCol1}>
              <Text style={styles.rowTitle}>HealthSync</Text>
              <Text style={styles.rowSub}>HealthTech</Text>
            </View>
            <View style={[styles.tableCol2, { alignItems: 'center' }]}>
              <View style={styles.badgeGreen}><Text style={styles.badgeGreenTxt}>Active</Text></View>
            </View>
            <View style={styles.tableCol3}>
              <Text style={styles.growthGreen}>+8.1%</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={styles.tableRow}>
            <View style={styles.tableCol1}>
              <Text style={styles.rowTitle}>EduPeak</Text>
              <Text style={styles.rowSub}>EdTech</Text>
            </View>
            <View style={[styles.tableCol2, { alignItems: 'center' }]}>
              <View style={styles.badgeYellow}><Text style={styles.badgeYellowTxt}>Pending</Text></View>
            </View>
            <View style={styles.tableCol3}>
              <Text style={styles.growthGray}>0.0%</Text>
            </View>
          </View>

        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { label: 'Home', icon: Home },
          { label: 'Startups', icon: Rocket },
          { label: 'Students', icon: Users },
          { label: 'Analytics', icon: BarChart2 },
          { label: 'Settings', icon: Settings }
        ].map(item => {
          const isActive = activeTab === item.label;
          const Icon = item.icon;
          return (
            <TouchableOpacity 
              key={item.label} 
              style={styles.navItem}
              onPress={() => handleTabPress(item.label)}
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
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20, backgroundColor: BG },
  
  headerCard: {
    backgroundColor: WHITE,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    marginBottom: 20,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  adminInfo: { flexDirection: 'row', alignItems: 'center' },
  shieldIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  adminTitle: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  adminSubtitle: { fontSize: 10, color: TEXT_GRAY, letterSpacing: 0.5, fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { padding: 4 },
  profilePic: { width: 32, height: 32, borderRadius: 16, marginLeft: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: TEXT_DARK },
  
  titleSection: { paddingHorizontal: 20, marginBottom: 20 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: TEXT_DARK, marginBottom: 12 },
  filterScroll: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterChip: { backgroundColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterChipActive: { backgroundColor: PRIMARY },
  filterChipText: { fontSize: 12, fontWeight: '600', color: TEXT_GRAY },
  filterChipTextActive: { color: WHITE },
  calendarBtn: { backgroundColor: '#e2e8f0', padding: 8, borderRadius: 20, marginLeft: 4 },

  statsContainer: { paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  statCard: { backgroundColor: WHITE, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statContent: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statTextGroup: { justifyContent: 'center' },
  statLabel: { fontSize: 11, color: TEXT_GRAY, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: TEXT_DARK },
  statGrowth: { fontSize: 12, fontWeight: '700' },

  chartCard: { backgroundColor: WHITE, marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: TEXT_DARK },
  legendRow: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  legendText: { fontSize: 10, color: TEXT_GRAY },
  
  lineChartContainer: { marginTop: 10 },
  chartXAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 10 },
  xAxisLabel: { fontSize: 10, color: '#94a3b8' },

  donutContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 16 },
  donutBox: { position: 'relative', width: 120, height: 120 },
  donutCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  donutCenterText: { fontSize: 16, fontWeight: '800', color: TEXT_DARK },
  donutLegend: { justifyContent: 'center', gap: 12 },
  donutLegendItem: { flexDirection: 'row', alignItems: 'center' },

  viewAllText: { fontSize: 11, fontWeight: '700', color: TEXT_DARK },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8, marginBottom: 12 },
  tableHeaderTxt: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 },
  tableCol1: { flex: 2 },
  tableCol2: { flex: 1 },
  tableCol3: { flex: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  rowTitle: { fontSize: 13, fontWeight: '700', color: TEXT_DARK, marginBottom: 2 },
  rowSub: { fontSize: 11, color: TEXT_GRAY },
  badgeGreen: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeGreenTxt: { fontSize: 10, fontWeight: '700', color: '#16a34a' },
  badgeYellow: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeYellowTxt: { fontSize: 10, fontWeight: '700', color: '#d97706' },
  growthGreen: { fontSize: 12, fontWeight: '700', color: '#16a34a', textAlign: 'right' },
  growthGray: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textAlign: 'right' },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: WHITE, borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  navTextActive: { color: PRIMARY, fontWeight: '700' },
});
