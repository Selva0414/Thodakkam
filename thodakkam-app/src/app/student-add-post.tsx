import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Alert
} from 'react-native';
import {
  ArrowLeft, MoreVertical, Camera, Globe, X, Heart, MessageCircle, Send as SendIcon, Bookmark, ChevronDown
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { userStore } from '../utils/userStore';

const PRIMARY = '#6a1b9a';
const BG = '#f8f9fa';
const WHITE = '#ffffff';
const DARK = '#0f172a';
const GRAY = '#6b7280';
const BORDER = '#e2e8f0';

export default function StudentAddPost() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [category, setCategory] = useState('Project');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

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
        router.back();
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Your Achievement</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <MoreVertical size={20} color={DARK} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Input Area */}
        <View style={styles.inputArea}>
          {userStore.profilePhoto ? (
            <Image source={{ uri: userStore.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: WHITE, fontWeight: 'bold' }}>
                {userStore.name ? userStore.name.charAt(0).toUpperCase() : 'S'}
              </Text>
            </View>
          )}
          <TextInput
            style={styles.textInput}
            placeholder="What's your achievement? Describe your project, certification, or award..."
            placeholderTextColor={'#94a3b8'}
            multiline
            value={text}
            onChangeText={setText}
          />
        </View>

        {/* Media Upload Area */}
        <View style={styles.mediaArea}>
          {imageUrl && (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImgBtn} onPress={() => setImageUrl('')}>
                <X size={12} color={WHITE} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.addMediaBox} onPress={pickImage}>
            <Camera size={24} color={DARK} />
            <Text style={styles.addMediaText}>ADD MEDIA</Text>
          </TouchableOpacity>
        </View>

        {/* Category Selection Dropdown */}
        <View style={{ marginBottom: 24, zIndex: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: GRAY, letterSpacing: 0.5, marginBottom: 8 }}>CATEGORY</Text>
          <TouchableOpacity 
            style={styles.dropdownBtn} 
            activeOpacity={0.7}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownText}>{category}</Text>
            <ChevronDown size={20} color={GRAY} />
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownMenu}>
              {['Project', 'Certificate', 'Award', 'Work Experience'].map((cat, index) => (
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
                    category === cat && { color: PRIMARY, fontWeight: '700' }
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Visibility */}
        <View style={styles.visibilityBox}>
          <Globe size={18} color={PRIMARY} />
          <View style={{ flex: 1 }}>
            <Text style={styles.visibilityLabel}>VISIBLE TO</Text>
            <Text style={styles.visibilityValue}>Public (Community)</Text>
          </View>
        </View>

        {/* Live Preview Section */}
        <View style={styles.previewDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.previewTitle}>LIVE FEED PREVIEW</Text>
          <Text style={styles.cancelText}>Cancel</Text>
        </View>

        {/* Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            {userStore.profilePhoto ? (
              <Image source={{ uri: userStore.profilePhoto }} style={styles.previewAvatar} />
            ) : (
              <View style={[styles.previewAvatar, { backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 14 }}>
                  {userStore.name ? userStore.name.charAt(0).toUpperCase() : 'S'}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.previewName}>{userStore.name || 'Student Name'}</Text>
              <Text style={styles.previewMeta}>Just now • {category}</Text>
            </View>
          </View>
          {text ? (
            <Text style={styles.previewText}>{text}</Text>
          ) : null}
          {imageUrl && (
            <Image source={{ uri: imageUrl }} style={styles.previewImg} resizeMode="cover" />
          )}
          <View style={styles.previewFooter}>
            <Heart size={20} color={GRAY} />
            <MessageCircle size={20} color={GRAY} style={{ marginLeft: 16 }} />
            <SendIcon size={20} color={GRAY} style={{ marginLeft: 16 }} />
            <Bookmark size={20} color={GRAY} style={{ marginLeft: 'auto' }} />
          </View>
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
          <View style={styles.tipItem}><Text style={styles.tipDot}>•</Text><Text style={styles.tipText}>Include a clear photo to increase engagement by 40%.</Text></View>
          <View style={styles.tipItem}><Text style={styles.tipDot}>•</Text><Text style={styles.tipText}>Tag your community or study group to share the win.</Text></View>
          <View style={styles.tipItem}><Text style={styles.tipDot}>•</Text><Text style={styles.tipText}>Keep it concise; the best posts are easy to read.</Text></View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitBtnText}>{loading ? 'Posting...' : 'Post Achievement'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: DARK },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  inputArea: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: PRIMARY },
  textInput: {
    flex: 1, minHeight: 60, fontSize: 14, color: DARK,
    paddingTop: 8, paddingBottom: 8,
  },

  mediaArea: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  imagePreviewWrapper: { position: 'relative', width: 80, height: 80 },
  imagePreview: { width: 80, height: 80, borderRadius: 12 },
  removeImgBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addMediaBox: {
    width: 80, height: 80, borderRadius: 12, borderWidth: 1.5, borderColor: DARK, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc'
  },
  addMediaText: { fontSize: 8, fontWeight: '700', color: DARK, marginTop: 4 },

  visibilityBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12,
    marginBottom: 24,
  },
  visibilityLabel: { fontSize: 9, fontWeight: '700', color: GRAY, letterSpacing: 0.5 },
  visibilityValue: { fontSize: 13, fontWeight: '700', color: DARK },

  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14,
    backgroundColor: WHITE
  },
  dropdownText: { fontSize: 14, color: DARK, fontWeight: '500' },
  dropdownMenu: {
    position: 'absolute', top: 75, left: 0, right: 0,
    backgroundColor: WHITE, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      default: { elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }
    }),
    zIndex: 20
  },
  dropdownItem: { padding: 14 },
  dropdownItemText: { fontSize: 14, color: DARK },

  previewDivider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  previewTitle: { fontSize: 10, fontWeight: '800', color: DARK, letterSpacing: 1, paddingHorizontal: 12 },
  cancelText: { fontSize: 12, fontWeight: '700', color: GRAY, position: 'absolute', right: 0, top: -20 },

  previewCard: {
    borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 16, padding: 16, marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.04)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    }),
  },
  previewHeader: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  previewAvatar: { width: 32, height: 32, borderRadius: 16 },
  previewName: { fontSize: 13, fontWeight: '700', color: DARK },
  previewMeta: { fontSize: 10, color: GRAY },
  previewText: { fontSize: 13, color: DARK, lineHeight: 18, marginBottom: 12 },
  previewImg: { width: '100%', height: 300, backgroundColor: '#f8fafc', borderRadius: 8, marginBottom: 12 },
  previewFooter: { flexDirection: 'row', alignItems: 'center' },

  tipsBox: { backgroundColor: '#fdfbf7', borderWidth: 1, borderColor: '#f3e8ff', borderRadius: 12, padding: 16, marginBottom: 24 },
  tipsTitle: { fontSize: 13, fontWeight: '800', color: DARK, marginBottom: 8 },
  tipItem: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  tipDot: { fontSize: 12, color: DARK },
  tipText: { fontSize: 11, color: '#475569', flex: 1, lineHeight: 16 },

  submitBtn: {
    backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(106,27,154,0.3)' },
      default: { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    }),
  },
  submitBtnText: { color: WHITE, fontSize: 14, fontWeight: '700' },
});
