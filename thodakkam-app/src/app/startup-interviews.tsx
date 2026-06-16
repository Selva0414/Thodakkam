import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, Dimensions
} from 'react-native';
import {
  Briefcase, Users, Calendar, LayoutGrid, Search, Bell, Settings, FileText, Code, Clock, User, MoreVertical, HelpCircle, Plus
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import StartupHeader from '../components/StartupHeader';
import { useAppTheme } from '../context/ThemeContext';

export default function StartupInterviews() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string);
  const { colors, isDark } = useAppTheme();

  const [activeTab, setActiveTab] = useState('Interviews');
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (companyName) {
      fetchAssessments();
    }
  }, [companyName]);

  const fetchAssessments = async () => {
    try {
      const res = await fetch(`https://thodakkam-backend.onrender.com/api/assessments/${encodeURIComponent(companyName)}`);
      const data = await res.json();
      if (data.success && data.assessments) {
        const mapped = data.assessments.map((a: any) => {
          const tags: any[] = [];
          let questionsCount = 0;

          if (a.selectedRounds?.includes('mcq')) {
            tags.push({ label: 'MCQ Assessment', icon: FileText });
            if (a.mcqConfig?.questions) questionsCount += a.mcqConfig.questions.length;
            else if (a.mcqConfig?.domainConfig?.questionsCount) questionsCount += Number(a.mcqConfig.domainConfig.questionsCount);
          }
          if (a.selectedRounds?.includes('coding')) {
            tags.push({ label: 'Live Coding', icon: Code });
          }
          if (a.selectedRounds?.includes('interview')) {
            tags.push({ label: 'Interview', icon: Users });
          }

          let status = 'INACTIVE';
          const now = new Date();
          let startDateObj = null;
          let endDateObj = null;

          if (a.mcqConfig?.startDate && a.mcqConfig?.startTime) {
            startDateObj = new Date(`${a.mcqConfig.startDate}T${a.mcqConfig.startTime}`);
          } else if (a.mcqConfig?.startDate) {
            startDateObj = new Date(a.mcqConfig.startDate);
          }

          if (a.mcqConfig?.endDate && a.mcqConfig?.endTime) {
            endDateObj = new Date(`${a.mcqConfig.endDate}T${a.mcqConfig.endTime}`);
          } else if (a.mcqConfig?.endDate) {
            endDateObj = new Date(a.mcqConfig.endDate);
          }

          if (startDateObj && endDateObj) {
            if (now >= startDateObj && now <= endDateObj) {
              status = 'ACTIVE';
            }
          } else if (startDateObj) {
            if (now >= startDateObj) status = 'ACTIVE';
          } else {
            // Default to active if no schedule is set
            status = 'ACTIVE';
          }

          return {
            id: a.id,
            title: a.title,
            status: status,
            tags,
            questions: questionsCount,
            candidates: a.assignedCandidates?.length || 0,
            date: startDateObj ? startDateObj.toLocaleDateString() : new Date(a.createdAt).toLocaleDateString()
          };
        });
        setAssessments(mapped);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavPress = (label: string) => {
    if (label === 'Home') {
      router.navigate({ pathname: '/startup-dashboard' as any, params: { companyName } });
    } else if (label === 'Jobs') {
      router.navigate({ pathname: '/startup-jobs' as any, params: { companyName } });
    } else if (label === 'Candidates') {
      router.navigate({ pathname: '/startup-candidates' as any, params: { companyName } });
    } else if (label === 'Feed') {
      router.navigate({ pathname: '/startup-community' as any, params: { companyName } });
    }
  };

  const isWeb = Platform.OS === 'web';
  const { width } = Dimensions.get('window');
  // For web, we can make it a grid if it's wide enough
  const isWide = width > 768;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StartupHeader companyName={companyName} />
      
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Assessments</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>Create and manage assessments for candidates</Text>
          </View>
          <TouchableOpacity 
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push({ pathname: '/startup-create-assessment' as any, params: { companyName } })}
          >
            <Plus size={16} color="#ffffff" />
            <Text style={styles.createBtnText}>Create Assessment</Text>
          </TouchableOpacity>
        </View>

        {/* Assessments Grid / List */}
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary }}>Loading...</Text>
          </View>
        ) : assessments.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.inputBg }]}>
              <FileText size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Assessments Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>You haven't created any assessments. Click "Create Assessment" to get started.</Text>
          </View>
        ) : (
          <View style={[styles.grid, isWide && styles.gridWide]}>
            {assessments.map((item) => (
              <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, isWide && styles.cardWide]}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'INACTIVE' ? colors.inputBg : (isDark ? colors.success + '20' : '#dcfce7') }]}>
                      <Text style={[styles.statusText, { color: item.status === 'INACTIVE' ? colors.textSecondary : (isDark ? colors.success : '#16a34a') }]}>{item.status}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={{ padding: 4 }}>
                    <MoreVertical size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {item.description ? (
                  <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={3}>{item.description}</Text>
                ) : null}

                <View style={styles.tagsRow}>
                  {item.tags.map((tag: any, idx: number) => {
                    const Icon = tag.icon;
                    return (
                      <View key={idx} style={[styles.tag, { backgroundColor: isDark ? colors.primary + '20' : '#f5effc' }]}>
                        <Icon size={12} color={colors.primary} />
                        <Text style={[styles.tagText, { color: colors.primary }]}>{tag.label}</Text>
                      </View>
                    )
                  })}
                </View>

                <View style={{ flex: 1 }} />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.footerRow}>
                  <View style={styles.footerItem}>
                    <HelpCircle size={14} color={colors.textSecondary} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>{item.questions} questions</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Users size={14} color={colors.textSecondary} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>{item.candidates} candidates</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>{item.date}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Nav */}
      {!isWide && (
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
              <TouchableOpacity
                key={item.label}
                style={styles.navItem}
                onPress={() => handleNavPress(item.label)}
              >
                <View style={[{ padding: 8, borderRadius: 20 }, isActive && { backgroundColor: isDark ? colors.primary + '30' : colors.primary + '20', transform: [{ scale: 1.1 }] }]}>
                  <Icon size={22} color={isActive ? colors.primary : colors.textSecondary} />
                </View>
                <Text style={[styles.navText, { color: colors.textSecondary }, isActive && { color: colors.primary, fontWeight: '700' }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  pageHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', 
    marginBottom: 24, flexWrap: 'wrap', gap: 16
  },
  pageTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  pageSubtitle: { fontSize: 14 },
  createBtn: { 
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 
  },
  createBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },

  grid: { gap: 20 },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  
  card: { 
    borderRadius: 12, padding: 20,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    minHeight: 180
  },
  cardWide: { width: '31%', minWidth: 300 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, flex: 1, paddingRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '800' },

  cardDesc: { fontSize: 13, lineHeight: 20, marginBottom: 16 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 
  },
  tagText: { fontSize: 12, fontWeight: '600' },

  divider: { height: 1, width: '100%', marginVertical: 16 },
  
  footerRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, fontWeight: '500' },

  bottomNav: { 
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, 
    borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 24 : 12 
  },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 10, fontWeight: '500' },

  emptyState: { 
    alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 20,
    borderRadius: 12, borderWidth: 1
  },
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', maxWidth: 300, lineHeight: 22 }
});
