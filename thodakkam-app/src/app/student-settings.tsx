import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  TextInput, Platform, SafeAreaView, Alert 
} from 'react-native';
import { Sun, Moon, Shield, KeyRound, Eye, EyeOff, Save, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StudentHeader from '../components/StudentHeader';
import { useAppTheme } from '../context/ThemeContext';

const GREEN = '#10b981';

const BACKEND_URL = Platform.OS === 'android' ? 'https://thodakkam-1.onrender.com' : 'https://thodakkam-1.onrender.com';

export default function StudentSettings() {
  const router = useRouter();
  
  const { theme, setTheme, colors } = useAppTheme();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    setIsUpdating(true);

    try {
      const storedId = await AsyncStorage.getItem('studentUserId');
      if (!storedId) {
        Alert.alert('Error', 'User ID not found. Please log in again.');
        setIsUpdating(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/user/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: storedId,
          currentPassword: currentPassword,
          newPassword: newPassword
        })
      });

      const data = await res.json();
      
      if (data.success) {
        Alert.alert('Success', 'Your password has been successfully updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', data.message || 'Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error. Could not reach the server.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StudentHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: colors.headerTitle }]}>Account Settings</Text>
          </View>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>Manage your account security and application appearance.</Text>
        </View>

        {/* Appearance Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Sun size={20} color={colors.primary} style={styles.cardIcon} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Appearance</Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Customize how the platform looks for you.</Text>
          
          <View style={styles.themeRow}>
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { backgroundColor: colors.inputBg, borderColor: 'transparent' },
                theme === 'light' && { backgroundColor: '#fdfaef', borderColor: colors.primary }
              ]}
              onPress={() => setTheme('light')}
              activeOpacity={0.8}
            >
              <Sun size={20} color={theme === 'light' ? colors.primary : colors.textSecondary} />
              <Text style={[styles.themeText, { color: theme === 'light' ? colors.primary : colors.text }]}>Light Mode</Text>
              {theme === 'light' && (
                <View style={styles.checkIconWrapper}>
                  <Text style={styles.checkIconText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { backgroundColor: colors.inputBg, borderColor: 'transparent' },
                theme === 'dark' && { backgroundColor: '#2e1065', borderColor: colors.primary }
              ]}
              onPress={() => setTheme('dark')}
              activeOpacity={0.8}
            >
              <Moon size={20} color={theme === 'dark' ? colors.primary : colors.textSecondary} />
              <Text style={[styles.themeText, { color: theme === 'dark' ? colors.primary : colors.text }]}>Dark Mode</Text>
              {theme === 'dark' && (
                <View style={styles.checkIconWrapper}>
                  <Text style={styles.checkIconText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Change Password Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Shield size={20} color={colors.primary} style={styles.cardIcon} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Change Password</Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Keep your account secure by updating your password regularly.</Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Current Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <KeyRound size={18} color={colors.textSecondary} style={styles.inputPrefix} />
              <TextInput 
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter current password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                {showCurrentPassword ? <Eye size={18} color={colors.textSecondary} /> : <EyeOff size={18} color={colors.textSecondary} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rowGroup}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <KeyRound size={18} color={colors.textSecondary} style={styles.inputPrefix} />
                <TextInput 
                  style={[styles.input, { color: colors.text }]}
                  placeholder="New password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <Eye size={18} color={colors.textSecondary} /> : <EyeOff size={18} color={colors.textSecondary} />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm New Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <KeyRound size={18} color={colors.textSecondary} style={styles.inputPrefix} />
                <TextInput 
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <Eye size={18} color={colors.textSecondary} /> : <EyeOff size={18} color={colors.textSecondary} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.updateBtn, { backgroundColor: colors.primary }, isUpdating && styles.updateBtnDisabled]} 
              onPress={handleUpdatePassword}
              disabled={isUpdating}
            >
              <Save size={18} color={'#ffffff'} />
              <Text style={styles.updateBtnText}>{isUpdating ? 'Updating...' : 'Update Password'}</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60, alignItems: 'center' },
  
  headerSection: { 
    width: '100%', 
    maxWidth: 800, 
    marginBottom: 32, 
    marginTop: 16,
    paddingHorizontal: 8
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
    minHeight: 44
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 10,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
      default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
    })
  },
  pageTitle: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  pageSubtitle: { fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },

  card: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 800,
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.04)' },
      default: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }
    })
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardIcon: { marginRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardSubtitle: { fontSize: 14, marginBottom: 24 },

  themeRow: { flexDirection: 'row', gap: 16 },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 2,
    gap: 8
  },
  themeText: { fontSize: 15, fontWeight: '600' },
  checkIconWrapper: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: GREEN,
    justifyContent: 'center', alignItems: 'center'
  },
  checkIconText: { color: GREEN, fontSize: 12, fontWeight: '800' },

  rowGroup: { flexDirection: 'row', gap: 16, ...Platform.select({ default: { flexWrap: 'wrap' }, web: {} }) },
  formGroup: { marginBottom: 20, width: Platform.OS !== 'web' ? '100%' : 'auto' },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 52, paddingHorizontal: 16,
    overflow: 'hidden'
  },
  inputPrefix: { marginRight: 12 },
  input: { 
    flex: 1, 
    fontSize: 14, 
    height: '100%',
    backgroundColor: 'transparent',
    ...Platform.select({ web: { outlineStyle: 'none' } as any })
  },
  eyeBtn: { padding: 4, marginLeft: 8 },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  updateBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 12, gap: 8,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(90, 39, 155, 0.25)' },
      default: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
    })
  },
  updateBtnDisabled: { opacity: 0.7 },
  updateBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' }
});
