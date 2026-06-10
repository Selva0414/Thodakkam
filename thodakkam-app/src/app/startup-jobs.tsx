import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, ActivityIndicator, Modal, Linking
} from 'react-native';
import {
  Search, Mail, Bell, Settings, Briefcase, Users,
  Calendar, MessageSquare, LayoutGrid, Plus,
  List as ListIcon, BarChart2, Edit2, MapPin, MoreHorizontal, X, ExternalLink
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import StartupHeader from '../components/StartupHeader';
import Svg, { Path, Circle } from 'react-native-svg';

const PRIMARY = '#662483';
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function StartupJobs() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('Jobs');
  const [jobFilter, setJobFilter] = useState('All Jobs');
  const [viewMode, setViewMode] = useState<'List' | 'Analytics'>('List');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [analyticsTime, setAnalyticsTime] = useState(30);

  const companyName = (params.companyName as string) || 'Echo Digital';

  useFocusEffect(
    React.useCallback(() => {
      fetchJobs();
    }, [companyName])
  );

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/jobs/startup/${companyName}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Fetch Jobs Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toLowerCase();
    if (words.length === 1 && words[0].length >= 4) return words[0].substring(0, 4).toLowerCase();
    return name.substring(0, 2).toLowerCase();
  };

  const companyInitials = getInitials(companyName);

  const handleNavPress = (label: string) => {
    setActiveTab(label);
    if (label === 'Dashboard') {
      router.replace({ pathname: '/startup-dashboard' as any, params: { companyName } });
    } else if (label === 'Candidates') {
      router.replace({ pathname: '/startup-candidates' as any, params: { companyName } });
    } else if (label === 'Interviews') {
      router.replace({ pathname: '/startup-interviews' as any, params: { companyName } });
    } else if (label === 'Community') {
      router.replace({ pathname: '/startup-community' as any, params: { companyName } });
    }
  };

  const allCount = jobs.length;
  const activeCount = jobs.filter(j => j.status === 'ACTIVE').length;
  const draftCount = jobs.filter(j => j.status === 'DRAFT').length;
  const closedCount = jobs.filter(j => j.status === 'CLOSED').length;

  const tabsData = [
    { label: 'All Jobs', count: allCount },
    { label: 'Active', count: activeCount },
    { label: 'Drafts', count: draftCount },
    { label: 'Closed', count: closedCount },
  ];

  const allApplications = jobs.flatMap(j => j.applications || []);
  const totalApplications = allApplications.length;
  
  const interviewed = allApplications.filter(a => a.status === 'INTERVIEW SCHEDULED' || a.status === 'OFFERED' || a.status === 'HIRED').length;
  const offered = allApplications.filter(a => a.status === 'OFFERED' || a.status === 'HIRED').length;
  const interviewToOfferRate = interviewed > 0 ? ((offered / interviewed) * 100).toFixed(1) + '%' : '0%';

  let avgDaysToHire = '-';
  if (offered > 0) {
     const offeredApps = allApplications.filter(a => a.status === 'OFFERED' || a.status === 'HIRED');
     const totalMs = offeredApps.reduce((sum, a) => {
        const t1 = new Date(a.appliedAt).getTime();
        const t2 = new Date(a.updatedAt || a.appliedAt).getTime();
        return sum + Math.max(0, t2 - t1);
     }, 0);
     avgDaysToHire = Math.max(1, Math.round(totalMs / offered / (24 * 60 * 60 * 1000))).toString();
  }

  const analyticsChartData = useMemo(() => {
    const xVals = [10, 80, 150, 220, 290];
    const currentBins = [0, 0, 0, 0, 0];
    const prevBins = [0, 0, 0, 0, 0];
    const now = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const intervalDays = analyticsTime / 5;

    allApplications.forEach(app => {
      const appTime = new Date(app.appliedAt).getTime();
      const daysAgo = Math.floor((now - appTime) / dayMs);
      
      if (daysAgo >= 0 && daysAgo < analyticsTime) {
         const binIndex = 4 - Math.floor(daysAgo / intervalDays);
         if (binIndex >= 0 && binIndex <= 4) currentBins[binIndex]++;
      } else if (daysAgo >= analyticsTime && daysAgo < analyticsTime * 2) {
         const adjustedDaysAgo = daysAgo - analyticsTime;
         const binIndex = 4 - Math.floor(adjustedDaysAgo / intervalDays);
         if (binIndex >= 0 && binIndex <= 4) prevBins[binIndex]++;
      }
    });

    const maxBin = Math.max(...currentBins, ...prevBins, 1);
    
    // Y map from 120 to 20 (height is 140, max y=20, min y=120)
    const mapY = (count: number) => 120 - (count / maxBin) * 100;
    const curY = currentBins.map(mapY);
    const prevY = prevBins.map(mapY);

    const dCur = `M${xVals[0]},${curY[0]} Q${(xVals[0]+xVals[1])/2},${curY[0]} ${xVals[1]},${curY[1]} T${xVals[2]},${curY[2]} T${xVals[3]},${curY[3]} T${xVals[4]},${curY[4]}`;
    const dPrev = `M${xVals[0]},${prevY[0]} Q${(xVals[0]+xVals[1])/2},${prevY[0]} ${xVals[1]},${prevY[1]} T${xVals[2]},${prevY[2]} T${xVals[3]},${prevY[3]} T${xVals[4]},${prevY[4]}`;
    
    const labels = [];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for(let i=0; i<4; i++) {
       const step = analyticsTime / 4;
       const daysBack = Math.max(0, Math.round(analyticsTime - (i * step) - step/2));
       const dObj = new Date(now - daysBack * dayMs);
       labels.push(`${dObj.getDate()} ${months[dObj.getMonth()]}`);
    }

    const dotX = xVals[3];
    const dotY = curY[3];

    return { dCur, dPrev, labels, dotX, dotY };
  }, [allApplications, analyticsTime]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StartupHeader companyName={companyName} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Job Actions Header */}
        <View style={styles.headerCard}>

          {/* Job Filter Tabs */}
          {viewMode === 'List' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
              {tabsData.map(tab => (
                <TouchableOpacity 
                  key={tab.label} 
                  style={[styles.filterTab, jobFilter === tab.label && styles.filterTabActive]}
                  onPress={() => setJobFilter(tab.label)}
                >
                  <Text style={[styles.filterTabText, jobFilter === tab.label && styles.filterTabTextActive]}>
                    {tab.label} ({tab.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Floating Add Job Button for List View */}
          {viewMode === 'List' && (
            <TouchableOpacity 
              style={styles.addJobBtn}
              onPress={() => router.push({ pathname: '/startup-add-job' as any, params: { companyName } })}
            >
              <Plus size={28} color={WHITE} />
            </TouchableOpacity>
          )}
        </View>

        {/* Conditional Content based on View Mode */}
        {viewMode === 'List' ? (
          <>
            {/* Sub-bar (View toggles and sort) */}
            <View style={styles.subBar}>
              <View style={styles.viewToggles}>
                <TouchableOpacity 
                  style={[styles.viewBtn, styles.viewBtnActive]}
                  onPress={() => setViewMode('List')}
                >
                  <ListIcon size={14} color={TEXT_DARK} style={{ marginRight: 6 }} />
                  <Text style={[styles.viewBtnText, styles.viewBtnTextActive]}>List</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.viewBtn}
                  onPress={() => setViewMode('Analytics')}
                >
                  <BarChart2 size={14} color={TEXT_GRAY} style={{ marginRight: 6 }} />
                  <Text style={styles.viewBtnText}>Analytics</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sortText}>Sorted by: <Text style={styles.sortTextBold}>Recently Added</Text></Text>
            </View>

            {/* Job List */}
            <View style={styles.jobList}>
              {loading ? (
                <ActivityIndicator color={PRIMARY} style={{ marginTop: 40 }} />
              ) : jobs.length === 0 ? (
                <Text style={{ textAlign: 'center', color: TEXT_GRAY, marginTop: 40 }}>No jobs found. Create one!</Text>
              ) : (
                jobs
                  .filter(job => {
                    if (jobFilter === 'All Jobs') return true;
                    const targetStatus = jobFilter === 'Drafts' ? 'draft' : jobFilter.toLowerCase();
                    return job.status.toLowerCase() === targetStatus;
                  })
                  .map(job => (
                  <View key={job.id} style={styles.jobCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: job.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9' }]}>
                          <Text style={[styles.badgeText, { color: job.status === 'ACTIVE' ? '#16a34a' : TEXT_GRAY }]}>{job.status}</Text>
                        </View>
                        <Text style={styles.postedText}>Posted recently</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.editBtn}
                        onPress={() => {
                          router.push({
                            pathname: '/startup-edit-job' as any,
                            params: {
                              companyName,
                              jobId: job.id,
                              title: job.title,
                              location: job.location,
                              type: job.type,
                              salary: job.salary,
                              description: job.description,
                              requirements: (job.requirements || []).join(', '),
                              department: job.department,
                              workMode: job.workMode,
                              experience: job.experience,
                              education: job.education,
                              openings: job.openings,
                              deadline: job.deadline,
                              applicationMethod: job.applicationMethod
                            }
                          });
                        }}
                      >
                        <Edit2 size={14} color={TEXT_GRAY} />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <View style={styles.locationRow}>
                      <MapPin size={12} color={TEXT_GRAY} />
                      <Text style={styles.locationText}>{job.location}</Text>
                    </View>

                    <View style={styles.jobStatsRow}>
                      <View style={styles.applicantsCol}>
                        <Text style={styles.applicantsNumber}>{job.applications?.length || 0}</Text>
                        <Text style={styles.applicantsLabel}>APPLICANTS</Text>
                      </View>
                      <View style={{ flex: 1 }} />
                      <View style={styles.miniChart}>
                        <View style={[styles.chartBar, { height: 12, backgroundColor: '#e2e8f0' }]} />
                        <View style={[styles.chartBar, { height: 12, backgroundColor: '#e2e8f0' }]} />
                        <View style={[styles.chartBar, { height: 12, backgroundColor: '#e2e8f0' }]} />
                      </View>
                    </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity 
                        style={[styles.primaryActionBtn, { backgroundColor: PRIMARY, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }]}
                        onPress={() => {
                          setSelectedJob(job);
                          setIsModalVisible(true);
                        }}
                      >
                        <Text style={[styles.actionBtnText, { color: WHITE }]}>View Applicants</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.moreBtn}>
                        <MoreHorizontal size={18} color={TEXT_GRAY} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <View style={styles.analyticsContainer}>
            <View style={styles.analyticsHeader}>
              <Text style={styles.analyticsTitle}>Job Analytics</Text>
              <TouchableOpacity style={styles.editBtn}>
                <MoreHorizontal size={20} color={TEXT_GRAY} />
              </TouchableOpacity>
            </View>

            <View style={styles.segmentedControl}>
              <TouchableOpacity 
                style={styles.segmentBtn}
                onPress={() => setViewMode('List')}
              >
                <Text style={styles.segmentBtnText}>List View</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.segmentBtn, styles.segmentBtnActive]}
                onPress={() => setViewMode('Analytics')}
              >
                <BarChart2 size={14} color={PRIMARY} style={{ marginRight: 6 }} />
                <Text style={[styles.segmentBtnText, styles.segmentBtnTextActive]}>Analytics</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeFilters}>
              <TouchableOpacity 
                style={[styles.timeFilterBtn, analyticsTime === 30 && styles.timeFilterBtnActive]}
                onPress={() => setAnalyticsTime(30)}
              >
                <Text style={analyticsTime === 30 ? styles.timeFilterBtnTextActive : styles.timeFilterBtnText}>Last 30 days</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.timeFilterBtn, analyticsTime === 7 && styles.timeFilterBtnActive]}
                onPress={() => setAnalyticsTime(7)}
              >
                <Text style={analyticsTime === 7 ? styles.timeFilterBtnTextActive : styles.timeFilterBtnText}>Last 7 days</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.timeFilterBtn, analyticsTime === 365 && styles.timeFilterBtnActive]}
                onPress={() => setAnalyticsTime(365)}
              >
                <Text style={analyticsTime === 365 ? styles.timeFilterBtnTextActive : styles.timeFilterBtnText}>Year-to-date</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportBtn}>
                <View style={styles.exportIconBox}>
                  <Text style={{ color: PRIMARY, fontWeight: '800', fontSize: 16 }}>↑</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.analyticsStats}>
              <View style={styles.aStatCard}>
                <View style={styles.aStatIcon}><Users size={18} color={PRIMARY} /></View>
                <View style={styles.aStatTextWrapper}>
                  <Text style={styles.aStatLabel}>TOTAL APPLICATIONS</Text>
                  <Text style={styles.aStatValue}>{totalApplications}</Text>
                </View>
                <View style={styles.aBadgeGreen}><Text style={styles.aBadgeGreenText}>↗ -</Text></View>
              </View>

              <View style={styles.aStatCard}>
                <View style={styles.aStatIcon}><Briefcase size={18} color={PRIMARY} /></View>
                <View style={styles.aStatTextWrapper}>
                  <Text style={styles.aStatLabel}>ACTIVE JOBS</Text>
                  <Text style={styles.aStatValue}>{activeCount}</Text>
                </View>
                <View style={styles.aBadgeGreen}><Text style={styles.aBadgeGreenText}>↗ -</Text></View>
              </View>

              <View style={styles.aStatCard}>
                <View style={styles.aStatIcon}><Calendar size={18} color={PRIMARY} /></View>
                <View style={styles.aStatTextWrapper}>
                  <Text style={styles.aStatLabel}>AVG. TIME TO HIRE</Text>
                  <Text style={styles.aStatValue}>{avgDaysToHire === '-' ? '-' : `${avgDaysToHire} Days`}</Text>
                </View>
                <View style={styles.aBadgeRed}><Text style={styles.aBadgeRedText}>-</Text></View>
              </View>

              <View style={styles.aStatCard}>
                <View style={styles.aStatIcon}><ListIcon size={18} color={PRIMARY} /></View>
                <View style={styles.aStatTextWrapper}>
                  <Text style={styles.aStatLabel}>INTERVIEW-TO-OFFER</Text>
                  <Text style={styles.aStatValue}>{interviewToOfferRate}</Text>
                </View>
                <View style={styles.aBadgeGreen}><Text style={styles.aBadgeGreenText}>↗ 5.1%</Text></View>
              </View>
            </View>

            {/* Application Trends Chart */}
            <View style={styles.aChartCard}>
              <View style={styles.aCardHeader}>
                <View>
                  <Text style={styles.aCardTitle}>Application</Text>
                  <Text style={styles.aCardTitle}>Trends</Text>
                </View>
                <View style={styles.aLegend}>
                  <View style={styles.aLegendItem}>
                    <View style={[styles.aLegendDot, { backgroundColor: PRIMARY }]} />
                    <Text style={styles.aLegendText}>CURRENT</Text>
                  </View>
                  <View style={styles.aLegendItem}>
                    <View style={[styles.aLegendDot, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#cbd5e1' }]} />
                    <Text style={styles.aLegendText}>PREVIOUS</Text>
                  </View>
                </View>
              </View>
              <View style={styles.aChartWrapper}>
                <Svg height="140" width="100%" viewBox="0 0 300 140">
                  <Path d={analyticsChartData.dPrev} fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
                  <Path d={analyticsChartData.dCur} fill="none" stroke={PRIMARY} strokeWidth="2.5" />
                  <Circle cx={analyticsChartData.dotX} cy={analyticsChartData.dotY} r="4" fill={PRIMARY} />
                </Svg>
                <View style={styles.chartXAxis}>
                  {analyticsChartData.labels.map((lbl, idx) => (
                    <Text key={idx} style={styles.xAxisLabel}>{lbl}</Text>
                  ))}
                </View>
              </View>
            </View>

            {/* Top Candidate Sources */}
            <View style={styles.aChartCard}>
              <Text style={[styles.aCardTitle, { marginBottom: 16 }]}>Top Candidate Sources</Text>
              
              <View style={styles.sourceRow}>
                <View style={styles.sourceTextRow}>
                  <Text style={styles.sourceName}>Resume Portfolio</Text>
                  <Text style={styles.sourcePct}>42%</Text>
                </View>
                <View style={styles.sourceBarBg}>
                  <View style={[styles.sourceBarFill, { width: '42%' }]} />
                </View>
              </View>
              
              <View style={styles.sourceRow}>
                <View style={styles.sourceTextRow}>
                  <Text style={styles.sourceName}>Direct Referral</Text>
                  <Text style={styles.sourcePct}>28%</Text>
                </View>
                <View style={styles.sourceBarBg}>
                  <View style={[styles.sourceBarFill, { width: '28%' }]} />
                </View>
              </View>
              
              <View style={styles.sourceRow}>
                <View style={styles.sourceTextRow}>
                  <Text style={styles.sourceName}>Indeed Jobs</Text>
                  <Text style={styles.sourcePct}>15%</Text>
                </View>
                <View style={styles.sourceBarBg}>
                  <View style={[styles.sourceBarFill, { width: '15%' }]} />
                </View>
              </View>

              <View style={styles.sourceRow}>
                <View style={styles.sourceTextRow}>
                  <Text style={styles.sourceName}>Direct App</Text>
                  <Text style={styles.sourcePct}>10%</Text>
                </View>
                <View style={styles.sourceBarBg}>
                  <View style={[styles.sourceBarFill, { width: '10%' }]} />
                </View>
              </View>

              <TouchableOpacity style={styles.viewSourceBtn}>
                <Text style={styles.viewSourceBtnText}>View Source Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal for viewing applicants */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Applicants for {selectedJob?.title}</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={TEXT_DARK} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              {!selectedJob?.applications || selectedJob.applications.length === 0 ? (
                <Text style={{ textAlign: 'center', color: TEXT_GRAY, marginTop: 40 }}>No applicants yet.</Text>
              ) : (
                selectedJob.applications.map((app: any) => (
                  <View key={app.id} style={styles.applicantCard}>
                    <View style={styles.applicantMeta}>
                      <Text style={styles.applicantName}>{app.fullName}</Text>
                      <Text style={styles.applicantContact}>{app.email} • {app.phone}</Text>
                    </View>
                    {app.resumeUrl && (
                      <TouchableOpacity 
                        style={styles.resumeBtn}
                        onPress={() => Linking.openURL(app.resumeUrl)}
                      >
                        <ExternalLink size={14} color={PRIMARY} />
                        <Text style={styles.resumeBtnText}>Resume</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Floating Elements */}
      <View style={styles.floatingContainer}>
        <View style={styles.floatingTopRow}>
          {viewMode === 'Analytics' && (
            <TouchableOpacity style={styles.addJobFloatingBtn}>
              <Plus size={20} color={WHITE} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.msgPill} onPress={() => router.push({ pathname: '/startup-messages' as any, params: { companyName } })}>
            <MessageSquare size={16} color={WHITE} style={{ marginRight: 6 }} />
            <Text style={styles.msgText}>Message</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'Analytics' && (
          <TouchableOpacity 
            style={styles.postNewJobBtn}
            onPress={() => router.push({ pathname: '/startup-add-job' as any, params: { companyName } })}
          >
            <Text style={styles.postNewJobBtnText}>Post New Job</Text>
          </TouchableOpacity>
        )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 80, backgroundColor: BG },
  
  headerCard: {
    backgroundColor: WHITE,
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 80 : 70,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    position: 'relative',
    zIndex: 100,
    elevation: 10
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  adminInfo: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#336155', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logoText: { color: WHITE, fontSize: 13, fontWeight: '700' },
  companyTitle: { fontSize: 15, fontWeight: '800', color: TEXT_DARK },
  companySubtitle: { fontSize: 9, color: TEXT_GRAY, letterSpacing: 0.5, fontWeight: '700', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { padding: 4 },
  
  searchBarContainer: { marginBottom: 64 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: TEXT_DARK },
  addJobBtn: { position: 'absolute', right: 20, top: 16, zIndex: 10, width: 56, height: 56, borderRadius: 28, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  filterTabs: { flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', width: '100%' },
  filterTab: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabActive: { borderBottomColor: TEXT_DARK },
  filterTabText: { fontSize: 13, color: TEXT_GRAY, fontWeight: '600' },
  filterTabTextActive: { color: TEXT_DARK, fontWeight: '700' },

  subBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  viewToggles: { flexDirection: 'row', backgroundColor: WHITE, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: '#f1f5f9' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  viewBtnActive: { backgroundColor: '#f8fafc', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  viewBtnText: { fontSize: 11, fontWeight: '600', color: TEXT_GRAY },
  viewBtnTextActive: { color: TEXT_DARK },
  sortText: { fontSize: 11, color: TEXT_GRAY },
  sortTextBold: { fontWeight: '700', color: TEXT_DARK },

  jobList: { paddingHorizontal: 20, paddingBottom: 20 },
  jobCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  postedText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  editBtn: { padding: 4 },
  
  jobTitle: { fontSize: 16, fontWeight: '800', color: TEXT_DARK, marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  locationText: { fontSize: 12, color: TEXT_GRAY, marginLeft: 6 },

  jobStatsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  applicantsCol: { marginRight: 16, width: 80 },
  applicantsNumber: { fontSize: 24, fontWeight: '800', color: TEXT_DARK },
  applicantsLabel: { fontSize: 9, fontWeight: '700', color: TEXT_GRAY, letterSpacing: 0.5 },
  
  avatarsWrapper: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: WHITE },
  avatarMore: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0f172a', borderWidth: 2, borderColor: WHITE, justifyContent: 'center', alignItems: 'center' },
  avatarMoreText: { color: WHITE, fontSize: 9, fontWeight: '700' },
  
  miniChart: { flexDirection: 'row', alignItems: 'flex-end', height: 32, gap: 4 },
  chartBar: { width: 6, borderRadius: 3 },
  positionFilledText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  primaryActionBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  moreBtn: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },

  floatingContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 140 : 120, left: 20, right: 20, zIndex: 10, pointerEvents: 'box-none' },
  floatingTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addJobFloatingBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  msgPill: { backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  msgText: { color: WHITE, fontSize: 13, fontWeight: '600' },
  postNewJobBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 16, alignItems: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  postNewJobBtnText: { color: WHITE, fontSize: 14, fontWeight: '700' },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: WHITE, borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  navTextActive: { color: PRIMARY, fontWeight: '700' },

  analyticsContainer: { paddingHorizontal: 20 },
  analyticsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  analyticsTitle: { fontSize: 24, fontWeight: '800', color: TEXT_DARK },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 20 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  segmentBtnActive: { backgroundColor: WHITE, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  segmentBtnText: { fontSize: 13, fontWeight: '600', color: TEXT_GRAY },
  segmentBtnTextActive: { color: PRIMARY },

  timeFilters: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  timeFilterBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  timeFilterBtnActive: { backgroundColor: PRIMARY },
  timeFilterBtnText: { fontSize: 12, fontWeight: '600', color: TEXT_GRAY },
  timeFilterBtnTextActive: { color: WHITE, fontSize: 12, fontWeight: '600' },
  exportBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  exportIconBox: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },

  analyticsStats: { gap: 12, marginBottom: 24 },
  aStatCard: { backgroundColor: WHITE, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  aStatIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fdf4ff', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  aStatTextWrapper: { flex: 1 },
  aStatLabel: { fontSize: 10, fontWeight: '700', color: TEXT_GRAY, marginBottom: 4 },
  aStatValue: { fontSize: 20, fontWeight: '800', color: TEXT_DARK },
  aBadgeGreen: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  aBadgeGreenText: { color: '#16a34a', fontSize: 10, fontWeight: '700' },
  aBadgeRed: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  aBadgeRedText: { color: '#ef4444', fontSize: 10, fontWeight: '700' },

  aChartCard: { backgroundColor: WHITE, padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  aCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  aCardTitle: { fontSize: 16, fontWeight: '800', color: TEXT_DARK },
  aLegend: { flexDirection: 'row', gap: 12, marginTop: 4 },
  aLegendItem: { flexDirection: 'row', alignItems: 'center' },
  aLegendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  aLegendText: { fontSize: 9, fontWeight: '700', color: TEXT_GRAY },
  aChartWrapper: { marginTop: 10 },
  chartXAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 },
  xAxisLabel: { fontSize: 10, color: '#94a3b8' },

  sourceRow: { marginBottom: 16 },
  sourceTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sourceName: { fontSize: 12, fontWeight: '600', color: TEXT_DARK },
  sourcePct: { fontSize: 12, fontWeight: '700', color: PRIMARY },
  sourceBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4 },
  sourceBarFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 4 },
  viewSourceBtn: { marginTop: 8, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  viewSourceBtnText: { color: PRIMARY, fontSize: 12, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: '60%', maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: TEXT_DARK },
  closeBtn: { padding: 8 },
  modalScroll: { flex: 1 },
  applicantCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 12 },
  applicantMeta: { flex: 1 },
  applicantName: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  applicantContact: { fontSize: 12, color: TEXT_GRAY, marginTop: 4 },
  resumeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fdf4ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  resumeBtnText: { color: PRIMARY, fontSize: 12, fontWeight: '700' }
});
