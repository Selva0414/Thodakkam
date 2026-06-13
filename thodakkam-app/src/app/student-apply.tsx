import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Alert
} from 'react-native';
import {
  Bell, Search, Mail, Settings, LayoutDashboard, Briefcase,
  MessageSquare, Users, CloudUpload, Send, ArrowLeft, UploadCloud, CheckCircle, AlertCircle
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { globalNotificationStore } from '../utils/notificationStore';
import { userStore } from '../utils/userStore';
import StudentHeader from '../components/StudentHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY = '#6a1b9a';
const BG = '#f8f9fa';
const WHITE = '#ffffff';
const DARK = '#0f172a';
const GRAY = '#6b7280';
const BORDER = '#e2e8f0';

function BottomTabBar() {
  const router = useRouter();
  const active = 'Jobs Search';
  const tabs = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Jobs Search', icon: Briefcase, path: '/student-jobs' },
    { label: 'Messages', icon: MessageSquare, path: '/student-messages' },
    { label: 'Community', icon: Users, path: '/student-community' },
  ];
  return (
    <View style={tabBarStyles.container}>
      {tabs.map(({ label, icon: Icon, path }) => {
        const isActive = active === label;
        return (
          <TouchableOpacity
            key={label}
            style={tabBarStyles.tab}
            onPress={() => {
              if (path) router.push(path as any);
            }}
          >
            <Icon size={22} color={isActive ? PRIMARY : GRAY} />
            <Text style={[tabBarStyles.label, isActive && tabBarStyles.labelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function StudentApply() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const jobTitle = (params.jobTitle as string) || "Internship";

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    resumeName: '',
    resumeUri: '',
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  React.useEffect(() => {
    const checkApplication = async () => {
      try {
        const jId = jobId || "mock-job-id";
        const email = userStore.email || form.email;
        if (!email) {
          setIsChecking(false);
          return;
        }

        const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/apply/check?jobId=${jId}&email=${email}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const resJson = await response.json();
        
        if (resJson.success && resJson.applied) {
          setAlreadyApplied(true);
        }
      } catch (err) {
        console.warn("Failed to check application status:", err);
      } finally {
        setIsChecking(false);
      }
    };
    checkApplication();
  }, [jobId]);

  const handleSubmit = async () => {
    if (!form.fullName || !form.email || !form.resumeUri) {
      Alert.alert("Missing Fields", "Please fill out all required fields and upload a resume.");
      return;
    }

    setLoading(true);
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const fallbackId = await AsyncStorage.getItem('studentUserId');
      const finalUserId = userStore.id || fallbackId;

      const response = await fetch(`${baseUrl}/api/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobId || "mock-job-id",
          userId: finalUserId,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          resumeUrl: form.resumeName
        }),
      });

      const resJson = await response.json();
      if (resJson.success) {
        setIsSubmitted(true);
        // Notify the company through global store
        globalNotificationStore.addNotification({
          title: `New Application for ${jobTitle}`,
          description: `${form.fullName} has submitted an application for the ${jobTitle} position.`,
          type: 'info',
          targetRole: 'startup'
        });
      } else {
        if (resJson.message === 'You have already applied for this job') {
          setAlreadyApplied(true);
        } else {
          Alert.alert("Error", resJson.message || "Failed to submit application");
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Network error. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Page Titles */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Apply for {jobTitle}</Text>
          <Text style={styles.pageSubtitle}>Here you can apply for a position in our company</Text>
        </View>

        {/* Application Form Card */}
        {isChecking ? (
          <View style={[styles.formCard, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ color: GRAY }}>Checking application status...</Text>
          </View>
        ) : alreadyApplied ? (
          <View style={[styles.formCard, { alignItems: 'center', paddingVertical: 40 }]}>
            <View style={[styles.successIconBox, { backgroundColor: '#fef2f2' }]}>
              <AlertCircle size={36} color="#ef4444" />
            </View>
            <Text style={styles.successTitle}>Already Applied!</Text>
            <Text style={styles.successSubtitle}>
              You have already submitted an application for the {jobTitle} position. Please wait for the company to review your profile.
            </Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>Back to Jobs</Text>
            </TouchableOpacity>
          </View>
        ) : isSubmitted ? (
          <View style={[styles.formCard, { alignItems: 'center', paddingVertical: 40 }]}>
            <View style={styles.successIconBox}>
              <CheckCircle size={36} color="#16a34a" />
            </View>
            <Text style={styles.successTitle}>Application Submitted!</Text>
            <Text style={styles.successSubtitle}>
              Your application for {jobTitle} has been successfully sent. We will review your profile and get back to you soon.
            </Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>Back to Jobs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Apply for Position</Text>
            <Text style={styles.cardSubtitle}>
              {jobTitle} - Engineering & Design
            </Text>

            {/* Full Name */}
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={form.fullName}
              onChangeText={(t) => setForm({ ...form, fullName: t })}
            />

            {/* Email */}
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              keyboardType="email-address"
              onChangeText={(t) => setForm({ ...form, email: t })}
            />

            {/* Phone Number */}
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              keyboardType="phone-pad"
              onChangeText={(t) => setForm({ ...form, phone: t })}
            />

            {/* Resume Upload */}
            <Text style={styles.label}>Resume / CV</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                  copyToCacheDirectory: true,
                });
                if (result.canceled === false && result.assets && result.assets.length > 0) {
                  setForm({
                    ...form,
                    resumeName: result.assets[0].name,
                    resumeUri: result.assets[0].uri
                  });
                }
              } catch (err) {
                console.warn("Document picker error:", err);
              }
            }}>
              <View style={styles.uploadIconWrap}>
                <CloudUpload size={20} color={DARK} />
              </View>
              {form.resumeName ? (
                <Text style={[styles.uploadText, { color: PRIMARY, fontWeight: '600' }]}>{form.resumeName}</Text>
              ) : (
                <Text style={styles.uploadText}>Click to upload or drag and drop</Text>
              )}
              <Text style={styles.uploadSubtext}>PDF, DOCX up to 10MB</Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.submitBtnText}>{loading ? 'Submitting...' : 'Submit Application'}</Text>
              {!loading && <Send size={14} color={WHITE} style={{ marginLeft: 6 }} />}
            </TouchableOpacity>

            <Text style={styles.termsText}>
              BY SUBMITTING, YOU AGREE TO OUR TERMS OF SERVICE
            </Text>
          </View>
        )}

      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  titleSection: { marginBottom: 16, marginTop: 4 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: DARK, marginBottom: 6 },
  pageSubtitle: { fontSize: 13, color: GRAY },

  formCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#f1f5f9',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    }),
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: DARK, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: GRAY, marginBottom: 24, lineHeight: 18 },

  label: { fontSize: 11, fontWeight: '700', color: DARK, marginBottom: 8 },
  input: {
    backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 12, paddingVertical: 14, fontSize: 14, color: DARK,
    marginBottom: 20,
  },

  uploadBox: {
    borderWidth: 1.5, borderColor: '#cbd5e1', borderStyle: 'dashed',
    borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24,
    backgroundColor: '#f8fafc',
  },
  uploadIconWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#fee2e2',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  uploadText: { fontSize: 13, fontWeight: '700', color: DARK, marginBottom: 4 },
  uploadSubtext: { fontSize: 11, color: GRAY },

  submitBtn: {
    backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(106,27,154,0.3)' },
      default: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    }),
    marginBottom: 20,
  },
  submitBtnText: { color: WHITE, fontSize: 14, fontWeight: '700' },

  termsText: {
    fontSize: 9, fontWeight: '700', color: '#94a3b8', textAlign: 'center',
    letterSpacing: 0.5, lineHeight: 14,
  },

  successIconBox: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#dcfce7',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 20, fontWeight: '800', color: DARK, marginBottom: 12 },
  successSubtitle: { fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: 32, lineHeight: 20, paddingHorizontal: 10 },
  backBtn: {
    backgroundColor: '#f1f5f9', borderRadius: 10, paddingVertical: 14, width: '100%',
    alignItems: 'center',
  },
  backBtnText: { color: DARK, fontSize: 14, fontWeight: '700' },
});

const navStyles = StyleSheet.create({
  headerContainer: {
    backgroundColor: WHITE,
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 24, height: 24, borderRadius: 6, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 13, fontWeight: '800', color: DARK },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellWrapper: { position: 'relative' },
  bellDot: { position: 'absolute', top: 0, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', borderWidth: 1, borderColor: WHITE },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarText: { color: WHITE, fontSize: 12, fontWeight: '700' },
  avatarImage: { width: '100%', height: '100%' },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: BG, borderRadius: 8, paddingHorizontal: 10, height: 36 },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 12, color: DARK },
  iconBtn: { padding: 4 },
});

const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, color: GRAY, fontWeight: '500' },
  labelActive: { color: PRIMARY, fontWeight: '700' },
});
