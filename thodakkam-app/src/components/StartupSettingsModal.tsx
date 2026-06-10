import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Switch, ScrollView, Platform
} from 'react-native';
import { Sun, Moon, X } from 'lucide-react-native';

const PRIMARY = '#662483';
const BG = '#ffffff';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

interface StartupSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function StartupSettingsModal({ visible, onClose }: StartupSettingsModalProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [newRegistrations, setNewRegistrations] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [investorActivity, setInvestorActivity] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Preferences</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={TEXT_GRAY} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Appearance */}
            <Text style={styles.sectionLabel}>APPEARANCE</Text>
            <View style={styles.themeRow}>
              <TouchableOpacity 
                style={[styles.themeOption, theme === 'light' && styles.themeOptionActive]}
                onPress={() => setTheme('light')}
              >
                <Sun size={24} color={theme === 'light' ? PRIMARY : TEXT_GRAY} />
                <Text style={[styles.themeText, theme === 'light' && styles.themeTextActive]}>Light</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.themeOption, theme === 'dark' && styles.themeOptionActive]}
                onPress={() => setTheme('dark')}
              >
                <Moon size={24} color={theme === 'dark' ? PRIMARY : TEXT_GRAY} />
                <Text style={[styles.themeText, theme === 'dark' && styles.themeTextActive]}>Dark</Text>
              </TouchableOpacity>
            </View>

            {/* System Notifications */}
            <Text style={[styles.sectionLabel, { marginTop: 32 }]}>SYSTEM NOTIFICATIONS</Text>
            
            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>New Registrations</Text>
                <Text style={styles.notificationDesc}>Alert for every new user join</Text>
              </View>
              <Switch
                trackColor={{ false: '#e2e8f0', true: PRIMARY }}
                thumbColor={WHITE}
                ios_backgroundColor="#e2e8f0"
                onValueChange={setNewRegistrations}
                value={newRegistrations}
              />
            </View>

            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Weekly Reports</Text>
                <Text style={styles.notificationDesc}>Sunday morning performance digest</Text>
              </View>
              <Switch
                trackColor={{ false: '#e2e8f0', true: PRIMARY }}
                thumbColor={WHITE}
                ios_backgroundColor="#e2e8f0"
                onValueChange={setWeeklyReports}
                value={weeklyReports}
              />
            </View>

            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Investor Activity</Text>
                <Text style={styles.notificationDesc}>Funding and stakeholders alerts</Text>
              </View>
              <Switch
                trackColor={{ false: '#e2e8f0', true: PRIMARY }}
                thumbColor={WHITE}
                ios_backgroundColor="#e2e8f0"
                onValueChange={setInvestorActivity}
                value={investorActivity}
              />
            </View>
            
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', maxWidth: 400, backgroundColor: WHITE, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: TEXT_DARK },
  closeBtn: { padding: 4, backgroundColor: '#f1f5f9', borderRadius: 20 },
  
  scrollContent: { paddingBottom: 10 },
  
  sectionLabel: { fontSize: 11, fontWeight: '800', color: TEXT_GRAY, letterSpacing: 1, marginBottom: 12 },
  
  themeRow: { flexDirection: 'row', gap: 12 },
  themeOption: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  themeOptionActive: { backgroundColor: '#fdfaef', borderColor: PRIMARY },
  themeText: { marginTop: 8, fontSize: 14, fontWeight: '600', color: TEXT_GRAY },
  themeTextActive: { color: PRIMARY },

  notificationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  notificationInfo: { flex: 1, paddingRight: 16 },
  notificationTitle: { fontSize: 15, fontWeight: '600', color: TEXT_DARK, marginBottom: 4 },
  notificationDesc: { fontSize: 12, color: TEXT_GRAY },
});
