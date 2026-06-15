import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Alert
} from 'react-native';
import {
  Image as ImageIcon, Paperclip, MapPin, ChevronDown, Eye
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { userStore } from '../utils/userStore';

const PRIMARY = '#1e1b4b'; // Very dark purple
const BUTTON_PRIMARY = '#662483';
const BG = '#f4f5f7';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function StudentAddPost() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [category, setCategory] = useState('Project');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUrl(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text for your post.');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      const res = await fetch(`${baseUrl}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          imageUrl: imageUrl,
          category,
          email: userStore.email
        })
      });
      const data = await res.json();
      if (data.success) {
        if (router.canGoBack()) router.back();
        else router.push('/student-community');
      } else {
        Alert.alert('Error', data.message || 'Failed to post.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = !text.trim() || loading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* Header Titles */}
        <View style={styles.headerTitles}>
          <Text style={styles.title}>Share Your Achievement</Text>
          <Text style={styles.subtitle}>Showcase your hard work to the community and potential recruiters.</Text>
        </View>

        {/* Main Input Card */}
        <View style={[styles.card, { zIndex: 10, elevation: 10 }]}>
          <View style={styles.inputSectionRow}>
            {userStore.profilePhoto ? (
              <Image source={{ uri: userStore.profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#475569', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 18 }}>
                  {userStore.name ? userStore.name.charAt(0).toUpperCase() : 'S'}
                </Text>
              </View>
            )}
            
            <View style={styles.textInputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="What did you achieve? Describe your project, certification, or award..."
                placeholderTextColor="#94a3b8"
                multiline
                value={text}
                onChangeText={setText}
                textAlignVertical="top"
              />
              {imageUrl && (
                <View style={styles.previewImageContainer}>
                  <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUrl(null)}>
                    <Text style={styles.removeImageText}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.purpleDot} />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Tools Row */}
          <View style={styles.toolsRow}>
            <View style={styles.leftTools}>
              <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
                <ImageIcon size={20} color="#475569" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Paperclip size={20} color="#475569" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <MapPin size={20} color="#475569" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.rightTools}>
              <Text style={styles.tagLabel}>TAG:</Text>
              <TouchableOpacity 
                style={styles.tagDropdown}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Text style={styles.tagText}>{category}</Text>
                <ChevronDown size={16} color="#475569" />
              </TouchableOpacity>

              {showDropdown && (
                <View style={styles.dropdownMenu}>
                  {['Project', 'Certificate', 'Award', 'Experience'].map((cat, index) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.dropdownItem,
                        index !== 3 && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }
                      ]}
                      onPress={() => {
                        setCategory(cat);
                        setShowDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        category === cat && { color: BUTTON_PRIMARY, fontWeight: '700' }
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Second Card: Visibility & Actions */}
        <View style={styles.card}>
          <View style={styles.actionRow}>
            <View style={styles.visibilityInfo}>
              <View style={styles.eyeIconBox}>
                <Eye size={20} color="#475569" />
              </View>
              <View>
                <Text style={styles.visibilityLabel}>VISIBILITY SETTINGS</Text>
                <Text style={styles.visibilityValue}>Public (Community)</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.postButton, isSubmitDisabled && styles.postButtonDisabled]} 
                onPress={handleSubmit} 
                disabled={isSubmitDisabled}
              >
                <Text style={[styles.postButtonText, isSubmitDisabled && styles.postButtonTextDisabled]}>
                  {loading ? 'Posting...' : 'Post Achievement'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 24, paddingBottom: 40, maxWidth: 650, width: '100%', alignSelf: 'center' },
  
  headerTitles: { alignItems: 'center', marginTop: 40, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '900', color: PRIMARY, marginBottom: 8 },
  subtitle: { fontSize: 14, color: TEXT_GRAY },

  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }
    }),
  },

  inputSectionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  textInputWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    minHeight: 140,
    padding: 16,
    paddingBottom: 24,
    position: 'relative'
  },
  textInput: {
    fontSize: 15,
    color: TEXT_DARK,
    lineHeight: 22,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {})
  },
  purpleDot: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7c3aed' // Bright purple dot
  },
  previewImageContainer: { marginTop: 12, position: 'relative', alignSelf: 'flex-start' },
  previewImage: { width: 120, height: 120, borderRadius: 8 },
  removeImageBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  removeImageText: { color: WHITE, fontSize: 12, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 20 },

  toolsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftTools: { flexDirection: 'row', gap: 12 },
  iconButton: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0',
    justifyContent: 'center', alignItems: 'center', backgroundColor: WHITE
  },
  rightTools: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative' },
  tagLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  tagDropdown: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6
  },
  tagText: { fontSize: 13, fontWeight: '600', color: '#334155' },

  dropdownMenu: {
    position: 'absolute', top: 50, right: 0,
    backgroundColor: WHITE, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    width: 150, zIndex: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 5 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }
    }),
  },
  dropdownItem: { padding: 12 },
  dropdownItemText: { fontSize: 13, color: TEXT_DARK },

  actionRow: { flexDirection: 'column', alignItems: 'stretch', gap: 16 },
  visibilityInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eyeIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  visibilityLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 2 },
  visibilityValue: { fontSize: 13, fontWeight: '800', color: TEXT_DARK },

  actionButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  postButton: { backgroundColor: '#cbd5e1', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  postButtonDisabled: { backgroundColor: '#e2e8f0' },
  postButtonText: { color: '#64748b', fontSize: 14, fontWeight: '700' },
  postButtonTextDisabled: { color: '#94a3b8' },
});
