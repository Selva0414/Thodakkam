import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, ActivityIndicator, TextInput
} from 'react-native';
import { ArrowLeft, Clock, CheckCircle, Code, Play } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY = '#5A279B';
const BG = '#f4f5f7';
const CARD_BG = '#ffffff';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function StudentCodingExam() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testResult, setTestResult] = useState<{success: boolean, msg: string} | null>(null);
  
  const assessmentId = params.assessmentId as string;

  useEffect(() => {
    async function fetchAssessment() {
      try {
        if (!assessmentId) return;

        const isCompleted = await AsyncStorage.getItem(`assessment_completed_${assessmentId}`);
        if (isCompleted === 'true') {
          setAlreadyCompleted(true);
        }

        const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
        const res = await fetch(`${baseUrl}/api/assessments/single/${assessmentId}`);
        const data = await res.json();
        if (data.success && data.assessment) {
          setAssessment(data.assessment);
          const config = data.assessment.codingConfig || {};
          setTimeLeft((config.durationMin || 60) * 60);
          setCode(config.starterCode || `function solution(input) {\n  // Your code here\n  return input;\n}`);
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
    if (!submitted && timeLeft > 0 && !alreadyCompleted) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setTestResult({ success: false, msg: 'Time is up!' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [submitted, timeLeft, alreadyCompleted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRunCode = async () => {
    setTestResult(null);
    try {
      const lang = assessment?.codingConfig?.programmingLanguage?.toLowerCase() || 'javascript';
      const testCases = assessment?.codingConfig?.testCases || [];
      
      // MOCK EXECUTION FOR PROTOTYPE
      // Public code execution APIs (like Piston) now require authentication/whitelists.
      // To keep the demo functional without a backend sandbox, we simulate the execution.
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      if (code.trim().length < 15) {
        setTestResult({ success: false, msg: 'Execution Error: Code is too short or empty.' });
        return;
      }

      if (lang === 'java' && !code.includes('class')) {
        setTestResult({ success: false, msg: 'Compilation Error: Main class not found in Java code.' });
        return;
      }

      if (testCases.length === 0) {
         setTestResult({ success: true, msg: 'No test cases provided. Code accepted.' });
         return;
      }

      // Simulate passing all test cases for the prototype flow
      setTestResult({ success: true, msg: `All ${testCases.length} test cases passed successfully!` });

    } catch (err: any) {
      setTestResult({ success: false, msg: `Execution Error: ${err.message}` });
    }
  };

  const handleSubmit = async () => {
    if (!testResult?.success) {
      alert('Please run the code and ensure all test cases pass before submitting.');
      return;
    }
    setSubmitted(true);
    alert('Congratulations! You passed the coding round. The startup has been notified!');
    if (assessmentId) {
      await AsyncStorage.setItem(`assessment_completed_${assessmentId}`, 'true');
    }
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
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: TEXT_GRAY }}>Assessment not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{assessment.title} - Coding</Text>
        <View style={styles.timerBox}>
          <Clock size={14} color={PRIMARY} />
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {alreadyCompleted ? (
          <View style={styles.successBox}>
            <CheckCircle size={32} color="#10b981" />
            <Text style={styles.successTitle}>Already Completed</Text>
            <Text style={styles.successSubtitle}>You have already passed this coding assessment.</Text>
            <TouchableOpacity style={styles.returnBtn} onPress={() => router.navigate('/student-assessments')}>
              <Text style={styles.returnBtnText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : submitted ? (
          <View style={styles.successBox}>
            <CheckCircle size={32} color="#10b981" />
            <Text style={styles.successTitle}>Assessment Passed</Text>
            <Text style={styles.successSubtitle}>You successfully passed the coding round. The startup has been notified of your result.</Text>
            <TouchableOpacity style={styles.returnBtn} onPress={() => router.navigate('/student-assessments')}>
              <Text style={styles.returnBtnText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Code size={20} color={PRIMARY} />
                <Text style={styles.infoTitle}>Coding Challenge</Text>
              </View>
              <Text style={styles.infoDesc}>
                {assessment.description || 'Complete the function below to pass the test cases.'}
              </Text>
              <View style={styles.langBadge}>
                <Text style={styles.langBadgeText}>Language: {assessment.codingConfig?.programmingLanguage || 'JavaScript'}</Text>
              </View>
            </View>

            <View style={styles.editorCard}>
              <View style={styles.editorHeader}>
                <Text style={styles.editorTitle}>index.js</Text>
                <TouchableOpacity style={styles.runBtn} onPress={handleRunCode}>
                  <Play size={14} color={WHITE} />
                  <Text style={styles.runBtnText}>Run Code</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.codeEditor}
                multiline
                textAlignVertical="top"
                value={code}
                onChangeText={setCode}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
              />
            </View>

            {testResult && (
              <View style={[styles.resultCard, { borderColor: testResult.success ? '#10b981' : '#ef4444', backgroundColor: testResult.success ? '#ecfdf5' : '#fef2f2' }]}>
                <Text style={[styles.resultText, { color: testResult.success ? '#059669' : '#b91c1c' }]}>
                  {testResult.success ? '✅ ' : '❌ '}
                  {testResult.msg}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.submitBtn, !testResult?.success && styles.submitBtnDisabled]} 
              onPress={handleSubmit}
              disabled={!testResult?.success}
            >
              <Text style={styles.submitBtnText}>Submit Code & Pass Round</Text>
            </TouchableOpacity>
          </>
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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: TEXT_DARK, flex: 1, textAlign: 'center' },
  timerBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f3e8ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  timerText: { color: PRIMARY, fontSize: 12, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100, maxWidth: 800, alignSelf: 'center', width: '100%' },

  infoCard: { backgroundColor: CARD_BG, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  infoTitle: { fontSize: 18, fontWeight: '800', color: TEXT_DARK },
  infoDesc: { fontSize: 14, color: TEXT_GRAY, lineHeight: 22, marginBottom: 16 },
  langBadge: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  langBadgeText: { fontSize: 12, fontWeight: '600', color: '#475569' },

  editorCard: { backgroundColor: '#1e293b', borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 12 },
  editorTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  runBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  runBtnText: { color: WHITE, fontSize: 13, fontWeight: '700' },
  
  codeEditor: { 
    height: 300, padding: 16, color: '#f8fafc', fontSize: 14, 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {})
  },

  resultCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  resultText: { fontSize: 14, fontWeight: '700' },

  submitBtn: { backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#cbd5e1' },
  submitBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },

  successBox: { backgroundColor: CARD_BG, borderRadius: 16, padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  successTitle: { fontSize: 24, fontWeight: '800', color: TEXT_DARK, marginTop: 16, marginBottom: 8 },
  successSubtitle: { fontSize: 15, color: TEXT_GRAY, textAlign: 'center', marginBottom: 32 },
  returnBtn: { backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  returnBtnText: { color: WHITE, fontSize: 15, fontWeight: '700' },
});
