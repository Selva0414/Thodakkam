import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Image, Platform
} from 'react-native';
import {
  Search, Mail, Bell, ShieldCheck, Rocket, Users,
  BarChart2, Settings, Home, Plus, Upload, SlidersHorizontal,
  MoreVertical, ChevronLeft, ChevronRight, ChevronDown, Activity
} from 'lucide-react-native';
import { router } from 'expo-router';

const PRIMARY = '#5A279B'; 
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function AdminStudents() {
  const [activeTab, setActiveTab] = useState('Students');

  const handleTabPress = (label: string) => {
    setActiveTab(label);
    if (label === 'Dashboard') {
      router.replace('/admin-dashboard' as any);
    } else if (label === 'Startups') {
      router.replace('/admin-startups' as any);
    } else if (label === 'Analytics') {
      router.replace('/admin-analytics' as any);
    } else if (label === 'Settings') {
      router.replace('/admin-settings' as any);
    }
  };

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

        {/* Page Title & Actions */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Students Management</Text>
          <Text style={styles.pageSubtitle}>Oversee all student placements and startup assignments.</Text>
          
          <View style={styles.topActionButtons}>
            <TouchableOpacity style={styles.addBtn}>
              <Plus size={16} color={WHITE} style={{ marginRight: 6 }} />
              <Text style={styles.addBtnText}>Add Student</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn}>
              <Upload size={14} color={TEXT_DARK} style={{ marginRight: 6 }} />
              <Text style={styles.exportBtnText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCardHalf, { marginRight: 12 }]}>
            <Text style={styles.statLabelSmall}>TOTAL STUDENTS</Text>
            <Text style={styles.statValueLarge}>1,245</Text>
            <View style={styles.greenBadge}>
              <Activity size={10} color="#16a34a" style={{ marginRight: 4 }} />
              <Text style={styles.greenBadgeText}>+5%</Text>
            </View>
          </View>

          <View style={styles.statCardHalf}>
            <Text style={styles.statLabelSmall}>UNASSIGNED</Text>
            <Text style={styles.statValueLarge}>65</Text>
            <View style={styles.orangeBadge}>
              <Text style={styles.orangeBadgeText}>⚠ Action Req.</Text>
            </View>
          </View>
        </View>

        {/* Active Students Card */}
        <View style={styles.activeStudentsCard}>
          <Text style={styles.statLabelSmall}>ACTIVE STUDENTS</Text>
          <View style={styles.activeRow}>
            <Text style={styles.statValueLarge}>1,180</Text>
            <Text style={styles.growthText}>95% Growth</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '95%' }]} />
          </View>
        </View>

        {/* Chart Mockup Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.statLabelSmall}>STUDENTS PER STARTUP</Text>
            <Text style={styles.chartSubLabel}>42 Startups</Text>
          </View>
          <View style={styles.mockBarChart}>
            {/* Simple mock bars */}
            <View style={styles.barCol}><View style={[styles.bar, { height: 60 }]} /><Text style={styles.barLabel}>EchoD</Text></View>
            <View style={styles.barCol}><View style={[styles.bar, { height: 40 }]} /><Text style={styles.barLabel}>FinFlow</Text></View>
            <View style={styles.barCol}><View style={[styles.bar, { height: 80 }]} /><Text style={styles.barLabel}>SkyVault</Text></View>
            <View style={styles.barCol}><View style={[styles.bar, { height: 50 }]} /><Text style={styles.barLabel}>StartelX</Text></View>
            <View style={styles.barCol}><View style={[styles.bar, { height: 30 }]} /><Text style={styles.barLabel}>Bloom</Text></View>
          </View>
        </View>

        {/* Search & Filters */}
        <View style={styles.filterCard}>
          <View style={styles.filterHeader}>
            <SlidersHorizontal size={16} color={TEXT_DARK} style={{ marginRight: 8 }} />
            <Text style={styles.filterTitle}>Search & Filters</Text>
          </View>

          <Text style={styles.filterLabel}>DEPARTMENT</Text>
          <TouchableOpacity style={styles.dropdownBox}>
            <Text style={styles.dropdownText}>Computer Science</Text>
            <ChevronDown size={16} color={TEXT_GRAY} />
          </TouchableOpacity>

          <Text style={styles.filterLabel}>STARTUP</Text>
          <TouchableOpacity style={styles.dropdownBox}>
            <Text style={styles.dropdownText}>All Startups</Text>
            <ChevronDown size={16} color={TEXT_GRAY} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Student List Section */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Student List</Text>
            <Text style={styles.listCount}>Showing 4 of 1,245</Text>
          </View>

          {/* Student 1 */}
          <View style={styles.studentCard}>
            <View style={styles.studentTopRow}>
              <View style={styles.studentInfoRow}>
                <View style={[styles.avatarBox, { backgroundColor: '#ffedd5' }]}>
                  <Text style={[styles.avatarText, { color: '#ea580c' }]}>SM</Text>
                </View>
                <View>
                  <Text style={styles.studentName}>Suryaa M</Text>
                  <Text style={styles.studentRoll}>Roll: 2021CSE0042</Text>
                </View>
              </View>
              <TouchableOpacity>
                <MoreVertical size={18} color={TEXT_GRAY} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Department</Text>
                <Text style={styles.gridValue}>CS Engineering</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Startup</Text>
                <Text style={styles.gridValue}>SkyVault</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Role</Text>
                <Text style={styles.gridValue}>Frontend Dev</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Status</Text>
                <View style={styles.statusBadgeGreen}>
                  <Text style={styles.statusBadgeGreenText}>Active</Text>
                </View>
              </View>
              <View style={styles.gridItemFull}>
                <Text style={styles.gridLabel}>Join Date</Text>
                <Text style={styles.gridValue}>Oct 12, 2023</Text>
              </View>
            </View>
          </View>

          {/* Student 2 */}
          <View style={styles.studentCard}>
            <View style={styles.studentTopRow}>
              <View style={styles.studentInfoRow}>
                <View style={[styles.avatarBox, { backgroundColor: '#e0e7ff' }]}>
                  <Text style={[styles.avatarText, { color: '#4f46e5' }]}>SE</Text>
                </View>
                <View>
                  <Text style={styles.studentName}>Shabari E S</Text>
                  <Text style={styles.studentRoll}>Roll: 2021CSE0089</Text>
                </View>
              </View>
              <TouchableOpacity>
                <MoreVertical size={18} color={TEXT_GRAY} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Department</Text>
                <Text style={styles.gridValue}>CS Engineering</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Startup</Text>
                <Text style={styles.gridValue}>FinFlow</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Role</Text>
                <Text style={styles.gridValue}>UI/UX Designer</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Status</Text>
                <View style={styles.statusBadgeOrange}>
                  <Text style={styles.statusBadgeOrangeText}>Pending</Text>
                </View>
              </View>
              <View style={styles.gridItemFull}>
                <Text style={styles.gridLabel}>Join Date</Text>
                <Text style={styles.gridValue}>Nov 08, 2023</Text>
              </View>
            </View>
          </View>

          {/* Student 3 */}
          <View style={styles.studentCard}>
            <View style={styles.studentTopRow}>
              <View style={styles.studentInfoRow}>
                <View style={[styles.avatarBox, { backgroundColor: '#f1f5f9' }]}>
                  <Text style={[styles.avatarText, { color: '#475569' }]}>GA</Text>
                </View>
                <View>
                  <Text style={styles.studentName}>Gowtham A</Text>
                  <Text style={styles.studentRoll}>Roll: 2021ECE0112</Text>
                </View>
              </View>
              <TouchableOpacity>
                <MoreVertical size={18} color={TEXT_GRAY} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Department</Text>
                <Text style={styles.gridValue}>ECE</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Startup</Text>
                <Text style={styles.gridValue}>EchoD</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Role</Text>
                <Text style={styles.gridValue}>Backend Dev</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Status</Text>
                <View style={styles.statusBadgeGray}>
                  <Text style={styles.statusBadgeGrayText}>Inactive</Text>
                </View>
              </View>
              <View style={styles.gridItemFull}>
                <Text style={styles.gridLabel}>Join Date</Text>
                <Text style={styles.gridValue}>Sep 28, 2023</Text>
              </View>
            </View>
          </View>

          {/* Pagination */}
          <View style={styles.paginationSection}>
            <View style={styles.paginationRow}>
              <TouchableOpacity style={styles.pageBtnOutlined}>
                <ChevronLeft size={16} color={TEXT_GRAY} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pageBtn, { backgroundColor: PRIMARY }]}>
                <Text style={[styles.pageBtnText, { color: WHITE }]}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pageBtnOutlined}>
                <Text style={styles.pageBtnText}>2</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pageBtnOutlined}>
                <Text style={styles.pageBtnText}>3</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pageBtnOutlined}>
                <ChevronRight size={16} color={TEXT_GRAY} />
              </TouchableOpacity>
            </View>
          </View>

        </View>

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
              onPress={() => handleTabPress(item.label)}
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
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20, backgroundColor: BG },
  
  headerCard: {
    backgroundColor: WHITE,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
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
  pageTitle: { fontSize: 20, fontWeight: '800', color: TEXT_DARK, marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: TEXT_GRAY, marginBottom: 16 },
  
  topActionButtons: { flexDirection: 'row', gap: 12 },
  addBtn: { flex: 1, backgroundColor: PRIMARY, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
  addBtnText: { color: WHITE, fontSize: 13, fontWeight: '600' },
  exportBtn: { flex: 0.5, backgroundColor: WHITE, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  exportBtnText: { color: TEXT_DARK, fontSize: 13, fontWeight: '600' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16 },
  statCardHalf: { flex: 1, backgroundColor: WHITE, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statLabelSmall: { fontSize: 10, fontWeight: '700', color: TEXT_GRAY, letterSpacing: 0.5, marginBottom: 8 },
  statValueLarge: { fontSize: 24, fontWeight: '800', color: TEXT_DARK, marginBottom: 8 },
  greenBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  greenBadgeText: { fontSize: 10, fontWeight: '700', color: '#16a34a' },
  orangeBadge: { backgroundColor: '#fff7ed', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ffedd5' },
  orangeBadgeText: { fontSize: 10, fontWeight: '700', color: '#ea580c' },

  activeStudentsCard: { backgroundColor: WHITE, marginHorizontal: 20, padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  growthText: { fontSize: 11, color: TEXT_GRAY, fontWeight: '500', paddingBottom: 6 },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: TEXT_DARK, borderRadius: 4 },

  chartCard: { backgroundColor: WHITE, marginHorizontal: 20, padding: 16, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartSubLabel: { fontSize: 11, fontWeight: '700', color: TEXT_DARK },
  mockBarChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, paddingHorizontal: 10 },
  barCol: { alignItems: 'center' },
  bar: { width: 24, backgroundColor: '#e2e8f0', borderTopLeftRadius: 4, borderTopRightRadius: 4, marginBottom: 8 },
  barLabel: { fontSize: 9, color: TEXT_GRAY },

  filterCard: { backgroundColor: WHITE, marginHorizontal: 20, padding: 16, borderRadius: 12, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  filterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  filterTitle: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  filterLabel: { fontSize: 10, fontWeight: '700', color: TEXT_GRAY, letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  dropdownBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  dropdownText: { fontSize: 13, color: TEXT_DARK },
  applyBtn: { backgroundColor: PRIMARY, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  applyBtnText: { color: WHITE, fontSize: 13, fontWeight: '600' },

  listSection: { paddingHorizontal: 20 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listTitle: { fontSize: 16, fontWeight: '800', color: TEXT_DARK },
  listCount: { fontSize: 11, color: TEXT_GRAY },
  
  studentCard: { backgroundColor: WHITE, padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  studentTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  studentInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 14, fontWeight: '700' },
  studentName: { fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginBottom: 2 },
  studentRoll: { fontSize: 11, color: TEXT_GRAY },
  
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '50%', marginBottom: 12 },
  gridItemFull: { width: '100%' },
  gridLabel: { fontSize: 10, color: TEXT_GRAY, marginBottom: 4 },
  gridValue: { fontSize: 12, fontWeight: '600', color: TEXT_DARK },
  
  statusBadgeGreen: { backgroundColor: '#dcfce7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusBadgeGreenText: { fontSize: 10, fontWeight: '600', color: '#16a34a' },
  statusBadgeOrange: { backgroundColor: '#fef3c7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusBadgeOrangeText: { fontSize: 10, fontWeight: '600', color: '#d97706' },
  statusBadgeGray: { backgroundColor: '#e2e8f0', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusBadgeGrayText: { fontSize: 10, fontWeight: '600', color: '#475569' },

  paginationSection: { alignItems: 'center', marginTop: 12, marginBottom: 24 },
  paginationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageBtnOutlined: { width: 32, height: 32, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE },
  pageBtn: { width: 32, height: 32, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  pageBtnText: { fontSize: 13, fontWeight: '600', color: TEXT_DARK },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: WHITE, borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  navTextActive: { color: PRIMARY, fontWeight: '700' },
});
