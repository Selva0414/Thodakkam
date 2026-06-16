import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Alert, Share, Animated
} from 'react-native';
import {
  Bell, Search, Mail, Settings, LayoutDashboard, Briefcase,
  MessageSquare, Users, Image as ImageIcon, Send, GraduationCap,
  Heart, MessageCircle, Share2, Plus, ClipboardList, ThumbsUp, Repeat, Bookmark, Smile, ArrowLeft
} from 'lucide-react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import StudentHeader from '../components/StudentHeader';
import StartupHeader from '../components/StartupHeader';
import { userStore } from '../utils/userStore';

const PRIMARY = '#6a1b9a';
const BG = '#f8f9fa';
const WHITE = '#ffffff';
const DARK = '#0f172a';
const GRAY = '#6b7280';
const BORDER = '#e2e8f0';

function BottomTabBar() {
  const router = useRouter();
  const active = 'Feed';
  const tabs = [
    { label: 'Home', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Jobs', icon: Briefcase, path: '/student-jobs' },
    { label: 'Tests', icon: ClipboardList, path: '/student-assessments' },
    { label: 'Chat', icon: MessageSquare, path: '/student-messages' },
    { label: 'Feed', icon: Users, path: '/student-community' },
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
            <View style={[{ padding: 8, borderRadius: 20 }, isActive && { backgroundColor: PRIMARY + '20', transform: [{ scale: 1.1 }] }]}>
                  <Icon size={22} color={isActive ? PRIMARY : GRAY} />
                </View>
            <Text style={[tabBarStyles.label, isActive && tabBarStyles.labelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function SavedPosts() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = (params.role as string) || (userStore.email ? 'student' : 'startup');
  const identifier = (params.identifier as string) || userStore.email || params.companyName as string;
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchPosts = async () => {
    try {
      if (!identifier) {
        setLoading(false);
        return;
      }
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      const res = await fetch(`${baseUrl}/api/posts/saved/${encodeURIComponent(identifier)}?type=${role}`);
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
      {role === 'startup' ? <StartupHeader companyName={identifier} /> : <StudentHeader />}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft size={24} color={DARK} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: '800', color: DARK }}>Saved Posts</Text>
        </View>


        {/* Feed */}
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: GRAY }}>Loading saved posts...</Text>
        ) : posts.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: GRAY }}>You haven't saved any posts yet.</Text>
        ) : (
          posts.map(post => <PostItem key={post.id} post={post} role={role} identifier={identifier} />)
        )}
        </Animated.View>
      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

