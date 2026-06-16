import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, ActivityIndicator, TextInput, Modal
} from 'react-native';
import {
  Calendar, Clock, CheckCircle, XCircle, ArrowLeft, Calendar as CalendarIcon
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../context/ThemeContext';

export default function StartupReschedule() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('00:00');
  const [newEndTime, setNewEndTime] = useState('23:59');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const reqsStr = await AsyncStorage.getItem('reschedule_requests');
      if (reqsStr) {
        setRequests(JSON.parse(reqsStr));
      } else {
        setRequests([]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const openRescheduleModal = (req: any) => {
    setSelectedRequest(req);
    // Default to today and tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setNewStartDate(today.toISOString().split('T')[0]);
    setNewEndDate(tomorrow.toISOString().split('T')[0]);
    setNewStartTime('00:00');
    setNewEndTime('23:59');
    
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      const overrideKey = `reschedule_override_${selectedRequest.assessmentId}_${selectedRequest.studentId}`;
      const overrideData = {
        startDate: newStartDate + 'T00:00:00.000Z',
        endDate: newEndDate + 'T00:00:00.000Z',
        startTime: newStartTime,
        endTime: newEndTime
      };
      
      await AsyncStorage.setItem(overrideKey, JSON.stringify(overrideData));
      
      // Remove from requests list
      const updatedRequests = requests.filter(r => r.id !== selectedRequest.id);
      await AsyncStorage.setItem('reschedule_requests', JSON.stringify(updatedRequests));
      
      setRequests(updatedRequests);
      setShowModal(false);
      setSelectedRequest(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeny = async (reqId: string) => {
    try {
       const updatedRequests = requests.filter(r => r.id !== reqId);
       await AsyncStorage.setItem('reschedule_requests', JSON.stringify(updatedRequests));
       setRequests(updatedRequests);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Reschedule Requests</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Manage student extension requests</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Pending Requests</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>You're all caught up!</Text>
          </View>
        ) : (
          requests.map((req, i) => {
            const reqDate = new Date(req.requestedAt).toLocaleDateString();
            return (
              <View key={req.id || i} style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.studentName, { color: colors.text }]}>{req.studentName}</Text>
                    <Text style={[styles.studentEmail, { color: colors.textSecondary }]}>{req.studentEmail}</Text>
                  </View>
                  <Text style={[styles.reqDate, { color: colors.textSecondary }]}>{reqDate}</Text>
                </View>
                
                <View style={[styles.assessmentBox, { backgroundColor: colors.inputBg }]}>
                  <Text style={[styles.assessmentLabel, { color: colors.textSecondary }]}>Requested for:</Text>
                  <Text style={[styles.assessmentTitle, { color: colors.primary }]}>{req.assessmentTitle}</Text>
                </View>
                
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.btn, styles.denyBtn]} onPress={() => handleDeny(req.id)}>
                    <XCircle size={16} color="#ef4444" />
                    <Text style={[styles.btnText, { color: '#ef4444' }]}>Deny</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.approveBtn, { backgroundColor: colors.primary }]} onPress={() => openRescheduleModal(req)}>
                    <CheckCircle size={16} color="#ffffff" />
                    <Text style={[styles.btnText, { color: '#ffffff' }]}>Reschedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Set New Time</Text>
            {selectedRequest && (
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>For {selectedRequest.studentName}</Text>
            )}

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Start Date (YYYY-MM-DD)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <CalendarIcon size={16} color={colors.textSecondary} />
                <TextInput style={[styles.input, { color: colors.text }]} value={newStartDate} onChangeText={setNewStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>End Date (YYYY-MM-DD)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <CalendarIcon size={16} color={colors.textSecondary} />
                <TextInput style={[styles.input, { color: colors.text }]} value={newEndDate} onChangeText={setNewEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Start Time</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Clock size={16} color={colors.textSecondary} />
                  <TextInput style={[styles.input, { color: colors.text }]} value={newStartTime} onChangeText={setNewStartTime} placeholder="HH:MM" placeholderTextColor={colors.textSecondary} />
                </View>
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>End Time</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Clock size={16} color={colors.textSecondary} />
                  <TextInput style={[styles.input, { color: colors.text }]} value={newEndTime} onChangeText={setNewEndTime} placeholder="HH:MM" placeholderTextColor={colors.textSecondary} />
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.inputBg }]} onPress={() => setShowModal(false)}>
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleApprove}>
                <Text style={[styles.modalBtnText, { color: '#ffffff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, borderBottomWidth: 1, gap: 16 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100, opacity: 0.7 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySub: { fontSize: 14, marginTop: 4 },
  
  card: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  studentName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  studentEmail: { fontSize: 13 },
  reqDate: { fontSize: 12 },
  
  assessmentBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
  assessmentLabel: { fontSize: 12, marginBottom: 4 },
  assessmentTitle: { fontSize: 14, fontWeight: '700' },
  
  actions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 8 },
  denyBtn: { backgroundColor: '#ef444415' },
  approveBtn: {},
  btnText: { fontSize: 14, fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 400, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSub: { fontSize: 14, marginBottom: 20, marginTop: 4 },
  
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 44, gap: 10 },
  input: { flex: 1, fontSize: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
  
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '700' }
});
