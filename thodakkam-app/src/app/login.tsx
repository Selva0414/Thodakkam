import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { 
  GraduationCap, Lock, Mail, Eye, EyeOff
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const PRIMARY_COLOR = '#662483'; // Deep purple matching the screenshot
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#6b7280';
const BORDER_COLOR = '#e5e7eb';
const BG_LIGHT = '#f9fafb';

export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const SAMPLE_EMAIL = 'student@thodakkam.edu';
  const SAMPLE_PASSWORD = 'Student@123';

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const BACKEND_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await response.json();
      if (data.success && data.user) {
        router.replace({ 
          pathname: '/student-dashboard', 
          params: { userId: data.user.id } 
        });
      } else {
        setError(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      // Server unreachable – fall back to sample credentials
      if (email.trim().toLowerCase() === 'student@thodakkam.edu' && password === 'Student@123') {
        router.replace({ 
          pathname: '/student-dashboard', 
          params: { userName: 'Student' } 
        });
      } else {
        setError('Could not reach server. Sample login:\nEmail: student@thodakkam.edu\nPassword: Student@123');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <GraduationCap size={20} color="#ffffff" />
            </View>
            <Text style={styles.headerTitle}>Student Career Portal</Text>
          </View>

          {/* Hero */}
          <View style={styles.heroContainer}>
            <Text style={styles.heroText}>Launch your career{'\n'}with confidence.</Text>
          </View>

          {/* Welcome section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>Login to continue your career journey</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#9ca3af" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="student@university.edu"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.label}>PASSWORD</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/forgot-password', params: { role: 'student' } })}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#9ca3af" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {showPassword ? (
                    <Eye size={18} color="#9ca3af" />
                  ) : (
                    <EyeOff size={18} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginButton, isLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>{isLoading ? 'Verifying...' : 'Verify & Login'}</Text>
            </TouchableOpacity>

            {/* Sample credential hint */}
            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>🔑 Sample / Registered Login</Text>
              <Text style={styles.hintText}>Email: student@thodakkam.edu</Text>
              <Text style={styles.hintText}>Password: Student@123</Text>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{ flex: 1, minHeight: 60 }} />

          {/* Footer Links */}
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLinkText}>TERMS OF{'\n'}SERVICE</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLinkText}>PRIVACY{'\n'}POLICY</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLinkText}>HELP{'\n'}CENTER</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    gap: 12,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  heroContainer: {
    marginBottom: 48,
  },
  heroText: {
    fontSize: 32,
    fontWeight: '800',
    color: TEXT_DARK,
    lineHeight: 40,
    textAlign: 'center',
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_DARK,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    backgroundColor: BG_LIGHT,
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: TEXT_DARK,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      }
    }),
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#64748b',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  footerLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 14,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    lineHeight: 18,
  },
  hintBox: {
    marginTop: 16,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 14,
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#15803d',
    lineHeight: 18,
  },
});
