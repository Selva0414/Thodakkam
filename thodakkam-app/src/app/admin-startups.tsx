import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Image, Platform
} from 'react-native';
import {
  Search, Mail, Bell, ShieldCheck, Rocket, Users,
  BarChart2, Settings, Home, Plus, Download, CheckCircle,
  Clock, Zap, MoreHorizontal, ChevronLeft, ChevronRight
} from 'lucide-react-native';
import { router } from 'expo-router';
import AdminHeader from '../components/AdminHeader';

const PRIMARY = '#5A279B'; // Deep purple matching the brand
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function AdminStartups() {
  const [activeTab, setActiveTab] = useState('Startups');

  const handleTabPress = (label: string) => {
    setActiveTab(label);
    if (label === 'Dashboard') {
      router.replace('/admin-dashboard' as any);
    } else if (label === 'Students') {
      router.replace('/admin-students' as any);
    } else if (label === 'Analytics') {
      router.replace('/admin-analytics' as any);
    } else if (label === 'Settings') {
      router.replace('/admin-settings' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AdminHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        


        {/* Page Title & Add Button */}
        <View style={styles.titleSection}>
          <View>
            <Text style={styles.pageTitle}>Startup Management</Text>
            <Text style={styles.pageSubtitle}>Review, approve, and manage registered startup entities.</Text>
          </View>
          <TouchableOpacity style={styles.registerBtn}>
            <Plus size={14} color={WHITE} style={{ marginRight: 4 }} />
            <Text style={styles.registerBtnText}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {/* Card 1 */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <View style={[styles.statIconBox, { backgroundColor: '#dcfce7' }]}>
                <CheckCircle size={18} color="#16a34a" />
              </View>
              <View style={styles.greenBadge}>
                <Text style={styles.greenBadgeText}>+5%</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>Approved Startups</Text>
            <View style={styles.statBottom}>
              <Text style={styles.statValue}>98</Text>
              <TouchableOpacity>
                <Download size={16} color={TEXT_GRAY} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 2 */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <View style={[styles.statIconBox, { backgroundColor: '#fef3c7' }]}>
                <Clock size={18} color="#f59e0b" />
              </View>
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>-2%</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>Rejected Applications</Text>
            <View style={styles.statBottom}>
              <Text style={styles.statValue}>12</Text>
              <TouchableOpacity>
                <Download size={16} color={TEXT_GRAY} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 3 */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <View style={[styles.statIconBox, { backgroundColor: '#f3e8ff' }]}>
                <Zap size={18} color="#9333ea" />
              </View>
              <View style={styles.greenBadge}>
                <Text style={styles.greenBadgeText}>+8%</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>Active Entities</Text>
            <View style={styles.statBottom}>
              <Text style={styles.statValue}>110</Text>
              <TouchableOpacity>
                <Download size={16} color={TEXT_GRAY} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Startup List Section */}
        <View style={styles.listSection}>
          <Text style={styles.listSectionTitle}>STARTUP LIST</Text>

          {/* Item 1 */}
          <View style={styles.listItem}>
            <View style={styles.listTop}>
              <View style={styles.logoRow}>
                <View style={[styles.companyLogoBox, { backgroundColor: '#ede9fe' }]}>
                  <Text style={[styles.companyLogoText, { color: '#8b5cf6' }]}>ED</Text>
                </View>
                <View>
                  <Text style={styles.companyName}>EchoD</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>Software</Text>
                  </View>
                </View>
              </View>
              <View style={styles.statusBadgeGreen}>
                <View style={[styles.statusDot, { backgroundColor: '#16a34a' }]} />
                <Text style={styles.statusBadgeGreenText}>Approved</Text>
              </View>
            </View>
            
            <View style={styles.userRow}>
              <View style={styles.userLeft}>
                <Image source={{ uri: 'https://i.pravatar.cc/150?img=5' }} style={styles.userAvatar} />
                <Text style={styles.userName}>Sarah Chen</Text>
              </View>
              <TouchableOpacity style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.btnApprove}>
                <Text style={styles.btnApproveText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnReject}>
                <Text style={styles.btnRejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnBlock}>
                <Text style={styles.btnBlockText}>Block</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Item 2 */}
          <View style={styles.listItem}>
            <View style={styles.listTop}>
              <View style={styles.logoRow}>
                <View style={[styles.companyLogoBox, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.companyLogoText, { color: '#16a34a' }]}>SU</Text>
                </View>
                <View>
                  <Text style={styles.companyName}>Startup</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>Energy</Text>
                  </View>
                </View>
              </View>
              <View style={styles.statusBadgeOrange}>
                <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.statusBadgeOrangeText}>Pending</Text>
              </View>
            </View>
            
            <View style={styles.userRow}>
              <View style={styles.userLeft}>
                <Image source={{ uri: 'https://i.pravatar.cc/150?img=12' }} style={styles.userAvatar} />
                <Text style={styles.userName}>John Smith</Text>
              </View>
              <TouchableOpacity style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.btnApprove}>
                <Text style={styles.btnApproveText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnReject}>
                <Text style={styles.btnRejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnBlock}>
                <Text style={styles.btnBlockText}>Block</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Item 3 */}
          <View style={styles.listItem}>
            <View style={styles.listTop}>
              <View style={styles.logoRow}>
                <View style={[styles.companyLogoBox, { backgroundColor: '#e0e7ff' }]}>
                  <Text style={[styles.companyLogoText, { color: '#4f46e5' }]}>FF</Text>
                </View>
                <View>
                  <Text style={styles.companyName}>FinFlow</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>Fintech</Text>
                  </View>
                </View>
              </View>
              <View style={styles.statusBadgeBlue}>
                <View style={[styles.statusDot, { backgroundColor: '#4f46e5' }]} />
                <Text style={styles.statusBadgeBlueText}>Active</Text>
              </View>
            </View>
            
            <View style={styles.userRow}>
              <View style={styles.userLeft}>
                <Image source={{ uri: 'https://i.pravatar.cc/150?img=9' }} style={styles.userAvatar} />
                <Text style={styles.userName}>Elena Rodriguez</Text>
              </View>
              <TouchableOpacity style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.btnApprove}>
                <Text style={styles.btnApproveText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnReject}>
                <Text style={styles.btnRejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnBlock}>
                <Text style={styles.btnBlockText}>Block</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Item 4 */}
          <View style={styles.listItem}>
            <View style={styles.listTop}>
              <View style={styles.logoRow}>
                <View style={[styles.companyLogoBox, { backgroundColor: '#fae8ff' }]}>
                  <Text style={[styles.companyLogoText, { color: '#c026d3' }]}>SV</Text>
                </View>
                <View>
                  <Text style={styles.companyName}>SkyVault</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>Security</Text>
                  </View>
                </View>
              </View>
              <View style={styles.statusBadgeRed}>
                <View style={[styles.statusDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.statusBadgeRedText}>Rejected</Text>
              </View>
            </View>
            
            <View style={styles.userRow}>
              <View style={styles.userLeft}>
                <Image source={{ uri: 'https://i.pravatar.cc/150?img=14' }} style={styles.userAvatar} />
                <Text style={styles.userName}>Marcus Lee</Text>
              </View>
              <TouchableOpacity style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.btnApprove}>
                <Text style={styles.btnApproveText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnReject}>
                <Text style={styles.btnRejectText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnBlock}>
                <Text style={styles.btnBlockText}>Block</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pagination */}
          <View style={styles.paginationSection}>
            <Text style={styles.paginationText}>Showing 1 to 5 of 23 results</Text>
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
              <Text style={styles.pageDots}>...</Text>
              <TouchableOpacity style={styles.pageBtnOutlined}>
                <Text style={styles.pageBtnText}>5</Text>
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
  titleSection: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 11,
    color: TEXT_GRAY,
    width: '100%',
    paddingRight: 10,
  },
  registerBtn: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 2,
  },
  registerBtnText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
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
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  redBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  redBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },
  statLabel: {
    fontSize: 12,
    color: TEXT_GRAY,
    marginBottom: 8,
  },
  statBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  listSection: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  listSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: TEXT_DARK,
    letterSpacing: 1,
    marginBottom: 16,
  },
  listItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 4,
  },
  listTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyLogoText: {
    fontSize: 14,
    fontWeight: '700',
  },
  companyName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 10,
    color: TEXT_GRAY,
  },
  statusBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeGreenText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
    marginLeft: 4,
  },
  statusBadgeOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeOrangeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#d97706',
    marginLeft: 4,
  },
  statusBadgeBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeBlueText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4f46e5',
    marginLeft: 4,
  },
  statusBadgeRed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeRedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  userName: {
    fontSize: 12,
    color: TEXT_GRAY,
  },
  viewBtn: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewBtnText: {
    fontSize: 11,
    color: TEXT_GRAY,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  btnApprove: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnApproveText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '600',
  },
  btnReject: {
    flex: 1,
    backgroundColor: '#f97316',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnRejectText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '600',
  },
  btnBlock: {
    flex: 1,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnBlockText: {
    color: TEXT_DARK,
    fontSize: 13,
    fontWeight: '600',
  },
  paginationSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  paginationText: {
    fontSize: 11,
    color: TEXT_GRAY,
    marginBottom: 16,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageBtnOutlined: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  pageDots: {
    color: TEXT_GRAY,
    marginHorizontal: 4,
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
