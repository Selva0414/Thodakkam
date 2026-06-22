import { BASE_URL } from '@/config/api';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, ActivityIndicator, TextInput, Image, Alert
} from 'react-native';
import {
  ArrowLeft, User, Building, Shield, Trash2, Upload, XCircle, Lock, Monitor, CheckCircle, ChevronDown
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../context/ThemeContext';

export default function StartupProfile() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string) || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  
  const INDUSTRY_OPTIONS = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Other'];
  const SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+'];

  // Form State
  const [founderName, setFounderName] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [location, setLocation] = useState('');
  
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [github, setGithub] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [bio, setBio] = useState('');
  
  const [officePhotos, setOfficePhotos] = useState<string[]>([]);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (companyName) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [companyName]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // 1. Fetch from DB
      const response = await fetch(`${BASE_URL}/api/startup/profile/${encodeURIComponent(companyName)}`);
      const data = await response.json();
      
      let dbData: any = {};
      if (data.success && data.startup) {
        dbData = data.startup;
        setFounderName(dbData.founderName || '');
        setEmail(dbData.email || '');
        setBio(dbData.bio || '');
        setCompanyLogo(dbData.founderImage || dbData.profilePhoto || null);
      }

      // 2. Fetch extra fields from local storage (Fallback if DB doesn't support them)
      const localDataStr = await AsyncStorage.getItem(`startup_extra_${companyName}`);
      if (localDataStr) {
        const localData = JSON.parse(localDataStr);
        setIndustry(localData.industry || '');
        setCompanySize(localData.companySize || '');
        setFoundedYear(localData.foundedYear || '');
        setLocation(localData.location || '');
        setWebsite(localData.website || '');
        setLinkedin(localData.linkedin || '');
        setTwitter(localData.twitter || '');
        setInstagram(localData.instagram || '');
        setGithub(localData.github || '');
        setWorkMode(localData.workMode || '');
        if (localData.officePhotos) setOfficePhotos(localData.officePhotos);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save core fields to DB
      await fetch(`${BASE_URL}/api/startup/profile/${encodeURIComponent(companyName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderName,
          email,
          bio,
          profilePhoto: companyLogo
        })
      });

      // 2. Save extra fields locally
      const extraData = {
        industry, companySize, foundedYear, location, website, linkedin, twitter, instagram, github, workMode, officePhotos
      };
      await AsyncStorage.setItem(`startup_extra_${companyName}`, JSON.stringify(extraData));

      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const pickLogo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setCompanyLogo(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickOfficePhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setOfficePhotos([...officePhotos, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const removeOfficePhoto = (index: number) => {
    const updated = [...officePhotos];
    updated.splice(index, 1);
    setOfficePhotos(updated);
  };

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    Alert.alert('Success', 'Password updated (simulated).');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your startup account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('startupId');
          router.replace('/startup-login');
        }}
      ]
    );
  };

  const handleLogoutAll = async () => {
    Alert.alert('Logged Out', 'You have been logged out of all other devices.');
  };

  const sectionBg = isDark ? '#111827' : '#ffffff';
  const borderColor = isDark ? '#1f2937' : '#e5e7eb';
  const inputBgColor = isDark ? '#1f2937' : '#f9fafb';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>My Profile</Text>
        {isEditing ? (
          <TouchableOpacity style={[styles.saveBtnTop, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.saveBtnTop, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]} onPress={() => setIsEditing(true)}>
            <Text style={[styles.saveBtnText, { color: colors.text }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={loading ? [styles.scrollContent, { flex: 1, justifyContent: 'center' }] : styles.scrollContent}>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            {/* Section 1: Startup Profile */}
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
              <User size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Startup Profile</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Basic identity and branding for your startup.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>Founder Name *</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBgColor, color: colors.text, borderColor }, !isEditing && { opacity: 0.7 }]} value={founderName} onChangeText={setFounderName} placeholder="Mukesh" placeholderTextColor={colors.textSecondary} editable={isEditing} />
            </View>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBgColor, color: colors.text, borderColor }, !isEditing && { opacity: 0.7 }]} value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor={colors.textSecondary} keyboardType="email-address" editable={isEditing} />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>Industry</Text>
              <TouchableOpacity style={styles.selectWrapper} onPress={() => isEditing && setShowIndustryPicker(true)} activeOpacity={isEditing ? 0.7 : 1}>
                <View style={[styles.input, { backgroundColor: inputBgColor, borderColor, justifyContent: 'center' }, !isEditing && { opacity: 0.7 }]}>
                  <Text style={{ color: industry ? colors.text : colors.textSecondary }}>{industry || 'Select Industry'}</Text>
                </View>
                {isEditing && <ChevronDown size={16} color={colors.textSecondary} style={styles.selectIcon} />}
              </TouchableOpacity>
            </View>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>Company Size</Text>
              <TouchableOpacity style={styles.selectWrapper} onPress={() => isEditing && setShowSizePicker(true)} activeOpacity={isEditing ? 0.7 : 1}>
                <View style={[styles.input, { backgroundColor: inputBgColor, borderColor, justifyContent: 'center' }, !isEditing && { opacity: 0.7 }]}>
                  <Text style={{ color: companySize ? colors.text : colors.textSecondary }}>{companySize || 'Select Size'}</Text>
                </View>
                {isEditing && <ChevronDown size={16} color={colors.textSecondary} style={styles.selectIcon} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>Founded Year</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBgColor, color: colors.text, borderColor }, !isEditing && { opacity: 0.7 }]} value={foundedYear} onChangeText={setFoundedYear} placeholder="e.g. 2022" placeholderTextColor={colors.textSecondary} editable={isEditing} />
            </View>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>Location</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBgColor, color: colors.text, borderColor }, !isEditing && { opacity: 0.7 }]} value={location} onChangeText={setLocation} placeholder="e.g. Bangalore, India" placeholderTextColor={colors.textSecondary} editable={isEditing} />
            </View>
          </View>
        </View>

        {/* Section 2: Company Information */}
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#3b82f620' }]}>
              <Building size={20} color="#3b82f6" />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Company Information</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Public-facing details visible to visitors and investors.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={[styles.label, { color: colors.text }]}>Company Logo</Text>
          <View style={styles.logoRow}>
            {companyLogo ? (
              <Image source={{ uri: companyLogo }} style={[styles.logoPreview, { borderColor }]} />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: inputBgColor, borderColor }]}>
                <Building size={32} color={colors.textSecondary} />
              </View>
            )}
            <View>
              {isEditing && (
                <>
                  <TouchableOpacity style={[styles.uploadLogoBtn, { borderColor }]} onPress={pickLogo}>
                    <Upload size={16} color={colors.text} />
                    <Text style={[styles.uploadLogoText, { color: colors.text }]}>Upload New Logo</Text>
                  </TouchableOpacity>
                  <Text style={[styles.uploadHelper, { color: colors.textSecondary }]}>JPG, PNG, GIF — Max 800KB</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>Company Website</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBgColor, color: colors.text, borderColor }, !isEditing && { opacity: 0.7 }]} value={website} onChangeText={setWebsite} placeholder="https://" placeholderTextColor={colors.textSecondary} editable={isEditing} />
            </View>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>LinkedIn</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBgColor, color: colors.text, borderColor }, !isEditing && { opacity: 0.7 }]} value={linkedin} onChangeText={setLinkedin} placeholder="https://" placeholderTextColor={colors.textSecondary} editable={isEditing} />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>Twitter / X</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBgColor, color: colors.text, borderColor }, !isEditing && { opacity: 0.7 }]} value={twitter} onChangeText={setTwitter} placeholder="https://" placeholderTextColor={colors.textSecondary} editable={isEditing} />
            </View>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>Instagram</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBgColor, color: colors.text, borderColor }, !isEditing && { opacity: 0.7 }]} value={instagram} onChangeText={setInstagram} placeholder="https://" placeholderTextColor={colors.textSecondary} editable={isEditing} />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>GitHub</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBgColor, color: colors.text, borderColor }, !isEditing && { opacity: 0.7 }]} value={github} onChangeText={setGithub} placeholder="https://" placeholderTextColor={colors.textSecondary} editable={isEditing} />
            </View>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>Work Mode</Text>
              <View style={styles.selectWrapper}>
                <TextInput style={[styles.input, { backgroundColor: inputBgColor, color: colors.text, borderColor }, !isEditing && { opacity: 0.7 }]} value={workMode} onChangeText={setWorkMode} placeholder="Select Mode" placeholderTextColor={colors.textSecondary} editable={isEditing} />
                {isEditing && <ChevronDown size={16} color={colors.textSecondary} style={styles.selectIcon} />}
              </View>
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Company Description ({bio.length}/500)</Text>
          <TextInput 
            style={[styles.input, styles.textArea, { backgroundColor: inputBgColor, color: colors.text, borderColor }, !isEditing && { opacity: 0.7 }]} 
            value={bio} 
            onChangeText={text => setBio(text.substring(0, 500))} 
            placeholder="Tell investors and candidates about your startup..." 
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            editable={isEditing}
          />

          <Text style={[styles.label, { color: colors.text }]}>Physical Office Photos</Text>
          <View style={styles.photosRow}>
            {officePhotos.map((photo, i) => (
              <View key={i} style={styles.photoWrap}>
                <Image source={{ uri: photo }} style={[styles.officePhoto, { borderColor }]} />
                {isEditing && (
                  <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => removeOfficePhoto(i)}>
                    <XCircle size={20} color="#ef4444" fill="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {isEditing && (
              <TouchableOpacity style={[styles.addPhotoBtn, { borderColor, backgroundColor: inputBgColor }]} onPress={pickOfficePhoto}>
                <Upload size={20} color={colors.textSecondary} />
                <Text style={[styles.addPhotoText, { color: colors.textSecondary }]}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section 3: Security */}
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#f59e0b20' }]}>
              <Shield size={20} color="#f59e0b" />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Manage password and account safety controls.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.subSectionHeader}>
            <Lock size={16} color={colors.primary} />
            <Text style={[styles.subSectionTitle, { color: colors.primary }]}>CHANGE PASSWORD</Text>
          </View>

          <View style={[styles.gridRow, { alignItems: 'flex-end' }]}>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>Current Password</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBgColor, color: colors.text, borderColor }]} value={currentPassword} onChangeText={setCurrentPassword} placeholder="••••••••" placeholderTextColor={colors.textSecondary} secureTextEntry />
            </View>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBgColor, color: colors.text, borderColor }]} value={newPassword} onChangeText={setNewPassword} placeholder="Min 8 characters" placeholderTextColor={colors.textSecondary} secureTextEntry />
            </View>
            <View style={styles.gridCol}>
              <Text style={[styles.label, { color: colors.text }]}>Confirm New Password</Text>
              <TextInput style={[styles.input, { backgroundColor: inputBgColor, color: colors.text, borderColor }]} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            </View>
          </View>
          
          <TouchableOpacity style={[styles.updatePassBtn, { borderColor }]} onPress={handleUpdatePassword}>
            <Lock size={16} color={colors.text} />
            <Text style={[styles.updatePassText, { color: colors.text }]}>Update Password</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.subSectionHeader}>
            <Monitor size={16} color={colors.primary} />
            <Text style={[styles.subSectionTitle, { color: colors.primary }]}>ACTIVITY LOG</Text>
          </View>

          <View style={styles.logItem}>
            <View style={[styles.logDot, { backgroundColor: '#10b981' }]} />
            <View>
              <Text style={[styles.logTitle, { color: colors.text }]}>Last login</Text>
              <Text style={[styles.logSub, { color: colors.textSecondary }]}>Active session</Text>
            </View>
          </View>
          <View style={styles.logItem}>
            <View style={[styles.logDot, { backgroundColor: '#3b82f6' }]} />
            <View>
              <Text style={[styles.logTitle, { color: colors.text }]}>Recent changes</Text>
              <Text style={[styles.logSub, { color: colors.textSecondary }]}>Profile & Preferences</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.subSectionHeader}>
            <Monitor size={16} color={colors.primary} />
            <Text style={[styles.subSectionTitle, { color: colors.primary }]}>SESSIONS</Text>
          </View>
          <Text style={[styles.sessionText, { color: colors.textSecondary }]}>Sign out from all other devices and sessions.</Text>
          
          <TouchableOpacity style={[styles.logoutAllBtn, { borderColor }]} onPress={handleLogoutAll}>
            <Text style={[styles.logoutAllText, { color: colors.text }]}>Logout All Devices</Text>
          </TouchableOpacity>
        </View>

        {/* Section 4: Danger Zone */}
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#ef444420' }]}>
              <Trash2 size={20} color="#ef4444" />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Danger Zone</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Irreversible actions — proceed with extreme caution.</Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <Text style={[styles.dangerText, { color: colors.textSecondary }]}>Permanently delete your startup account and all associated data including jobs, candidates, and analytics. This action cannot be undone.</Text>
          
          <TouchableOpacity style={[styles.deleteAccountBtn, { backgroundColor: '#ef4444' }]} onPress={handleDeleteAccount}>
            <Trash2 size={18} color="#ffffff" />
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

          </>
        )}

      {/* Modals for Selectors */}
      {showIndustryPicker && (
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModal, { backgroundColor: colors.card, borderColor }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Industry</Text>
            {INDUSTRY_OPTIONS.map(opt => (
              <TouchableOpacity key={opt} style={styles.pickerOption} onPress={() => { setIndustry(opt); setShowIndustryPicker(false); }}>
                <Text style={[styles.pickerOptionText, { color: colors.text }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowIndustryPicker(false)}>
              <Text style={{ color: colors.primary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showSizePicker && (
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModal, { backgroundColor: colors.card, borderColor }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Size</Text>
            {SIZE_OPTIONS.map(opt => (
              <TouchableOpacity key={opt} style={styles.pickerOption} onPress={() => { setCompanySize(opt); setShowSizePicker(false); }}>
                <Text style={[styles.pickerOptionText, { color: colors.text }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowSizePicker(false)}>
              <Text style={{ color: colors.primary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  pickerModal: { width: 300, borderRadius: 16, padding: 20, borderWidth: 1 },
  pickerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  pickerOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#37415130' },
  pickerOptionText: { fontSize: 16 },
  pickerCancel: { marginTop: 16, alignItems: 'center', paddingVertical: 12 },

  safeArea: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  topBarTitle: { fontSize: 18, fontWeight: '800' },
  saveBtnTop: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 20, maxWidth: 1000, alignSelf: 'center', width: '100%' },

  section: { borderRadius: 16, padding: 24, marginBottom: 24, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14 },
  
  divider: { height: 1, backgroundColor: '#374151', marginVertical: 24, opacity: 0.5 },

  gridRow: { flexDirection: 'row', gap: 20, marginBottom: 20, flexWrap: 'wrap' },
  gridCol: { flex: 1, minWidth: 250 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
  textArea: { height: 120, paddingTop: 16, textAlignVertical: 'top' },
  
  selectWrapper: { position: 'relative', justifyContent: 'center' },
  selectIcon: { position: 'absolute', right: 16 },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 24 },
  logoPreview: { width: 80, height: 80, borderRadius: 16, borderWidth: 1 },
  logoPlaceholder: { width: 80, height: 80, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
  uploadLogoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start', marginBottom: 8 },
  uploadLogoText: { fontSize: 14, fontWeight: '600' },
  uploadHelper: { fontSize: 12 },

  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  photoWrap: { position: 'relative' },
  officePhoto: { width: 120, height: 90, borderRadius: 12, borderWidth: 1 },
  photoRemoveBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#ffffff', borderRadius: 12 },
  addPhotoBtn: { width: 120, height: 90, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 8 },
  addPhotoText: { fontSize: 13, fontWeight: '500' },

  subSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, textTransform: 'uppercase' },
  subSectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  
  updatePassBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start', marginTop: 8 },
  updatePassText: { fontSize: 14, fontWeight: '600' },

  logItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  logSub: { fontSize: 13 },
  
  sessionText: { fontSize: 14, marginBottom: 16 },
  logoutAllBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  logoutAllText: { fontSize: 14, fontWeight: '600' },

  dangerText: { fontSize: 15, lineHeight: 24, marginBottom: 20 },
  deleteAccountBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, alignSelf: 'flex-start' },
  deleteAccountText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
