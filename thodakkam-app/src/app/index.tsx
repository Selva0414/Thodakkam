import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Briefcase, GraduationCap, ShieldCheck } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

const CARDS = [
  {
    id: 'startup',
    title: 'Startup Dashboard',
    description: 'Post innovative job roles and discover top-tier student talent with our proprietary AI matching engine.',
    buttonText: 'Enter Startup Portal',
    Icon: Briefcase,
  },
  {
    id: 'student',
    title: 'Student Dashboard',
    description: 'Build your professional profile, showcase your skills, and track internship offers from fast-growing startups.',
    buttonText: 'Enter Student Portal',
    Icon: GraduationCap,
  },
  {
    id: 'admin',
    title: 'Master Admin Panel',
    description: 'Monitor ecosystem health, manage platform users, and access high-level analytics for the entire network.',
    buttonText: 'Enter Admin Portal',
    Icon: ShieldCheck,
  },
];

function ActionButton({ title, onPress }: { title: string; onPress?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <View>
      <Pressable
        onPress={onPress}
        // @ts-ignore
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        style={({ pressed }) => [
          styles.button,
          isHovered && styles.buttonHovered,
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text style={[
          styles.buttonText,
          isHovered && styles.buttonTextHovered,
        ]}>
          {title}
        </Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const studentId = await AsyncStorage.getItem('studentUserId');
        if (studentId) {
          router.replace({ pathname: '/student-dashboard', params: { userId: studentId } });
          return;
        }
        const startupId = await AsyncStorage.getItem('startupId');
        const startupCompanyName = await AsyncStorage.getItem('startupCompanyName');
        if (startupId) {
          if (startupCompanyName) {
            router.replace({ pathname: '/startup-dashboard', params: { startupId, companyName: startupCompanyName } });
            return;
          } else {
            // Broken state (old login without company name), force re-login
            await AsyncStorage.removeItem('startupId');
          }
        }
      } catch (err) {
        console.error('Failed to check session', err);
      }
    };
    checkSession();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {CARDS.map((card) => (
          <View key={card.id} style={styles.card}>
            <View style={styles.iconContainer}>
              <card.Icon size={22} color="#ffffff" strokeWidth={2} />
            </View>
            <Text style={styles.title}>{card.title}</Text>
            <Text style={styles.description}>{card.description}</Text>
            <ActionButton 
              title={card.buttonText} 
              onPress={() => {
                if (card.id === 'student') {
                  router.push('/register');
                } else if (card.id === 'startup') {
                  router.push('/startup-register');
                } else if (card.id === 'admin') {
                  router.push('/admin-login');
                }
              }} 
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContent: {
    padding: 24,
    gap: 24,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      }
    }),
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#5A279B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6b7280',
    marginBottom: 24,
  },
  button: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    transitionProperty: 'background-color, color, border-color',
    transitionDuration: '0.2s',
  },
  buttonHovered: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  buttonTextHovered: {
    color: '#ffffff',
  },
});
