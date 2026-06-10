import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, TextInput, Image, KeyboardAvoidingView, Modal
} from 'react-native';
import {
  Menu, Search, Plus, Smile, Send, Briefcase, Users, LayoutDashboard, ClipboardList, MessageSquare, X
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
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

  const [startups, setStartups] = useState([
    { id: '1', name: 'Echo Digital', active: true, avatar: 'https://ui-avatars.com/api/?name=Echo+Digital&background=0D8ABC&color=fff' },
    { id: '2', name: 'Figma', active: false, avatar: 'https://ui-avatars.com/api/?name=Figma&background=F24E1E&color=fff' },
    { id: '3', name: 'Stripe', active: false, avatar: 'https://ui-avatars.com/api/?name=Stripe&background=635BFF&color=fff' },
    { id: '4', name: 'Vercel', active: false, avatar: 'https://ui-avatars.com/api/?name=Vercel&background=000&color=fff' }
  ]);

  const allUsersToMessage = [
    { id: 's1', name: 'Tech Startup Inc', type: 'Startup', avatar: 'https://ui-avatars.com/api/?name=Tech+Startup+Inc&background=10b981&color=fff' },
    { id: 'u1', name: 'Alex Johnson', type: 'Student', avatar: 'https://i.pravatar.cc/150?u=Alex' },
    { id: 'u2', name: 'Sam Smith', type: 'Student', avatar: 'https://i.pravatar.cc/150?u=Sam' },
    { id: 's2', name: 'OpenAI', type: 'Startup', avatar: 'https://ui-avatars.com/api/?name=Open+AI&background=000&color=fff' },
  ];

  const handleStartConversation = (user: any) => {
    setIsModalVisible(false);
    // Add user to the horizontal list if not already there and set active
    setStartups(prev => {
      const exists = prev.find(s => s.id === user.id);
      const updated = prev.map(s => ({ ...s, active: false }));
      if (exists) {
        return updated.map(s => s.id === user.id ? { ...s, active: true } : s);
      }
      return [{ id: user.id, name: user.name, active: true, avatar: user.avatar }, ...updated];
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StudentHeader />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        
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
              <TouchableOpacity key={startup.id} style={styles.startupItem}>
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
          <View style={styles.dateLabelContainer}>
            <View style={styles.dateLabel}>
              <Text style={styles.dateLabelText}>TODAY</Text>
            </View>
          </View>

          {/* Received Message */}
          <View style={styles.messageRow}>
            <Image source={{ uri: startups[0].avatar }} style={styles.messageAvatar} />
            <View style={styles.messageContent}>
              <Text style={styles.messageMeta}>Echo Digital • 10:24 AM</Text>
              <View style={styles.messageBubbleReceived}>
                <Text style={styles.messageTextReceived}>Hey! Did you get a chance to look at the assessment assignment?</Text>
              </View>
            </View>
          </View>

          {/* Sent Message */}
          <View style={[styles.messageRow, styles.messageRowSent]}>
            <View style={[styles.messageContent, { alignItems: 'flex-end' }]}>
              <Text style={styles.messageMeta}>You • 10:30 AM</Text>
              <View style={styles.messageBubbleSent}>
                <Text style={styles.messageTextSent}>Yes! I just finished the first draft. Sending it over now.</Text>
              </View>

              {/* Attachment */}
              <View style={styles.attachmentCard}>
                <View style={styles.attachmentPreview}>
                  <Image source={{ uri: 'https://via.placeholder.com/300x150.png?text=Assignment' }} style={styles.attachmentImg} />
                </View>
                <View style={styles.attachmentFooter}>
                  <View>
                    <Text style={styles.attachmentName}>assignment_v1.pdf</Text>
                    <Text style={styles.attachmentSize}>2.4 MB</Text>
                  </View>
                  <Search size={16} color={TEXT_DARK} />
                </View>
              </View>
            </View>
          </View>

          {/* Received Message */}
          <View style={styles.messageRow}>
            <Image source={{ uri: startups[0].avatar }} style={styles.messageAvatar} />
            <View style={styles.messageContent}>
              <Text style={styles.messageMeta}>Echo Digital • 10:32 AM</Text>
              <View style={styles.messageBubbleReceived}>
                <Text style={styles.messageTextReceived}>This looks amazing! Thanks for getting it to us so quickly. We'll be in touch soon.</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachBtn}>
              <Plus size={20} color={TEXT_GRAY} />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#94a3b8"
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity style={styles.emojiBtn}>
              <Smile size={20} color={TEXT_GRAY} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.sendBtn}>
            <Send size={18} color={WHITE} />
          </TouchableOpacity>
        </View>

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
