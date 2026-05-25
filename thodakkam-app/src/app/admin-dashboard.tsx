import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Image, Platform
} from 'react-native';
import {
  Search, Mail, Bell, ShieldCheck, Rocket, Users,
  ClipboardList, Download, Activity, PieChart,
  Home, BarChart2, Settings, ChevronRight, Leaf, Cpu
} from 'lucide-react-native';
import { router } from 'expo-router';

const PRIMARY = '#5A279B'; // Deep purple matching the brand
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [stats, setStats] = useState({ totalStudents: 0, totalStartups: 0, pendingApprovals: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/admin/stats`);
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.adminInfo}>
              <View style={styles.shieldIconBox}>
                <ShieldCheck size={18} color={WHITE} />
              </View>
              <View>
                <Text style={styles.adminTitle}>Master Admin</Text>
                <Text style={styles.adminSubtitle}>MANAGEMENT</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionIcon}>
                <Mail size={20} color={TEXT_GRAY} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon}>
                <Bell size={20} color={TEXT_GRAY} />
              </TouchableOpacity>
              <Image 
                source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
                style={styles.profilePic} 
              />
            </View>
          </View>
          
          <View style={styles.searchBar}>
            <Search size={16} color={TEXT_GRAY} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search startups, students, or data..."
              placeholderTextColor={TEXT_GRAY}
            />
          </View>
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.pageTitle}>Overview Dashboard</Text>
          <Text style={styles.pageSubtitle}>Welcome back! Here's what's happening today.</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {/* Card 1 */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>Total Startups</Text>
              <View style={[styles.statIconBox, { backgroundColor: '#f1f5f9' }]}>
                <Rocket size={18} color={TEXT_DARK} />
              </View>
            </View>
            <Text style={styles.statValue}>{stats.totalStartups}</Text>
            <View style={styles.statBottom}>
              <View style={styles.badgeRow}>
                <View style={styles.greenBadge}>
                  <Activity size={10} color="#16a34a" style={{ marginRight: 2 }} />
                  <Text style={styles.greenBadgeText}>+8%</Text>
                </View>
                <Text style={styles.statSubText}>from last month</Text>
              </View>
              <TouchableOpacity>
                <Download size={16} color={TEXT_GRAY} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 2 */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>Total Students</Text>
              <View style={[styles.statIconBox, { backgroundColor: '#eff6ff' }]}>
                <Users size={18} color="#3b82f6" />
              </View>
            </View>
            <Text style={styles.statValue}>{stats.totalStudents}</Text>
            <View style={styles.statBottom}>
              <View style={styles.badgeRow}>
                <View style={styles.greenBadge}>
                  <Activity size={10} color="#16a34a" style={{ marginRight: 2 }} />
                  <Text style={styles.greenBadgeText}>+12%</Text>
                </View>
                <Text style={styles.statSubText}>active users</Text>
              </View>
              <TouchableOpacity>
                <Download size={16} color={TEXT_GRAY} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 3 */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>Pending Approvals</Text>
              <View style={[styles.statIconBox, { backgroundColor: '#fef3c7' }]}>
                <ClipboardList size={18} color="#f59e0b" />
              </View>
            </View>
            <Text style={styles.statValue}>{stats.pendingApprovals}</Text>
            <View style={styles.statBottom}>
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>Requires attention</Text>
              </View>
              <TouchableOpacity>
                <Download size={16} color={TEXT_GRAY} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Charts Section */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Student Participation</Text>
            <Text style={styles.chartSubtitle}>Monthly Index</Text>
          </View>
          
          {/* Mock Bar Chart Area */}
          <View style={styles.mockBarChart}>
            <Text style={styles.mockChartValue}>90%</Text>
            <View style={styles.mockXAxis}>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
                <Text key={m} style={styles.xAxisLabel}>{m}</Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Startup Categories</Text>
          
          <View style={styles.donutContainer}>
            {/* Mock Donut Chart */}
            <View style={styles.donutCircle}>
              <View style={styles.donutInner}>
                <Text style={styles.donutInnerValue}>100%</Text>
              </View>
            </View>
            
            {/* Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: PRIMARY }]} />
                <Text style={styles.legendLabel}>Tech</Text>
                <Text style={[styles.legendValue, { color: PRIMARY }]}>40%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.legendLabel}>Fintech</Text>
                <Text style={[styles.legendValue, { color: PRIMARY }]}>25%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendLabel}>Health</Text>
                <Text style={[styles.legendValue, { color: PRIMARY }]}>20%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#475569' }]} />
                <Text style={styles.legendLabel}>EdTech</Text>
                <Text style={[styles.legendValue, { color: PRIMARY }]}>15%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Applications */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Applications</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listItem}>
            <View style={styles.listIconBox}>
              <Leaf size={18} color={TEXT_DARK} />
            </View>
            <View style={styles.listDetails}>
              <Text style={styles.listTitle}>EcoStride</Text>
              <Text style={styles.listSub}>Sarah Chen • Oct 24, 2023</Text>
            </View>
            <View style={styles.pendingTag}>
              <Text style={styles.pendingTagText}>Pending</Text>
            </View>
          </View>

          <View style={styles.listItem}>
            <View style={styles.listIconBox}>
              <Cpu size={18} color={TEXT_DARK} />
            </View>
            <View style={styles.listDetails}>
              <Text style={styles.listTitle}>NeuroChip AI</Text>
              <Text style={styles.listSub}>David Miller • Oct 22, 2023</Text>
            </View>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>Active</Text>
            </View>
          </View>
        </View>

        {/* System Status Footer */}
        <View style={styles.systemStatus}>
          <View style={styles.systemDot} />
          <Text style={styles.systemText}>SYSTEM HEALTH: OPTIMAL PERFORMANCE</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { label: 'Dashboard', icon: Home },
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
              onPress={() => {
                setActiveTab(item.label);
                if (item.label === 'Startups') {
                  router.replace('/admin-startups' as any);
                } else if (item.label === 'Students') {
                  router.replace('/admin-students' as any);
                } else if (item.label === 'Analytics') {
                  router.replace('/admin-analytics' as any);
                } else if (item.label === 'Settings') {
                  router.replace('/admin-settings' as any);
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
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    backgroundColor: BG,
  },
  headerCard: {
    backgroundColor: WHITE,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  adminTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  adminSubtitle: {
    fontSize: 10,
    color: TEXT_GRAY,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    padding: 4,
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: TEXT_DARK,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: TEXT_GRAY,
  },
  statsContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 13,
    color: TEXT_GRAY,
    fontWeight: '500',
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 16,
  },
  statBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  greenBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  redBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  redBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
  },
  statSubText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  chartCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  chartSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  mockBarChart: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  mockChartValue: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  mockXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  donutCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: PRIMARY,
    borderLeftColor: '#10b981',
    borderBottomColor: '#3b82f6',
    borderTopColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
  },
  donutInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutInnerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
  },
  legendContainer: {
    flex: 1,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    color: TEXT_GRAY,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  listIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listDetails: {
    flex: 1,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  listSub: {
    fontSize: 11,
    color: TEXT_GRAY,
  },
  pendingTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pendingTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
  },
  activeTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  systemStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  systemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  systemText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  navTextActive: {
    color: PRIMARY,
    fontWeight: '700',
  },
});
