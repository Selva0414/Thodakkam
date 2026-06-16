import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, ActivityIndicator
} from 'react-native';
import { ArrowLeft, Clock, CheckCircle, CheckSquare, Square, Shield, Award, ArrowRight } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY = '#5A279B';
const BG = '#f4f5f7';
const CARD_BG = '#ffffff';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function StudentExam() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const assessmentId = params.assessmentId as string;

  useEffect(() => {
    async function fetchAssessment() {
      try {
        if (!assessmentId) return;

        // Check if already completed
        const isCompleted = await AsyncStorage.getItem(`assessment_completed_${assessmentId}`);
        if (isCompleted === 'true') {
          setAlreadyCompleted(true);
        }

        const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
        const res = await fetch(`${baseUrl}/api/assessments/single/${assessmentId}`);
        const data = await res.json();
        if (data.success && data.assessment) {
          setAssessment(data.assessment);
          const duration = data.assessment.mcqConfig?.durationMin || 30;
          setTimeLeft(duration * 60);
        }
      } catch (err) {
        console.error('Failed to fetch assessment:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAssessment();
  }, [assessmentId]);

  useEffect(() => {
    let timer: any;
    if (examStarted && !submitted && timeLeft > 0 && !alreadyCompleted) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, submitted, timeLeft, alreadyCompleted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  if (!assessment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={TEXT_DARK} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: TEXT_GRAY }}>Assessment not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const questions = assessment.mcqConfig?.questions || [];

  const handleSelectOption = (qIndex: number, option: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    
    let score = 0;
    let totalScore = 0;
    
    questions.forEach((q: any, index: number) => {
      const pts = Number(q.points) || 1;
      totalScore += pts;
      if (answers[index] === q.correctOption) {
        score += pts;
      }
    });

    const percent = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
    alert(`Assessment submitted successfully! You scored ${percent}%`);
    
    if (assessmentId) {
      await AsyncStorage.setItem(`assessment_completed_${assessmentId}`, 'true');
      
      const userStr = await AsyncStorage.getItem('userData');
      if (userStr && assessment.jobId) {
         const user = JSON.parse(userStr);
         const resultObj = {
           roundType: 'MCQ_ROUND',
           score: percent,
           status: percent >= (assessment.mcqConfig?.passPercentage || 60) ? 'PASSED' : 'FAILED',
           completedAt: new Date().toISOString()
         };
         await AsyncStorage.setItem(`mock_assessment_result_${user.id}_${assessment.jobId}`, JSON.stringify([resultObj]));
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{assessment.title}</Text>
        <View style={styles.timerBox}>
          <Clock size={14} color={PRIMARY} />
          <Text style={styles.timerText}>{examStarted ? formatTime(timeLeft) : `${assessment.mcqConfig?.durationMin || 30}:00`}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {alreadyCompleted && !submitted && (
          <View style={styles.successBox}>
            <CheckCircle size={32} color="#10b981" />
            <Text style={styles.successTitle}>Already Completed</Text>
            <Text style={styles.successSubtitle}>You have already attended and submitted this assessment.</Text>
            <TouchableOpacity style={styles.returnBtn} onPress={() => router.navigate('/student-assessments')}>
              <Text style={styles.returnBtnText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {!alreadyCompleted && submitted && (
          <View style={styles.successBox}>
            <CheckCircle size={32} color="#10b981" />
            <Text style={styles.successTitle}>Exam Submitted</Text>
            <Text style={styles.successSubtitle}>Your responses have been recorded and sent to the startup.</Text>
            <TouchableOpacity style={styles.returnBtn} onPress={() => router.navigate('/student-assessments')}>
              <Text style={styles.returnBtnText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {!alreadyCompleted && !submitted && !examStarted && (
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionsHeader}>
              <Award size={48} color={PRIMARY} style={{ marginBottom: 16 }} />
              <Text style={styles.instructionsTitle}>Assessment Instructions & Guidelines</Text>
              <Text style={styles.instructionsSubtitle}>Please read the instructions carefully before starting.</Text>
            </View>

            <View style={styles.guidelinesCard}>
              <View style={styles.guidelineItem}>
                <View style={styles.guidelineNumber}><Text style={styles.guidelineNumberText}>1</Text></View>
                <View style={styles.guidelineContent}>
                  <Text style={styles.guidelineHeading}>Enforced Fullscreen Mode</Text>
                  <Text style={styles.guidelineDesc}>The entire assessment must be completed in fullscreen. Exiting fullscreen once will show a warning. A second exit will automatically submit and end your test.</Text>
                </View>
              </View>

              <View style={[styles.guidelineItem, { borderBottomWidth: 0 }]}>
                <View style={styles.guidelineNumber}><Text style={styles.guidelineNumberText}>2</Text></View>
                <View style={styles.guidelineContent}>
                  <Text style={styles.guidelineHeading}>Anti-Cheat Protection</Text>
                  <Text style={styles.guidelineDesc}>Tab switching, window blurring, copying, pasting, and right-clicking are strictly prohibited and monitored.</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setHasAgreed(!hasAgreed)}
              activeOpacity={0.7}
            >
              {hasAgreed ? <CheckSquare size={24} color={PRIMARY} /> : <Square size={24} color={TEXT_GRAY} />}
              <Text style={styles.checkboxText}>I have read the instructions and agree to follow the rules of the assessment.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.startAssessmentBtn, !hasAgreed && styles.startAssessmentBtnDisabled]}
              disabled={!hasAgreed}
              onPress={() => setExamStarted(true)}
            >
              <Text style={styles.startAssessmentBtnText}>Start Assessment</Text>
              <ArrowRight size={20} color={WHITE} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}

        {!alreadyCompleted && !submitted && examStarted && questions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Questions Found</Text>
            <Text style={styles.emptySubtitle}>The startup hasn't added any MCQ questions for this assessment.</Text>
          </View>
        ) : !alreadyCompleted && !submitted && examStarted && (
          questions.map((q: any, index: number) => (
            <View key={index} style={styles.questionCard}>
              <Text style={styles.questionText}>
                {index + 1}. {q.question || `Question ${index + 1}`}
              </Text>

              <View style={styles.optionsList}>
                {['A', 'B', 'C', 'D'].map((optLabel) => {
                  const optText = q[`option${optLabel}`] || `Option ${optLabel}`;

                  const isSelected = answers[index] === optLabel;
                  return (
                    <TouchableOpacity
                      key={optLabel}
                      style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                      onPress={() => handleSelectOption(index, optLabel)}
                    >
                      <View style={[styles.radio, isSelected && styles.radioSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {optLabel}. {optText}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}

        {!alreadyCompleted && !submitted && examStarted && questions.length > 0 && (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit Assessment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: WHITE, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0'
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtnText: { fontSize: 14, color: TEXT_DARK, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TEXT_DARK, flex: 1, textAlign: 'center' },
  timerBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f3e8ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  timerText: { color: PRIMARY, fontSize: 12, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100, maxWidth: 800, alignSelf: 'center', width: '100%' },

  emptyCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT_DARK, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: TEXT_GRAY, textAlign: 'center' },

  questionCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  questionText: { fontSize: 16, fontWeight: '600', color: TEXT_DARK, marginBottom: 20, lineHeight: 24 },

  optionsList: { gap: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fafafa' },
  optionRowSelected: { borderColor: PRIMARY, backgroundColor: '#f3e8ff' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: PRIMARY },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY },
  optionText: { fontSize: 15, color: TEXT_DARK, flex: 1 },
  optionTextSelected: { color: PRIMARY, fontWeight: '500' },

  submitBtn: { backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },

  successBox: { backgroundColor: CARD_BG, borderRadius: 16, padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  successTitle: { fontSize: 24, fontWeight: '800', color: TEXT_DARK, marginTop: 16, marginBottom: 8 },
  successSubtitle: { fontSize: 15, color: TEXT_GRAY, textAlign: 'center', marginBottom: 32 },
  returnBtn: { backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  returnBtnText: { color: WHITE, fontSize: 15, fontWeight: '700' },

  instructionsContainer: { alignItems: 'center', marginTop: 20 },
  instructionsHeader: { alignItems: 'center', marginBottom: 32 },
  instructionsTitle: { fontSize: 24, fontWeight: '800', color: TEXT_DARK, textAlign: 'center', marginBottom: 8 },
  instructionsSubtitle: { fontSize: 16, color: TEXT_GRAY, textAlign: 'center' },
  guidelinesCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 24, width: '100%', marginBottom: 32, borderWidth: 1, borderColor: '#e2e8f0' },
  guidelineItem: { flexDirection: 'row', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  guidelineNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  guidelineNumberText: { color: WHITE, fontWeight: '700', fontSize: 14 },
  guidelineContent: { flex: 1 },
  guidelineHeading: { fontSize: 16, fontWeight: '700', color: TEXT_DARK, marginBottom: 6 },
  guidelineDesc: { fontSize: 14, color: TEXT_GRAY, lineHeight: 22 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 32, paddingHorizontal: 10 },
  checkboxText: { fontSize: 15, color: TEXT_DARK, marginLeft: 12, flex: 1, lineHeight: 22 },
  startAssessmentBtn: { backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, elevation: 2, shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  startAssessmentBtnDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0, elevation: 0 },
  startAssessmentBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },
});
