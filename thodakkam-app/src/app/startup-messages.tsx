import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, TextInput, Image, KeyboardAvoidingView, Modal
} from 'react-native';
import {
  Menu, Search, Plus, Smile, Send, Briefcase, Users, Calendar, LayoutGrid, MessageSquare, X
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const PRIMARY = '#662483';
const BG = '#ffffff';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function StartupMessages() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyName = (params.companyName as string) || 'Company';

  const [message, setMessage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [allUsersToMessage, setAllUsersToMessage] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({});
  const [myUserId, setMyUserId] = useState<string>('');
  const [showEmojis, setShowEmojis] = useState(false);
  const COMMON_EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '🎉', '🚀', '👀'];

  useEffect(() => {
    AsyncStorage.getItem('startupId').then(id => {
      // We will fallback to companyName if ID is missing or use userStore
      if (id) {
        setMyUserId(id);
        fetchUsers(id);
      }
    });
  }, []);

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
      const res = await fetch('https://thodakkam-backend.onrender.com/api/users/all');
      if (!res.ok) {
        console.warn('API /api/users/all returned ' + res.status);
        return;
      }
      const data = await res.json();
      let formattedUsers: any[] = [];
      if (data.success) {
        formattedUsers = data.users.map((u: any) => {
          let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=662483&color=fff`;
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
      const convRes = await fetch(`https://thodakkam-backend.onrender.com/api/messages/conversations/${userId}`);
      if (convRes.ok) {
        const convData = await convRes.json();
        if (convData.success && convData.conversationIds) {
          const activeCandidates = convData.conversationIds.map((id: string) => {
            const u = formattedUsers.find(u => u.id === id);
            return u ? { id: u.id, name: u.name, active: false, avatar: u.avatar } : null;
          }).filter(Boolean);
          
          if (activeCandidates.length > 0) {
            setCandidates(activeCandidates);
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
    
    if (!myUserId) return;

    try {
      const res = await fetch(`https://thodakkam-backend.onrender.com/api/messages/${myUserId}/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const formattedMsgs = data.messages.map((m: any) => ({
            id: m.id,
            text: m.text,
            isSentByMe: m.senderId === myUserId,
            time: new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }));
          setChatMessages(prev => ({...prev, [user.id]: formattedMsgs}));
        }
      }
    } catch (err) {
      console.error('Fetch msgs error:', err);
    }
  };

  const handleSelectChat = async (candidateId: string, updateActiveState = true) => {
    if (updateActiveState) {
      setActiveChatId(candidateId);
      setCandidates(prev => prev.map(s => ({ ...s, active: s.id === candidateId })));
    }
    
    if (!myUserId) return;
    try {
      const res = await fetch(`https://thodakkam-backend.onrender.com/api/messages/${myUserId}/${candidateId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const formattedMsgs = data.messages.map((m: any) => ({
            id: m.id,
            text: m.text,
            isSentByMe: m.senderId === myUserId,
            time: new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }));
          setChatMessages(prev => ({...prev, [candidateId]: formattedMsgs}));
        }
      }
    } catch (err) {
      console.error('Fetch msgs error:', err);
    }
  };

  const sendActualMessage = async (msgText: string) => {
    if (!msgText.trim() || !activeChatId || !myUserId) return;
    
    const tempId = Date.now().toString();
    const newMessage = { id: tempId, text: msgText, isSentByMe: true, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    setChatMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMessage]
    }));

    try {
      await fetch('https://thodakkam-backend.onrender.com/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: myUserId, receiverId: activeChatId, text: msgText })
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

  const handleNavPress = (label: string) => {
    if (label === 'Dashboard') {
      router.replace({ pathname: '/startup-dashboard' as any, params: { companyName } });
    } else if (label === 'Jobs') {
      router.replace({ pathname: '/startup-jobs' as any, params: { companyName } });
    } else if (label === 'Candidates') {
      router.replace({ pathname: '/startup-candidates' as any, params: { companyName } });
    } else if (label === 'Interviews') {
      router.replace({ pathname: '/startup-interviews' as any, params: { companyName } });
    } else if (label === 'Community') {
      router.replace({ pathname: '/startup-community' as any, params: { companyName } });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Menu size={24} color={TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={{ marginRight: 16 }}>
              <Search size={20} color={TEXT_DARK} />
            </TouchableOpacity>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>{companyName.substring(0, 3).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Candidate Horizontal List */}
        <View style={styles.candidateListContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.candidateList}>
            <TouchableOpacity style={styles.newChatBtn} onPress={() => setIsModalVisible(true)}>
              <View style={styles.newChatIconBox}>
                <Plus size={24} color={PRIMARY} />
              </View>
              <Text style={styles.candidateName}>New</Text>
            </TouchableOpacity>

            {candidates.map(candidate => (
              <TouchableOpacity key={candidate.id} style={styles.candidateItem} onPress={() => handleSelectChat(candidate.id)}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: candidate.avatar }} style={[styles.candidateAvatar, candidate.active && styles.activeAvatarBorder]} />
                  {candidate.active && <View style={styles.activeDot} />}
                </View>
                <Text style={[styles.candidateName, candidate.active && styles.activeCandidateName]}>{candidate.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chat Area */}
        <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
          {!activeChatId ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
              <MessageSquare size={48} color="#cbd5e1" />
              <Text style={{ marginTop: 16, color: '#94a3b8', fontSize: 16 }}>Select or start a new conversation</Text>
            </View>
          ) : (
            <>
              <View style={styles.dateLabelContainer}>
                <View style={styles.dateLabel}>
                  <Text style={styles.dateLabelText}>TODAY</Text>
                </View>
              </View>

              {(chatMessages[activeChatId] || []).length === 0 && (
                <Text style={{ textAlign: 'center', color: TEXT_GRAY, marginTop: 20 }}>No messages yet. Say hi!</Text>
              )}

              {(chatMessages[activeChatId] || []).map((msg: any) => (
                <View key={msg.id} style={[styles.messageRow, msg.isSentByMe ? styles.messageRowSent : null]}>
                  {!msg.isSentByMe && <Image source={{ uri: candidates.find(s => s.id === activeChatId)?.avatar }} style={styles.messageAvatar} />}
                  <View style={[styles.messageContent, msg.isSentByMe ? { alignItems: 'flex-end' } : null]}>
                    <Text style={styles.messageMeta}>{msg.isSentByMe ? 'You' : candidates.find(s => s.id === activeChatId)?.name} • {msg.time}</Text>
                    <View style={msg.isSentByMe ? styles.messageBubbleSent : styles.messageBubbleReceived}>
                      {msg.text.startsWith('data:image/') ? (
                        <Image source={{ uri: msg.text }} style={{ width: 200, height: 200, borderRadius: 8 }} resizeMode="cover" />
                      ) : (
                        <Text style={msg.isSentByMe ? styles.messageTextSent : styles.messageTextReceived}>{msg.text}</Text>
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
          <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', padding: 10, justifyContent: 'space-around', borderTopWidth: 1, borderColor: '#e2e8f0' }}>
            {COMMON_EMOJIS.map(emoji => (
              <TouchableOpacity key={emoji} onPress={() => setMessage(prev => prev + emoji)}>
                <Text style={{ fontSize: 24 }}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage} disabled={!activeChatId}>
              <Plus size={20} color={TEXT_GRAY} />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#94a3b8"
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity style={styles.emojiBtn} onPress={() => setShowEmojis(!showEmojis)}>
              <Smile size={20} color={TEXT_GRAY} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.sendBtn, !activeChatId && { opacity: 0.5 }]} onPress={handleSendMessage} disabled={!activeChatId}>
            <Send size={18} color={WHITE} />
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          {[
            { label: 'Dashboard', icon: LayoutGrid },
            { label: 'Jobs', icon: Briefcase },
            { label: 'Candidates', icon: Users, active: true },
            { label: 'Interviews', icon: Calendar },
            { label: 'Community', icon: Users }
          ].map(item => {
            const isActive = item.active;
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
      </KeyboardAvoidingView>

      {/* New Conversation Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Message</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={TEXT_DARK} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Search size={18} color={TEXT_GRAY} />
              <TextInput style={styles.searchInput} placeholder="Search students or startups..." placeholderTextColor={TEXT_GRAY} />
            </View>

            <ScrollView style={styles.userList}>
              {allUsersToMessage.map(u => (
                <TouchableOpacity key={u.id} style={styles.userListItem} onPress={() => handleStartConversation(u)}>
                  <Image source={{ uri: u.avatar }} style={styles.userListAvatar} />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userType}>{u.type}</Text>
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
  safeArea: { flex: 1, backgroundColor: WHITE },
  container: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 16, backgroundColor: WHITE },
  headerTitle: { fontSize: 18, fontWeight: '800', color: TEXT_DARK },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  logoBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  logoText: { color: TEXT_DARK, fontSize: 10, fontWeight: '800' },

  candidateListContainer: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: WHITE, paddingVertical: 12 },
  candidateList: { paddingHorizontal: 20, gap: 16 },
  candidateItem: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 6 },
  candidateAvatar: { width: 56, height: 56, borderRadius: 28, opacity: 0.5 },
  activeAvatarBorder: { opacity: 1, borderWidth: 2, borderColor: PRIMARY },
  activeDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: WHITE },
  candidateName: { fontSize: 12, color: TEXT_GRAY, fontWeight: '500' },
  activeCandidateName: { color: TEXT_DARK, fontWeight: '700' },

  chatArea: { flex: 1, backgroundColor: '#f8fafc' },
  chatContent: { padding: 20, paddingBottom: 40 },

  dateLabelContainer: { alignItems: 'center', marginVertical: 16 },
  dateLabel: { backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  dateLabelText: { fontSize: 10, fontWeight: '700', color: TEXT_GRAY, letterSpacing: 0.5 },

  messageRow: { flexDirection: 'row', marginBottom: 24, maxWidth: '85%' },
  messageRowSent: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  messageAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 12, marginTop: 18 },
  messageContent: { flex: 1 },
  messageMeta: { fontSize: 10, color: '#94a3b8', marginBottom: 6 },
  messageBubbleReceived: { backgroundColor: WHITE, padding: 16, borderRadius: 20, borderTopLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  messageTextReceived: { fontSize: 14, color: TEXT_DARK, lineHeight: 20 },
  messageBubbleSent: { backgroundColor: '#0f172a', padding: 16, borderRadius: 20, borderTopRightRadius: 4 },
  messageTextSent: { fontSize: 14, color: WHITE, lineHeight: 20 },

  attachmentCard: { marginTop: 12, backgroundColor: WHITE, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  attachmentPreview: { height: 120, backgroundColor: '#f1f5f9' },
  attachmentImg: { width: '100%', height: '100%' },
  attachmentFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  attachmentName: { fontSize: 12, fontWeight: '700', color: TEXT_DARK, marginBottom: 2 },
  attachmentSize: { fontSize: 10, color: TEXT_GRAY },

  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 24, paddingHorizontal: 16, height: 48, marginRight: 12 },
  attachBtn: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 14, color: TEXT_DARK },
  emojiBtn: { marginLeft: 12 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: WHITE, borderTopWidth: 1, borderColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  navItem: { alignItems: 'center', padding: 8 },
  navText: { fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: '500' },
  navTextActive: { color: PRIMARY, fontWeight: '700' },

  newChatBtn: { alignItems: 'center', marginRight: 4 },
  newChatIconBox: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: TEXT_DARK },
  closeBtn: { padding: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: TEXT_DARK },
  userList: { flex: 1 },
  userListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  userListAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  userType: { fontSize: 12, color: TEXT_GRAY, marginTop: 2 },
});
