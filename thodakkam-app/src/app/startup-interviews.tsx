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

const PRIMARY = '#662483';
const BG = '#fdfcfc'; // Very light grey/white background from image
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

const MOCK_ASSESSMENTS: any[] = [];

export default function StartupInterviews() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string);

  const [activeTab, setActiveTab] = useState('Interviews');

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

  const isWeb = Platform.OS === 'web';
  const { width } = Dimensions.get('window');
  // For web, we can make it a grid if it's wide enough
  const isWide = width > 768;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StartupHeader companyName={companyName} />
      
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={styles.pageTitle}>Assessments</Text>
            <Text style={styles.pageSubtitle}>Create and manage assessments for candidates</Text>
          </View>
          <TouchableOpacity 
            style={styles.createBtn}
            onPress={() => router.push({ pathname: '/startup-create-assessment' as any, params: { companyName } })}
          >
            <Plus size={16} color={WHITE} />
            <Text style={styles.createBtnText}>Create Assessment</Text>
          </TouchableOpacity>
        </View>

        {/* Assessments Grid / List */}
        {MOCK_ASSESSMENTS.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <FileText size={32} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No Assessments Yet</Text>
            <Text style={styles.emptySubtitle}>You haven't created any assessments. Click "Create Assessment" to get started.</Text>
          </View>
        ) : (
          <View style={[styles.grid, isWide && styles.gridWide]}>
            {MOCK_ASSESSMENTS.map((item) => (
              <View key={item.id} style={[styles.card, isWide && styles.cardWide]}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={{ padding: 4 }}>
                    <MoreVertical size={18} color={TEXT_GRAY} />
                  </TouchableOpacity>
                </View>

                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>
                ) : null}

                <View style={styles.tagsRow}>
                  {item.tags.map((tag: any, idx: number) => {
                    const Icon = tag.icon;
                    return (
                      <View key={idx} style={styles.tag}>
                        <Icon size={12} color={PRIMARY} />
                        <Text style={styles.tagText}>{tag.label}</Text>
                      </View>
                    )
                  })}
                </View>

                <View style={{ flex: 1 }} />
                <View style={styles.divider} />

                <View style={styles.footerRow}>
                  <View style={styles.footerItem}>
                    <HelpCircle size={14} color={TEXT_GRAY} />
                    <Text style={styles.footerText}>{item.questions} questions</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Users size={14} color={TEXT_GRAY} />
                    <Text style={styles.footerText}>{item.candidates} candidates</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Clock size={14} color={TEXT_GRAY} />
                    <Text style={styles.footerText}>{item.date}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Nav */}
      {!isWide && (
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
            // Original purple from original UI for active tab
            const tabColor = '#662483'; 
            return (
              <TouchableOpacity
                key={item.label}
                style={styles.navItem}
                onPress={() => handleNavPress(item.label)}
              >
                <Icon size={20} color={isActive ? tabColor : '#94a3b8'} />
                <Text style={[styles.navText, isActive && { color: tabColor, fontWeight: '700' }]}>
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
  safeArea: { flex: 1, backgroundColor: WHITE },
  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 20, paddingBottom: 60, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  pageHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', 
    marginBottom: 24, flexWrap: 'wrap', gap: 16
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: TEXT_DARK, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: TEXT_GRAY },
  createBtn: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#662483', 
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 
  },
  createBtnText: { color: WHITE, fontSize: 13, fontWeight: '600' },

  grid: { gap: 20 },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  
  card: { 
    backgroundColor: WHITE, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    minHeight: 180
  },
  cardWide: { width: '31%', minWidth: 300 },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, flex: 1, paddingRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  statusBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { color: '#16a34a', fontSize: 10, fontWeight: '800' },

  cardDesc: { fontSize: 13, color: TEXT_GRAY, lineHeight: 20, marginBottom: 16 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    backgroundColor: '#f5f3ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 
  },
  tagText: { color: '#662483', fontSize: 11, fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#f1f5f9', width: '100%', marginVertical: 16 },
  
  footerRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, color: TEXT_GRAY, fontWeight: '500' },

  bottomNav: { 
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, 
    backgroundColor: WHITE, borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 24 : 12 
  },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },

  emptyState: { 
    alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 20,
    backgroundColor: WHITE, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9'
  },
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT_DARK, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: TEXT_GRAY, textAlign: 'center', maxWidth: 300, lineHeight: 22 }
});
