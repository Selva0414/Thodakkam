import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Alert
} from 'react-native';
import {
  Folder, Image as ImageIcon, Link as LinkIcon, PlusCircle,
  Globe, Users, MoreHorizontal, Heart, MessageCircle, Share2,
  Lightbulb, Tag, X, Camera
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import StartupHeader from '../components/StartupHeader';
import { userStore } from '../utils/userStore';

const PRIMARY = '#662483';
const BG = '#ffffff';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function StartupAddPost() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string) || 'Echo Digital';
  
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [category, setCategory] = useState('PROJECT');
  const [visibility, setVisibility] = useState('Public');
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
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          imageUrl: imageUrl,
          category,
          email: userStore.email || 'startup@example.com',
          companyName: companyName
        })
      });
      const data = await res.json();
      if (data.success) {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push('/startup-community');
        }
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
      <StartupHeader companyName={companyName} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.pageTitle}>Share Your Thought</Text>
        <Text style={styles.pageSubtitle}>Showcase your hard work and inspire your fellow students.</Text>

        {/* Input Card */}
        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=33' }} style={styles.avatar} />
            <TextInput
              style={styles.textInput}
              placeholder="What did you achieve?..."
              placeholderTextColor={'#94a3b8'}
              multiline
              value={text}
              onChangeText={setText}
            />
          </View>
          
          <View style={styles.divider} />

          <View style={styles.toolsRow}>
            <TouchableOpacity style={styles.categoryDropdown}>
              <Folder size={14} color={PRIMARY} />
              <Text style={styles.categoryText}>{category}</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />
            
            <TouchableOpacity style={styles.iconBtn} onPress={pickImage}>
              <ImageIcon size={20} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <LinkIcon size={20} color={PRIMARY} />
            </TouchableOpacity>
          </View>

          {/* Media Upload Box */}
          <View style={styles.mediaArea}>
            {imageUrl && (
              <View style={styles.imagePreviewWrapper}>
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} resizeMode="cover" />
                <TouchableOpacity style={styles.removeImgBtn} onPress={() => setImageUrl(null)}>
                  <X size={12} color={WHITE} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.addMediaBox} onPress={pickImage}>
              <PlusCircle size={24} color={PRIMARY} />
              <Text style={styles.addMediaText}>+ Add Media</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Visibility Settings */}
        <View style={styles.visibilityHeader}>
          <Text style={styles.visibilityTitle}>VISIBILITY SETTINGS</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.radioItem, visibility === 'Public' && styles.radioItemActive]} 
          onPress={() => setVisibility('Public')}
        >
          <View style={[styles.radioIconWrap, visibility === 'Public' && { backgroundColor: '#f3e8ff' }]}>
            <Globe size={18} color={visibility === 'Public' ? PRIMARY : TEXT_GRAY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.radioLabel, visibility === 'Public' && { color: PRIMARY }]}>Public (Community)</Text>
            <Text style={styles.radioSub}>Visible to all students in the portal</Text>
          </View>
          <View style={[styles.radioCircle, visibility === 'Public' && styles.radioCircleActive]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.radioItem, visibility === 'Followers' && styles.radioItemActive]} 
          onPress={() => setVisibility('Followers')}
        >
          <View style={[styles.radioIconWrap, visibility === 'Followers' && { backgroundColor: '#f3e8ff' }]}>
            <Users size={18} color={visibility === 'Followers' ? PRIMARY : TEXT_GRAY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.radioLabel, visibility === 'Followers' && { color: PRIMARY }]}>Followers Only</Text>
            <Text style={styles.radioSub}>Only your connections see this</Text>
          </View>
          <View style={[styles.radioCircle, visibility === 'Followers' && styles.radioCircleActive]} />
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitBtnText}>{loading ? 'Posting...' : 'Post Achievement'}</Text>
        </TouchableOpacity>

        {/* Live Preview Divider */}
        <View style={styles.previewDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.previewDividerText}>LIVE FEED PREVIEW</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Live Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={[styles.previewAvatar, { backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 16 }}>
                {companyName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName}>{companyName}</Text>
              <Text style={styles.previewMeta}>Just now • Project</Text>
            </View>
            <MoreHorizontal size={20} color={TEXT_GRAY} />
          </View>
          
          <Text style={styles.previewText}>
            {text || 'Finally launched the Nexus UI Kit! This project took 4 months of late-night coding and user testing. 🚀'}
          </Text>
          
          {(imageUrl || !text) && (
            <View style={styles.previewImgBox}>
              <Image 
                source={imageUrl ? { uri: imageUrl } : { uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop' }} 
                style={styles.previewImg} 
                resizeMode="cover"
              />
            </View>
          )}

          <View style={styles.previewFooter}>
            <TouchableOpacity style={styles.previewAction}>
              <Heart size={16} color={TEXT_GRAY} />
              <Text style={styles.previewActionText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.previewAction}>
              <MessageCircle size={16} color={TEXT_GRAY} />
              <Text style={styles.previewActionText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.previewAction}>
              <Share2 size={16} color={TEXT_GRAY} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pro Tips */}
        <Text style={styles.tipsSectionTitle}>PRO TIPS FOR POSTING</Text>
        
        <View style={styles.tipCard}>
          <Lightbulb size={20} color={PRIMARY} />
          <Text style={styles.tipText}>Posts with <Text style={{ color: PRIMARY, fontWeight: '700' }}>visual media</Text> get 80% more engagement from recruiters and peers.</Text>
        </View>

        <View style={styles.tipCard}>
          <Tag size={20} color={PRIMARY} />
          <Text style={styles.tipText}>Use specific tags like <Text style={{ color: PRIMARY, fontWeight: '700' }}>#Design</Text> or <Text style={{ color: PRIMARY, fontWeight: '700' }}>#Code</Text> to appear in filtered search results.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },

  pageTitle: { fontSize: 28, fontWeight: '800', color: TEXT_DARK, marginBottom: 8 },
  pageSubtitle: { fontSize: 13, color: TEXT_GRAY, lineHeight: 20, marginBottom: 24 },

  inputCard: { backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  textInput: { flex: 1, minHeight: 60, fontSize: 15, color: TEXT_DARK, paddingTop: 8 },
  
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 16 },
  
  toolsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  categoryDropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3e8ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  categoryText: { fontSize: 11, fontWeight: '800', color: TEXT_DARK },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },

  mediaArea: { flexDirection: 'row', gap: 12 },
  imagePreviewWrapper: { position: 'relative', width: 100, height: 100 },
  imagePreview: { width: 100, height: 100, borderRadius: 12 },
  removeImgBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  addMediaBox: { height: 100, flex: 1, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8 },
  addMediaText: { fontSize: 12, fontWeight: '700', color: PRIMARY },

  visibilityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  visibilityTitle: { fontSize: 11, fontWeight: '800', color: TEXT_GRAY, letterSpacing: 1 },
  cancelText: { fontSize: 13, fontWeight: '700', color: '#ef4444' },

  radioItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 12 },
  radioItemActive: { backgroundColor: '#fdf4ff', borderWidth: 1, borderColor: '#f3e8ff' },
  radioIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  radioLabel: { fontSize: 14, fontWeight: '800', color: TEXT_DARK, marginBottom: 2 },
  radioSub: { fontSize: 11, color: TEXT_GRAY },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1' },
  radioCircleActive: { borderColor: PRIMARY, borderWidth: 6 },

  submitBtn: { backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 12, marginBottom: 32, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnText: { color: WHITE, fontSize: 15, fontWeight: '800' },

  previewDivider: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  previewDividerText: { fontSize: 10, fontWeight: '800', color: TEXT_GRAY, letterSpacing: 1 },

  previewCard: { backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  previewAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  previewName: { fontSize: 14, fontWeight: '800', color: TEXT_DARK },
  previewMeta: { fontSize: 11, color: TEXT_GRAY, marginTop: 2 },
  previewText: { fontSize: 13, color: TEXT_DARK, lineHeight: 20, marginBottom: 12 },
  previewImgBox: { width: '100%', height: 300, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  previewImg: { width: '100%', height: '100%' },
  previewFooter: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  previewAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewActionText: { fontSize: 13, color: TEXT_GRAY, fontWeight: '600' },

  tipsSectionTitle: { fontSize: 11, fontWeight: '800', color: PRIMARY, letterSpacing: 1, marginBottom: 16, paddingHorizontal: 4 },
  tipCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 12 },
  tipText: { flex: 1, fontSize: 12, color: TEXT_GRAY, lineHeight: 18 },

  messageFab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  messageFabText: { color: WHITE, fontSize: 14, fontWeight: '700' },
});
