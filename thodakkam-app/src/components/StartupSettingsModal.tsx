import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Switch, ScrollView, Platform
} from 'react-native';
import { Sun, Moon, X } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';

interface StartupSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function StartupSettingsModal({ visible, onClose }: StartupSettingsModalProps) {
  const { colors, isDark, toggleTheme } = useAppTheme();
  
  const [newRegistrations, setNewRegistrations] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [investorActivity, setInvestorActivity] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.modalContainer, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
          
          <View style={styles.header}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Preferences</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Appearance */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPEARANCE</Text>
            <View style={styles.themeRow}>
              <TouchableOpacity 
                style={[styles.themeOption, { backgroundColor: colors.card, borderColor: colors.border }, !isDark && { borderColor: colors.primary, backgroundColor: isDark ? colors.primary + '20' : '#fef2f2' }]}
                onPress={() => { if (isDark) toggleTheme(); }}
              >
                <Sun size={24} color={!isDark ? colors.primary : colors.textSecondary} />
                <Text style={[styles.themeText, { color: colors.textSecondary }, !isDark && { color: colors.primary }]}>Light</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.themeOption, { backgroundColor: colors.card, borderColor: colors.border }, isDark && { borderColor: colors.primary, backgroundColor: isDark ? colors.primary + '20' : '#f0fdfa' }]}
                onPress={() => { if (!isDark) toggleTheme(); }}
              >
                <Moon size={24} color={isDark ? colors.primary : colors.textSecondary} />
                <Text style={[styles.themeText, { color: colors.textSecondary }, isDark && { color: colors.primary }]}>Dark</Text>
              </TouchableOpacity>
            </View>

            {/* System Notifications */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 32 }]}>SYSTEM NOTIFICATIONS</Text>
            
            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Text style={[styles.notificationTitle, { color: colors.text }]}>New Registrations</Text>
                <Text style={[styles.notificationDesc, { color: colors.textSecondary }]}>Alert for every new user join</Text>
              </View>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDark ? colors.text : '#ffffff'}
                ios_backgroundColor={colors.border}
                onValueChange={setNewRegistrations}
                value={newRegistrations}
              />
            </View>

            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Text style={[styles.notificationTitle, { color: colors.text }]}>Weekly Reports</Text>
                <Text style={[styles.notificationDesc, { color: colors.textSecondary }]}>Sunday morning performance digest</Text>
              </View>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDark ? colors.text : '#ffffff'}
                ios_backgroundColor={colors.border}
                onValueChange={setWeeklyReports}
                value={weeklyReports}
              />
            </View>

            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Text style={[styles.notificationTitle, { color: colors.text }]}>Investor Activity</Text>
                <Text style={[styles.notificationDesc, { color: colors.textSecondary }]}>Funding and stakeholders alerts</Text>
              </View>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDark ? colors.text : '#ffffff'}
                ios_backgroundColor={colors.border}
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    maxHeight: '85%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
      android: { elevation: 10 },
      web: { boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }
    })
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  themeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  notificationInfo: {
    flex: 1,
    paddingRight: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  notificationDesc: {
    fontSize: 13,
  },
});
