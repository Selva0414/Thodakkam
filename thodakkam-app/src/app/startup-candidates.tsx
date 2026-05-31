import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, ActivityIndicator, Linking, TextInput, Image, Modal, Alert
} from 'react-native';
import {
  Briefcase, Users, Calendar, LayoutGrid, Sparkles, CheckSquare, Square, Search, Bell, Settings, MessageSquare, Mail, X, Phone, ExternalLink
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

const PRIMARY = '#662483';
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

const ATS_CIRCLE_RADIUS = 18;
const ATS_CIRCLE_CIRCUMFERENCE = 2 * Math.PI * ATS_CIRCLE_RADIUS;

export default function StartupCandidates() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('Candidates');
  const [filterTab, setFilterTab] = useState('All');
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [selectedProfileApp, setSelectedProfileApp] = useState<any>(null);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const companyName = (params.companyName as string) || 'Echo Digital';

  useFocusEffect(
    React.useCallback(() => {
      fetchApplications();
    }, [companyName])
  );

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/applications/startup/${companyName}`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      if (data.success) {
        // Mocking some ATS scores and statuses for the UI demo based on the Figma
        const enrichedApps = (data.applications || []).map((app: any, idx: number) => {
          const scores = [88, 94, 91, 76];
          const statuses = ['NEW', 'REVIEWING', 'INTERVIEW SCHEDULED', 'REVIEWING'];
          return {
            ...app,
            atsScore: scores[idx % scores.length],
            status: app.status === 'PENDING' ? statuses[idx % statuses.length] : app.status,
            isRemote: true
          };
        });
        setApplications(enrichedApps);
      }
    } catch (err) {
      console.error('Fetch Apps Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavPress = (label: string) => {
    setActiveTab(label);
    if (label === 'Dashboard') {
      router.replace({ pathname: '/startup-dashboard' as any, params: { companyName } });
    } else if (label === 'Jobs') {
      router.replace({ pathname: '/startup-jobs' as any, params: { companyName } });
    } else if (label === 'Interviews') {
      router.replace({ pathname: '/startup-interviews' as any, params: { companyName } });
    } else if (label === 'Community') {
      router.replace({ pathname: '/startup-community' as any, params: { companyName } });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const filters = [
    { label: 'All', count: applications.length },
    { label: 'New', count: applications.filter(a => a.status === 'NEW').length },
    { label: 'Reviewing', count: applications.filter(a => a.status === 'REVIEWING').length },
    { label: 'Shortlist', count: 0 },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Search & Header (Figma style) */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View style={styles.companyInfo}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>echo</Text>
            </View>
            <View>
              <Text style={styles.companyNameText}>{companyName}</Text>
              <Text style={styles.premiumText}>PREMIUM PLAN</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <Mail size={20} color={TEXT_GRAY} />
            <Bell size={20} color={TEXT_GRAY} />
            <Settings size={20} color={TEXT_GRAY} />
          </View>
        </View>
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search analytics, candidates..."
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabsContainer}>
          {filters.map(f => (
            <TouchableOpacity 
              key={f.label} 
              style={[styles.filterTab, filterTab === f.label && styles.filterTabActive]}
              onPress={() => setFilterTab(f.label)}
            >
              <Text style={[styles.filterTabText, filterTab === f.label && styles.filterTabTextActive]}>
                {f.label}
              </Text>
              <View style={[styles.filterBadge, filterTab === f.label && styles.filterBadgeActive]}>
                <Text style={styles.filterBadgeText}>{f.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.contentPadding}>
          {/* AI ATS Analyzer Button */}
          <TouchableOpacity style={styles.aiButton}>
            <Sparkles size={18} color={WHITE} style={{ marginRight: 8 }} />
            <Text style={styles.aiButtonText}>AI ATS Analyzer</Text>
          </TouchableOpacity>

          {/* Candidates List */}
          {loading ? (
            <ActivityIndicator color={PRIMARY} style={{ marginTop: 40 }} />
          ) : applications.length === 0 ? (
            <Text style={{ textAlign: 'center', color: TEXT_GRAY, marginTop: 40 }}>No candidates found.</Text>
          ) : (
            applications.filter(a => filterTab === 'All' ? true : filterTab.toUpperCase() === a.status).map((app) => {
              const isSelected = selectedIds.includes(app.id);
              
              // ATS Circle Color
              const atsColor = app.atsScore >= 90 ? '#10b981' : app.atsScore >= 80 ? '#22c55e' : '#eab308';
              const progressStroke = ATS_CIRCLE_CIRCUMFERENCE - (ATS_CIRCLE_CIRCUMFERENCE * app.atsScore) / 100;

              return (
                <View key={app.id} style={[styles.candidateCard, isSelected && styles.candidateCardSelected]}>
                  <View style={styles.cardMainRow}>
                    <TouchableOpacity onPress={() => toggleSelect(app.id)} style={styles.checkbox}>
                      {isSelected ? <CheckSquare size={20} color={PRIMARY} /> : <Square size={20} color="#cbd5e1" />}
                    </TouchableOpacity>
                    
                    {app.user?.profilePhoto ? (
                      <Image source={{ uri: app.user.profilePhoto }} style={styles.avatarImg} />
                    ) : (
                      <View style={[styles.avatarImg, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_GRAY }}>{app.fullName.substring(0,2).toUpperCase()}</Text>
                      </View>
                    )}

                    <View style={styles.cardInfo}>
                      <Text style={styles.candidateName}>{app.fullName}</Text>
                      <Text style={styles.jobTitle}>{app.jobTitle}</Text>
                      <Text style={styles.appliedDate}>Applied: {new Date(app.appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>

                    {/* ATS Score Circle */}
                    <View style={styles.atsContainer}>
                      <Svg width="40" height="40" viewBox="0 0 40 40">
                        <Circle cx="20" cy="20" r={ATS_CIRCLE_RADIUS} stroke="#f1f5f9" strokeWidth="3" fill="none" />
                        <Circle cx="20" cy="20" r={ATS_CIRCLE_RADIUS} stroke={atsColor} strokeWidth="3" fill="none" strokeDasharray={ATS_CIRCLE_CIRCUMFERENCE} strokeDashoffset={progressStroke} strokeLinecap="round" transform="rotate(-90 20 20)" />
                        <SvgText x="20" y="24" fontSize="10" fontWeight="bold" fill={atsColor} textAnchor="middle">{app.atsScore}%</SvgText>
                      </Svg>
                    </View>
                  </View>

                  {/* Badges */}
                  <View style={styles.badgesRow}>
                    {app.status === 'NEW' && <View style={[styles.badge, { backgroundColor: '#e0e7ff' }]}><Text style={[styles.badgeText, { color: '#4f46e5' }]}>NEW</Text></View>}
                    {app.status === 'REVIEWING' && <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}><Text style={[styles.badgeText, { color: '#d97706' }]}>REVIEWING</Text></View>}
                    {app.status === 'INTERVIEW SCHEDULED' && <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}><Text style={[styles.badgeText, { color: '#16a34a' }]}>INTERVIEW SCHEDULED</Text></View>}
                    {app.isRemote && <View style={[styles.badge, { backgroundColor: '#f1f5f9' }]}><Text style={[styles.badgeText, { color: TEXT_GRAY }]}>Remote</Text></View>}
                    <View style={{ flex: 1 }} />
                    {app.status === 'REVIEWING' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <CheckSquare size={12} color={TEXT_DARK} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: TEXT_DARK }}>Selected</Text>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={styles.viewProfileBtn}
                      onPress={() => {
                        setSelectedProfileApp(app);
                        setIsProfileModalVisible(true);
                      }}
                    >
                      <Text style={styles.viewProfileText}>View Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.scheduleBtn}
                      onPress={() => {
                        if (app.status === 'INTERVIEW SCHEDULED') {
                          setAlertMessage('This candidate is already scheduled for an interview for this role.');
                          setIsAlertVisible(true);
                          return;
                        }

                        router.push({
                          pathname: '/startup-interviews' as any,
                          params: {
                            companyName,
                            candidateName: app.fullName,
                            jobTitle: app.jobTitle,
                            candidateId: app.id,
                            resumeUrl: app.resumeUrl || ''
                          }
                        });
                      }}
                    >
                      <Text style={styles.scheduleBtnText}>{app.status === 'INTERVIEW SCHEDULED' ? 'Scheduled' : 'Schedule'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* View Profile Modal */}
      <Modal
        visible={isProfileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Candidate Profile</Text>
              <TouchableOpacity onPress={() => setIsProfileModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={TEXT_DARK} />
              </TouchableOpacity>
            </View>
            
            {selectedProfileApp && (
              <ScrollView style={styles.modalScroll}>
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  {selectedProfileApp.user?.profilePhoto ? (
                    <Image source={{ uri: selectedProfileApp.user.profilePhoto }} style={styles.modalAvatar} />
                  ) : (
                    <View style={[styles.modalAvatar, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 24, fontWeight: '700', color: TEXT_GRAY }}>{selectedProfileApp.fullName.substring(0,2).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={[styles.candidateName, { fontSize: 20, marginTop: 12 }]}>{selectedProfileApp.fullName}</Text>
                  <Text style={[styles.jobTitle, { fontSize: 14 }]}>Applied for: {selectedProfileApp.jobTitle}</Text>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>Contact Information</Text>
                  <View style={styles.infoRow}>
                    <Mail size={16} color={TEXT_GRAY} />
                    <Text style={styles.infoText}>{selectedProfileApp.email}</Text>
                  </View>
                  {selectedProfileApp.phone && (
                    <View style={styles.infoRow}>
                      <Phone size={16} color={TEXT_GRAY} />
                      <Text style={styles.infoText}>{selectedProfileApp.phone}</Text>
                    </View>
                  )}
                </View>

                {selectedProfileApp.resumeUrl && (
                  <View style={[styles.infoGroup, { marginTop: 20 }]}>
                    <Text style={styles.infoLabel}>Resume</Text>
                    <TouchableOpacity 
                      style={styles.modalResumeBtn}
                      onPress={() => Linking.openURL(selectedProfileApp.resumeUrl)}
                    >
                      <ExternalLink size={16} color={PRIMARY} />
                      <Text style={styles.modalResumeBtnText}>View Uploaded Resume</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Skills Section */}
                <View style={[styles.infoGroup, { marginTop: 20 }]}>
                  <Text style={styles.infoLabel}>Skills</Text>
                  <View style={styles.skillsWrapper}>
                    {((selectedProfileApp.user?.skills?.length > 0) ? selectedProfileApp.user.skills : ['React Native', 'TypeScript', 'Figma', 'UI/UX Design', 'Node.js']).map((skill: string, index: number) => (
                      <View key={index} style={styles.skillPill}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Education Section */}
                <View style={[styles.infoGroup, { marginTop: 20 }]}>
                  <Text style={styles.infoLabel}>Education</Text>
                  {((selectedProfileApp.user?.education?.length > 0) ? selectedProfileApp.user.education : [
                    { degree: 'B.Tech in Computer Science', institution: 'XYZ University', year: '2020 - 2024' },
                    { degree: 'High School Diploma', institution: 'ABC School', year: '2018 - 2020' }
                  ]).map((edu: any, index: number) => (
                    <View key={index} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>{edu.degree || edu.title}</Text>
                        <Text style={styles.timelineSubtitle}>{edu.institution || edu.school}</Text>
                        <Text style={styles.timelineDate}>{edu.year || edu.duration}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Experience / Internship Section */}
                <View style={[styles.infoGroup, { marginTop: 20 }]}>
                  <Text style={styles.infoLabel}>Experience & Internships</Text>
                  {((selectedProfileApp.user?.experience?.length > 0) ? selectedProfileApp.user.experience : [
                    { role: 'Frontend Developer Intern', company: 'Tech Innovators Inc.', duration: 'Jun 2023 - Dec 2023' },
                    { role: 'UI/UX Designer', company: 'Creative Solutions', duration: 'Jan 2022 - May 2023' }
                  ]).map((exp: any, index: number) => (
                    <View key={index} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>{exp.role || exp.title}</Text>
                        <Text style={styles.timelineSubtitle}>{exp.company}</Text>
                        <Text style={styles.timelineDate}>{exp.duration}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={[styles.infoGroup, { marginTop: 20 }]}>
                  <Text style={styles.infoLabel}>Application Status</Text>
                  <View style={[styles.badge, { backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12 }]}>
                    <Text style={[styles.badgeText, { color: TEXT_DARK }]}>{selectedProfileApp.status}</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Floating Action Bars */}
      <View style={styles.floatingWrapper}>
        {selectedIds.length > 0 && (
          <View style={styles.selectionBar}>
            <View>
              <Text style={styles.selectionText}>{selectedIds.length} Candidates Selected</Text>
              <TouchableOpacity onPress={clearSelection}>
                <Text style={styles.cancelText}>Cancel selection</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.scheduleSelectedBtn}
              onPress={() => {
                router.push({
                  pathname: '/startup-interviews' as any,
                  params: {
                    companyName,
                    isBatch: 'true',
                    candidateIds: selectedIds.join(',')
                  }
                });
              }}
            >
              <Text style={styles.scheduleSelectedText}>Schedule ({selectedIds.length})</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.fabRow}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.messageFab}>
            <MessageSquare size={16} color={WHITE} style={{ marginRight: 8 }} />
            <Text style={styles.messageFabText}>Message</Text>
          </TouchableOpacity>
        </View>
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
              onPress={() => handleNavPress(item.label)}
            >
              <Icon size={20} color={isActive ? PRIMARY : '#94a3b8'} />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Alert Modal */}
      <Modal
        visible={isAlertVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAlertVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <View style={styles.alertIconBox}>
              <Bell size={24} color={PRIMARY} />
            </View>
            <Text style={styles.alertTitle}>Already Scheduled</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>
            <TouchableOpacity style={styles.alertBtn} onPress={() => setIsAlertVisible(false)}>
              <Text style={styles.alertBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  
  headerContainer: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 16, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  companyInfo: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#336155', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  logoText: { color: WHITE, fontSize: 10, fontWeight: '800' },
  companyNameText: { fontSize: 14, fontWeight: '800', color: TEXT_DARK },
  premiumText: { fontSize: 8, fontWeight: '700', color: TEXT_GRAY, letterSpacing: 0.5, marginTop: 2 },
  headerIcons: { flexDirection: 'row', gap: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: TEXT_DARK },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 160, backgroundColor: WHITE },
  
  filterTabsContainer: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingLeft: 20 },
  filterTab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabActive: { borderBottomColor: TEXT_DARK },
  filterTabText: { fontSize: 13, fontWeight: '600', color: TEXT_GRAY },
  filterTabTextActive: { color: TEXT_DARK },
  filterBadge: { backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  filterBadgeActive: { backgroundColor: '#e0e7ff' },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: TEXT_GRAY },

  contentPadding: { padding: 20 },
  
  aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 14, marginBottom: 24 },
  aiButtonText: { color: WHITE, fontSize: 14, fontWeight: '700' },

  candidateCard: { backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  candidateCardSelected: { borderColor: PRIMARY, backgroundColor: '#fdf4ff' },
  
  cardMainRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  checkbox: { marginRight: 12, marginTop: 4 },
  avatarImg: { width: 48, height: 48, borderRadius: 12, marginRight: 12 },
  cardInfo: { flex: 1 },
  candidateName: { fontSize: 15, fontWeight: '800', color: TEXT_DARK },
  jobTitle: { fontSize: 12, color: TEXT_GRAY, marginTop: 2, marginBottom: 4 },
  appliedDate: { fontSize: 10, color: '#94a3b8' },
  atsContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 16, gap: 6, paddingLeft: 32 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },

  actionRow: { flexDirection: 'row', gap: 12 },
  viewProfileBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  viewProfileText: { color: TEXT_DARK, fontSize: 13, fontWeight: '700' },
  scheduleBtn: { flex: 1, backgroundColor: PRIMARY, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  scheduleBtnText: { color: WHITE, fontSize: 13, fontWeight: '700' },

  floatingWrapper: { position: 'absolute', bottom: Platform.OS === 'ios' ? 90 : 70, left: 0, right: 0, paddingHorizontal: 20, pointerEvents: 'box-none' },
  selectionBar: { backgroundColor: WHITE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, marginBottom: 16 },
  selectionText: { fontSize: 13, fontWeight: '800', color: TEXT_DARK },
  cancelText: { fontSize: 10, fontWeight: '700', color: '#ef4444', marginTop: 4 },
  scheduleSelectedBtn: { backgroundColor: PRIMARY, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  scheduleSelectedText: { color: WHITE, fontSize: 12, fontWeight: '700' },
  
  fabRow: { flexDirection: 'row' },
  messageFab: { backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  messageFabText: { color: WHITE, fontSize: 14, fontWeight: '700' },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: WHITE, borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  navTextActive: { color: PRIMARY, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: '60%', maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: TEXT_DARK },
  closeBtn: { padding: 8 },
  modalScroll: { flex: 1 },
  modalAvatar: { width: 80, height: 80, borderRadius: 20 },
  infoGroup: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12 },
  infoLabel: { fontSize: 12, fontWeight: '700', color: TEXT_GRAY, marginBottom: 12, textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { fontSize: 14, color: TEXT_DARK, marginLeft: 10 },
  modalResumeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdf4ff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f3e8ff' },
  modalResumeBtnText: { color: PRIMARY, fontSize: 14, fontWeight: '700', marginLeft: 8 },
  
  skillsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillPill: { backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  skillText: { fontSize: 12, fontWeight: '600', color: TEXT_DARK },

  timelineItem: { flexDirection: 'row', marginBottom: 16, position: 'relative' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY, marginTop: 4, marginRight: 12 },
  timelineContent: { flex: 1 },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  timelineSubtitle: { fontSize: 13, color: TEXT_GRAY, marginTop: 2 },
  timelineDate: { fontSize: 11, color: '#94a3b8', marginTop: 4 },

  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { width: 300, backgroundColor: WHITE, borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  alertIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fdf4ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  alertTitle: { fontSize: 18, fontWeight: '800', color: TEXT_DARK, marginBottom: 8 },
  alertMessage: { fontSize: 14, color: TEXT_GRAY, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  alertBtn: { width: '100%', backgroundColor: PRIMARY, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  alertBtnText: { color: WHITE, fontSize: 14, fontWeight: '700' },
});
