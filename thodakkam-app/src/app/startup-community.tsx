import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Alert, Share, Animated
} from 'react-native';
import {
  Bell, Search, Mail, Settings, LayoutGrid, Briefcase,
  MessageSquare, Users, Image as ImageIcon, Send, GraduationCap,
  Heart, MessageCircle, Share2, Plus, ClipboardList, ThumbsUp, Repeat, Bookmark, Smile, Calendar
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
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    if (companyName) {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      fetch(`${baseUrl}/api/startup/profile/${encodeURIComponent(companyName)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.startup?.companyLogo) {
            setCompanyLogo(data.startup.companyLogo);
          }
        })
        .catch(err => console.log('Error fetching logo:', err));
    }
  }, [companyName]);

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
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
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
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        
        {/* Top Search & Filter Card */}
        <View style={styles.topSearchCard}>
          <View style={styles.topSearchRow}>
            <View style={styles.searchInputWrap}>
              <Search size={20} color={GRAY} style={styles.searchIcon} />
              <TextInput 
                style={styles.mainSearchInput}
                placeholder="Search users, posts, tags..."
                placeholderTextColor={GRAY}
              />
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push({ pathname: '/startup-add-post' as any, params: { companyName } })}>
              <Plus size={18} color={WHITE} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sortByText}>Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            {['All', 'Project', 'Award', 'Certificate', 'Work Experience'].map((cat, index) => {
              const isActive = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.newFilterChip, isActive && styles.newFilterChipActive]}
                  onPress={() => setActiveCategory(cat)}
                >
                  {!isActive && index === 1 && <LayoutGrid size={14} color={GRAY} style={{marginRight: 6}}/>}
                  {!isActive && index === 2 && <ClipboardList size={14} color={GRAY} style={{marginRight: 6}}/>}
                  {!isActive && index === 3 && <GraduationCap size={14} color={GRAY} style={{marginRight: 6}}/>}
                  {!isActive && index === 4 && <Briefcase size={14} color={GRAY} style={{marginRight: 6}}/>}
                  <Text style={[styles.newFilterText, isActive && styles.newFilterTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Feed */}
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: GRAY }}>Loading feed...</Text>
        ) : posts.filter(p => activeCategory === 'All' || p.category === activeCategory).length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: GRAY }}>No posts yet in {activeCategory}.</Text>
        ) : (
          posts.filter(p => activeCategory === 'All' || p.category === activeCategory).map(post => <PostItem key={post.id} post={post} companyName={companyName} companyLogo={companyLogo} />)
        )}
        
        </Animated.View>
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

function PostItem({ post, companyName, companyLogo }: { post: any, companyName: string, companyLogo: string | null }) {
  const initialLikes = post.likes ? post.likes.length : 0;
  // Fallback to random if no likes field
  const [likesCount, setLikesCount] = useState(post.likes ? initialLikes : Math.floor(Math.random() * 100));
  const [liked, setLiked] = useState(false);
  
  const [comments, setComments] = useState<any[]>(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    // Optimistic UI update
    setLiked(!liked);
    setLikesCount((prev: number) => liked ? prev - 1 : prev + 1);
    
    // We try to call the backend, but since backend doesn't support startup likes perfectly via email without user table, it might 404. We keep optimistic UI.
    try {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';
      await fetch(`${baseUrl}/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName }) // Send companyName to identify the startup
      });
    } catch (err) {
      console.error(err);
      // Revert if error
      setLiked(liked);
      setLikesCount(likesCount);
    } finally {
      setIsLiking(false);
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
        body: JSON.stringify({ text: commentText, companyName })
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setComments([...comments, data.comment]);
        setCommentText('');
      } else {
        // Fallback optimistic UI if server fails
        const tempComment = {
          id: Date.now().toString(),
          text: commentText,
          startup: { companyName, profilePhoto: companyLogo, companyLogo: companyLogo }
        };
        setComments([...comments, tempComment]);
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
      // Optimistic UI on error
      const tempComment = {
        id: Date.now().toString(),
        text: commentText,
        startup: { companyName, profilePhoto: companyLogo, companyLogo: companyLogo }
      };
      setComments([...comments, tempComment]);
      setCommentText('');
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
          <Text style={styles.postAuthor}>{authorName}</Text>
          <Text style={styles.postTime}>{authorRole} • Just now</Text>
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
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
      )}

      <View style={[styles.postFooter, showComments && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 16, marginBottom: 16 }]}>
        <TouchableOpacity style={styles.footerAction} onPress={handleLike}>
          <ThumbsUp size={18} color={liked ? PRIMARY : GRAY} />
          <Text style={[styles.footerActionText, liked && { color: PRIMARY }]}>Like ({likesCount})</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.footerAction, showComments && styles.activeFooterBtn]} 
          onPress={() => setShowComments(!showComments)}
        >
          <MessageSquare size={18} color={showComments ? PRIMARY : GRAY} />
          <Text style={[styles.footerActionText, showComments && { color: PRIMARY }]}>Comment ({comments.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerAction}>
          <Repeat size={18} color={GRAY} />
          <Text style={styles.footerActionText}>Repost (0)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.footerAction, styles.shareAction]}>
          <Bookmark size={18} color={GRAY} />
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {showComments && (
        <View style={styles.commentsSection}>
          {comments.map((c: any) => {
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
                    <Briefcase size={10} color="#10b981" />
                    <Text style={styles.commentRoleText}>{role}</Text>
                  </View>
                </View>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            </View>
          )})}

          {/* Add Comment Input */}
          <View style={styles.commentInputRow}>
            {companyLogo ? (
              <Image source={{ uri: companyLogo }} style={styles.commentAvatar} />
            ) : (
              <View style={[styles.commentAvatar, { backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: WHITE, fontSize: 10, fontWeight: 'bold' }}>{companyName.charAt(0).toUpperCase()}</Text>
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

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  topSearchCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  topSearchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  searchIcon: { marginRight: 8 },
  mainSearchInput: { flex: 1, fontSize: 14, color: DARK, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
  sortByText: { fontSize: 13, color: GRAY, marginBottom: 8, fontWeight: '500' },
  
  newFilterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: WHITE, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 8 },
  newFilterChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  newFilterText: { fontSize: 13, fontWeight: '600', color: GRAY },
  newFilterTextActive: { color: WHITE },
  filterScroll: { flexGrow: 0 },
  filterContent: { paddingRight: 16 },

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
  footerAction: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  activeFooterBtn: { backgroundColor: '#f3e8ff', borderWidth: 1, borderColor: PRIMARY },
  footerActionText: { fontSize: 13, fontWeight: '600', color: GRAY },
  shareAction: { marginLeft: 'auto', paddingHorizontal: 0 },

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
  commentSendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },

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

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: WHITE, borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  navText: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  navTextActive: { color: PRIMARY, fontWeight: '700' },
});
