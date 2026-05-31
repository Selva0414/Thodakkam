import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, TextInput, Image, Linking, ActivityIndicator, Alert
} from 'react-native';
import {
  Briefcase, Users, Calendar, LayoutGrid, Search, Bell, Settings, Mail, MapPin, ChevronLeft, ChevronRight, Plus, Video, Building2, CheckCircle2, Circle, MessageSquare, ArrowRight, ArrowLeft, X
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { globalNotificationStore } from '../utils/notificationStore';

const PRIMARY = '#662483';
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function StartupInterviews() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string) || 'Echo Digital';
  const candidateName = (params.candidateName as string) || 'M.S.Dhoni';
  const jobTitle = (params.jobTitle as string) || 'Senior Full-stack Engineer';
  const resumeUrl = params.resumeUrl as string;

  const [activeTab, setActiveTab] = useState('Interviews');
  
  // Dynamic Calendar State
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    // Default to today
    const now = new Date();
    return now.toDateString();
  });
  const [selectedSlot, setSelectedSlot] = useState('10:30 AM - 11:30 AM');
  const [selectedPlatform, setSelectedPlatform] = useState('google_meet');
  
  // Interview Type Dropdown State
  const [selectedInterviewType, setSelectedInterviewType] = useState('Technical Interview (Round 1)');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const interviewTypes = [
    'Technical Interview (Round 1)',
    'Technical Interview (Round 2)',
    'HR Interview (Round 3)',
    'Final Interview (Round 4)'
  ];

  // Interviewers State
  const [interviewers, setInterviewers] = useState<{name: string, color: string}[]>([
    { name: 'Boopathy', color: '#3b82f6' },
    { name: 'Gokul', color: '#f97316' }
  ]);
  const [isAddingInterviewer, setIsAddingInterviewer] = useState(false);
  const [newInterviewerName, setNewInterviewerName] = useState('');

  // API State
  const [isScheduling, setIsScheduling] = useState(false);
  const candidateId = params.candidateId as string;

  const handleNavPress = (label: string) => {
    setActiveTab(label);
    if (label === 'Dashboard') {
      router.replace({ pathname: '/startup-dashboard' as any, params: { companyName } });
    } else if (label === 'Jobs') {
      router.replace({ pathname: '/startup-jobs' as any, params: { companyName } });
    } else if (label === 'Candidates') {
      router.replace({ pathname: '/startup-candidates' as any, params: { companyName } });
    } else if (label === 'Community') {
      router.replace({ pathname: '/startup-community' as any, params: { companyName } });
    }
  };

  // Dynamic Date Generation
  const getWeekDays = () => {
    const baseDate = new Date();
    // Go to current week + offset
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    
    // Find Sunday of this week
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day;
    const sunday = new Date(baseDate.setDate(diff));

    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(sunday);
      nextDay.setDate(sunday.getDate() + i);
      week.push(nextDay);
    }
    return week;
  };

  const weekDays = getWeekDays();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = monthNames[weekDays[0].getMonth()];
  const currentYear = weekDays[0].getFullYear();
  const formattedMonthYear = `${currentMonthName} ${currentYear}`;

  const slots = [
    '09:00 AM - 10:00 AM',
    '10:30 AM - 11:30 AM',
    '01:00 PM - 02:00 PM',
    '02:30 PM - 03:30 PM',
    '04:00 PM - 05:00 PM',
  ];

  const handleRemoveInterviewer = (index: number) => {
    setInterviewers(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddInterviewer = () => {
    if (newInterviewerName.trim() === '') return;
    const colors = ['#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setInterviewers(prev => [...prev, { name: newInterviewerName.trim(), color: randomColor }]);
    setNewInterviewerName('');
    setIsAddingInterviewer(false);
  };

  const handleSchedule = async () => {
    if (!candidateId) return;
    setIsScheduling(true);
    try {
      const response = await fetch(`http://localhost:5000/api/applications/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INTERVIEW SCHEDULED' })
      });
      if (response.ok) {
        if (Platform.OS === 'web') {
          alert('Interview Scheduled Successfully!');
        } else {
          Alert.alert('Success', 'Interview Scheduled Successfully!');
        }

        // Notify the student
        globalNotificationStore.addNotification({
          title: `Interview Scheduled: ${jobTitle}`,
          description: `${companyName} has scheduled an interview with you for the ${jobTitle} position on ${selectedDateStr} at ${selectedSlot}.`,
          type: 'success',
          targetRole: 'student'
        });

        router.back();
      } else {
        throw new Error('Failed to schedule');
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') {
        alert('Error scheduling interview');
      } else {
        Alert.alert('Error', 'Could not schedule interview.');
      }
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Header */}
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
        
        {/* Candidate Info Card */}
        <View style={styles.candidateCard}>
          <View style={styles.avatarWrap}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?u=' + candidateName }} 
              style={styles.avatarImg} 
            />
          </View>
          <Text style={styles.candidateName}>{candidateName}</Text>
          <Text style={styles.jobTitle}>{jobTitle}</Text>
          <View style={styles.locationRow}>
            <MapPin size={12} color="#94a3b8" />
            <Text style={styles.locationText}>Los Angeles, CA</Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.viewCvBtn}
              onPress={() => resumeUrl ? Linking.openURL(resumeUrl) : null}
            >
              <Text style={styles.viewCvText}>View CV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.portfolioBtn}>
              <Text style={styles.portfolioText}>Portfolio</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Picker */}
        <View style={styles.calendarCard}>
          <View style={styles.calHeader}>
            <Text style={styles.monthText}>{formattedMonthYear}</Text>
            <View style={styles.calNav}>
              <TouchableOpacity onPress={() => setWeekOffset(prev => prev - 1)}>
                <ChevronLeft size={20} color={TEXT_GRAY} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setWeekOffset(prev => prev + 1)}>
                <ChevronRight size={20} color={TEXT_GRAY} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.daysRow}>
            {weekDays.map((d, i) => {
              const isSelected = d.toDateString() === selectedDateStr;
              const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
              return (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.dayItem, isSelected && styles.dayItemSelected]}
                  onPress={() => setSelectedDateStr(d.toDateString())}
                >
                  <Text style={[styles.dayName, isSelected && { color: WHITE }]}>{dayName}</Text>
                  <Text style={[styles.dayNum, isSelected && { color: WHITE }]}>{d.getDate()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Meeting Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Meeting Details</Text>
          
          <Text style={styles.label}>Interview Type</Text>
          <View style={{ zIndex: 10 }}>
            <TouchableOpacity 
              style={[styles.dropdownInput, isDropdownOpen && { marginBottom: 10 }]}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Text style={styles.dropdownText}>{selectedInterviewType}</Text>
              <ChevronRight size={16} color={TEXT_GRAY} style={{ transform: [{ rotate: isDropdownOpen ? '-90deg' : '90deg' }] }} />
            </TouchableOpacity>
            
            {isDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {interviewTypes.map((type, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.dropdownItem,
                      index === interviewTypes.length - 1 && { borderBottomWidth: 0 },
                      selectedInterviewType === type && { backgroundColor: '#f8fafc' }
                    ]}
                    onPress={() => {
                      setSelectedInterviewType(type);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, selectedInterviewType === type && { color: PRIMARY, fontWeight: '700' }]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.label}>Interviewers</Text>
          <View style={styles.interviewersWrapper}>
            {interviewers.map((inv, index) => (
              <View key={index} style={styles.interviewerPill}>
                <View style={[styles.dot, { backgroundColor: inv.color }]} />
                <Text style={styles.interviewerName}>{inv.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveInterviewer(index)}>
                  <X size={12} color={TEXT_GRAY} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            ))}
            
            {isAddingInterviewer ? (
              <View style={[styles.interviewerPill, { paddingVertical: 4 }]}>
                <TextInput 
                  style={{ fontSize: 12, padding: 0, minWidth: 80 }}
                  placeholder="Name..."
                  autoFocus
                  value={newInterviewerName}
                  onChangeText={setNewInterviewerName}
                  onSubmitEditing={handleAddInterviewer}
                  onBlur={() => setIsAddingInterviewer(false)}
                />
              </View>
            ) : (
              <TouchableOpacity style={styles.addInterviewerBtn} onPress={() => setIsAddingInterviewer(true)}>
                <Plus size={12} color={PRIMARY} />
                <Text style={styles.addInterviewerText}>Add Interviewer</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>Meeting Platform</Text>
          <View style={styles.platformsWrapper}>
            <TouchableOpacity 
              style={[styles.platformOption, selectedPlatform === 'google_meet' && styles.platformOptionSelected]}
              onPress={() => setSelectedPlatform('google_meet')}
            >
              {selectedPlatform === 'google_meet' ? (
                <View style={styles.radioSelected}><View style={styles.radioInner} /></View>
              ) : (
                <View style={styles.radioUnselected} />
              )}
              <Video size={16} color={selectedPlatform === 'google_meet' ? TEXT_DARK : TEXT_GRAY} />
              <Text style={[styles.platformText, selectedPlatform === 'google_meet' && styles.platformTextSelected]}>Google Meet</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.platformOption, selectedPlatform === 'office' && styles.platformOptionSelected]}
              onPress={() => setSelectedPlatform('office')}
            >
              {selectedPlatform === 'office' ? (
                <View style={styles.radioSelected}><View style={styles.radioInner} /></View>
              ) : (
                <View style={styles.radioUnselected} />
              )}
              <Building2 size={16} color={selectedPlatform === 'office' ? TEXT_DARK : TEXT_GRAY} />
              <Text style={[styles.platformText, selectedPlatform === 'office' && styles.platformTextSelected]}>Office Room 4B</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Slots */}
        <View style={styles.slotsCard}>
          <Text style={styles.sectionTitle}>Available Slots</Text>
          <Text style={styles.slotsSub}>Thursday, Oct 5th</Text>

          <View style={styles.slotsList}>
            {slots.map((slot, i) => {
              const isSelected = slot === selectedSlot;
              return (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.slotItem, isSelected && styles.slotItemSelected]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>{slot}</Text>
                  {isSelected && <CheckCircle2 size={16} color={TEXT_DARK} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.timezoneText}>All times are shown in your local timezone (PST)</Text>
        </View>

      </ScrollView>

      {/* Floating Bottom Actions */}
      <View style={styles.floatingActionsWrapper}>
        <View style={styles.floatingActions}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={16} color={TEXT_DARK} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          
          <Text style={styles.saveDraftText}>Save Draft</Text>
          
          <TouchableOpacity style={styles.nextBtn} onPress={handleSchedule} disabled={isScheduling}>
            {isScheduling ? (
              <ActivityIndicator size="small" color={WHITE} />
            ) : (
              <>
                <Text style={styles.nextBtnText}>Schedule Interview</Text>
                <ArrowRight size={16} color={WHITE} />
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.fabRow}>
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
  scrollContent: { paddingBottom: 220, backgroundColor: BG, padding: 20 },
  
  candidateCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatarWrap: { width: 72, height: 72, borderRadius: 20, overflow: 'hidden', marginBottom: 12 },
  avatarImg: { width: '100%', height: '100%' },
  candidateName: { fontSize: 18, fontWeight: '800', color: TEXT_DARK, marginBottom: 4 },
  jobTitle: { fontSize: 13, color: TEXT_GRAY, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  locationText: { fontSize: 11, color: '#94a3b8' },
  actionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  viewCvBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  viewCvText: { fontSize: 13, fontWeight: '700', color: TEXT_DARK },
  portfolioBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  portfolioText: { fontSize: 13, fontWeight: '700', color: TEXT_DARK },

  calendarCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthText: { fontSize: 16, fontWeight: '800', color: TEXT_DARK },
  calNav: { flexDirection: 'row', gap: 12 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayItem: { alignItems: 'center', justifyContent: 'center', width: 46, height: 64, borderRadius: 16 },
  dayItemSelected: { backgroundColor: PRIMARY },
  dayName: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginBottom: 4 },
  dayNum: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },

  detailsCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: TEXT_DARK, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: TEXT_GRAY, marginBottom: 8 },
  dropdownInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 10, padding: 14, marginBottom: 20 },
  dropdownText: { fontSize: 13, color: TEXT_DARK, fontWeight: '500' },
  dropdownMenu: { backgroundColor: WHITE, borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 10, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 4 } },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemText: { fontSize: 13, color: TEXT_DARK, fontWeight: '500' },
  
  interviewersWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  interviewerPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  interviewerName: { fontSize: 12, fontWeight: '600', color: TEXT_DARK },
  addInterviewerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdf4ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  addInterviewerText: { fontSize: 12, fontWeight: '600', color: PRIMARY, marginLeft: 4 },

  platformsWrapper: { gap: 12 },
  platformOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9' },
  platformOptionSelected: { borderColor: PRIMARY, backgroundColor: WHITE },
  radioSelected: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: PRIMARY, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY },
  radioUnselected: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#cbd5e1', marginRight: 12 },
  platformText: { fontSize: 13, fontWeight: '600', color: TEXT_GRAY, marginLeft: 8 },
  platformTextSelected: { color: TEXT_DARK },

  slotsCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  slotsSub: { fontSize: 12, color: TEXT_GRAY, marginBottom: 16, marginTop: -12 },
  slotsList: { gap: 12 },
  slotItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  slotItemSelected: { borderColor: TEXT_DARK, backgroundColor: WHITE },
  slotText: { fontSize: 13, fontWeight: '600', color: TEXT_GRAY },
  slotTextSelected: { color: TEXT_DARK, fontWeight: '700' },
  timezoneText: { textAlign: 'center', fontSize: 10, color: '#94a3b8', marginTop: 20 },

  floatingActionsWrapper: { position: 'absolute', bottom: Platform.OS === 'ios' ? 90 : 70, left: 0, right: 0, paddingHorizontal: 20, pointerEvents: 'box-none' },
  floatingActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: WHITE, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, marginBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8 },
  backBtnText: { fontSize: 12, fontWeight: '700', color: TEXT_DARK },
  saveDraftText: { fontSize: 12, fontWeight: '700', color: TEXT_DARK },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#5b21b6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  nextBtnText: { fontSize: 13, fontWeight: '700', color: WHITE },

  fabRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  messageFab: { backgroundColor: '#5b21b6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  messageFabText: { color: WHITE, fontSize: 14, fontWeight: '700' },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: WHITE, borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  navTextActive: { color: PRIMARY, fontWeight: '700' },
});
