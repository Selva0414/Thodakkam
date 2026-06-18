import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, TextInput, Image, KeyboardAvoidingView, Modal, Alert, Linking
} from 'react-native';
import {
  Menu, Search, Plus, Smile, Send, Briefcase, Users, Calendar, LayoutGrid, MessageSquare, X, ArrowLeft, FileText, Image as LucideImage, Camera, Headphones, User as UserIcon, AlignLeft, Calendar as CalendarIcon, FilePlus, Paperclip, Download
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { globalNotificationStore } from '../utils/notificationStore';
import { useAppTheme } from '../context/ThemeContext';

export default function StartupMessages() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string) || 'Company';
  const { colors, isDark } = useAppTheme();

  const [message, setMessage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [allUsersToMessage, setAllUsersToMessage] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({});
  const [myUserId, setMyUserId] = useState<string>('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const COMMON_EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '🎉', '🚀', '👀'];

  useEffect(() => {
    if (companyName) {
      fetch(`https://thodakkam.onrender.com/api/startup/profile/${encodeURIComponent(companyName)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.startup?.companyLogo) {
            setCompanyLogo(data.startup.companyLogo);
          }
        })
        .catch(err => console.log('Error fetching logo:', err));
    }
  }, [companyName]);

  useEffect(() => {
    AsyncStorage.getItem('startupId').then(id => {
      if (id) {
        setMyUserId(id);
        fetchUsers(id);
      } else if (companyName) {
        fetch(`https://thodakkam.onrender.com/api/startup/profile/${encodeURIComponent(companyName)}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.startup?.id) {
              AsyncStorage.setItem('startupId', data.startup.id);
              setMyUserId(data.startup.id);
              fetchUsers(data.startup.id);
            }
          })
          .catch(err => console.log('Error fallback fetching ID:', err));
      }
    });
  }, [companyName]);

  // Real-time polling effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeChatId && myUserId) {
      interval = setInterval(() => {
        handleSelectChat(activeChatId, false); // Fetch silently
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeChatId, myUserId]);

  const fetchUsers = async (userId: string) => {
    try {
      const res = await fetch('https://thodakkam.onrender.com/api/users/all');
      if (!res.ok) {
        console.warn('API /api/users/all returned ' + res.status);
        return;
      }
      const data = await res.json();
      let formattedUsers: any[] = [];
      if (data.success) {
        formattedUsers = data.users.map((u: any) => {
          let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=${colors.primary.replace('#', '')}&color=fff`;
          if (u.profilePhoto && !u.profilePhoto.startsWith('file://')) {
            avatarUrl = u.profilePhoto;
          }
          return {
            id: u.id,
            name: u.fullName || u.email,
            type: u.role,
            avatar: avatarUrl
          };
        });
        setAllUsersToMessage(formattedUsers);
      }

      // Fetch active conversations
      const convRes = await fetch(`https://thodakkam.onrender.com/api/messages/conversations/${userId}`);
      if (convRes.ok) {
        const convData = await convRes.json();
        const pinnedStr = await AsyncStorage.getItem(`pinned_candidates_${userId}`);
        let pinnedIds: string[] = [];
        if (pinnedStr) {
          try { pinnedIds = JSON.parse(pinnedStr); } catch (e) { }
        }

        if (convData.success) {
          const allIds = new Set<string>([...pinnedIds, ...(convData.conversationIds || [])]);
          const activeCandidates = Array.from(allIds).map((id: string) => {
            const u = formattedUsers.find(u => u.id === id);
            return u ? { id: u.id, name: u.name, active: false, avatar: u.avatar } : null;
          }).filter(Boolean);

          if (activeCandidates.length > 0 && activeCandidates[0]) {
            setCandidates(activeCandidates as any[]);
            if (!activeChatId) {
              handleSelectChat(activeCandidates[0].id, true, userId);
            }
          }
        }
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  const handleStartConversation = async (user: any) => {
    setIsModalVisible(false);
    setActiveChatId(user.id);
    setCandidates(prev => {
      const exists = prev.find(s => s.id === user.id);
      const updated = prev.map(s => ({ ...s, active: false }));
      if (exists) {
        return updated.map(s => s.id === user.id ? { ...s, active: true } : s);
      }
      return [{ id: user.id, name: user.name, active: true, avatar: user.avatar }, ...updated];
    });

    if (myUserId) {
      AsyncStorage.getItem(`pinned_candidates_${myUserId}`).then(pinnedStr => {
        let pinnedIds: string[] = [];
        if (pinnedStr) {
          try { pinnedIds = JSON.parse(pinnedStr); } catch (e) { }
        }
        if (!pinnedIds.includes(user.id)) {
          pinnedIds.unshift(user.id);
          AsyncStorage.setItem(`pinned_candidates_${myUserId}`, JSON.stringify(pinnedIds));
        }
      });
    }

    if (!myUserId) return;

    try {
      const res = await fetch(`https://thodakkam.onrender.com/api/messages/${myUserId}/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const formattedMsgs = data.messages.map((m: any) => ({
            id: m.id,
            text: m.text,
            isSentByMe: m.senderId === myUserId,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setChatMessages(prev => ({ ...prev, [user.id]: formattedMsgs }));
        }
      }
    } catch (err) {
      console.error('Fetch msgs error:', err);
    }
  };

  const handleSelectChat = async (candidateId: string, updateActiveState = true, overrideUserId?: string) => {
    if (updateActiveState) {
      setActiveChatId(candidateId);
      setCandidates(prev => prev.map(s => ({ ...s, active: s.id === candidateId })));
    }

    const uid = overrideUserId || myUserId;
    if (!uid) return;
    try {
      const res = await fetch(`https://thodakkam.onrender.com/api/messages/${uid}/${candidateId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const formattedMsgs = data.messages.map((m: any) => ({
            id: m.id,
            text: m.text,
            isSentByMe: m.senderId === myUserId,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setChatMessages(prev => ({ ...prev, [candidateId]: formattedMsgs }));
        }
      }
    } catch (err) {
      console.error('Fetch msgs error:', err);
    }
  };

  const sendActualMessage = async (msgText: string) => {
    if (!msgText.trim() || !activeChatId || !myUserId) return;

    const tempId = Date.now().toString();
    const newMessage = { id: tempId, text: msgText, isSentByMe: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMessage]
    }));

    setCandidates(prev => {
      if (!prev.find(s => s.id === activeChatId)) {
        const targetUser = allUsersToMessage.find(u => u.id === activeChatId);
        if (targetUser) {
          return [{ id: targetUser.id, name: targetUser.name, active: false, avatar: targetUser.avatar }, ...prev];
        }
      }
      return prev;
    });

    try {
      await fetch('https://thodakkam.onrender.com/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: myUserId, receiverId: activeChatId, text: msgText })
      });

      globalNotificationStore.addNotification({
        title: 'New Message',
        description: 'You received a new message',
        type: 'info'
      });
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleSendMessage = () => {
    sendActualMessage(message);
    setMessage('');
    setShowEmojis(false);
  };

  const handlePickImage = async () => {
    setShowAttachmentMenu(false);
    if (!activeChatId) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0].base64) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      sendActualMessage(base64Img);
    }
  };

  const handlePickDocument = async () => {
    setShowAttachmentMenu(false);
    if (!activeChatId) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name;

        // Convert to base64
        const response = await fetch(fileUri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          sendActualMessage(`[DOCUMENT] ${fileName}|${base64data}`);
        };
        reader.readAsDataURL(blob);
      }
    } catch (err) {
      console.log('Error picking document', err);
    }
  };

  const handleNavPress = (label: string) => {
    if (label === 'Home') {
      router.navigate({ pathname: '/startup-dashboard' as any, params: { companyName } });
    } else if (label === 'Jobs') {
      router.navigate({ pathname: '/startup-jobs' as any, params: { companyName } });
    } else if (label === 'Candidates') {
      router.navigate({ pathname: '/startup-candidates' as any, params: { companyName } });
    } else if (label === 'Interviews') {
      router.navigate({ pathname: '/startup-interviews' as any, params: { companyName } });
    } else if (label === 'Feed') {
      router.navigate({ pathname: '/startup-community' as any, params: { companyName } });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
          <View style={styles.headerRight}>
            <View style={[styles.logoBox, { backgroundColor: colors.inputBg }, companyLogo && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}>
              {companyLogo ? (
                <Image source={{ uri: companyLogo }} style={{ width: '100%', height: '100%', borderRadius: 16, resizeMode: 'cover' }} />
              ) : (
                <Text style={[styles.logoText, { color: colors.text }]}>{companyName.substring(0, 3).toUpperCase()}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Candidate Horizontal List */}
        <View style={[styles.candidateListContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.candidateList}>
            <TouchableOpacity style={styles.newChatBtn} onPress={() => setIsModalVisible(true)}>
              <View style={[styles.newChatIconBox, { borderColor: colors.border }]}>
                <Plus size={24} color={colors.primary} />
              </View>
              <Text style={[styles.candidateName, { color: colors.textSecondary }]}>New</Text>
            </TouchableOpacity>

            {candidates.map(candidate => (
              <TouchableOpacity key={candidate.id} style={styles.candidateItem} onPress={() => handleSelectChat(candidate.id)}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: candidate.avatar }} style={[styles.candidateAvatar, candidate.active && { opacity: 1, borderWidth: 2, borderColor: colors.primary }]} />
                  {candidate.active && <View style={[styles.activeDot, { borderColor: colors.card, backgroundColor: isDark ? colors.success : '#22c55e' }]} />}
                </View>
                <Text style={[styles.candidateName, { color: colors.textSecondary }, candidate.active && { color: colors.text, fontWeight: '700' }]}>{candidate.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chat Area */}
        <ScrollView style={[styles.chatArea, { backgroundColor: colors.background }]} contentContainerStyle={styles.chatContent}>
          {!activeChatId ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
              <MessageSquare size={48} color={colors.textSecondary} />
              <Text style={{ marginTop: 16, color: colors.textSecondary, fontSize: 16 }}>Select or start a new conversation</Text>
            </View>
          ) : (
            <>
              <View style={styles.dateLabelContainer}>
                <View style={[styles.dateLabel, { backgroundColor: colors.inputBg }]}>
                  <Text style={[styles.dateLabelText, { color: colors.textSecondary }]}>TODAY</Text>
                </View>
              </View>

              {(chatMessages[activeChatId] || []).length === 0 && (
                <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>No messages yet. Say hi!</Text>
              )}

              {(chatMessages[activeChatId] || []).map((msg: any) => (
                <View key={msg.id} style={[styles.messageRow, msg.isSentByMe ? styles.messageRowSent : null]}>
                  {!msg.isSentByMe && <Image source={{ uri: candidates.find(s => s.id === activeChatId)?.avatar }} style={styles.messageAvatar} />}
                  <View style={[styles.messageContent, msg.isSentByMe ? { alignItems: 'flex-end' } : null]}>
                    <Text style={[styles.messageMeta, { color: colors.textSecondary }]}>{msg.isSentByMe ? 'You' : candidates.find(s => s.id === activeChatId)?.name} • {msg.time}</Text>
                    <View style={[msg.isSentByMe ? { backgroundColor: isDark ? colors.primary : '#0f172a', padding: 16, borderRadius: 20, borderTopRightRadius: 4 } : { backgroundColor: colors.card, padding: 16, borderRadius: 20, borderTopLeftRadius: 4, shadowColor: isDark ? '#000000' : '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }, (msg.text.startsWith('data:image/') || msg.text.startsWith('[DOCUMENT] ') || msg.text.startsWith('Sent a document: ')) && { padding: 0, backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }]}>
                      {msg.text.startsWith('data:image/') ? (
                        <TouchableOpacity onPress={() => setSelectedImage(msg.text)}>
                          <Image source={{ uri: msg.text }} style={{ width: 200, height: 200, borderRadius: 8 }} resizeMode="cover" />
                        </TouchableOpacity>
                      ) : msg.text.startsWith('[DOCUMENT] ') || msg.text.startsWith('Sent a document: ') ? (
                        <View style={{ width: 260, backgroundColor: colors.primary, borderRadius: 16, overflow: 'hidden' }}>
                          {/* Top Header */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingBottom: 8 }}>
                            <Paperclip size={16} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />
                            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
                              {msg.text.split('|')[0].replace('[DOCUMENT] ', '').replace('Sent a document: ', '')}
                            </Text>
                          </View>

                          {/* Inner White Card */}
                          <View style={{ backgroundColor: colors.card, height: 140, marginHorizontal: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                            <Paperclip size={48} color={colors.textSecondary} />
                          </View>

                          {/* Footer with Download */}
                          <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginTop: 4 }}
                            onPress={() => {
                              const parts = msg.text.split('|');
                              const fileName = parts[0].replace('[DOCUMENT] ', '').replace('Sent a document: ', '');
                              if (parts.length > 1) {
                                const base64Data = parts[1];
                                if (Platform.OS === 'web') {
                                  const a = document.createElement("a");
                                  a.href = base64Data;
                                  a.download = fileName;
                                  a.click();
                                } else {
                                  Linking.openURL(base64Data).catch(() => {
                                    Alert.alert('Download Error', 'Could not open the document.');
                                  });
                                }
                              } else {
                                Alert.alert('Download Started', 'Downloading ' + fileName);
                              }
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                              <Paperclip size={14} color="rgba(255,255,255,0.9)" style={{ marginRight: 6 }} />
                              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
                                {msg.text.split('|')[0].replace('[DOCUMENT] ', '').replace('Sent a document: ', '')}
                              </Text>
                            </View>
                            <Download size={18} color="rgba(255,255,255,0.7)" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={[msg.isSentByMe ? { fontSize: 14, color: '#ffffff', lineHeight: 20 } : { fontSize: 14, color: colors.text, lineHeight: 20 }]}>{msg.text}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>

        {/* Emoji Bar */}
        {showEmojis && (
          <View style={{ flexDirection: 'row', backgroundColor: colors.inputBg, padding: 10, justifyContent: 'space-around', borderTopWidth: 1, borderColor: colors.border }}>
            {COMMON_EMOJIS.map(emoji => (
              <TouchableOpacity key={emoji} onPress={() => setMessage(prev => prev + emoji)}>
                <Text style={{ fontSize: 24 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          {showAttachmentMenu && (
            <View style={{ position: 'absolute', bottom: 70, left: 16, backgroundColor: colors.card, borderRadius: 12, padding: 8, width: 200, zIndex: 100, elevation: 10, shadowColor: isDark ? '#000000' : colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, borderWidth: 1, borderColor: colors.border }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12 }} onPress={handlePickDocument}>
                <Paperclip size={18} color={colors.primary} style={{ marginRight: 12 }} />
                <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '500' }}>Attach File</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 12 }} onPress={handlePickImage}>
                <LucideImage size={18} color={colors.primary} style={{ marginRight: 12 }} />
                <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '500' }}>Image</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg }]}>
            <TouchableOpacity style={[styles.attachBtn, { backgroundColor: isDark ? colors.primary + '30' : '#f3e8ff', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }]} onPress={() => setShowAttachmentMenu(!showAttachmentMenu)} disabled={!activeChatId}>
              <Plus size={18} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Write a message..."
              placeholderTextColor={colors.textSecondary}
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity style={styles.emojiBtn} onPress={() => setShowEmojis(!showEmojis)}>
              <Smile size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }, !activeChatId && { opacity: 0.5 }]} onPress={handleSendMessage} disabled={!activeChatId}>
            <Send size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>


      </KeyboardAvoidingView>

      {/* Image Viewer Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 10 }}
            onPress={() => setSelectedImage(null)}
          >
            <X size={28} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: selectedImage || '' }} style={{ width: '100%', height: '70%' }} resizeMode="contain" />
          <TouchableOpacity
            style={{ marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => {
              if (Platform.OS === 'web') {
                const a = document.createElement("a");
                a.href = selectedImage || '';
                a.download = 'image.jpg';
                a.click();
              } else {
                Linking.openURL(selectedImage || '').catch(() => Alert.alert('Error', 'Could not download image.'));
              }
            }}
          >
            <Download size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Download Image</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* New Conversation Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Message</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBar, { backgroundColor: colors.inputBg }]}>
              <Search size={18} color={colors.textSecondary} />
              <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder="Search students or startups..." placeholderTextColor={colors.textSecondary} value={searchQuery} onChangeText={setSearchQuery} />
            </View>

            <ScrollView style={styles.userList}>
              {allUsersToMessage.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                <TouchableOpacity key={u.id} style={[styles.userListItem, { borderBottomColor: colors.border }]} onPress={() => handleStartConversation(u)}>
                  <Image source={{ uri: u.avatar }} style={styles.userListAvatar} />
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>{u.name}</Text>
                    <Text style={[styles.userType, { color: colors.textSecondary }]}>{u.type}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 10, fontWeight: '800' },

  candidateListContainer: { borderBottomWidth: 1, paddingVertical: 12 },
  candidateList: { paddingHorizontal: 20, gap: 16 },
  candidateItem: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 6 },
  candidateAvatar: { width: 56, height: 56, borderRadius: 28, opacity: 0.5 },
  activeDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  candidateName: { fontSize: 12, fontWeight: '500' },

  chatArea: { flex: 1 },
  chatContent: { padding: 20, paddingBottom: 40 },

  dateLabelContainer: { alignItems: 'center', marginVertical: 16 },
  dateLabel: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  dateLabelText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  messageRow: { flexDirection: 'row', marginBottom: 24, maxWidth: '85%' },
  messageRowSent: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  messageAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 12, marginTop: 18 },
  messageContent: { flex: 1 },
  messageMeta: { fontSize: 10, marginBottom: 6 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 16, height: 48, marginRight: 12 },
  attachBtn: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 14 },
  emojiBtn: { marginLeft: 12 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', padding: 8 },
  navText: { fontSize: 10, marginTop: 4, fontWeight: '500' },

  newChatBtn: { alignItems: 'center', marginRight: 4 },
  newChatIconBox: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  closeBtn: { padding: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  userList: { flex: 1 },
  userListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  userListAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700' },
  userType: { fontSize: 12, marginTop: 2 },
});
