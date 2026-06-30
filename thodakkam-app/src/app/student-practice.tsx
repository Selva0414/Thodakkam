import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Zap, Code, Layers, Palette, Clock, Users, Star, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import StudentHeader from '../components/StudentHeader';
import { BASE_URL } from '../config/api';

export default function StudentPracticeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ stats: any; courses: any[] } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/practice/learning-path`);
      const responseData = await response.json();
      if (responseData.success) {
        setData(responseData.data);
      }
    } catch (error) {
      console.error('Error fetching learning paths:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code': return <Code size={24} color="#fff" />;
      case 'Layers': return <Layers size={24} color="#fff" />;
      case 'Palette': return <Palette size={24} color="#fff" />;
      default: return <Code size={24} color="#fff" />;
    }
  };

  return (
    <View style={styles.container}>
      <StudentHeader activeTab="home" />
      <ScrollView contentContainerStyle={[styles.scrollContent, isMobile && { padding: 16 }]}>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : data ? (
          <View style={styles.contentWrapper}>
            
            {/* Header Section */}
            <View style={[styles.headerSection, isMobile && { flexDirection: 'column', gap: 24 }]}>
              <View style={styles.headerLeft}>
                <View style={styles.hubBadge}>
                  <Zap size={14} color="#7c3aed" />
                  <Text style={styles.hubBadgeText}>LEARNING HUB</Text>
                </View>
                <Text style={styles.pageTitle}>Choose Your Learning Path</Text>
                <Text style={styles.pageSubtitle}>
                  Here you can practice and learn. Industry-aligned courses with structured topics and MCQ assessments. Learn at your pace, earn certificates.
                </Text>
              </View>

              <View style={[styles.statsContainer, isMobile && { width: '100%', justifyContent: 'space-between' }]}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{data.stats.courses}</Text>
                  <Text style={styles.statLabel}>Courses</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{data.stats.students}</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{data.stats.contentHours} hrs</Text>
                  <Text style={styles.statLabel}>Content</Text>
                </View>
              </View>
            </View>

            {/* Courses Grid */}
            <View style={[styles.grid, isMobile && { flexDirection: 'column' }]}>
              {data.courses.map((course) => (
                <View key={course.id} style={[styles.card, isMobile && { width: '100%' }]}>
                  {/* Card Top / Header */}
                  <View style={[styles.cardTop, { backgroundColor: course.themeColor }]}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.iconBox}>
                        {getIcon(course.icon)}
                      </View>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>{course.level}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseDesc}>{course.description}</Text>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Clock size={14} color="#64748b" />
                        <Text style={styles.metaText}>{course.hours} hrs</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Users size={14} color="#64748b" />
                        <Text style={styles.metaText}>{course.students.toLocaleString()}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Star size={14} color="#64748b" />
                        <Text style={styles.metaText}>{course.rating}</Text>
                      </View>
                    </View>

                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={styles.progressValue}>{course.progress}/{course.topics} topics</Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${(course.progress / course.topics) * 100}%`, backgroundColor: course.themeColor }]} />
                      </View>
                    </View>

                    <Pressable 
                      style={[styles.startButton, { backgroundColor: course.themeColor }]}
                      onPress={() => router.push(`/student-course-unlock?id=${course.id}`)}
                    >
                      <Text style={styles.startButtonText}>Start Course</Text>
                      <ChevronRight size={16} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 32,
    alignItems: 'center',
    paddingBottom: 64,
  },
  loadingContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 1200,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 48,
  },
  headerLeft: {
    flex: 1,
    maxWidth: 600,
  },
  hubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  hubBadgeText: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
      },
      default: {
        elevation: 2,
      }
    })
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  card: {
    flex: 1,
    minWidth: 300,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
      },
      default: {
        elevation: 5,
      }
    })
  },
  cardTop: {
    height: 120,
    padding: 20,
    justifyContent: 'flex-end',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    padding: 20,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  courseDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
    minHeight: 40,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
