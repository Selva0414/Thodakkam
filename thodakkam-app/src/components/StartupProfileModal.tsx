import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  TextInput, Image, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../context/ThemeContext';

interface StartupProfileModalProps {
  visible: boolean;
  onClose: () => void;
  companyName: string;
}

export default function StartupProfileModal({ visible, onClose, companyName }: StartupProfileModalProps) {
  const { colors, isDark } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Super Admin');
  const [timezone, setTimezone] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    if (visible && companyName) {
      fetchProfile();
    }
  }, [visible, companyName]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://thodakkam.onrender.com/api/startup/profile/${encodeURIComponent(companyName)}`);
      const data = await response.json();
      if (data.success && data.startup) {
        setFullName(data.startup.founderName || '');
        setEmail(data.startup.email || '');
        setRole(data.startup.role || 'Super Admin');
        setTimezone(data.startup.timezone || '(GMT-08:00) Pacific Time');
        setBio(data.startup.bio || '');
        setProfilePhoto(data.startup.founderImage || data.startup.profilePhoto);
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
      const response = await fetch(`https://thodakkam.onrender.com/api/startup/profile/${encodeURIComponent(companyName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderName: fullName,
          email,
          role,
          timezone,
          bio,
          profilePhoto
        })
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditing(false);
      } else {
        Alert.alert('Error', data.message || 'Could not update profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Server error');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      setProfilePhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const removeImage = () => {
    setProfilePhoto(null);
  };

  const handleClose = () => {
    if (isEditing) {
      setIsEditing(false);
      fetchProfile(); // Reset to original data
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Profile Information</Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              {/* Avatar Section */}
              <View style={styles.avatarRow}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Text style={[styles.avatarPlaceholderText, { color: colors.textSecondary }]}>{fullName.substring(0, 2).toUpperCase() || companyName.substring(0, 2).toUpperCase()}</Text>
                  </View>
                )}
                
                <View style={styles.avatarActions}>
                  {isEditing && (
                    <>
                      <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: colors.primary }]} onPress={pickImage}>
                        <Text style={styles.uploadBtnText}>Upload New</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.removeBtn} onPress={removeImage}>
                        <Text style={[styles.removeBtnText, { color: isDark ? colors.danger : '#ef4444' }]}>Remove</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              {/* Form Fields */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>FULL NAME</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.primary }, !isEditing && { borderColor: 'transparent', backgroundColor: colors.card, color: colors.textSecondary }]} value={fullName} onChangeText={setFullName} editable={isEditing} />

              <Text style={[styles.label, { color: colors.textSecondary }]}>EMAIL</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.primary }, !isEditing && { borderColor: 'transparent', backgroundColor: colors.card, color: colors.textSecondary }]} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" editable={isEditing} />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>ROLE</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.primary }, !isEditing && { borderColor: 'transparent', backgroundColor: colors.card, color: colors.textSecondary }]} value={role} onChangeText={setRole} editable={isEditing} />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>TIMEZONE</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.primary }, !isEditing && { borderColor: 'transparent', backgroundColor: colors.card, color: colors.textSecondary }]} value={timezone} onChangeText={setTimezone} editable={isEditing} />
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>BIO</Text>
              <TextInput 
                style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.primary }, !isEditing && { borderColor: 'transparent', backgroundColor: colors.card, color: colors.textSecondary }]} 
                value={bio} 
                onChangeText={setBio} 
                multiline 
                numberOfLines={4} 
                editable={isEditing}
              />

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={[styles.cancelBtnText, { color: colors.text }]}>{isEditing ? 'Cancel' : 'Close'}</Text>
                </TouchableOpacity>
                {isEditing ? (
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
                    {saving ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={() => setIsEditing(true)}>
                    <Text style={styles.saveBtnText}>Edit Profile</Text>
                  </TouchableOpacity>
                )}
              </View>

            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', maxWidth: 500, maxHeight: '90%', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 24 },
  
  scrollContent: { paddingBottom: 20 },

  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 24 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  avatarPlaceholderText: { fontSize: 24, fontWeight: '700' },
  
  avatarActions: { flex: 1, alignItems: 'flex-start' },
  uploadBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginBottom: 12 },
  uploadBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  removeBtn: { paddingHorizontal: 16 },
  removeBtnText: { fontSize: 13, fontWeight: '600' },

  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, borderWidth: 1 },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 32 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, marginRight: 12 },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  saveBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, minWidth: 120, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
