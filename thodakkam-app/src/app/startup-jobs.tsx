import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, ActivityIndicator, Modal, Linking
} from 'react-native';
import {
  Search, Mail, Bell, Settings, Briefcase, Users, UserCheck, CheckCircle, Check,
  Calendar, MessageSquare, LayoutGrid, Plus,
  List as ListIcon, BarChart2, Edit2, MapPin, MoreHorizontal, X, ExternalLink, Clock
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import StartupHeader from '../components/StartupHeader';
import Svg, { Path, Circle } from 'react-native-svg';
import { globalNotificationStore } from '../utils/notificationStore';

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
  const [viewMode, setViewMode] = useState<'List' | 'Analytics' | 'Tracking' | 'CandidateDetail'>('List');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isCandidateModalVisible, setIsCandidateModalVisible] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [analyticsTime, setAnalyticsTime] = useState(30);
  const [globalCompanyLogo, setGlobalCompanyLogo] = useState<string | null>(null);
  const [activeStageView, setActiveStageView] = useState<string | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<any[]>([]);

  const companyName = (params.companyName as string) || 'Echo Digital';
  const jobToTrack = selectedJob || (jobs && jobs.length > 0 ? jobs[0] : null);

  useFocusEffect(
    React.useCallback(() => {
      fetchJobs();
    }, [companyName])
  );

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://thodakkam-backend.onrender.com/api/jobs/startup/${companyName}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
      }

      const profileRes = await fetch(`https://thodakkam-backend.onrender.com/api/startup/profile/${encodeURIComponent(companyName)}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success && profileData.startup?.companyLogo) {
          setGlobalCompanyLogo(profileData.startup.companyLogo);
        }
      }
    } catch (err) {
      console.error('Fetch Jobs Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    setActiveMenuId(null);
    const targetJob = jobs.find(j => j.id === jobId);
    
    // Optimistic UI update
    setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    
    try {
      const payload = targetJob ? { ...targetJob, status: newStatus } : { status: newStatus };
      const res = await fetch(`https://thodakkam-backend.onrender.com/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchJobs();
      }
    } catch (err) {
      console.error('Update Job Status Error:', err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    setActiveMenuId(null);
    // Optimistic UI update
    setJobs(prevJobs => prevJobs.filter(j => j.id !== jobId));

    try {
      const res = await fetch(`https://thodakkam-backend.onrender.com/api/jobs/${jobId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchJobs();
      }
    } catch (err) {
      console.error('Delete Job Error:', err);
    }
  };

  const getInitials = (name: string) => {
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toLowerCase();
    if (words.length === 1 && words[0].length >= 4) return words[0].substring(0, 4).toLowerCase();
    return name.substring(0, 2).toLowerCase();
  };

  const companyInitials = getInitials(companyName);

  const PIPELINE_STAGES = [
    { id: 'PENDING', label: 'Applied' },
    { id: 'SHORTLISTED', label: 'Shortlisted' },
    { id: 'MCQ_ROUND', label: 'MCQ Round' },
    { id: 'CODING_ROUND', label: 'Coding' },
    { id: 'INTERVIEW', label: 'Interview' },
    { id: 'SELECTED', label: 'Selected' }
  ];

  const rawStatus = (selectedCandidate?.status || 'PENDING').toUpperCase();
  let currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === rawStatus);
  if (currentStageIndex === -1) currentStageIndex = 0;

  useEffect(() => {
    if (selectedCandidate) {
      setActiveStageView(PIPELINE_STAGES[Math.min(currentStageIndex, PIPELINE_STAGES.length - 1)].id);
      
      // Fetch assessment results for this candidate
      if (selectedCandidate.userId && jobToTrack?.id) {
        fetch(`https://thodakkam-backend.onrender.com/api/assessment-results/${selectedCandidate.userId}/${jobToTrack.id}`)
          .then(async res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              return res.json();
            } else {
              throw new Error("Response is not JSON");
            }
          })
          .then(data => {
            if (data && data.success && data.results) {
              setAssessmentResults(data.results);
            }
          })
          .catch(err => {
            console.log('Assessment results API not yet deployed or error:', err.message);
          });
      }
    }
  }, [selectedCandidate]);

  const handleUpdateApplicationStatus = async (newStatus: string) => {
    if (!selectedCandidate) return;
    try {
      const res = await fetch(`https://thodakkam-backend.onrender.com/api/applications/${selectedCandidate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        if (newStatus === 'SELECTED' && selectedCandidate.userId && jobToTrack?.startupId) {
          globalNotificationStore.addNotification({
            title: `Selected for ${jobToTrack.title}`,
            description: `Congratulations! You have been selected for the ${jobToTrack.title} role at ${companyName}.`,
            type: 'success',
            targetRole: 'student'
          });
        }
        setSelectedCandidate({ ...selectedCandidate, status: newStatus });
        fetchJobs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavPress = (label: string) => {
    setActiveTab(label);
    if (label === 'Dashboard') {
      router.navigate({ pathname: '/startup-dashboard' as any, params: { companyName } });
    } else if (label === 'Candidates') {
      router.navigate({ pathname: '/startup-candidates' as any, params: { companyName } });
    } else if (label === 'Interviews') {
      router.navigate({ pathname: '/startup-interviews' as any, params: { companyName } });
    } else if (label === 'Community') {
      router.navigate({ pathname: '/startup-community' as any, params: { companyName } });
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

  const handleOpenResume = (app: any) => {
    // Check if the application itself has a valid base64 resume
    if (app?.resumeUrl && app.resumeUrl.startsWith('data:')) {
      Linking.openURL(app.resumeUrl).catch(err => console.error("Couldn't load page", err));
      return;
    }
    // Fallback: If resumeUrl is just a filename (missing on backend), try the user's profile resume
    if (app?.user?.resumeFile && app.user.resumeFile.startsWith('data:')) {
      Linking.openURL(app.user.resumeFile).catch(err => console.error("Couldn't load page", err));
      return;
    }
    // Final fallback: try to load it from the backend uploads folder
    if (app?.resumeUrl) {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      const fullUrl = app.resumeUrl.startsWith('http') ? app.resumeUrl : `${baseUrl}/uploads/${app.resumeUrl.split(/[/\\]/).pop()}`;
      Linking.openURL(fullUrl).catch(err => console.error("Couldn't load page", err));
    } else {
      alert("No resume available for this candidate.");
    }
  };

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
                  onPress={() => setViewMode('Tracking')}
                >
                  <BarChart2 size={14} color={TEXT_GRAY} style={{ marginRight: 6 }} />
                  <Text style={styles.viewBtnText}>Tracking</Text>
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
                  <View key={job.id} style={[styles.jobCard, { zIndex: activeMenuId === job.id ? 100 : 1 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                      <View style={[styles.jobCardLogo, (job.companyLogo || globalCompanyLogo) && { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#e2e8f0' }]}>
                        {(job.companyLogo || globalCompanyLogo) ? (
                          <Image 
                            source={{ uri: (job.companyLogo || globalCompanyLogo) as string }} 
                            style={{ width: '100%', height: '100%', borderRadius: 8 }} 
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.jobCardLogoText}>{companyInitials.toUpperCase()}</Text>
                        )}
                      </View>
                      
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                          <Text style={styles.jobTitle}>{job.title}</Text>
                          <View style={[styles.badge, { backgroundColor: job.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9' }]}>
                            <Text style={[styles.badgeText, { color: job.status === 'ACTIVE' ? '#16a34a' : TEXT_GRAY }]}>{job.status}</Text>
                          </View>
                        </View>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Calendar size={12} color={TEXT_GRAY} />
                            <Text style={styles.jobCardMetaText}>Posted recently</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MapPin size={12} color={TEXT_GRAY} />
                            <Text style={styles.jobCardMetaText}>{job.location}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} color={TEXT_GRAY} />
                            <Text style={styles.jobCardMetaText}>{job.type || 'Full-time'}</Text>
                          </View>
                        </View>
                      </View>

                      {job.status === 'ACTIVE' && (
                        <View style={styles.daysLeftPill}>
                          <Clock size={10} color="#ea580c" />
                          <Text style={styles.daysLeftText}>Live</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.statLabel}>APPLICANTS</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.statValue}>{job.applications?.length || 0}</Text>
                          <Text style={styles.statTrend}>↗ +0 today</Text>
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.statLabel}>INTERVIEWS</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} color={PRIMARY} />
                          <Text style={styles.statValueSmall}>0 scheduled</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity 
                        style={[styles.primaryActionBtn, { backgroundColor: PRIMARY, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }]}
                        onPress={() => {
                          setSelectedJob(job);
                          setViewMode('Tracking');
                        }}
                      >
                        <Text style={[styles.actionBtnText, { color: WHITE }]}>View Applicants</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.outlineActionBtn}
                        onPress={() => {
                          router.push({
                            pathname: '/startup-job-details' as any,
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
                        <Text style={styles.outlineActionBtnText}>View Details</Text>
                      </TouchableOpacity>

                      <View style={{ position: 'relative', zIndex: 100 }}>
                        <TouchableOpacity 
                          style={styles.moreBtn}
                          onPress={() => setActiveMenuId(activeMenuId === job.id ? null : job.id)}
                        >
                          <MoreHorizontal size={18} color={TEXT_GRAY} />
                        </TouchableOpacity>

                        {activeMenuId === job.id && (
                          <View style={styles.dropdownMenu}>
                            <TouchableOpacity 
                              style={styles.dropdownItem}
                              onPress={() => {
                                setActiveMenuId(null);
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
                              <Text style={styles.dropdownItemText}>Edit Job</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.dropdownItem}
                              onPress={() => handleUpdateStatus(job.id, 'DRAFT')}
                            >
                              <Text style={styles.dropdownItemText}>Move to Draft</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.dropdownItem}
                              onPress={() => handleUpdateStatus(job.id, 'CLOSED')}
                            >
                              <Text style={styles.dropdownItemText}>Close Job</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.dropdownItem}
                              onPress={() => handleDeleteJob(job.id)}
                            >
                              <Text style={[styles.dropdownItemText, { color: '#ef4444' }]}>Delete Job</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        ) : viewMode === 'Tracking' ? (
          jobToTrack ? (
            <View style={{ paddingHorizontal: 20, paddingBottom: 40, marginTop: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: TEXT_DARK, marginBottom: 4 }}>Job Management</Text>
            <Text style={{ fontSize: 13, color: TEXT_GRAY, marginBottom: 20 }}>Review listings and track candidate journey across hiring stages.</Text>

            <View style={{ backgroundColor: WHITE, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <TouchableOpacity onPress={() => setViewMode('List')}>
                  <Text style={{ fontSize: 12, color: TEXT_GRAY, fontWeight: '600' }}>Jobs  <Text style={{ color: '#cbd5e1' }}>{'>'}</Text>  </Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 12, color: TEXT_DARK, fontWeight: '600' }}>Tracking</Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <View>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_DARK, marginBottom: 4 }}>{jobToTrack.title}</Text>
                  <Text style={{ fontSize: 11, color: TEXT_GRAY }}>ID: {jobToTrack.id}</Text>
                </View>
                <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: '#16a34a', fontSize: 10, fontWeight: '800' }}>ACTIVE</Text>
                </View>
              </View>

              {/* Filters ScrollView */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={styles.tFilterPill}><Briefcase size={14} color={TEXT_GRAY} /><Text style={styles.tFilterText}>{jobToTrack.title}</Text></View>
                  <View style={styles.tFilterPill}><Text style={styles.tFilterText}>All Stages</Text></View>
                  <View style={styles.tFilterPill}><Text style={styles.tFilterText}>All Status</Text></View>
                  <View style={styles.tFilterPill}><Text style={styles.tFilterText}>mm/dd/yyyy</Text><Calendar size={14} color={TEXT_GRAY} /></View>
                  <View style={styles.tFilterPill}><Text style={styles.tFilterText}>mm/dd/yyyy</Text><Calendar size={14} color={TEXT_GRAY} /></View>
                  <TouchableOpacity><Text style={{ color: TEXT_DARK, fontSize: 12, fontWeight: '600', marginLeft: 8 }}>Clear Filters</Text></TouchableOpacity>
                </View>
              </ScrollView>

              {/* 4 Cards */}
              <View style={styles.trackingGrid}>
                {/* Total Applicants */}
                <View style={[styles.trackingCard, { borderColor: '#bfdbfe' }]}>
                  <View style={[styles.trackingIconBox, { backgroundColor: '#eff6ff' }]}>
                    <Users size={18} color="#3b82f6" />
                  </View>
                  <Text style={styles.trackingLabel}>TOTAL APPLICANTS</Text>
                  <Text style={styles.trackingValue}>{jobToTrack.applications?.length || 0}</Text>
                  <Text style={[styles.trackingSubtext, { color: '#3b82f6' }]}>+{(jobToTrack.applications?.length || 0) > 0 ? 1 : 0} this week</Text>
                </View>

                {/* Shortlisted */}
                <View style={[styles.trackingCard, { borderColor: '#fef08a' }]}>
                  <View style={[styles.trackingIconBox, { backgroundColor: '#fefce8' }]}>
                    <UserCheck size={18} color="#eab308" />
                  </View>
                  <Text style={styles.trackingLabel}>SHORTLISTED</Text>
                  <Text style={styles.trackingValue}>0</Text>
                  <Text style={[styles.trackingSubtext, { color: '#eab308' }]}>+0 this week</Text>
                </View>

                {/* Interviews Scheduled */}
                <View style={[styles.trackingCard, { borderColor: '#e9d5ff' }]}>
                  <View style={[styles.trackingIconBox, { backgroundColor: '#faf5ff' }]}>
                    <Calendar size={18} color="#a855f7" />
                  </View>
                  <Text style={styles.trackingLabel}>INTERVIEWS SCHEDULED</Text>
                  <Text style={styles.trackingValue}>0</Text>
                  <Text style={[styles.trackingSubtext, { color: '#a855f7' }]}>+0 this week</Text>
                </View>

                {/* Selected */}
                <View style={[styles.trackingCard, { borderColor: '#bbf7d0' }]}>
                  <View style={[styles.trackingIconBox, { backgroundColor: '#f0fdf4' }]}>
                    <CheckCircle size={18} color="#22c55e" />
                  </View>
                  <Text style={styles.trackingLabel}>SELECTED</Text>
                  <Text style={styles.trackingValue}>0</Text>
                  <Text style={[styles.trackingSubtext, { color: '#22c55e' }]}>+0 this week</Text>
                </View>
              </View>

              {/* Applicant List */}
              <View>
                {!jobToTrack?.applications || jobToTrack.applications.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: TEXT_GRAY, marginTop: 20 }}>No applicants yet.</Text>
                ) : (
                  jobToTrack.applications.map((app: any) => (
                    <TouchableOpacity 
                      key={app.id} 
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 12, marginBottom: 12, backgroundColor: WHITE }}
                      onPress={() => {
                        setSelectedCandidate(app);
                        setViewMode('CandidateDetail');
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                        {app.user?.profilePhoto ? (
                          <Image source={{ uri: app.user.profilePhoto }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_GRAY }}>
                            {app.fullName ? app.fullName.charAt(0).toUpperCase() : 'U'}
                          </Text>
                        )}
                      </View>
                      
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: TEXT_DARK }} numberOfLines={1}>{app.fullName}</Text>
                        <Text style={{ fontSize: 12, color: TEXT_GRAY }} numberOfLines={1}>{app.email}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1.2 }}>
                        <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                          <Text style={{ color: '#3b82f6', fontSize: 10, fontWeight: '600' }}>MCQ Round</Text>
                        </View>
                        <View style={{ borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                          <Text style={{ color: TEXT_DARK, fontSize: 10, fontWeight: '600' }}>Round 1/1</Text>
                        </View>
                        <Text style={{ fontSize: 11, color: TEXT_DARK, fontWeight: '600', marginLeft: 4 }}>
                          {new Date(app.appliedAt || Date.now()).toLocaleDateString()}
                        </Text>
                        <View style={{ backgroundColor: '#dbeafe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ color: '#2563eb', fontSize: 9, fontWeight: '800' }}>NEW</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          </View>
          ) : (
            <Text style={{ textAlign: 'center', color: TEXT_GRAY, marginTop: 40 }}>No jobs available to track.</Text>
          )
        ) : viewMode === 'CandidateDetail' && selectedCandidate ? (
          <View style={{ paddingHorizontal: 20, paddingBottom: 40, marginTop: 20 }}>
            {/* Back button */}
            <TouchableOpacity 
              style={{ alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: WHITE, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
              onPress={() => setViewMode('Tracking')}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: TEXT_DARK }}>{'<  Back to Tracking'}</Text>
            </TouchableOpacity>

            {/* Header Card */}
            <View style={{ backgroundColor: WHITE, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                     {selectedCandidate.user?.profilePhoto ? (
                        <Image source={{ uri: selectedCandidate.user.profilePhoto }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
                      ) : (
                        <Text style={{ fontSize: 20, fontWeight: '700', color: PRIMARY }}>
                          {selectedCandidate.fullName ? selectedCandidate.fullName.charAt(0).toUpperCase() : 'U'}
                        </Text>
                      )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_DARK, marginBottom: 4 }}>{selectedCandidate.fullName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <Text style={{ fontSize: 12, color: TEXT_GRAY }}>✉ {selectedCandidate.email}</Text>
                      <Text style={{ fontSize: 12, color: TEXT_GRAY }}>📞 {selectedCandidate.phone || '—'}</Text>
                      <Text style={{ fontSize: 12, color: TEXT_GRAY }}>📍 {selectedCandidate.user?.location || 'Salem, India'}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                  <Text style={{ color: PRIMARY, fontSize: 11, fontWeight: '700' }}>MCQ Round</Text>
                </View>
              </View>
            </View>

            {/* Stage Details */}
            {(() => {
              const activeStage = PIPELINE_STAGES.find(s => s.id === activeStageView) || PIPELINE_STAGES[Math.min(currentStageIndex, PIPELINE_STAGES.length - 1)];
              const resultData = assessmentResults.find(r => r.roundType === activeStage.id) || null;
              const activeIdx = PIPELINE_STAGES.findIndex(s => s.id === activeStage.id);
              const isPastStage = activeIdx < currentStageIndex;
              const isCurrentStage = activeIdx === currentStageIndex;
              
              let statusLabel = 'Not Started';
              let statusColor = '#94a3b8';
              let statusBg = '#f1f5f9';

              if (resultData?.status === 'PASSED') {
                statusLabel = 'Passed';
                statusColor = '#22c55e';
                statusBg = '#dcfce7';
              } else if (resultData?.status === 'FAILED') {
                statusLabel = 'Failed';
                statusColor = '#ef4444';
                statusBg = '#fee2e2';
              } else if (isPastStage) {
                statusLabel = 'Completed';
                statusColor = '#22c55e';
                statusBg = '#dcfce7';
              } else if (isCurrentStage) {
                statusLabel = 'In Progress';
                statusColor = '#a855f7';
                statusBg = '#f3e8ff';
              }

              return (
                <View style={{ backgroundColor: WHITE, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 4, borderLeftColor: PRIMARY, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 16, marginRight: 8 }}>📝</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT_DARK }}>Stage Details — {activeStage.label}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Click any pipeline stage below to explore its details.</Text>
                  
                  <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                    <View style={{ flex: 1, minWidth: 90, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fafaf9' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 8 }}>SCORE</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: TEXT_DARK }}>{resultData?.score !== null && resultData?.score !== undefined ? `${resultData.score}%` : '—'}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 90, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fafaf9' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 8 }}>STATUS</Text>
                      <View style={{ alignSelf: 'flex-start', backgroundColor: statusBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ color: statusColor, fontSize: 11, fontWeight: '700' }}>{statusLabel}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1, minWidth: 100, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fafaf9' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 8 }}>COMPLETED ON</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: TEXT_DARK }}>
                        {resultData?.completedAt ? new Date(resultData.completedAt).toLocaleDateString() : '—'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })()}

            {/* Application Pipeline */}
            <View style={{ backgroundColor: WHITE, borderRadius: 12, paddingVertical: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT_DARK, marginBottom: 30, paddingHorizontal: 20 }}>Application Pipeline</Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 10 }}>
                  {PIPELINE_STAGES.map((stage, index) => {
                    const isCompleted = currentStageIndex > index;
                    const isCurrent = currentStageIndex === index;
                    
                    return (
                      <React.Fragment key={stage.id}>
                        {/* Node */}
                        <TouchableOpacity 
                          style={{ alignItems: 'center', width: 64, opacity: activeStageView === stage.id ? 1 : 0.8 }}
                          onPress={() => setActiveStageView(stage.id)}
                        >
                          <View style={{ height: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                            {isCompleted ? (
                              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: WHITE, borderWidth: 2, borderColor: '#22c55e', justifyContent: 'center', alignItems: 'center', shadowColor: activeStageView === stage.id ? '#22c55e' : 'transparent', shadowOpacity: 0.5, shadowRadius: 4 }}>
                                <Check size={14} color="#22c55e" />
                              </View>
                            ) : isCurrent ? (
                              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#fdf4ff', borderWidth: 2, borderColor: '#a855f7', justifyContent: 'center', alignItems: 'center', shadowColor: activeStageView === stage.id ? '#a855f7' : 'transparent', shadowOpacity: 0.5, shadowRadius: 4 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#a855f7' }} />
                              </View>
                            ) : (
                              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: WHITE, borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }} />
                            )}
                          </View>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: isCompleted ? '#22c55e' : isCurrent ? '#a855f7' : '#94a3b8', textAlign: 'center' }}>{stage.label}</Text>
                        </TouchableOpacity>

                        {/* Connecting Line */}
                        {index < PIPELINE_STAGES.length - 1 && (
                          <View style={{ width: 40, height: 2, backgroundColor: isCompleted ? '#22c55e' : '#e2e8f0', marginTop: 13, marginHorizontal: -4, zIndex: -1 }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Stage Actions */}
            <View style={{ backgroundColor: WHITE, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: TEXT_DARK, marginBottom: 16 }}>Stage Actions</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                {selectedCandidate?.status === 'REJECTED' ? (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#ef4444' }}>Candidate Rejected</Text>
                ) : selectedCandidate?.status === 'SELECTED' ? (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#22c55e' }}>Candidate Selected!</Text>
                ) : (
                  <>
                    {currentStageIndex < PIPELINE_STAGES.length - 2 && (
                      <TouchableOpacity 
                        style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: PRIMARY }}
                        onPress={() => handleUpdateApplicationStatus(PIPELINE_STAGES[currentStageIndex + 1].id)}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: WHITE }}>Move to {PIPELINE_STAGES[currentStageIndex + 1].label}</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#22c55e' }}
                      onPress={() => handleUpdateApplicationStatus('SELECTED')}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: WHITE }}>Select Candidate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ef4444', backgroundColor: WHITE }}
                      onPress={() => handleUpdateApplicationStatus('REJECTED')}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>Reject</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <Text style={{ fontSize: 11, color: '#94a3b8' }}>Update the pipeline status or reject the candidate entirely.</Text>
            </View>

          </View>
        ) : null}
      </ScrollView>



      {/* Floating Elements */}
      <View style={styles.floatingContainer}>
        <View style={styles.floatingTopRow}>
          {viewMode === 'Analytics' && (
            <TouchableOpacity style={styles.addJobFloatingBtn}>
              <Plus size={20} color={WHITE} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />

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

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12, position: 'relative', zIndex: 50 },
  primaryActionBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  outlineActionBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', backgroundColor: WHITE },
  outlineActionBtnText: { fontSize: 13, fontWeight: '700', color: TEXT_DARK },
  moreBtn: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE },
  
  dropdownMenu: { position: 'absolute', top: 50, right: 0, width: 140, backgroundColor: WHITE, borderRadius: 12, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10, zIndex: 999 },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 16 },
  dropdownItemText: { fontSize: 13, fontWeight: '600', color: TEXT_DARK },

  jobCardLogo: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  jobCardLogoText: { color: WHITE, fontSize: 16, fontWeight: '800' },
  jobCardMetaText: { fontSize: 11, color: TEXT_GRAY },
  daysLeftPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ffedd5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  daysLeftText: { fontSize: 10, fontWeight: '700', color: '#ea580c' },
  
  statLabel: { fontSize: 9, fontWeight: '700', color: TEXT_GRAY, letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: TEXT_DARK },
  statValueSmall: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  statTrend: { fontSize: 11, fontWeight: '700', color: '#16a34a' },

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

  tFilterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  tFilterText: { fontSize: 11, color: TEXT_DARK, fontWeight: '500' },

  trackingGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
  trackingCard: { 
    width: '48%', backgroundColor: WHITE, padding: 16, borderRadius: 12, 
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 
  },
  trackingIconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  trackingLabel: { fontSize: 10, fontWeight: '700', color: TEXT_GRAY, marginBottom: 4 },
  trackingValue: { fontSize: 24, fontWeight: '800', color: TEXT_DARK, marginBottom: 8 },
  trackingSubtext: { fontSize: 10, fontWeight: '700' },

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
