import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Alert, Share
} from 'react-native';
import {
  Bell, Search, Mail, Settings, LayoutGrid, Briefcase,
  MessageSquare, Users, Image as ImageIcon, Send, GraduationCap,
  Heart, MessageCircle, Share2, Plus, Calendar
} from 'lucide-react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import StartupHeader from '../components/StartupHeader';

const PRIMARY = '#662483';
const BG = '#f8fafc';
const WHITE = '#ffffff';
const DARK = '#0f172a';
const GRAY = '#64748b';
const BORDER = '#e2e8f0';

export default function StartupCommunity() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string) || 'Echo Digital';
  const [activeTab, setActiveTab] = useState('Community');

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchPosts = async () => {
    try {
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/posts`);
      const data = await res.json();
      if (data.success) {
        const processedPosts = data.posts.map((post: any) => {
          let pImageUrl = post.imageUrl;
          if (pImageUrl && !pImageUrl.startsWith('http') && !pImageUrl.startsWith('data:image')) {
            const filename = pImageUrl.split(/[/\\]/).pop();
            pImageUrl = `${baseUrl}/uploads/${filename}`;
          }
          let uPhoto = post.user?.profilePhoto;
          if (uPhoto && !uPhoto.startsWith('http') && !uPhoto.startsWith('data:image')) {
            const filename = uPhoto.split(/[/\\]/).pop();
            uPhoto = `${baseUrl}/uploads/${filename}`;
          }
          return { ...post, imageUrl: pImageUrl, user: post.user ? { ...post.user, profilePhoto: uPhoto } : null };
        });
        setPosts(processedPosts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  const handleNavPress = (label: string) => {
    setActiveTab(label);
    if (label === 'Dashboard') {
      router.replace({ pathname: '/startup-dashboard' as any, params: { companyName } });
    } else if (label === 'Jobs') {
      router.replace({ pathname: '/startup-jobs' as any, params: { companyName } });
    } else if (label === 'Candidates') {
      router.replace({ pathname: '/startup-candidates' as any, params: { companyName } });
    } else if (label === 'Interviews') {
      router.replace({ pathname: '/startup-interviews' as any, params: { companyName } });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StartupHeader companyName={companyName} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Community Feed</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push({ pathname: '/startup-add-post' as any, params: { companyName } })}>
            <Plus size={18} color={WHITE} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          {['All', 'Projects', 'Awards', 'Certifications'].map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Trending Tags */}
        <View style={styles.trendingCard}>
          <Text style={styles.trendingTitle}>Trending in Startups</Text>
          <View style={styles.tagsRow}>
            <View style={styles.tagBadge}><Text style={styles.tagText}>#SeedFunding</Text></View>
            <View style={styles.tagBadge}><Text style={styles.tagText}>#HiringDevs</Text></View>
            <View style={styles.tagBadge}><Text style={styles.tagText}>#YCombinator</Text></View>
            <View style={styles.tagBadge}><Text style={styles.tagText}>#SaaS</Text></View>
          </View>
        </View>

        {/* Recommended to Connect */}
        <View style={styles.recommendedSection}>
          <Text style={styles.recommendedTitle}>Recommended Connections</Text>
          <View style={styles.recommendedUser}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=11' }} style={styles.recAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.recName}>TechFlow Inc.</Text>
              <Text style={styles.recRole}>B2B SaaS Platform</Text>
            </View>
            <TouchableOpacity style={styles.followBtn}><Text style={styles.followBtnText}>Connect</Text></TouchableOpacity>
          </View>
          <View style={styles.recommendedUser}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=15' }} style={styles.recAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.recName}>Sarah Jenkins</Text>
              <Text style={styles.recRole}>Angel Investor</Text>
            </View>
            <TouchableOpacity style={styles.followBtn}><Text style={styles.followBtnText}>Connect</Text></TouchableOpacity>
          </View>
        </View>

        {/* Feed */}
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: GRAY }}>Loading feed...</Text>
        ) : posts.filter(p => activeCategory === 'All' || p.category === activeCategory).length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: GRAY }}>No posts yet in {activeCategory}.</Text>
        ) : (
          posts.filter(p => activeCategory === 'All' || p.category === activeCategory).map(post => <PostItem key={post.id} post={post} companyName={companyName} />)
        )}

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { label: 'Dashboard', icon: LayoutGrid },
          { label: 'Jobs', icon: Briefcase },
          { label: 'Candidates', icon: Users },
          { label: 'Interviews', icon: Calendar },
          { label: 'Community', icon: Users }
        ].map(item => {
          const isActive = activeTab === item.label;
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.label}
              style={styles.navItem}
              onPress={() => handleNavPress(item.label)}
            >
              <Icon size={20} color={isActive ? PRIMARY : '#94a3b8'} />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ─── Post Item Component ───────────────────────────────────────────────────────

function PostItem({ post, companyName }: { post: any, companyName: string }) {
  const [likesCount, setLikesCount] = useState(() => Math.floor(Math.random() * 100));
  const [commentsCount] = useState(() => Math.floor(Math.random() * 20));
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLikesCount(prev => prev - 1);
      setLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setLiked(true);
    }
  };

  const handleComment = () => {
    Alert.alert('Comments', 'Comment section coming soon!');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post by ${post.user?.fullName || 'a user'}: "${post.text}" - Join Thodakkam to see more!`,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        {post.user?.profilePhoto ? (
          <Image
            source={{ uri: post.user.profilePhoto }}
            style={styles.postAvatar}
          />
        ) : (
          <View style={[styles.postAvatar, { backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 14 }}>
              {(post.user?.fullName).charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>{post.user?.fullName}</Text>
          <Text style={styles.postTime}>
            {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {post.category && (
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>{post.category.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <Text style={styles.postText}>{post.text}</Text>

      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
      )}

      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.footerAction} onPress={handleLike}>
          <Heart size={18} color={liked ? '#e11d48' : GRAY} fill={liked ? '#e11d48' : 'transparent'} />
          <Text style={[styles.footerActionText, liked && { color: '#e11d48', fontWeight: 'bold' }]}>
            {likesCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerAction} onPress={handleComment}>
          <MessageCircle size={18} color={GRAY} />
          <Text style={styles.footerActionText}>{commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareAction} onPress={handleShare}>
          <Share2 size={18} color={GRAY} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 4 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: DARK },
  addBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },

  filterScroll: { marginBottom: 20, flexGrow: 0 },
  filterContent: { gap: 8, paddingRight: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: PRIMARY },
  filterText: { fontSize: 12, fontWeight: '600', color: GRAY },
  filterTextActive: { color: WHITE },

  trendingCard: { backgroundColor: '#cbd5e1', borderRadius: 12, padding: 16, marginBottom: 20 },
  trendingTitle: { fontSize: 12, fontWeight: '800', color: DARK, marginBottom: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBadge: { backgroundColor: WHITE, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  tagText: { fontSize: 10, fontWeight: '700', color: DARK },

  recommendedSection: { marginBottom: 24 },
  recommendedTitle: { fontSize: 13, fontWeight: '800', color: DARK, marginBottom: 12 },
  recommendedUser: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  recAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  recName: { fontSize: 13, fontWeight: '700', color: DARK },
  recRole: { fontSize: 10, color: GRAY },
  followBtn: { borderWidth: 1, borderColor: DARK, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  followBtnText: { fontSize: 11, fontWeight: '700', color: DARK },

  postCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    }),
  },
  postHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0' },
  postMeta: { flex: 1 },
  postAuthor: { fontSize: 14, fontWeight: '800', color: DARK },
  postTime: { fontSize: 11, color: GRAY, marginTop: 2 },
  badgeWrap: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: '800', color: DARK, letterSpacing: 0.5 },

  postText: { fontSize: 13, color: DARK, lineHeight: 20, marginBottom: 12 },
  postImage: { width: '100%', height: 300, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 16 },

  postFooter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  footerAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerActionText: { fontSize: 12, fontWeight: '600', color: GRAY },
  shareAction: { marginLeft: 'auto' },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: WHITE, borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  navTextActive: { color: PRIMARY, fontWeight: '700' },
});
