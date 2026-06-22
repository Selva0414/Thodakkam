import { BASE_URL } from '@/config/api';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import StartupHeader from '../components/StartupHeader';
import { ArrowLeft, FileText, Code, Users, Calendar, Clock, Briefcase } from 'lucide-react-native';

export default function StartupAssessmentDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string);
  const id = (params.id as string);
  const { colors, isDark } = useAppTheme();

  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAssessment();
    }
  }, [id]);

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/assessments/single/${id}`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      if (data.success && data.assessment) {
        setAssessment(data.assessment);
      }
    } catch (err) {
      console.error('Fetch Assessment Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StartupHeader companyName={companyName} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!assessment) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StartupHeader companyName={companyName} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Assessment not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StartupHeader companyName={companyName} />
      
      <View style={[styles.topBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={16} color={colors.textSecondary} />
          <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Assessment Details</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{assessment.title}</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>{assessment.description || 'No description provided.'}</Text>
          
          <View style={styles.infoRow}>
            <Briefcase size={16} color={colors.primary} />
            <Text style={{ color: colors.text }}>{assessment.jobId ? 'Linked to a Job' : 'No Job Linked'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Users size={16} color={colors.primary} />
            <Text style={{ color: colors.text }}>{assessment.assignedCandidates?.length || 0} Assigned Candidates</Text>
          </View>
        </View>

        {assessment.selectedRounds?.includes('mcq') && assessment.mcqConfig && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <FileText size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>MCQ Round Configuration</Text>
            </View>
            <View style={styles.configGrid}>
              <View style={[styles.configItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Duration</Text>
                <Text style={[styles.configValue, { color: colors.text }]}>{assessment.mcqConfig.durationMin} mins</Text>
              </View>
              <View style={[styles.configItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Pass Percentage</Text>
                <Text style={[styles.configValue, { color: colors.text }]}>{assessment.mcqConfig.passPercentage}%</Text>
              </View>
              <View style={[styles.configItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Questions</Text>
                <Text style={[styles.configValue, { color: colors.text }]}>
                  {assessment.mcqConfig.questionType === 'manual' ? assessment.mcqConfig.questions?.length : assessment.mcqConfig.domainConfig?.questionsCount}
                </Text>
              </View>
            </View>
          </View>
        )}

        {assessment.selectedRounds?.includes('coding') && assessment.codingConfig && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Code size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Live Coding Configuration</Text>
            </View>
            <View style={styles.configGrid}>
              <View style={[styles.configItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Language</Text>
                <Text style={[styles.configValue, { color: colors.text }]}>{assessment.codingConfig.programmingLanguage}</Text>
              </View>
              <View style={[styles.configItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Duration</Text>
                <Text style={[styles.configValue, { color: colors.text }]}>{assessment.codingConfig.durationMin} mins</Text>
              </View>
              <View style={[styles.configItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Pass Percentage</Text>
                <Text style={[styles.configValue, { color: colors.text }]}>{assessment.codingConfig.passPercentage}%</Text>
              </View>
            </View>
          </View>
        )}

        {assessment.selectedRounds?.includes('interview') && assessment.interviewConfig && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Interview Configuration</Text>
            </View>
            <View style={styles.configGrid}>
              <View style={[styles.configItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Duration</Text>
                <Text style={[styles.configValue, { color: colors.text }]}>{assessment.interviewConfig.durationMin} mins</Text>
              </View>
              <View style={[styles.configItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Start Date</Text>
                <Text style={[styles.configValue, { color: colors.text }]}>{assessment.interviewConfig.startDate}</Text>
              </View>
              <View style={[styles.configItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Link</Text>
                <Text style={[styles.configValue, { color: colors.text }]}>{assessment.interviewConfig.meetingLink || 'None'}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.editBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: '/startup-create-assessment' as any, params: { companyName, editId: id } })}
        >
          <Text style={styles.editBtnText}>Edit Assessment</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60, maxWidth: 800, alignSelf: 'center', width: '100%', gap: 20 },
  
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, position: 'absolute', left: 20, zIndex: 10 },
  backBtnText: { fontSize: 14, fontWeight: '500' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },

  card: { padding: 20, borderRadius: 12, borderWidth: 1 },
  pageTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  pageSubtitle: { fontSize: 14, marginBottom: 16, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  
  configGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  configItem: { padding: 12, borderRadius: 8, flex: 1, minWidth: 120 },
  configLabel: { fontSize: 12, marginBottom: 4 },
  configValue: { fontSize: 15, fontWeight: '600' },

  editBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  editBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' }
});
