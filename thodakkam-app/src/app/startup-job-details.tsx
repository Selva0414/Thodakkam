import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Clock, Briefcase, Building, GraduationCap, CheckCircle2 } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';

export default function StartupJobDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useAppTheme();

  const { title, location, type, experience, workMode, education, description, requirements } = params;

  const reqArray = typeof requirements === 'string' && requirements.trim().length > 0 
    ? requirements.split(',').map(r => r.trim())
    : [
        'Design and implement scalable software architectures and features',
        'Write clean, maintainable, and testable code following industry standards',
        'Conduct code reviews and provide constructive feedback',
        'Troubleshoot, debug, and resolve complex technical issues',
        'Lead agile ceremonies such as sprint planning and retrospectives'
      ];

  const skills = ['java', 'c', 'javascript', 'react', 'node.js'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Job Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={[styles.jobTitle, { color: colors.text }]}>{title || 'Senior developer'}</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.metaItem}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{location || 'Kakkaveri, Tamil Nadu'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{type || 'Internship'}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Facts</Text>
          
          <View style={styles.factRow}>
            <View style={[styles.factIconBox, { backgroundColor: isDark ? colors.primary + '20' : '#f3e8ff' }]}><Clock size={16} color={colors.primary} /></View>
            <View>
              <Text style={[styles.factLabel, { color: colors.textSecondary }]}>EXPERIENCE</Text>
              <Text style={[styles.factValue, { color: colors.text }]}>{experience || '0-1 years'}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.factRow}>
            <View style={[styles.factIconBox, { backgroundColor: isDark ? colors.primary + '20' : '#f3e8ff' }]}><Building size={16} color={colors.primary} /></View>
            <View>
              <Text style={[styles.factLabel, { color: colors.textSecondary }]}>WORK MODE</Text>
              <Text style={[styles.factValue, { color: colors.text }]}>{workMode || 'Remote'}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.factRow}>
            <View style={[styles.factIconBox, { backgroundColor: isDark ? colors.primary + '20' : '#f3e8ff' }]}><GraduationCap size={16} color={colors.primary} /></View>
            <View>
              <Text style={[styles.factLabel, { color: colors.textSecondary }]}>EDUCATION</Text>
              <Text style={[styles.factValue, { color: colors.text }]}>{education || 'B.E / B.Tech'}</Text>
            </View>
          </View>

          <View style={[styles.badgeBox, { backgroundColor: isDark ? colors.success + '20' : '#dcfce7' }]}>
            <CheckCircle2 size={16} color={isDark ? colors.success : "#059669"} />
            <Text style={[styles.badgeBoxText, { color: isDark ? colors.success : "#059669" }]}>Direct Company Posting</Text>
          </View>
        </View>

        <View style={[styles.officeCard, { backgroundColor: isDark ? colors.primary + '20' : '#ede9fe' }]}>
          <Text style={[styles.officeLabel, { color: colors.primary }]}>PRIMARY OFFICE</Text>
          <Text style={[styles.officeTitle, { color: colors.text }]}>{location || 'Kakkaveri, Tamil Nadu'}</Text>
          <View style={styles.officeMeta}>
            <MapPin size={14} color={colors.primary} />
            <Text style={[styles.officeMetaText, { color: colors.primary }]}>Location mapped from listing</Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Role Overview</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {description || 'The Senior Developer will design, develop, and maintain robust software applications while leading technical initiatives and ensuring adherence to best practices. This role collaborates closely with product managers, designers, and QA teams to deliver high-quality features on schedule.'}
          </Text>

          <Text style={[styles.subHeading, { color: colors.text }]}>Key Responsibilities</Text>
          {reqArray.map((req, index) => (
            <View key={index} style={styles.reqRow}>
              <CheckCircle2 size={18} color={isDark ? colors.success : "#059669"} style={{ marginTop: 2 }} />
              <Text style={[styles.reqText, { color: colors.textSecondary }]}>{req}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Skills Required</Text>
          <View style={styles.skillsWrapper}>
            {skills.map((skill, idx) => (
              <View key={idx} style={[styles.skillPill, { backgroundColor: isDark ? colors.primary + '20' : '#fdf4ff', borderColor: isDark ? colors.primary + '40' : '#e9d5ff' }]}>
                <Text style={[styles.skillPillText, { color: colors.primary }]}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 80 },
  
  heroSection: { marginBottom: 24, marginTop: 8 },
  jobTitle: { fontSize: 32, fontWeight: '800', marginBottom: 16, letterSpacing: -0.5 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14 },

  sectionCard: { borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  
  factRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  factIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  factLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  factValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginBottom: 12, marginLeft: 56 },

  badgeBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-start', marginTop: 16, gap: 8 },
  badgeBoxText: { fontSize: 12, fontWeight: '700' },

  officeCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  officeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  officeTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  officeMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  officeMetaText: { fontSize: 13 },

  descriptionText: { fontSize: 14, lineHeight: 24, marginBottom: 24 },
  subHeading: { fontSize: 14, fontWeight: '700', marginBottom: 16 },
  reqRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  reqText: { flex: 1, fontSize: 14, lineHeight: 22 },

  skillsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skillPill: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  skillPillText: { fontSize: 14, fontWeight: '600' }
});
