import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Image, Platform, SafeAreaView, ActivityIndicator, Linking, Animated } from 'react-native';
import { Camera, X, Plus, FileText, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import StudentHeader from '../components/StudentHeader';
import { userStore, updateGlobalUser } from '../utils/userStore';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../context/ThemeContext';

export default function StudentProfile() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const [profile, setProfile] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    location: '',
    profilePhoto: null as string | null,
    resumeName: '',
    resumeFile: null as string | null,
    skills: [] as string[],
    newSkill: '',
    education: [] as any[],
    experience: [] as any[],
    portfolioUrl: '',
    githubUrl: '',
    linkedinUrl: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      let id = userStore.id;
      if (!id) {
        const stored = await AsyncStorage.getItem('studentUserId');
        if (stored) id = stored;
      }
      if (!id) id = '8bbe6fc3-2716-4821-b967-35b0689cbf11';

      setUserId(id);
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam.onrender.com' : 'https://thodakkam.onrender.com';
      const response = await fetch(`${baseUrl}/api/user/${id}`);
      const json = await response.json();

      if (json.success && json.user) {
        const u = json.user;
        setProfile({
          ...profile,
          fullName: u.fullName || '',
          username: u.fullName ? u.fullName.split(' ')[0] : '',
          email: u.email || '',
          phone: u.phone || '',
          location: u.location || '',
          profilePhoto: u.profilePhoto || null,
          resumeName: u.resumeFile ? 'Existing Resume Attached' : '',
          resumeFile: u.resumeFile || null,
          skills: Array.isArray(u.skills) ? u.skills : [],
          education: Array.isArray(u.education) ? u.education.map((e:any) => ({...e, cgpa: e.cgpa || (e.description?.includes('CGPA') ? e.description.replace('CGPA: ', '') : '')})) : (typeof u.education === 'string' ? JSON.parse(u.education).map((e:any) => ({...e, cgpa: e.cgpa || (e.description?.includes('CGPA') ? e.description.replace('CGPA: ', '') : '')})) : (typeof u.education === 'object' && u.education !== null ? [{...u.education, cgpa: u.education.cgpa || (u.education.description?.includes('CGPA') ? u.education.description.replace('CGPA: ', '') : '')}] : [])),
          experience: Array.isArray(u.experience) ? u.experience : (typeof u.experience === 'string' ? JSON.parse(u.experience) : (typeof u.experience === 'object' && u.experience !== null ? [u.experience] : [])),
          portfolioUrl: u.portfolioUrl || '',
          githubUrl: u.githubUrl || '',
          linkedinUrl: u.linkedinUrl || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam.onrender.com' : 'https://thodakkam.onrender.com';
      const res = await fetch(`${baseUrl}/api/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profile.fullName,
          phone: profile.phone,
          location: profile.location,
          profilePhoto: profile.profilePhoto,
          resumeFile: profile.resumeFile,
          skills: profile.skills,
          education: profile.education,
          experience: profile.experience,
          portfolioUrl: profile.portfolioUrl,
          githubUrl: profile.githubUrl,
          linkedinUrl: profile.linkedinUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        updateGlobalUser({
          name: profile.fullName,
          profilePhoto: profile.profilePhoto,
          phone: profile.phone
        });
        alert('Profile saved successfully!');
        setIsEditing(false);
      } else {
        alert(data.message || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    if (!isEditing) return;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfile({ ...profile, profilePhoto: result.assets[0].uri });
    }
  };

  const handleResumeClick = async () => {
    if (isEditing) {
      try {
        const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
        if (!res.canceled && res.assets && res.assets.length > 0) {
          setProfile({ ...profile, resumeFile: res.assets[0].uri, resumeName: res.assets[0].name });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      if (profile.resumeFile) {
        try {
          if (Platform.OS === 'web' && profile.resumeFile.startsWith('data:application/pdf;base64,')) {
            const base64Data = profile.resumeFile.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
          } else {
            await Linking.openURL(profile.resumeFile);
          }
        } catch (e) {
          alert('Could not open resume');
        }
      } else {
        alert('No resume available');
      }
    }
  };

  const addSkill = () => {
    if (profile.newSkill.trim() && !profile.skills.includes(profile.newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, profile.newSkill.trim()], newSkill: '' });
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  const addEducation = () => {
    setProfile({
      ...profile,
      education: [...profile.education, { institution: '', degree: '', startYear: '', endYear: '', cgpa: '' }]
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const newEd = [...profile.education];
    newEd[index][field] = value;
    setProfile({ ...profile, education: newEd });
  };

  const addExperience = () => {
    setProfile({
      ...profile,
      experience: [...profile.experience, { company: '', role: '', startDate: '', endDate: '', description: '' }]
    });
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const newExp = [...profile.experience];
    newExp[index][field] = value;
    setProfile({ ...profile, experience: newExp });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StudentHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StudentHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => { if (router.canGoBack()) { router.back(); } else { router.navigate('/student-dashboard'); } }} style={styles.backBtn}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: colors.text }]}>My Profile</Text>
          </View>
          {isEditing ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.border }]} onPress={() => { setIsEditing(false); fetchProfile(); }}>
                <Text style={[styles.saveBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
                <Text style={[styles.saveBtnText, { color: '#ffffff' }]}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={() => setIsEditing(true)}>
              <Text style={[styles.saveBtnText, { color: '#ffffff' }]}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Photo Section */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.photoRow}>
            <View style={styles.photoContainer}>
              {profile.profilePhoto ? (
                <Image source={{ uri: profile.profilePhoto }} style={styles.photoImg} />
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.photoPlaceholderText}>{profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}</Text>
                </View>
              )}
              {isEditing && (
                <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: colors.primary, borderColor: colors.card }]} onPress={pickImage}>
                  <Camera size={14} color={'#ffffff'} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.photoTextWrap}>
              <Text style={[styles.photoTitle, { color: colors.text }]}>Profile Photo</Text>
              <Text style={[styles.photoSubtitle, { color: colors.textSecondary }]}>Update your photo to help employers recognize you</Text>
            </View>
          </View>
        </View>

        {/* Personal Info */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={profile.fullName} onChangeText={t => setProfile({...profile, fullName: t})} editable={isEditing} />
            </View>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={profile.username} onChangeText={t => setProfile({...profile, username: t})} editable={isEditing} />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
              <TextInput style={[styles.input, { backgroundColor: isDark ? colors.background : '#f1f5f9', color: colors.textSecondary, borderColor: colors.border }]} value={profile.email} editable={false} />
            </View>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={profile.phone} onChangeText={t => setProfile({...profile, phone: t})} keyboardType="phone-pad" editable={isEditing} />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Location</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={profile.location} onChangeText={t => setProfile({...profile, location: t})} placeholder={isEditing ? "e.g. Salem, India" : ""} placeholderTextColor={colors.textSecondary} editable={isEditing} />
            </View>
          </View>
        </View>

        {/* Skills */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Skills & Expertise</Text>
          <View style={styles.skillsList}>
            {profile.skills.map((skill, idx) => (
              <View key={idx} style={[styles.skillTag, { backgroundColor: isDark ? colors.primary + '20' : '#eff6ff' }]}>
                <Text style={[styles.skillText, { color: isDark ? colors.primary : '#1e40af' }]}>{skill}</Text>
                {isEditing && (
                  <TouchableOpacity onPress={() => removeSkill(skill)}>
                    <X size={14} color={isDark ? colors.primary : "#3b82f6"} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          {isEditing && (
            <View style={styles.addSkillRow}>
              <TextInput 
                style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} 
                placeholder="Add a new skill..." 
                placeholderTextColor={colors.textSecondary}
                value={profile.newSkill}
                onChangeText={t => setProfile({...profile, newSkill: t})}
                onSubmitEditing={addSkill}
              />
              <TouchableOpacity style={[styles.addSkillBtn, { backgroundColor: colors.primary }]} onPress={addSkill}>
                <Plus size={20} color={'#ffffff'} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Education */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Education Details</Text>
            {isEditing && (
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={addEducation}>
                <Plus size={14} color={'#ffffff'} />
                <Text style={styles.addBtnText}>Add Education</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {profile.education.map((ed, idx) => (
            <View key={idx} style={[styles.itemBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <View style={styles.row}>
                <View style={[styles.col, { flex: 2 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Institution</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={ed.institution} onChangeText={t => updateEducation(idx, 'institution', t)} editable={isEditing} />
                </View>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Degree</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={ed.degree} onChangeText={t => updateEducation(idx, 'degree', t)} editable={isEditing} />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Start Year</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={ed.startYear} onChangeText={t => updateEducation(idx, 'startYear', t)} keyboardType="numeric" editable={isEditing} />
                </View>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>End Year</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={ed.endYear} onChangeText={t => updateEducation(idx, 'endYear', t)} keyboardType="numeric" editable={isEditing} />
                </View>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>CGPA</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={ed.cgpa} onChangeText={t => updateEducation(idx, 'cgpa', t)} editable={isEditing} />
                </View>
              </View>
            </View>
          ))}
          {profile.education.length === 0 && <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No education added yet.</Text>}
        </View>

        {/* Internships */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Internship Experience</Text>
            {isEditing && (
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={addExperience}>
                <Plus size={14} color={'#ffffff'} />
                <Text style={styles.addBtnText}>Add Internship</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {profile.experience.map((exp, idx) => (
            <View key={idx} style={[styles.itemBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Company Name</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={exp.company} onChangeText={t => updateExperience(idx, 'company', t)} placeholder={isEditing ? "e.g. Google, Inc." : ""} placeholderTextColor={colors.textSecondary} editable={isEditing} />
                </View>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Role / Title</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={exp.role} onChangeText={t => updateExperience(idx, 'role', t)} placeholder={isEditing ? "e.g. Software Engineer Intern" : ""} placeholderTextColor={colors.textSecondary} editable={isEditing} />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Start Date</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={exp.startDate} onChangeText={t => updateExperience(idx, 'startDate', t)} placeholder={isEditing ? "mm/dd/yyyy" : ""} placeholderTextColor={colors.textSecondary} editable={isEditing} />
                </View>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>End Date</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={exp.endDate} onChangeText={t => updateExperience(idx, 'endDate', t)} placeholder={isEditing ? "mm/dd/yyyy" : ""} placeholderTextColor={colors.textSecondary} editable={isEditing} />
                </View>
              </View>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
              <TextInput style={[styles.input, { height: 80, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={exp.description} onChangeText={t => updateExperience(idx, 'description', t)} multiline placeholder={isEditing ? "Describe your key responsibilities..." : ""} placeholderTextColor={colors.textSecondary} editable={isEditing} />
            </View>
          ))}
          {profile.experience.length === 0 && <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No experience added yet.</Text>}
        </View>

        {/* Resume */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Professional Resume</Text>
          <TouchableOpacity style={[styles.resumeBox, { borderColor: colors.border, backgroundColor: colors.inputBg }, !isEditing && { borderColor: 'transparent', backgroundColor: isDark ? colors.background : '#f1f5f9' }]} onPress={handleResumeClick}>
            <FileText size={20} color={colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.resumeTitle, { color: colors.text }]}>{profile.resumeName || (profile.resumeFile ? 'View Resume' : (isEditing ? 'Upload Resume' : 'No Resume Uploaded'))}</Text>
              {isEditing && <Text style={[styles.resumeSub, { color: colors.textSecondary }]}>Click to replace</Text>}
            </View>
          </TouchableOpacity>
        </View>

        {/* Online Presence */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Online Presence</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Personal Website</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={profile.portfolioUrl} onChangeText={t => setProfile({...profile, portfolioUrl: t})} placeholder={isEditing ? "https://yourportfolio.com" : ""} placeholderTextColor={colors.textSecondary} editable={isEditing} />
            </View>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>LinkedIn URL</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={profile.linkedinUrl} onChangeText={t => setProfile({...profile, linkedinUrl: t})} placeholder={isEditing ? "https://linkedin.com/in/..." : ""} placeholderTextColor={colors.textSecondary} editable={isEditing} />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>GitHub URL</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }, !isEditing && styles.readOnlyInput, !isEditing && { backgroundColor: isDark ? colors.background : '#f8fafc', color: colors.textSecondary }]} value={profile.githubUrl} onChangeText={t => setProfile({...profile, githubUrl: t})} placeholder={isEditing ? "https://github.com/..." : ""} placeholderTextColor={colors.textSecondary} editable={isEditing} />
            </View>
          </View>
        </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { padding: 4, marginLeft: -4 },
  pageTitle: { fontSize: 24, fontWeight: '800' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { fontWeight: '700', fontSize: 13 },
  card: {
    borderRadius: 16, padding: 24, marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 }
    })
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
  photoRow: { flexDirection: 'row', alignItems: 'center' },
  photoContainer: { width: 80, height: 80, borderRadius: 16, position: 'relative', marginRight: 16 },
  photoImg: { width: '100%', height: '100%', borderRadius: 16 },
  photoPlaceholder: { width: '100%', height: '100%', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderText: { color: '#ffffff', fontSize: 32, fontWeight: '700' },
  cameraBtn: { position: 'absolute', bottom: -6, right: -6, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  photoTextWrap: { flex: 1 },
  photoTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  photoSubtitle: { fontSize: 12 },
  row: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  col: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14 },
  skillsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  skillTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  skillText: { fontSize: 13, fontWeight: '600' },
  addSkillRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addSkillBtn: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 6 },
  addBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  itemBox: { padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  resumeBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 20 },
  resumeTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  resumeSub: { fontSize: 12 },
  readOnlyInput: { borderColor: 'transparent', fontWeight: '500' }
});
