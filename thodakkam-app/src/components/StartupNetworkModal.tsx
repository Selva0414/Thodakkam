import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, Platform
} from 'react-native';
import { UserPlus, ArrowRight, MessageSquare, X } from 'lucide-react-native';

const PRIMARY = '#662483';
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

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
      const res = await fetch(`http://localhost:5000/api/startup/network/${encodeURIComponent(companyName)}`);
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
      const res = await fetch(`http://localhost:5000/api/startup/network/${encodeURIComponent(companyName)}/${endpoint}`, {
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
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>My Network</Text>
                <Text style={styles.subtitle}>Manage your professional relationships and connections.</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={TEXT_GRAY} />
              </TouchableOpacity>
            </View>
            
            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, tab === 'following' && styles.tabActive]}
                onPress={() => setTab('following')}
              >
                <Text style={[styles.tabText, tab === 'following' && styles.tabTextActive]}>Following</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, tab === 'followers' && styles.tabActive]}
                onPress={() => setTab('followers')}
              >
                <Text style={[styles.tabText, tab === 'followers' && styles.tabTextActive]}>Followers</Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <View style={styles.listContainer}>
              {currentList.map((user) => (
                <View key={user.id} style={styles.userCard}>
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userRole} numberOfLines={1}>{user.role}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.followBtn, user.following && styles.followingBtn]}
                    onPress={() => toggleFollow(user.id, !!user.following)}
                  >
                    <Text style={[styles.followBtnText, user.following && styles.followingBtnText]}>
                      {user.following ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
              {currentList.length === 0 && (
                <Text style={styles.emptyText}>No users found.</Text>
              )}
            </View>

            {/* Grow Your Network */}
            <View style={styles.growNetworkCard}>
              <View style={styles.growHeader}>
                <UserPlus size={18} color={PRIMARY} />
                <Text style={styles.growTitle}>Grow Your Network</Text>
              </View>

              {suggestions.map((user) => (
                <View key={user.id} style={styles.suggestionRow}>
                  <Image source={{ uri: user.avatar }} style={styles.suggestionAvatar} />
                  <Text style={styles.suggestionName}>{user.name}</Text>
                  <TouchableOpacity style={styles.addBtn} onPress={() => toggleFollow(user.id, false)}>
                    <UserPlus size={14} color={PRIMARY} />
                  </TouchableOpacity>
                </View>
              ))}
              {suggestions.length === 0 && (
                <Text style={styles.emptyText}>No suggestions right now.</Text>
              )}

              <TouchableOpacity style={styles.showMoreBtn}>
                <Text style={styles.showMoreText}>Show More Suggestions</Text>
                <ArrowRight size={14} color={PRIMARY} />
              </TouchableOpacity>
            </View>

          </ScrollView>

          {/* Floating Message Button */}
          <TouchableOpacity style={styles.messageBtn}>
            <MessageSquare size={16} color={WHITE} />
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '100%', maxWidth: 420, maxHeight: '90%', backgroundColor: BG, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, position: 'relative' },
  scrollContent: { paddingBottom: 60 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerText: { flex: 1, paddingRight: 12 },
  title: { fontSize: 24, fontWeight: '800', color: TEXT_DARK, marginBottom: 4 },
  subtitle: { fontSize: 13, color: TEXT_GRAY },
  closeBtn: { padding: 4, backgroundColor: '#e2e8f0', borderRadius: 20 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 24, padding: 4, marginBottom: 24, alignSelf: 'flex-start' },
  tab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  tabActive: { backgroundColor: PRIMARY },
  tabText: { fontSize: 13, fontWeight: '600', color: TEXT_GRAY },
  tabTextActive: { color: WHITE },

  listContainer: { gap: 12, marginBottom: 24 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, padding: 12, borderRadius: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  userRole: { fontSize: 12, color: TEXT_GRAY, marginTop: 2 },
  followBtn: { backgroundColor: PRIMARY, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  followingBtn: { backgroundColor: WHITE, borderWidth: 1, borderColor: '#cbd5e1' },
  followBtnText: { color: WHITE, fontSize: 12, fontWeight: '600' },
  followingBtnText: { color: TEXT_DARK },

  growNetworkCard: { backgroundColor: '#f5f3ff', borderRadius: 20, padding: 20 },
  growHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  growTitle: { fontSize: 16, fontWeight: '700', color: PRIMARY },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  suggestionAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  suggestionName: { flex: 1, fontSize: 14, fontWeight: '600', color: TEXT_DARK },
  addBtn: { width: 28, height: 28, backgroundColor: WHITE, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  showMoreText: { fontSize: 12, fontWeight: '700', color: PRIMARY },
  emptyText: { fontSize: 13, color: TEXT_GRAY, textAlign: 'center', marginTop: 12 },

  messageBtn: { position: 'absolute', bottom: 24, right: 24, backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 24, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  messageBtnText: { color: WHITE, fontSize: 14, fontWeight: '700' },
});
