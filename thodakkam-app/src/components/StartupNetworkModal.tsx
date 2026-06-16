import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, Platform
} from 'react-native';
import { UserPlus, ArrowRight, MessageSquare, X } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';

interface StartupNetworkModalProps {
  visible: boolean;
  onClose: () => void;
  companyName: string;
}

interface NetworkUser {
  id: string;
  name: string;
  role?: string;
  avatar: string;
  following?: boolean;
}

export default function StartupNetworkModal({ visible, onClose, companyName }: StartupNetworkModalProps) {
  const { colors, isDark } = useAppTheme();
  const [tab, setTab] = useState<'following' | 'followers'>('following');
  const [loading, setLoading] = useState(false);
  
  const [followers, setFollowers] = useState<NetworkUser[]>([]);
  const [following, setFollowing] = useState<NetworkUser[]>([]);
  const [suggestions, setSuggestions] = useState<NetworkUser[]>([]);

  React.useEffect(() => {
    if (visible && companyName) {
      fetchNetwork();
    }
  }, [visible, companyName]);

  const fetchNetwork = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://thodakkam-backend.onrender.com/api/startup/network/${encodeURIComponent(companyName)}`);
      const data = await res.json();
      if (data.success) {
        setFollowers(data.followers || []);
        setFollowing(data.following || []);
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Error fetching network:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
    try {
      const endpoint = isCurrentlyFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`https://thodakkam-backend.onrender.com/api/startup/network/${encodeURIComponent(companyName)}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        fetchNetwork(); // Refresh network state after action
      }
    } catch (err) {
      console.error(`Error ${isCurrentlyFollowing ? 'unfollowing' : 'following'}:`, err);
    }
  };

  const currentList = tab === 'following' ? following : followers;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.modalContainer, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]} onPress={(e) => e.stopPropagation()}>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: colors.text }]}>My Network</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your professional relationships and connections.</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.inputBg }]}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: colors.inputBg, borderColor: colors.border, borderWidth: 1 }]}>
              <TouchableOpacity 
                style={[styles.tab, tab === 'following' && { backgroundColor: colors.primary }]}
                onPress={() => setTab('following')}
              >
                <Text style={[styles.tabText, { color: colors.textSecondary }, tab === 'following' && { color: '#ffffff' }]}>Following</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, tab === 'followers' && { backgroundColor: colors.primary }]}
                onPress={() => setTab('followers')}
              >
                <Text style={[styles.tabText, { color: colors.textSecondary }, tab === 'followers' && { color: '#ffffff' }]}>Followers</Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <View style={styles.listContainer}>
              {currentList.map((user) => (
                <View key={user.id} style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                    <Text style={[styles.userRole, { color: colors.textSecondary }]} numberOfLines={1}>{user.role}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.followBtn, { backgroundColor: colors.primary }, user.following && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
                    onPress={() => toggleFollow(user.id, !!user.following)}
                  >
                    <Text style={[styles.followBtnText, { color: '#ffffff' }, user.following && { color: colors.text }]}>
                      {user.following ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
              {currentList.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users found.</Text>
              )}
            </View>

            {/* Grow Your Network */}
            <View style={[styles.growNetworkCard, { backgroundColor: isDark ? colors.primary + '10' : '#f5f3ff' }]}>
              <View style={styles.growHeader}>
                <UserPlus size={18} color={colors.primary} />
                <Text style={[styles.growTitle, { color: colors.primary }]}>Grow Your Network</Text>
              </View>

              {suggestions.map((user) => (
                <View key={user.id} style={styles.suggestionRow}>
                  <Image source={{ uri: user.avatar }} style={styles.suggestionAvatar} />
                  <Text style={[styles.suggestionName, { color: colors.text }]}>{user.name}</Text>
                  <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.card }]} onPress={() => toggleFollow(user.id, false)}>
                    <UserPlus size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
              {suggestions.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No suggestions right now.</Text>
              )}

              <TouchableOpacity style={styles.showMoreBtn}>
                <Text style={[styles.showMoreText, { color: colors.primary }]}>Show More Suggestions</Text>
                <ArrowRight size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

          </ScrollView>

          {/* Floating Message Button */}
          <TouchableOpacity style={[styles.messageBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <MessageSquare size={16} color="#ffffff" />
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '100%', maxWidth: 420, maxHeight: '90%', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, position: 'relative' },
  scrollContent: { paddingBottom: 60 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerText: { flex: 1, paddingRight: 12 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 13 },
  closeBtn: { padding: 4, borderRadius: 20 },
  
  tabContainer: { flexDirection: 'row', borderRadius: 24, padding: 4, marginBottom: 24, alignSelf: 'flex-start' },
  tab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  tabText: { fontSize: 13, fontWeight: '600' },

  listContainer: { gap: 12, marginBottom: 24 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700' },
  userRole: { fontSize: 12, marginTop: 2 },
  followBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  followBtnText: { fontSize: 12, fontWeight: '600' },

  growNetworkCard: { borderRadius: 20, padding: 20 },
  growHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  growTitle: { fontSize: 16, fontWeight: '700' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  suggestionAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  suggestionName: { flex: 1, fontSize: 14, fontWeight: '600' },
  addBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  showMoreText: { fontSize: 12, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 12 },

  messageBtn: { position: 'absolute', bottom: 24, right: 24, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  messageBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
