import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, TextInput
} from 'react-native';
import {
  Menu, Search, Briefcase, Users, Calendar, LayoutGrid, MessageSquare, 
  Eye, UploadCloud, Key, Lightbulb, TrendingUp, GraduationCap,
  CheckCircle2, AlertTriangle, XCircle, Clock
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const PRIMARY = '#662483';
const BG = '#ffffff';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';
const SUCCESS = '#22c55e';
const WARNING = '#f59e0b';
const DANGER = '#ef4444';

export default function StartupAiAnalyzer() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string) || 'Company';

  const [activeTab, setActiveTab] = useState('Candidates');

  const handleNavPress = (label: string) => {
    setActiveTab(label);
    if (label === 'Home') router.replace({ pathname: '/startup-dashboard' as any, params: { companyName } });
    else if (label === 'Jobs') router.replace({ pathname: '/startup-jobs' as any, params: { companyName } });
    else if (label === 'Candidates') router.replace({ pathname: '/startup-candidates' as any, params: { companyName } });
    else if (label === 'Interviews') router.replace({ pathname: '/startup-interviews' as any, params: { companyName } });
    else if (label === 'Feed') router.replace({ pathname: '/startup-community' as any, params: { companyName } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View style={styles.companyInfo}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>{companyName.substring(0, 3).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.companyNameText}>{companyName}</Text>
              <Text style={styles.premiumText}>PREMIUM PLAN</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity><MessageSquare size={20} color={TEXT_GRAY} /></TouchableOpacity>
            <TouchableOpacity><Users size={20} color={TEXT_GRAY} /></TouchableOpacity>
            <TouchableOpacity><LayoutGrid size={20} color={TEXT_GRAY} /></TouchableOpacity>
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
        
        {/* Target Job Role Header */}
        <View style={styles.roleHeader}>
          <Text style={styles.sectionLabel}>TARGET JOB ROLE</Text>
          <TouchableOpacity style={styles.viewResumeBtn}>
            <Eye size={14} color={TEXT_DARK} style={{ marginRight: 6 }} />
            <Text style={styles.viewResumeText}>View Resume</Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Box */}
        <View style={styles.dropdownBox}>
          <Briefcase size={16} color={TEXT_GRAY} />
          <Text style={styles.dropdownText}>Senior Frontend Engineer (React/TypeScript)</Text>
          <Text style={{ marginLeft: 'auto', color: TEXT_GRAY }}>⌄</Text>
        </View>

        {/* Upload Box */}
        <View style={styles.uploadBox}>
          <View style={styles.uploadIconWrap}>
            <UploadCloud size={24} color={PRIMARY} />
          </View>
          <Text style={styles.uploadTitle}>Upload Resume</Text>
          <Text style={styles.uploadSub}>Drag and drop PDF or DOCX (Max 5MB)</Text>
          <TouchableOpacity style={styles.selectFileBtn}>
            <Text style={styles.selectFileText}>Select File</Text>
          </TouchableOpacity>
        </View>

        {/* AI Scanning Status */}
        <View style={styles.scanCard}>
          <Text style={styles.scanScore}>82%</Text>
          <Text style={styles.scanTitle}>AI Scanning Active</Text>
          <Text style={styles.scanSub}>Our neural network is mapping patterns against 5k+ industry standards.</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '82%' }]} />
          </View>
          <Text style={styles.scanStatusText}>EXTRACTING SEMANTIC SKILLS...</Text>
        </View>

        {/* Metric Cards */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconWrap, { backgroundColor: '#e0f2fe' }]}><Key size={14} color="#0284c7" /></View>
              <Text style={styles.metricValue}>92%</Text>
            </View>
            <Text style={styles.metricLabel}>Keyword Match</Text>
            <View style={styles.miniBarBg}><View style={[styles.miniBarFill, { backgroundColor: '#0284c7', width: '92%' }]} /></View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconWrap, { backgroundColor: '#ffedd5' }]}><Lightbulb size={14} color="#ea580c" /></View>
              <Text style={styles.metricValue}>78%</Text>
            </View>
            <Text style={styles.metricLabel}>Skills Relevance</Text>
            <View style={styles.miniBarBg}><View style={[styles.miniBarFill, { backgroundColor: '#ea580c', width: '78%' }]} /></View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconWrap, { backgroundColor: '#dcfce7' }]}><TrendingUp size={14} color="#16a34a" /></View>
              <Text style={styles.metricValue}>85%</Text>
            </View>
            <Text style={styles.metricLabel}>Experience Dept</Text>
            <View style={styles.miniBarBg}><View style={[styles.miniBarFill, { backgroundColor: '#16a34a', width: '85%' }]} /></View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconWrap, { backgroundColor: '#f3e8ff' }]}><GraduationCap size={14} color="#9333ea" /></View>
              <Text style={styles.metricValue}>100%</Text>
            </View>
            <Text style={styles.metricLabel}>Education Match</Text>
            <View style={styles.miniBarBg}><View style={[styles.miniBarFill, { backgroundColor: '#9333ea', width: '100%' }]} /></View>
          </View>
        </View>

        {/* Detailed Breakdown */}
        <View style={styles.breakdownHeader}>
          <Text style={styles.sectionLabelDark}>Detailed Breakdown</Text>
          <TouchableOpacity style={styles.newAnalysisBtn}>
            <Text style={styles.newAnalysisText}>+New Analysis</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.breakdownCard}>
          <View style={styles.bdIconWrap}><CheckCircle2 size={16} color={SUCCESS} /></View>
          <View style={styles.bdContent}>
            <View style={styles.bdTitleRow}>
              <Text style={styles.bdTitle}>Frontend Core Skills</Text>
              <Text style={[styles.bdStatus, { color: SUCCESS }]}>STRONG MATCH</Text>
            </View>
            <Text style={styles.bdDesc}>Excellent proficiency in React, TypeScript, and Tailwind CSS detected.</Text>
          </View>
        </View>

        <View style={styles.breakdownCard}>
          <View style={styles.bdIconWrap}><AlertTriangle size={16} color={WARNING} /></View>
          <View style={styles.bdContent}>
            <View style={styles.bdTitleRow}>
              <Text style={styles.bdTitle}>Testing Frameworks</Text>
              <Text style={[styles.bdStatus, { color: WARNING }]}>IMPROVEMENT NEEDED</Text>
            </View>
            <Text style={styles.bdDesc}>Limited mention of unit testing (Jest/Cypress) or TDD practices.</Text>
          </View>
        </View>

        <View style={styles.breakdownCard}>
          <View style={styles.bdIconWrap}><CheckCircle2 size={16} color={SUCCESS} /></View>
          <View style={styles.bdContent}>
            <View style={styles.bdTitleRow}>
              <Text style={styles.bdTitle}>Project Leadership</Text>
              <Text style={[styles.bdStatus, { color: SUCCESS }]}>STRONG MATCH</Text>
            </View>
            <Text style={styles.bdDesc}>Experience leading teams of 4+ and managing agile workflows.</Text>
          </View>
        </View>

        <View style={styles.breakdownCard}>
          <View style={styles.bdIconWrap}><XCircle size={16} color={DANGER} /></View>
          <View style={styles.bdContent}>
            <View style={styles.bdTitleRow}>
              <Text style={styles.bdTitle}>Infrastructure/DevOps</Text>
              <Text style={[styles.bdStatus, { color: DANGER }]}>MISSING</Text>
            </View>
            <Text style={styles.bdDesc}>No mention of CI/CD pipelines, Docker, or AWS configurations.</Text>
          </View>
        </View>

        {/* Fit Recommendation */}
        <View style={styles.recommendationCard}>
          <View style={styles.recHeaderRow}>
            <View style={styles.recIconWrap}><Clock size={16} color={SUCCESS} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.recTitle}>Fit Recommendation: <Text style={{ color: SUCCESS }}>High Priority</Text></Text>
              <Text style={styles.recSub}>This candidate is in the top 5% of all applicants for this role.</Text>
            </View>
          </View>
          <View style={styles.recActions}>
            <TouchableOpacity style={styles.shortlistBtn}>
              <Text style={styles.shortlistBtnText}>Shortlist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scheduleBtn}>
              <Text style={styles.scheduleBtnText}>Schedule Interview</Text>
            </TouchableOpacity>
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
            <TouchableOpacity key={item.label} style={styles.navItem} onPress={() => handleNavPress(item.label)}>
              <View style={[{ padding: 8, borderRadius: 20 }, isActive && { backgroundColor: PRIMARY + '20', transform: [{ scale: 1.1 }] }]}>
                  <Icon size={22} color={isActive ? PRIMARY : '#94a3b8'} />
                </View>
              <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  
  headerContainer: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 16, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
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
  scrollContent: { padding: 20, paddingBottom: 100 },

  roleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: TEXT_GRAY, letterSpacing: 1 },
  viewResumeBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  viewResumeText: { fontSize: 12, fontWeight: '700', color: TEXT_DARK },

  dropdownBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 20 },
  dropdownText: { fontSize: 13, fontWeight: '600', color: TEXT_DARK, marginLeft: 8 },

  uploadBox: { borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  uploadIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  uploadTitle: { fontSize: 16, fontWeight: '800', color: TEXT_DARK, marginBottom: 4 },
  uploadSub: { fontSize: 11, color: TEXT_GRAY, marginBottom: 16 },
  selectFileBtn: { backgroundColor: PRIMARY, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  selectFileText: { color: WHITE, fontSize: 13, fontWeight: '700' },

  scanCard: { backgroundColor: WHITE, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  scanScore: { fontSize: 32, fontWeight: '800', color: TEXT_DARK, marginBottom: 12 },
  scanTitle: { fontSize: 14, fontWeight: '800', color: TEXT_DARK, marginBottom: 4 },
  scanSub: { fontSize: 11, color: TEXT_GRAY, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  progressBarBg: { width: '100%', height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, marginBottom: 12 },
  progressBarFill: { height: 4, backgroundColor: PRIMARY, borderRadius: 2 },
  scanStatusText: { fontSize: 9, fontWeight: '700', color: TEXT_GRAY, letterSpacing: 1 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 24 },
  metricCard: { width: '48%', backgroundColor: WHITE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  metricValue: { fontSize: 16, fontWeight: '800', color: TEXT_DARK },
  metricLabel: { fontSize: 11, color: TEXT_GRAY, marginBottom: 12 },
  miniBarBg: { height: 4, backgroundColor: '#f1f5f9', borderRadius: 2 },
  miniBarFill: { height: 4, borderRadius: 2 },

  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionLabelDark: { fontSize: 14, fontWeight: '800', color: TEXT_DARK },
  newAnalysisBtn: { backgroundColor: PRIMARY, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  newAnalysisText: { fontSize: 11, fontWeight: '700', color: WHITE },

  breakdownCard: { flexDirection: 'row', backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  bdIconWrap: { marginRight: 12, marginTop: 2 },
  bdContent: { flex: 1 },
  bdTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  bdTitle: { fontSize: 13, fontWeight: '800', color: TEXT_DARK },
  bdStatus: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  bdDesc: { fontSize: 11, color: TEXT_GRAY, lineHeight: 16 },

  recommendationCard: { backgroundColor: '#4c1d95', borderRadius: 16, padding: 20, marginTop: 8 },
  recHeaderRow: { flexDirection: 'row', marginBottom: 20 },
  recIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  recTitle: { fontSize: 15, fontWeight: '800', color: WHITE, marginBottom: 4 },
  recSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  recActions: { flexDirection: 'row', gap: 12 },
  shortlistBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  shortlistBtnText: { color: WHITE, fontSize: 13, fontWeight: '700' },
  scheduleBtn: { flex: 1, backgroundColor: SUCCESS, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  scheduleBtnText: { color: WHITE, fontSize: 13, fontWeight: '700' },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: WHITE, borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', padding: 8 },
  navText: { fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  navTextActive: { color: PRIMARY, fontWeight: '700' },

  fabRow: { position: 'absolute', bottom: Platform.OS === 'ios' ? 90 : 70, right: 20 },
  messageFab: { backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  messageFabText: { color: WHITE, fontSize: 14, fontWeight: '700' },
});
