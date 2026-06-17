import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { ChevronLeft, Clock, Check, X, Inbox } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';

export default function StudentRequests() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState('Pending');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Job Request Management</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Review and respond to interview invitations from companies
          </Text>
        </View>
        <View style={[styles.tabs, { backgroundColor: colors.card }]}>
          {['Pending', 'Accepted', 'All'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabBtn, 
                activeTab === tab && styles.activeTabBtn,
                activeTab === tab && { backgroundColor: colors.background }
              ]}
            >
              <Text style={[
                styles.tabText, 
                { color: activeTab === tab ? colors.text : colors.textSecondary }
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconWrapper, { backgroundColor: '#f59e0b20' }]}>
              <Clock size={18} color="#f59e0b" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>PENDING INVITES</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconWrapper, { backgroundColor: '#10b98120' }]}>
              <Check size={18} color="#10b981" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ACCEPTED</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconWrapper, { backgroundColor: '#ef444420' }]}>
              <X size={18} color="#ef4444" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>REJECTED</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
          </View>
        </View>

        <View style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.emptyIconWrapper, { backgroundColor: colors.background }]}>
            <Inbox size={32} color={colors.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Interview Invites</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            You don't have any pending interview invitations right now.
          </Text>
          <TouchableOpacity 
            style={[styles.browseBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/student-jobs')}
          >
            <Text style={styles.browseBtnText}>Browse Jobs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
  },
  backBtn: {
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 200,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginTop: 12,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTabBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statValue: {
    position: 'absolute',
    top: 20,
    right: 20,
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyStateCard: {
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
    marginBottom: 24,
  },
  browseBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
