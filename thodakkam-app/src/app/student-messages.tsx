import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, TextInput, Image, KeyboardAvoidingView, Modal, Animated
} from 'react-native';
import {
  Menu, Search, Plus, Smile, Send, Briefcase, Users, LayoutDashboard, ClipboardList, MessageSquare, X
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import StudentHeader from '../components/StudentHeader';

const PRIMARY = '#5A279B';
const BG = '#f4f5f7';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

function BottomTabBar({ activeTab }: { activeTab: string }) {
  const router = useRouter();
  const tabs = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Jobs Board', icon: Briefcase, path: '/student-jobs' },
    { label: 'Assessments', icon: ClipboardList, path: '/student-assessments' },
    { label: 'Messages', icon: MessageSquare, path: '/student-messages' },
    { label: 'Community', icon: Users, path: '/student-community' },
  ];
  return (
    <View style={tabBarStyles.container}>
      {tabs.map(({ label, icon: Icon, path }) => {
        const isActive = activeTab === label;
        return (
          <TouchableOpacity key={label} style={tabBarStyles.tab} onPress={() => {
            if (path && path !== '/student-messages' && activeTab === 'Messages') {
               router.push(path as any);
            } else if (path && !isActive) {
               router.push(path as any);
            }
          }}>
            <Icon size={22} color={isActive ? PRIMARY : TEXT_GRAY} />
            <Text style={[tabBarStyles.label, isActive && tabBarStyles.labelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function StudentMessages() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [startups, setStartups] = useState<any[]>([]);
  const [allUsersToMessage, setAllUsersToMessage] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({});
  const [myUserId, setMyUserId] = useState<string>('');
  const [showEmojis, setShowEmojis] = useState(false);
  const COMMON_EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '🎉', '🚀', '👀'];

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

  useEffect(() => {
    AsyncStorage.getItem('studentUserId').then(id => {
      if (id) {
        setMyUserId(id);
        fetchUsers(id);
      }
    });
  }, []);

  // Real-time polling effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (myUserId) {
      interval = setInterval(async () => {
        // Refresh active chat
        if (activeChatId) {
          handleSelectChat(activeChatId, false);
        }
        
        // Refresh conversation list to see new incoming chats
        if (allUsersToMessage.length > 0) {
          try {
            const convRes = await fetch(`https://thodakkam-backend.onrender.com/api/messages/conversations/${myUserId}`);
            if (convRes.ok) {
              const convData = await convRes.json();
              if (convData.success && convData.conversationIds) {
                setStartups(prev => {
                  const existingIds = prev.map(p => p.id);
                  const newIds = convData.conversationIds.filter((id: string) => !existingIds.includes(id));
                  if (newIds.length === 0) return prev;
                  const newStartups = newIds.map((id: string) => {
                    const u = allUsersToMessage.find((u:any) => u.id === id);
                    return u ? { id: u.id, name: u.name, active: false, avatar: u.avatar } : null;
                  }).filter(Boolean);
                  return [...newStartups, ...prev]; // put new ones at front
                });
              }
            }
          } catch (e) {}
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeChatId, myUserId, allUsersToMessage]);

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
          let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=0D8ABC&color=fff`;
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
          const activeStartups = convData.conversationIds.map((id: string) => {
            const u = formattedUsers.find(u => u.id === id);
            return u ? { id: u.id, name: u.name, active: false, avatar: u.avatar } : null;
          }).filter(Boolean);
          
          if (activeStartups.length > 0) {
            setStartups(activeStartups);
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
    setStartups(prev => {
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

  const handleSelectChat = async (startupId: string, updateActiveState = true) => {
    if (updateActiveState) {
      setActiveChatId(startupId);
      setStartups(prev => prev.map(s => ({ ...s, active: s.id === startupId })));
    }
    
    if (!myUserId) return;
    try {
      const res = await fetch(`https://thodakkam-backend.onrender.com/api/messages/${myUserId}/${startupId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const formattedMsgs = data.messages.map((m: any) => ({
            id: m.id,
            text: m.text,
            isSentByMe: m.senderId === myUserId,
            time: new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }));
          setChatMessages(prev => ({...prev, [startupId]: formattedMsgs}));
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentHeader />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Startup Horizontal List */}
        <View style={styles.startupListContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.startupList}>
            <TouchableOpacity style={styles.newChatBtn} onPress={() => setIsModalVisible(true)}>
              <View style={styles.newChatIconBox}>
                <Plus size={24} color={PRIMARY} />
              </View>
              <Text style={styles.startupName}>New</Text>
            </TouchableOpacity>

            {startups.map(startup => (
              <TouchableOpacity key={startup.id} style={styles.startupItem} onPress={() => handleSelectChat(startup.id)}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: startup.avatar }} style={[styles.startupAvatar, startup.active && styles.activeAvatarBorder]} />
                  {startup.active && <View style={styles.activeDot} />}
                </View>
                <Text style={[styles.startupName, startup.active && styles.activeStartupName]}>{startup.name}</Text>
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
                  {!msg.isSentByMe && <Image source={{ uri: startups.find(s => s.id === activeChatId)?.avatar }} style={styles.messageAvatar} />}
                  <View style={[styles.messageContent, msg.isSentByMe ? { alignItems: 'flex-end' } : null]}>
                    <Text style={styles.messageMeta}>{msg.isSentByMe ? 'You' : startups.find(s => s.id === activeChatId)?.name} • {msg.time}</Text>
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

        </Animated.View>
        {/* Bottom Navigation */}
        <BottomTabBar activeTab="Messages" />
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

  startupListContainer: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: WHITE, paddingVertical: 12 },
  startupList: { paddingHorizontal: 20, gap: 16, alignItems: 'center' },
  startupItem: { alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 6 },
  startupAvatar: { width: 56, height: 56, borderRadius: 28, opacity: 0.5 },
  activeAvatarBorder: { opacity: 1, borderWidth: 2, borderColor: PRIMARY },
  activeDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: WHITE },
  startupName: { fontSize: 12, color: TEXT_GRAY, fontWeight: '500' },
  activeStartupName: { color: TEXT_DARK, fontWeight: '700' },

  newChatBtn: { alignItems: 'center', marginRight: 4 },
  newChatIconBox: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },


  chatArea: { flex: 1, backgroundColor: '#f8fafc' },
  chatContent: { padding: 20, paddingBottom: 100 },

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

  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingBottom: Platform.OS === 'ios' ? 100 : 80 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 24, paddingHorizontal: 16, height: 48, marginRight: 12 },
  attachBtn: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 14, color: TEXT_DARK },
  emojiBtn: { marginLeft: 12 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

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

const tabBarStyles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Platform.OS === 'ios' ? 80 : 70, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: Platform.OS === 'ios' ? 20 : 0, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  tab: { alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' },
  label: { fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: '500' },
  labelActive: { color: PRIMARY, fontWeight: '700' },
});
