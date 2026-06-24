import { BASE_URL } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Alert
} from 'react-native';
import {
  Image as ImageIcon, Paperclip, MapPin, ChevronDown, Eye
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import StartupHeader from '../components/StartupHeader';
import { useAppTheme } from '../context/ThemeContext';

export default function StartupAddPost() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string) || 'Echo Digital';
  const { colors, isDark } = useAppTheme();

  const [text, setText] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [category, setCategory] = useState('Project');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImages = result.assets.map(asset => `data:image/jpeg;base64,${asset.base64}`);
      setImageUrls(prev => [...prev, ...newImages]);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some text for your post.');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = BASE_URL;
      const token = await AsyncStorage.getItem('startupToken');

      // Extract base64 part if image exists
      let media_base64 = null;
      let media_type = null;
      if (imageUrls.length > 0) {
        const firstImage = imageUrls[0];
        if (firstImage.startsWith('data:image')) {
          const parts = firstImage.split(',');
          if (parts.length === 2) {
            media_type = parts[0].split(';')[0].split(':')[1];
            media_base64 = parts[1];
          }
        }
      }

      const res = await fetch(`${baseUrl}/api/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: text,
          tags: [category],
          media_base64,
          media_type
        })
      });
      const data = await res.json();
      if (res.ok || data.success || data.id) {
        if (router.canGoBack()) router.back();
        else router.push('/startup-community');
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

  const TAG_OPTIONS = ['Project', 'Award', 'Certificate', 'Work Experience', 'Job'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StartupHeader companyName={companyName} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header Titles */}
        <View style={styles.headerTitles}>
          <Text style={[styles.title, { color: colors.text }]}>Share Company Update</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Showcase your progress to the community and potential recruits.</Text>
        </View>

        {/* Main Input Card */}
        <View style={[styles.card, { backgroundColor: colors.card, zIndex: 10, elevation: 10, shadowColor: isDark ? '#000000' : '#000', borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.inputSectionRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18 }}>
                {companyName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={[styles.textInputWrapper, { backgroundColor: colors.inputBg }]}>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="What did your startup achieve? Describe your milestone, funding, or award..."
                placeholderTextColor={colors.textSecondary}
                multiline
                value={text}
                onChangeText={setText}
                textAlignVertical="top"
              />
              {imageUrls.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                  {imageUrls.map((uri, idx) => (
                    <View key={idx} style={[styles.previewImageContainer, { marginRight: 12, marginTop: 0 }]}>
                      <Image source={{ uri }} style={styles.previewImage} />
                      <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))}>
                        <Text style={styles.removeImageText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
              <View style={[styles.purpleDot, { backgroundColor: colors.primary }]} />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Tools Row */}
          <View style={styles.toolsRow}>
            <View style={styles.leftTools}>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={pickImage}>
                <ImageIcon size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Paperclip size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MapPin size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.rightTools}>
              <Text style={[styles.tagLabel, { color: colors.textSecondary }]}>TAG:</Text>
              <TouchableOpacity
                style={[styles.tagDropdown, { backgroundColor: colors.inputBg }]}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Text style={[styles.tagText, { color: colors.text }]}>{category}</Text>
                <ChevronDown size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {showDropdown && (
                <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#000000' : '#000' }]}>
                  {TAG_OPTIONS.map((cat, index) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.dropdownItem,
                        index !== TAG_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                      ]}
                      onPress={() => {
                        setCategory(cat);
                        setShowDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        { color: colors.text },
                        category === cat && { color: colors.primary, fontWeight: '700' }
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
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? '#000000' : '#000', borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.actionRow}>
            <View style={styles.visibilityInfo}>
              <View style={[styles.eyeIconBox, { backgroundColor: colors.inputBg }]}>
                <Eye size={20} color={colors.textSecondary} />
              </View>
              <View>
                <Text style={[styles.visibilityLabel, { color: colors.textSecondary }]}>VISIBILITY SETTINGS</Text>
                <Text style={[styles.visibilityValue, { color: colors.text }]}>Public (Community)</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.postButton, isSubmitDisabled ? { backgroundColor: colors.border } : { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={isSubmitDisabled}
              >
                <Text style={[styles.postButtonText, isSubmitDisabled ? { color: colors.textSecondary } : { color: '#ffffff' }]}>
                  {loading ? 'Posting...' : 'Post Update'}
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
  safeArea: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40, maxWidth: 650, width: '100%', alignSelf: 'center' },

  headerTitles: { alignItems: 'center', marginTop: 32, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 14 },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
      web: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }
    }),
  },

  inputSectionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  textInputWrapper: {
    flex: 1,
    borderRadius: 12,
    minHeight: 140,
    padding: 16,
    paddingBottom: 24,
    position: 'relative'
  },
  textInput: {
    fontSize: 15,
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
  },
  previewImageContainer: { marginTop: 12, position: 'relative', alignSelf: 'flex-start' },
  previewImage: { width: 120, height: 120, borderRadius: 8 },
  removeImageBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  removeImageText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },

  divider: { height: 1, marginBottom: 20 },

  toolsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftTools: { flexDirection: 'row', gap: 12 },
  iconButton: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center'
  },
  rightTools: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative' },
  tagLabel: { fontSize: 12, fontWeight: '700' },
  tagDropdown: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6
  },
  tagText: { fontSize: 13, fontWeight: '600' },

  dropdownMenu: {
    position: 'absolute', top: 50, right: 0,
    borderRadius: 12, borderWidth: 1,
    width: 160, zIndex: 10,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 5 },
      web: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }
    }),
  },
  dropdownItem: { padding: 14 },
  dropdownItemText: { fontSize: 14 },

  actionRow: { flexDirection: 'column', alignItems: 'stretch', gap: 16 },
  visibilityInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eyeIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  visibilityLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  visibilityValue: { fontSize: 13, fontWeight: '800' },

  actionButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  cancelText: { fontSize: 15, fontWeight: '600' },
  postButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  postButtonText: { fontSize: 14, fontWeight: '700' },
});
