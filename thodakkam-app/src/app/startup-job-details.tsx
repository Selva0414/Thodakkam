import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Clock, Briefcase, Building, GraduationCap, CheckCircle2 } from 'lucide-react-native';

const PRIMARY = '#662483';
const BG = '#f8fafc';
const WHITE = '#ffffff';
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#64748b';

export default function StartupJobDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.jobTitle}>{title || 'Senior developer'}</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.metaItem}>
              <MapPin size={14} color={TEXT_GRAY} />
              <Text style={styles.metaText}>{location || 'Kakkaveri, Tamil Nadu'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color={TEXT_GRAY} />
              <Text style={styles.metaText}>{type || 'Internship'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Facts</Text>
          
          <View style={styles.factRow}>
            <View style={styles.factIconBox}><Clock size={16} color={PRIMARY} /></View>
            <View>
              <Text style={styles.factLabel}>EXPERIENCE</Text>
              <Text style={styles.factValue}>{experience || '0-1 years'}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.factRow}>
            <View style={styles.factIconBox}><Building size={16} color={PRIMARY} /></View>
            <View>
              <Text style={styles.factLabel}>WORK MODE</Text>
              <Text style={styles.factValue}>{workMode || 'Remote'}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.factRow}>
            <View style={styles.factIconBox}><GraduationCap size={16} color={PRIMARY} /></View>
            <View>
              <Text style={styles.factLabel}>EDUCATION</Text>
              <Text style={styles.factValue}>{education || 'B.E / B.Tech'}</Text>
            </View>
          </View>

          <View style={styles.badgeBox}>
            <CheckCircle2 size={16} color="#059669" />
            <Text style={styles.badgeBoxText}>Direct Company Posting</Text>
          </View>
        </View>

        <View style={styles.officeCard}>
          <Text style={styles.officeLabel}>PRIMARY OFFICE</Text>
          <Text style={styles.officeTitle}>{location || 'Kakkaveri, Tamil Nadu'}</Text>
          <View style={styles.officeMeta}>
            <MapPin size={14} color={PRIMARY} />
            <Text style={styles.officeMetaText}>Location mapped from listing</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Role Overview</Text>
          <Text style={styles.descriptionText}>
            {description || 'The Senior Developer will design, develop, and maintain robust software applications while leading technical initiatives and ensuring adherence to best practices. This role collaborates closely with product managers, designers, and QA teams to deliver high-quality features on schedule.'}
          </Text>

          <Text style={styles.subHeading}>Key Responsibilities</Text>
          {reqArray.map((req, index) => (
            <View key={index} style={styles.reqRow}>
              <CheckCircle2 size={18} color="#059669" style={{ marginTop: 2 }} />
              <Text style={styles.reqText}>{req}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Skills Required</Text>
          <View style={styles.skillsWrapper}>
            {skills.map((skill, idx) => (
              <View key={idx} style={styles.skillPill}>
                <Text style={styles.skillPillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TEXT_DARK },
  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 20, paddingBottom: 80 },
  
  heroSection: { marginBottom: 24, marginTop: 8 },
  jobTitle: { fontSize: 32, fontWeight: '800', color: '#1e293b', marginBottom: 16, letterSpacing: -0.5 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, color: '#475569' },

  sectionCard: { backgroundColor: WHITE, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 20 },
  
  factRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  factIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  factLabel: { fontSize: 10, fontWeight: '700', color: TEXT_GRAY, letterSpacing: 0.5, marginBottom: 4 },
  factValue: { fontSize: 14, fontWeight: '600', color: TEXT_DARK },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12, marginLeft: 56 },

  badgeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, alignSelf: 'flex-start', marginTop: 16, gap: 8 },
  badgeBoxText: { color: '#059669', fontSize: 12, fontWeight: '700' },

  officeCard: { backgroundColor: '#ede9fe', borderRadius: 16, padding: 20, marginBottom: 16 },
  officeLabel: { fontSize: 10, fontWeight: '700', color: PRIMARY, letterSpacing: 0.5, marginBottom: 8 },
  officeTitle: { fontSize: 18, fontWeight: '700', color: TEXT_DARK, marginBottom: 12 },
  officeMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  officeMetaText: { fontSize: 13, color: PRIMARY },

  descriptionText: { fontSize: 14, color: '#475569', lineHeight: 24, marginBottom: 24 },
  subHeading: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  reqRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  reqText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 22 },

  skillsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skillPill: { backgroundColor: '#fdf4ff', borderWidth: 1, borderColor: '#e9d5ff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  skillPillText: { color: PRIMARY, fontSize: 14, fontWeight: '600' }
});
