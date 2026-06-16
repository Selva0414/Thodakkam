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
import { useAppTheme } from '../context/ThemeContext';

export default function StartupAiAnalyzer() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string) || 'Company';
  const { colors, isDark } = useAppTheme();

  const [activeTab, setActiveTab] = useState('Candidates');

  const handleNavPress = (label: string) => {
    if (label === 'Home') router.navigate({ pathname: '/startup-dashboard' as any, params: { companyName } });
    else if (label === 'Jobs') router.navigate({ pathname: '/startup-jobs' as any, params: { companyName } });
    else if (label === 'Candidates') router.navigate({ pathname: '/startup-candidates' as any, params: { companyName } });
    else if (label === 'Interviews') router.navigate({ pathname: '/startup-interviews' as any, params: { companyName } });
    else if (label === 'Feed') router.navigate({ pathname: '/startup-community' as any, params: { companyName } });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.companyInfo}>
            <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>{companyName.substring(0, 3).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={[styles.companyNameText, { color: colors.text }]}>{companyName}</Text>
              <Text style={[styles.premiumText, { color: colors.textSecondary }]}>PREMIUM PLAN</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity><MessageSquare size={20} color={colors.textSecondary} /></TouchableOpacity>
            <TouchableOpacity><Users size={20} color={colors.textSecondary} /></TouchableOpacity>
            <TouchableOpacity><LayoutGrid size={20} color={colors.textSecondary} /></TouchableOpacity>
          </View>
        </View>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg }]}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search analytics, candidates..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        
        {/* Target Job Role Header */}
        <View style={styles.roleHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TARGET JOB ROLE</Text>
          <TouchableOpacity style={[styles.viewResumeBtn, { borderColor: colors.border }]}>
            <Eye size={14} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={[styles.viewResumeText, { color: colors.text }]}>View Resume</Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Box */}
        <View style={[styles.dropdownBox, { borderColor: colors.border }]}>
          <Briefcase size={16} color={colors.textSecondary} />
          <Text style={[styles.dropdownText, { color: colors.text }]}>Senior Frontend Engineer (React/TypeScript)</Text>
          <Text style={{ marginLeft: 'auto', color: colors.textSecondary }}>⌄</Text>
        </View>

        {/* Upload Box */}
        <View style={[styles.uploadBox, { borderColor: colors.border }]}>
          <View style={[styles.uploadIconWrap, { backgroundColor: isDark ? colors.primary + '20' : '#f3e8ff' }]}>
            <UploadCloud size={24} color={colors.primary} />
          </View>
          <Text style={[styles.uploadTitle, { color: colors.text }]}>Upload Resume</Text>
          <Text style={[styles.uploadSub, { color: colors.textSecondary }]}>Drag and drop PDF or DOCX (Max 5MB)</Text>
          <TouchableOpacity style={[styles.selectFileBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.selectFileText}>Select File</Text>
          </TouchableOpacity>
        </View>

        {/* AI Scanning Status */}
        <View style={[styles.scanCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.scanScore, { color: colors.text }]}>82%</Text>
          <Text style={[styles.scanTitle, { color: colors.text }]}>AI Scanning Active</Text>
          <Text style={[styles.scanSub, { color: colors.textSecondary }]}>Our neural network is mapping patterns against 5k+ industry standards.</Text>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: '82%', backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.scanStatusText, { color: colors.textSecondary }]}>EXTRACTING SEMANTIC SKILLS...</Text>
        </View>

        {/* Metric Cards */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconWrap, { backgroundColor: isDark ? '#0284c7' + '20' : '#e0f2fe' }]}><Key size={14} color="#0284c7" /></View>
              <Text style={[styles.metricValue, { color: colors.text }]}>92%</Text>
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Keyword Match</Text>
            <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}><View style={[styles.miniBarFill, { backgroundColor: '#0284c7', width: '92%' }]} /></View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconWrap, { backgroundColor: isDark ? '#ea580c' + '20' : '#ffedd5' }]}><Lightbulb size={14} color="#ea580c" /></View>
              <Text style={[styles.metricValue, { color: colors.text }]}>78%</Text>
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Skills Relevance</Text>
            <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}><View style={[styles.miniBarFill, { backgroundColor: '#ea580c', width: '78%' }]} /></View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconWrap, { backgroundColor: isDark ? colors.success + '20' : '#dcfce7' }]}><TrendingUp size={14} color={isDark ? colors.success : "#16a34a"} /></View>
              <Text style={[styles.metricValue, { color: colors.text }]}>85%</Text>
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Experience Dept</Text>
            <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}><View style={[styles.miniBarFill, { backgroundColor: isDark ? colors.success : '#16a34a', width: '85%' }]} /></View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconWrap, { backgroundColor: isDark ? '#9333ea' + '20' : '#f3e8ff' }]}><GraduationCap size={14} color="#9333ea" /></View>
              <Text style={[styles.metricValue, { color: colors.text }]}>100%</Text>
            </View>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Education Match</Text>
            <View style={[styles.miniBarBg, { backgroundColor: colors.border }]}><View style={[styles.miniBarFill, { backgroundColor: '#9333ea', width: '100%' }]} /></View>
          </View>
        </View>

        {/* Detailed Breakdown */}
        <View style={styles.breakdownHeader}>
          <Text style={[styles.sectionLabelDark, { color: colors.text }]}>Detailed Breakdown</Text>
          <TouchableOpacity style={[styles.newAnalysisBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.newAnalysisText}>+New Analysis</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.breakdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.bdIconWrap}><CheckCircle2 size={16} color={isDark ? colors.success : "#22c55e"} /></View>
          <View style={styles.bdContent}>
            <View style={styles.bdTitleRow}>
              <Text style={[styles.bdTitle, { color: colors.text }]}>Frontend Core Skills</Text>
              <Text style={[styles.bdStatus, { color: isDark ? colors.success : "#22c55e" }]}>STRONG MATCH</Text>
            </View>
            <Text style={[styles.bdDesc, { color: colors.textSecondary }]}>Excellent proficiency in React, TypeScript, and Tailwind CSS detected.</Text>
          </View>
        </View>

        <View style={[styles.breakdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.bdIconWrap}><AlertTriangle size={16} color={isDark ? colors.warning : "#f59e0b"} /></View>
          <View style={styles.bdContent}>
            <View style={styles.bdTitleRow}>
              <Text style={[styles.bdTitle, { color: colors.text }]}>Testing Frameworks</Text>
              <Text style={[styles.bdStatus, { color: isDark ? colors.warning : "#f59e0b" }]}>IMPROVEMENT NEEDED</Text>
            </View>
            <Text style={[styles.bdDesc, { color: colors.textSecondary }]}>Limited mention of unit testing (Jest/Cypress) or TDD practices.</Text>
          </View>
        </View>

        <View style={[styles.breakdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.bdIconWrap}><CheckCircle2 size={16} color={isDark ? colors.success : "#22c55e"} /></View>
          <View style={styles.bdContent}>
            <View style={styles.bdTitleRow}>
              <Text style={[styles.bdTitle, { color: colors.text }]}>Project Leadership</Text>
              <Text style={[styles.bdStatus, { color: isDark ? colors.success : "#22c55e" }]}>STRONG MATCH</Text>
            </View>
            <Text style={[styles.bdDesc, { color: colors.textSecondary }]}>Experience leading teams of 4+ and managing agile workflows.</Text>
          </View>
        </View>

        <View style={[styles.breakdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.bdIconWrap}><XCircle size={16} color={isDark ? colors.danger : "#ef4444"} /></View>
          <View style={styles.bdContent}>
            <View style={styles.bdTitleRow}>
              <Text style={[styles.bdTitle, { color: colors.text }]}>Infrastructure/DevOps</Text>
              <Text style={[styles.bdStatus, { color: isDark ? colors.danger : "#ef4444" }]}>MISSING</Text>
            </View>
            <Text style={[styles.bdDesc, { color: colors.textSecondary }]}>No mention of CI/CD pipelines, Docker, or AWS configurations.</Text>
          </View>
        </View>

        {/* Fit Recommendation */}
        <View style={[styles.recommendationCard, { backgroundColor: isDark ? colors.primary + '80' : '#4c1d95' }]}>
          <View style={styles.recHeaderRow}>
            <View style={styles.recIconWrap}><Clock size={16} color={isDark ? colors.success : "#22c55e"} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.recTitle}>Fit Recommendation: <Text style={{ color: isDark ? colors.success : "#22c55e" }}>High Priority</Text></Text>
              <Text style={styles.recSub}>This candidate is in the top 5% of all applicants for this role.</Text>
            </View>
          </View>
          <View style={styles.recActions}>
            <TouchableOpacity style={styles.shortlistBtn}>
              <Text style={styles.shortlistBtnText}>Shortlist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.scheduleBtn, { backgroundColor: isDark ? colors.success : "#22c55e" }]}>
              <Text style={styles.scheduleBtnText}>Schedule Interview</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>



      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
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
              <View style={[{ padding: 8, borderRadius: 20 }, isActive && { backgroundColor: isDark ? colors.primary + '30' : colors.primary + '20', transform: [{ scale: 1.1 }] }]}>
                  <Icon size={22} color={isActive ? colors.primary : colors.textSecondary} />
                </View>
              <Text style={[styles.navText, { color: colors.textSecondary }, isActive && { color: colors.primary, fontWeight: '700' }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  
  headerContainer: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 16, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  companyInfo: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  logoText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  companyNameText: { fontSize: 14, fontWeight: '800' },
  premiumText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  headerIcons: { flexDirection: 'row', gap: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },

  roleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  viewResumeBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  viewResumeText: { fontSize: 12, fontWeight: '700' },

  dropdownBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 20 },
  dropdownText: { fontSize: 13, fontWeight: '600', marginLeft: 8 },

  uploadBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  uploadIconWrap: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  uploadTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  uploadSub: { fontSize: 11, marginBottom: 16 },
  selectFileBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  selectFileText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  scanCard: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  scanScore: { fontSize: 32, fontWeight: '800', marginBottom: 12 },
  scanTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  scanSub: { fontSize: 11, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  progressBarBg: { width: '100%', height: 4, borderRadius: 2, marginBottom: 12 },
  progressBarFill: { height: 4, borderRadius: 2 },
  scanStatusText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 24 },
  metricCard: { width: '48%', borderRadius: 16, padding: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  metricValue: { fontSize: 16, fontWeight: '800' },
  metricLabel: { fontSize: 11, marginBottom: 12 },
  miniBarBg: { height: 4, borderRadius: 2 },
  miniBarFill: { height: 4, borderRadius: 2 },

  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionLabelDark: { fontSize: 14, fontWeight: '800' },
  newAnalysisBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  newAnalysisText: { fontSize: 11, fontWeight: '700', color: '#ffffff' },

  breakdownCard: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  bdIconWrap: { marginRight: 12, marginTop: 2 },
  bdContent: { flex: 1 },
  bdTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  bdTitle: { fontSize: 13, fontWeight: '800' },
  bdStatus: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  bdDesc: { fontSize: 11, lineHeight: 16 },

  recommendationCard: { borderRadius: 16, padding: 20, marginTop: 8 },
  recHeaderRow: { flexDirection: 'row', marginBottom: 20 },
  recIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  recTitle: { fontSize: 15, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  recSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  recActions: { flexDirection: 'row', gap: 12 },
  shortlistBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  shortlistBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  scheduleBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  scheduleBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', padding: 8 },
  navText: { fontSize: 10, marginTop: 4, fontWeight: '500' },

  fabRow: { position: 'absolute', bottom: Platform.OS === 'ios' ? 90 : 70, right: 20 },
  messageFab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  messageFabText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
