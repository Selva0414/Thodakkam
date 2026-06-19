import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Platform, Image, Alert, Share, Animated
} from 'react-native';
import {
  Bell, Search, Mail, Settings, LayoutDashboard, Briefcase,
  MessageSquare, Users, Image as ImageIcon, Send, GraduationCap,
  Heart, MessageCircle, Share2, Plus, ClipboardList, ThumbsUp, Repeat, Bookmark, Smile
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import StudentHeader from '../components/StudentHeader';
import { userStore } from '../utils/userStore';
import { useAppTheme } from '../context/ThemeContext';
import { Dimensions, Modal } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function BottomTabBar() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const active = 'Feed';
  const tabs = [
    { label: 'Home', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Job', icon: Briefcase, path: '/student-jobs' },
    { label: 'Test', icon: ClipboardList, path: '/student-assessments' },
    { label: 'Chat', icon: MessageSquare, path: '/student-messages' },
    { label: 'Feed', icon: Users, path: '/student-community' }
  ];
  return (
    <View style={[tabBarStyles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
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
            <View style={[{ padding: 8, borderRadius: 20 }, isActive && { backgroundColor: colors.primary + '20', transform: [{ scale: 1.1 }] }]}>
                  <Icon size={22} color={isActive ? colors.primary : colors.textSecondary} />
                </View>
            <Text style={[tabBarStyles.label, { color: colors.textSecondary }, isActive && { color: colors.primary, fontWeight: '700' }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function StudentCommunity() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

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
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend-47rn.onrender.com' : 'https://thodakkam-backend-47rn.onrender.com';
      const res = await fetch(`${baseUrl}/api/posts`);
      const data = await res.json();
      if (data.success) {
        const processedPosts = data.posts.map((post: any) => {
          let pImageUrl = post.imageUrl;
          let parsedImages: string[] = [];
          if (pImageUrl) {
            try {
              const parsed = JSON.parse(pImageUrl);
              if (Array.isArray(parsed)) {
                parsedImages = parsed.map(url => {
                  if (!url.startsWith('http') && !url.startsWith('data:image')) {
                    const filename = url.split(/[/\\]/).pop();
                    return `${baseUrl}/uploads/${filename}`;
                  }
                  return url;
                });
              } else {
                if (!pImageUrl.startsWith('http') && !pImageUrl.startsWith('data:image')) {
                  const filename = pImageUrl.split(/[/\\]/).pop();
                  parsedImages = [`${baseUrl}/uploads/${filename}`];
                } else {
                  parsedImages = [pImageUrl];
                }
              }
            } catch (e) {
              if (!pImageUrl.startsWith('http') && !pImageUrl.startsWith('data:image')) {
                const filename = pImageUrl.split(/[/\\]/).pop();
                parsedImages = [`${baseUrl}/uploads/${filename}`];
              } else {
                parsedImages = [pImageUrl];
              }
            }
          }

          let uPhoto = post.user?.profilePhoto;
          if (uPhoto && !uPhoto.startsWith('http') && !uPhoto.startsWith('data:image')) {
            const filename = uPhoto.split(/[/\\]/).pop();
            uPhoto = `${baseUrl}/uploads/${filename}`;
          }
          return { ...post, imageUrls: parsedImages, user: post.user ? { ...post.user, profilePhoto: uPhoto } : null };
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StudentHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Top Search & Filter Card */}
        <View style={[styles.topSearchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.topSearchRow}>
            <View style={[styles.searchInputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput 
                style={[styles.mainSearchInput, { color: colors.text }]}
                placeholder="Search users, posts, tags..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/student-add-post' as any)}>
              <Plus size={18} color={'#ffffff'} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sortByText, { color: colors.textSecondary }]}>Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            {['All', 'Project', 'Award', 'Certificate', 'Work Experience'].map((cat, index) => {
              const isActive = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.newFilterChip, { backgroundColor: colors.card, borderColor: colors.border }, isActive && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setActiveCategory(cat)}
                >
                  {!isActive && index === 1 && <LayoutDashboard size={14} color={colors.textSecondary} style={{marginRight: 6}}/>}
                  {!isActive && index === 2 && <ClipboardList size={14} color={colors.textSecondary} style={{marginRight: 6}}/>}
                  {!isActive && index === 3 && <GraduationCap size={14} color={colors.textSecondary} style={{marginRight: 6}}/>}
                  {!isActive && index === 4 && <Briefcase size={14} color={colors.textSecondary} style={{marginRight: 6}}/>}
                  <Text style={[styles.newFilterText, { color: colors.textSecondary }, isActive && { color: '#ffffff' }]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>


        {/* Feed */}
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>Loading ideas...</Text>
        ) : posts.filter(p => activeCategory === 'All' || p.category === activeCategory).length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>No posts yet in {activeCategory}. Be the first to share!</Text>
        ) : (
          posts.filter(p => activeCategory === 'All' || p.category === activeCategory).map(post => <PostItem key={post.id} post={post} />)
        )}
        </Animated.View>
      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

// ─── Post Item Component ───────────────────────────────────────────────────────

function PostItem({ post }: { post: any }) {
  const { colors, isDark } = useAppTheme();
  const initialLikes = post.likes ? post.likes.length : 0;
  const initiallyLiked = post.likes ? post.likes.some((l: any) => l.user?.email === userStore.email) : false;
  
  const initialReposts = post.reposts ? post.reposts.length : 0;
  const initiallyReposted = post.reposts ? post.reposts.some((r: any) => r.user?.email === userStore.email) : false;

  const initiallySaved = post.savedBy ? post.savedBy.some((s: any) => s.user?.email === userStore.email) : false;

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

  // Image Viewer State
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const handleLike = async () => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikesCount((prev: number) => newLikedState ? prev + 1 : prev - 1);
    
    try {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend-47rn.onrender.com' : 'https://thodakkam-backend-47rn.onrender.com';
      await fetch(`${baseUrl}/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userStore.email })
      });
    } catch (err) {
      console.error(err);
      setLiked(!newLikedState);
      setLikesCount((prev: number) => newLikedState ? prev - 1 : prev + 1);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    
    try {
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend-47rn.onrender.com' : 'https://thodakkam-backend-47rn.onrender.com';
      const res = await fetch(`${baseUrl}/api/posts/${post.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText, email: userStore.email })
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
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend-47rn.onrender.com' : 'https://thodakkam-backend-47rn.onrender.com';
      const res = await fetch(`${baseUrl}/api/posts/${post.id}/repost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userStore.email })
      });
      const data = await res.json();
      if (!data.success) {
        setHasReposted(!newRepostedState);
        setRepostCount((prev: number) => newRepostedState ? prev - 1 : prev + 1);
      }
    } catch (err) {
      console.error(err);
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
      const baseUrl = Platform.OS === 'android' ? 'https://thodakkam-backend-47rn.onrender.com' : 'https://thodakkam-backend-47rn.onrender.com';
      const res = await fetch(`${baseUrl}/api/posts/${post.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userStore.email })
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
    <View style={[styles.postCard, { backgroundColor: colors.card }]}>
      <View style={styles.postHeader}>
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={styles.postAvatar} />
        ) : (
          <View style={[styles.postAvatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>{authorInitial}</Text>
          </View>
        )}
        <View style={styles.postMeta}>
          <Text style={[styles.postAuthor, { color: colors.text }]} numberOfLines={1}>{authorName}</Text>
          <Text style={[styles.postTime, { color: colors.textSecondary }]} numberOfLines={1}>{authorRole} • Just now</Text>
        </View>
        {post.category && (
          <View style={[styles.badgeWrap, { backgroundColor: isDark ? colors.primary + '20' : '#f3e8ff' }]}>
            <Text style={[styles.badgeText, { color: isDark ? colors.primary : '#6a1b9a' }]}>{post.category.toUpperCase()}</Text>
          </View>
        )}
        <TouchableOpacity style={{ marginLeft: 8 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 18, fontWeight: 'bold' }}>···</Text>
        </TouchableOpacity>
      </View>

      {post.text ? <Text style={[styles.postText, { color: colors.text }]}>{post.text}</Text> : null}

      {post.imageUrls && post.imageUrls.length > 0 && (
        <View style={styles.imageGridContainer}>
          {post.imageUrls.length === 1 ? (
            <TouchableOpacity onPress={() => { setViewerIndex(0); setViewerVisible(true); }} activeOpacity={0.9}>
              <Image source={{ uri: post.imageUrls[0] }} style={[styles.postImage, { backgroundColor: '#ffffff' }]} resizeMode="contain" />
            </TouchableOpacity>
          ) : post.imageUrls.length === 2 ? (
            <View style={{ flexDirection: 'row', gap: 4, height: 220, marginBottom: 12 }}>
              {post.imageUrls.map((img: string, idx: number) => (
                <TouchableOpacity key={idx} style={{ flex: 1 }} onPress={() => { setViewerIndex(idx); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: img }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          ) : post.imageUrls.length === 3 ? (
            <View style={{ flexDirection: 'row', gap: 4, height: 220, marginBottom: 12 }}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => { setViewerIndex(0); setViewerVisible(true); }} activeOpacity={0.9}>
                <Image source={{ uri: post.imageUrls[0] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
              </TouchableOpacity>
              <View style={{ flex: 1, gap: 4 }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => { setViewerIndex(1); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: post.imageUrls[1] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => { setViewerIndex(2); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: post.imageUrls[2] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 4, height: 220, marginBottom: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => { setViewerIndex(0); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: post.imageUrls[0] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => { setViewerIndex(2); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: post.imageUrls[2] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => { setViewerIndex(1); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: post.imageUrls[1] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, position: 'relative' }} onPress={() => { setViewerIndex(3); setViewerVisible(true); }} activeOpacity={0.9}>
                  <Image source={{ uri: post.imageUrls[3] }} style={[{ flex: 1, borderRadius: 12, backgroundColor: '#ffffff' }]} resizeMode="cover" />
                  {post.imageUrls.length > 4 && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>+{post.imageUrls.length - 4}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={[styles.postFooter, showComments && { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 16, marginBottom: 16 }]}>
        <TouchableOpacity style={styles.footerAction} onPress={handleLike}>
          <ThumbsUp size={20} color={liked ? colors.primary : colors.textSecondary} fill={liked ? colors.primary : 'transparent'} />
          <Text style={[styles.footerActionText, { color: colors.textSecondary }, liked && { color: colors.primary }]}>{likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.footerAction, showComments && { backgroundColor: isDark ? colors.primary + '20' : '#f3e8ff', borderWidth: 1, borderColor: colors.primary }]} 
          onPress={() => setShowComments(!showComments)}
        >
          <MessageSquare size={20} color={showComments ? colors.primary : colors.textSecondary} />
          <Text style={[styles.footerActionText, { color: colors.textSecondary }, showComments && { color: colors.primary }]}>{comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerAction} onPress={handleRepost} disabled={isReposting}>
          <Repeat size={20} color={hasReposted ? colors.primary : colors.textSecondary} />
          <Text style={[styles.footerActionText, { color: colors.textSecondary }, hasReposted && { color: colors.primary }]}>{repostCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.footerAction, styles.shareAction]} onPress={handleSave} disabled={isSaving}>
          <Bookmark size={18} color={hasSaved ? colors.primary : colors.textSecondary} fill={hasSaved ? colors.primary : 'transparent'} />
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
                <View style={[styles.commentAvatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>{author.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={[styles.commentBubble, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={[styles.commentAuthor, { color: colors.text }]}>{author}</Text>
                  <View style={[styles.commentRoleBadge, { backgroundColor: isDark ? colors.success + '20' : '#ecfdf5' }]}>
                    <GraduationCap size={10} color={isDark ? colors.success : '#10b981'} />
                    <Text style={[styles.commentRoleText, { color: isDark ? colors.success : '#10b981' }]}>{role}</Text>
                  </View>
                </View>
                <Text style={[styles.commentText, { color: colors.text }]}>{c.text}</Text>
              </View>
            </View>
          )})}

          {/* Add Comment Input */}
          <View style={styles.commentInputRow}>
            {userStore.profilePhoto ? (
              <Image source={{ uri: userStore.profilePhoto }} style={styles.commentAvatar} />
            ) : (
              <View style={[styles.commentAvatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>{userStore.name ? userStore.name.charAt(0).toUpperCase() : 'S'}</Text>
              </View>
            )}
            <View style={[styles.commentInputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <TextInput 
                style={[styles.commentInput, { color: colors.text }]}
                placeholder="Add a comment..."
                placeholderTextColor={colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={submitComment}
              />
              <TouchableOpacity style={{ padding: 4 }} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
                <Smile size={18} color={'#fbbf24'} />
              </TouchableOpacity>
            </View>
            
            {showEmojiPicker && (
              <View style={[styles.emojiPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {['👍', '❤️', '😂', '😮', '😢', '👏', '🔥', '🚀'].map(emoji => (
                  <TouchableOpacity 
                    key={emoji} 
                    onPress={() => {
                      setCommentText(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    style={[styles.emojiBtn, { backgroundColor: colors.inputBg }]}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity style={[styles.commentSendBtn, { backgroundColor: colors.primary }, !commentText.trim() && { opacity: 0.5 }]} onPress={submitComment} disabled={!commentText.trim()}>
              <Send size={16} color={'#ffffff'} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Full Screen Image Viewer Modal */}
      <Modal visible={viewerVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, zIndex: 10 }}>
              <TouchableOpacity onPress={() => setViewerVisible(false)} style={{ padding: 8 }}>
                <Text style={{ color: '#fff', fontSize: 32, lineHeight: 32 }}>×</Text>
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {viewerIndex + 1} / {post.imageUrls?.length || 0}
              </Text>
              <View style={{ width: 40 }} />
            </View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setViewerIndex(newIndex);
              }}
              contentOffset={{ x: viewerIndex * SCREEN_WIDTH, y: 0 }}
              style={{ flex: 1 }}
            >
              {post.imageUrls?.map((img: string, idx: number) => (
                <View key={idx} style={{ width: SCREEN_WIDTH, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                  <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 20, paddingBottom: 100, gap: 8 }}>
              {post.imageUrls?.map((_: any, idx: number) => (
                <View key={idx} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: viewerIndex === idx ? '#fff' : 'rgba(255,255,255,0.3)' }} />
              ))}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  topSearchCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  topSearchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
  },
  addBtn: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  searchIcon: { marginRight: 8 },
  mainSearchInput: { flex: 1, fontSize: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
  sortByText: { fontSize: 13, marginBottom: 8, fontWeight: '500' },
  
  newFilterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  newFilterText: { fontSize: 13, fontWeight: '600' },
  filterScroll: { flexGrow: 0 },
  filterContent: { paddingRight: 16 },

  postCard: {
    borderRadius: 16, padding: 16, marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    }),
  },
  postHeader: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0' },
  postMeta: { flex: 1, marginRight: 8 },
  postAuthor: { fontSize: 14, fontWeight: '800', flexShrink: 1 },
  postTime: { fontSize: 11, marginTop: 2 },
  badgeWrap: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  postText: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  postImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 12 },
  imageGridContainer: { width: '100%' },

  postFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  footerAction: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 20 },
  footerActionText: { fontSize: 13, fontWeight: '600' },
  shareAction: { paddingHorizontal: 0 },

  commentsSection: { marginTop: 4 },
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e2e8f0' },
  commentBubble: { flex: 1, padding: 12, borderRadius: 16, borderWidth: 1 },
  commentAuthor: { fontSize: 13, fontWeight: '700' },
  commentRoleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  commentRoleText: { fontSize: 9, fontWeight: '700', marginLeft: 4 },
  commentText: { fontSize: 13, lineHeight: 18 },

  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, position: 'relative' },
  commentInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, height: 40 },
  commentInput: { flex: 1, fontSize: 13, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
  commentSendBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  emojiPicker: {
    position: 'absolute',
    bottom: 50,
    right: 40,
    borderRadius: 24,
    padding: 8,
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    }),
    zIndex: 100,
  },
  emojiBtn: { padding: 6, borderRadius: 16 },
  emojiText: { fontSize: 18 },
});

const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 30 : 24,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, fontWeight: '500' },
});