function PostItem({ post, role, identifier }: { post: any, role: string, identifier: string }) {
  const initialLikes = post.likes ? post.likes.length : 0;
  const initiallyLiked = post.likes ? post.likes.some((l: any) => role === 'startup' ? l.startup?.companyName === identifier : l.user?.email === identifier) : false;
  
  const initialReposts = post.reposts ? post.reposts.length : 0;
  const initiallyReposted = post.reposts ? post.reposts.some((r: any) => role === 'startup' ? r.startup?.companyName === identifier : r.user?.email === identifier) : false;

  const initiallySaved = post.savedBy ? post.savedBy.some((s: any) => role === 'startup' ? s.startup?.companyName === identifier : s.user?.email === identifier) : false;

  const [likesCount, setLikesCount] = useState(initialLikes);
  const [liked, setLiked] = useState(initiallyLiked);
  
  const [comments, setComments] = useState<any[]>(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [repostCount, setRepostCount] = useState(initialReposts);
  const [hasReposted, setHasReposted] = useState(initiallyReposted);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(initiallySaved);

  const handleLike = async () => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikesCount((prev: number) => newLikedState ? prev + 1 : prev - 1);
    
    try {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      await fetch(`${baseUrl}/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(role === 'startup' ? { companyName: identifier } : { email: identifier })
      });
    } catch (err) {
      console.error(err);
      // Revert if error
      setLiked(!newLikedState);
      setLikesCount((prev: number) => newLikedState ? prev - 1 : prev + 1);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    
    try {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      const res = await fetch(`${baseUrl}/api/posts/${post.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText, ...(role === 'startup' ? { companyName: identifier } : { email: identifier }) })
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setComments([...comments, data.comment]);
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  const authorName = post.user?.fullName || post.startup?.companyName || 'Anonymous User';
  const authorInitial = authorName.charAt(0).toUpperCase();
  const authorRole = post.user ? 'Student' : (post.startup ? 'Startup' : 'Member');
  const profilePhoto = post.user?.profilePhoto || post.startup?.profilePhoto || post.startup?.companyLogo;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post by ${authorName}: "${post.text}" - Join Thodakkam to see more!`,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRepost = async () => {
    if (isReposting) return;
    const newRepostedState = !hasReposted;
    setHasReposted(newRepostedState);
    setRepostCount((prev: number) => newRepostedState ? prev + 1 : prev - 1);
    setIsReposting(true);
    
    try {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      const res = await fetch(`${baseUrl}/api/posts/${post.id}/repost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(role === 'startup' ? { companyName: identifier } : { email: identifier })
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        setHasReposted(!newRepostedState);
        setRepostCount((prev: number) => newRepostedState ? prev - 1 : prev + 1);
      }
    } catch (err) {
      console.error(err);
      // Revert on failure
      setHasReposted(!newRepostedState);
      setRepostCount((prev: number) => newRepostedState ? prev - 1 : prev + 1);
    } finally {
      setIsReposting(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    const newSavedState = !hasSaved;
    setHasSaved(newSavedState);
    setIsSaving(true);
    
    try {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      const res = await fetch(`${baseUrl}/api/posts/${post.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(role === 'startup' ? { companyName: identifier } : { email: identifier })
      });
      const data = await res.json();
      if (!data.success) {
        setHasSaved(!newSavedState);
      }
    } catch (err) {
      console.error(err);
      setHasSaved(!newSavedState);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={styles.postAvatar} />
        ) : (
          <View style={[styles.postAvatar, { backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 16 }}>{authorInitial}</Text>
          </View>
        )}
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor} numberOfLines={1}>{authorName}</Text>
          <Text style={styles.postTime} numberOfLines={1}>{authorRole} • Just now</Text>
        </View>
        {post.category && (
          <View style={[styles.badgeWrap, { backgroundColor: '#f3e8ff' }]}>
            <Text style={[styles.badgeText, { color: PRIMARY }]}>{post.category.toUpperCase()}</Text>
          </View>
        )}
        <TouchableOpacity style={{ marginLeft: 8 }}>
          <Text style={{ color: GRAY, fontSize: 18, fontWeight: 'bold' }}>···</Text>
        </TouchableOpacity>
      </View>

      {post.text ? <Text style={styles.postText}>{post.text}</Text> : null}

      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="contain" />
      )}

      <View style={[styles.postFooter, showComments && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 16, marginBottom: 16 }]}>
        <TouchableOpacity style={styles.footerAction} onPress={handleLike}>
          <ThumbsUp size={20} color={liked ? PRIMARY : GRAY} fill={liked ? PRIMARY : 'transparent'} />
          <Text style={[styles.footerActionText, liked && { color: PRIMARY }]}>{likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.footerAction, showComments && styles.activeFooterBtn]} 
          onPress={() => setShowComments(!showComments)}
        >
          <MessageSquare size={20} color={showComments ? PRIMARY : GRAY} />
          <Text style={[styles.footerActionText, showComments && { color: PRIMARY }]}>{comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerAction} onPress={handleRepost} disabled={isReposting}>
          <Repeat size={20} color={hasReposted ? PRIMARY : GRAY} />
          <Text style={[styles.footerActionText, hasReposted && { color: PRIMARY }]}>{repostCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.footerAction, styles.shareAction]} onPress={handleSave} disabled={isSaving}>
          <Bookmark size={18} color={hasSaved ? PRIMARY : GRAY} fill={hasSaved ? PRIMARY : 'transparent'} />
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {showComments && (
        <View style={styles.commentsSection}>
          {comments.map(c => {
            const author = c.user?.fullName || c.startup?.companyName || 'Anonymous';
            const avatar = c.user?.profilePhoto || c.startup?.profilePhoto || c.startup?.companyLogo;
            const role = c.user ? 'Student' : (c.startup ? 'Startup' : 'Member');
            return (
            <View key={c.id} style={styles.commentItem}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.commentAvatar} />
              ) : (
                <View style={[styles.commentAvatar, { backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: WHITE, fontSize: 10, fontWeight: 'bold' }}>{author.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.commentBubble}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={styles.commentAuthor}>{author}</Text>
                  <View style={styles.commentRoleBadge}>
                    <GraduationCap size={10} color="#10b981" />
                    <Text style={styles.commentRoleText}>{role}</Text>
                  </View>
                </View>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            </View>
          )})}

          {/* Add Comment Input */}
          <View style={styles.commentInputRow}>
            {userStore.profilePhoto ? (
              <Image source={{ uri: userStore.profilePhoto }} style={styles.commentAvatar} />
            ) : (
              <View style={[styles.commentAvatar, { backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: WHITE, fontSize: 10, fontWeight: 'bold' }}>{userStore.name ? userStore.name.charAt(0).toUpperCase() : 'S'}</Text>
              </View>
            )}
            <View style={styles.commentInputWrap}>
              <TextInput 
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={GRAY}
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={submitComment}
              />
              <TouchableOpacity style={{ padding: 4 }} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
                <Smile size={18} color={'#fbbf24'} />
              </TouchableOpacity>
            </View>
            
            {showEmojiPicker && (
              <View style={styles.emojiPicker}>
                {['👍', '❤️', '😂', '😮', '😢', '👏', '🔥', '🚀'].map(emoji => (
                  <TouchableOpacity 
                    key={emoji} 
                    onPress={() => {
                      setCommentText(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    style={styles.emojiBtn}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity style={[styles.commentSendBtn, !commentText.trim() && { opacity: 0.5 }]} onPress={submitComment} disabled={!commentText.trim()}>
              <Send size={16} color={WHITE} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  topSearchCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  topSearchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  searchIcon: { marginRight: 8 },
  mainSearchInput: { flex: 1, fontSize: 14, color: DARK, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
  sortByText: { fontSize: 13, color: GRAY, marginBottom: 8, fontWeight: '500' },
  
  newFilterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: WHITE, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  newFilterChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  newFilterText: { fontSize: 13, fontWeight: '600', color: GRAY },
  newFilterTextActive: { color: WHITE },
  filterScroll: { flexGrow: 0 },
  filterContent: { paddingRight: 16 },

  createPostCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  createPostTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  createPostAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  createPostInputWrap: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 20, paddingHorizontal: 16, height: 44, justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  createPostInput: { fontSize: 13, color: DARK, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
  
  createPostTagsScroll: { marginBottom: 16, flexGrow: 0 },
  createPostTags: { gap: 8, paddingRight: 16 },
  createTagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: WHITE, borderWidth: 1, borderColor: '#e2e8f0' },
  createTagChipActive: { backgroundColor: '#f3e8ff', borderColor: PRIMARY },
  createTagText: { fontSize: 11, fontWeight: '600', color: GRAY },
  createTagTextActive: { color: PRIMARY },

  createPostFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  createPostActions: { flexDirection: 'row', gap: 12 },
  createPostActionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: WHITE, borderWidth: 1, borderColor: '#e2e8f0' },
  createPostActionText: { fontSize: 12, fontWeight: '600', color: DARK },
  postSubmitBtn: { backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  postSubmitBtnText: { color: WHITE, fontWeight: '700', fontSize: 13 },

  repostCardWrapper: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  repostHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  repostText: { fontSize: 13, color: GRAY, fontWeight: '500' },
  
  nestedCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nestedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  nestedAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  avatarBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#10b981', borderRadius: 10, width: 14, height: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: WHITE },

  postCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    }),
  },
  postHeader: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0' },
  postMeta: { flex: 1, marginRight: 8 },
  postAuthor: { fontSize: 14, fontWeight: '800', color: DARK, flexShrink: 1 },
  postTime: { fontSize: 11, color: GRAY, marginTop: 2 },
  badgeWrap: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: '800', color: DARK, letterSpacing: 0.5 },

  postText: { fontSize: 13, color: DARK, lineHeight: 20, marginBottom: 12 },
  postImage: { width: '100%', height: 220, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 12 },

  postFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  footerAction: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 20 },
  activeFooterBtn: { backgroundColor: '#f3e8ff', borderWidth: 1, borderColor: PRIMARY },
  footerActionText: { fontSize: 13, fontWeight: '600', color: GRAY },
  shareAction: { paddingHorizontal: 0 },

  commentsSection: { marginTop: 4 },
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e2e8f0' },
  commentBubble: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: DARK },
  commentRoleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  commentRoleText: { fontSize: 9, fontWeight: '700', color: '#10b981', marginLeft: 4 },
  commentText: { fontSize: 13, color: DARK, lineHeight: 18 },

  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, position: 'relative' },
  commentInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, height: 40 },
  commentInput: { flex: 1, fontSize: 13, color: DARK, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
  commentSendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#c084fc', justifyContent: 'center', alignItems: 'center' },

  emojiPicker: {
    position: 'absolute',
    bottom: 50,
    right: 40,
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 8,
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    }),
    zIndex: 100,
  },
  emojiBtn: { padding: 6, borderRadius: 16, backgroundColor: '#f8fafc' },
  emojiText: { fontSize: 18 },
});

const navStyles = StyleSheet.create({
  headerContainer: {
    backgroundColor: WHITE,
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 16,
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
    paddingBottom: Platform.OS === 'ios' ? 30 : 24,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, color: GRAY, fontWeight: '500' },
  labelActive: { color: PRIMARY, fontWeight: '700' },
});
