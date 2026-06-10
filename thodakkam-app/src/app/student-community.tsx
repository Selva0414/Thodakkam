import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Alert, Share
} from 'react-native';
import {
  Bell, Search, Mail, Settings, LayoutDashboard, Briefcase,
  MessageSquare, Users, Image as ImageIcon, Send, GraduationCap,
  Heart, MessageCircle, Share2, Plus, ClipboardList
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import StudentHeader from '../components/StudentHeader';

const PRIMARY = '#6a1b9a';
const BG = '#f8f9fa';
const WHITE = '#ffffff';
const DARK = '#0f172a';
const GRAY = '#6b7280';
const BORDER = '#e2e8f0';

function BottomTabBar() {
  const router = useRouter();
  const active = 'Community';
  const tabs = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Jobs Search', icon: Briefcase, path: '/student-jobs' },
    { label: 'Assessments', icon: ClipboardList, path: '/student-assessments' },
    { label: 'Messages', icon: MessageSquare, path: '/student-messages' },
    { label: 'Community', icon: Users, path: '/student-community' },
  ];
  return (
    <View style={tabBarStyles.container}>
      {tabs.map(({ label, icon: Icon, path }) => {
        const isActive = active === label;
        return (
          <TouchableOpacity
            key={label}
            style={tabBarStyles.tab}
            onPress={() => {
              if (path) router.push(path as any);
            }}
          >
            <Icon size={22} color={isActive ? PRIMARY : GRAY} />
            <Text style={[tabBarStyles.label, isActive && tabBarStyles.labelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function StudentCommunity() {
  const router = useRouter();
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Community Feed</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/student-add-post' as any)}>
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
          <Text style={styles.trendingTitle}>Trending Tags</Text>
          <View style={styles.tagsRow}>
            <View style={styles.tagBadge}><Text style={styles.tagText}>#NextJS</Text></View>
            <View style={styles.tagBadge}><Text style={styles.tagText}>#Hiring</Text></View>
            <View style={styles.tagBadge}><Text style={styles.tagText}>#DesignChallenge</Text></View>
            <View style={styles.tagBadge}><Text style={styles.tagText}>#TailwindCSS</Text></View>
          </View>
        </View>

        {/* Recommended to Follow */}
        <View style={styles.recommendedSection}>
          <Text style={styles.recommendedTitle}>Recommended to Follow</Text>
          <View style={styles.recommendedUser}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=33' }} style={styles.recAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.recName}>James Wilson</Text>
              <Text style={styles.recRole}>Full Stack Developer</Text>
            </View>
            <TouchableOpacity style={styles.followBtn}><Text style={styles.followBtnText}>Follow</Text></TouchableOpacity>
          </View>
          <View style={styles.recommendedUser}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=47' }} style={styles.recAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.recName}>Elena Rodriguez</Text>
              <Text style={styles.recRole}>UX Researcher</Text>
            </View>
            <TouchableOpacity style={styles.followBtn}><Text style={styles.followBtnText}>Follow</Text></TouchableOpacity>
          </View>
        </View>

        {/* Feed */}
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: GRAY }}>Loading ideas...</Text>
        ) : posts.filter(p => activeCategory === 'All' || p.category === activeCategory).length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: GRAY }}>No posts yet in {activeCategory}. Be the first to share!</Text>
        ) : (
          posts.filter(p => activeCategory === 'All' || p.category === activeCategory).map(post => <PostItem key={post.id} post={post} />)
        )}

      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

// ─── Post Item Component ───────────────────────────────────────────────────────

function PostItem({ post }: { post: any }) {
  // Using initial random counts to simulate data
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

  const authorName = post.user?.fullName || post.startup?.companyName || 'Anonymous Student';
  const authorInitial = authorName.charAt(0).toUpperCase();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post by ${authorName}: "${post.text}" - Join Thodakkam to see more!`,
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
        ) : post.startup?.profilePhoto ? (
          <Image
            source={{ uri: post.startup.profilePhoto }}
            style={styles.postAvatar}
          />
        ) : (
          <View style={[styles.postAvatar, { backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 14 }}>
              {authorInitial}
            </Text>
          </View>
        )}
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>{authorName}</Text>
          <Text style={styles.postTime}>
            {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>PROJECT</Text>
        </View>
      </View>

      <Text style={styles.postText}>{post.text}</Text>

      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="contain" />
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

// ─── Main Screen ────────────────────────────────────────────────────────────────────

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
});

const navStyles = StyleSheet.create({
  headerContainer: {
    backgroundColor: WHITE,
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 16,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 24, height: 24, borderRadius: 6, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 13, fontWeight: '800', color: DARK },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellWrapper: { position: 'relative' },
  bellDot: { position: 'absolute', top: 0, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444', borderWidth: 1, borderColor: WHITE },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarText: { color: WHITE, fontSize: 12, fontWeight: '700' },
  avatarImage: { width: '100%', height: '100%' },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: BG, borderRadius: 8, paddingHorizontal: 10, height: 36 },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 12, color: DARK },
  iconBtn: { padding: 4 },
});

const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, color: GRAY, fontWeight: '500' },
  labelActive: { color: PRIMARY, fontWeight: '700' },
});
