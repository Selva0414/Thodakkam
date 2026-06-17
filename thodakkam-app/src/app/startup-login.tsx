import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { 
  Rocket, Lock, Mail, Eye, EyeOff, ArrowLeft
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const PRIMARY_COLOR = '#662483'; // Deep purple matching the screenshot
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#6b7280';
const BORDER_COLOR = '#e5e7eb';
const BG_LIGHT = '#f9fafb';

const BASE_URL = Platform.OS === 'android' ? 'https://thodakkam.onrender.com' : 'https://thodakkam.onrender.com';

export default function StartupLoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/startup/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await response.json();
      if (data.success) {
        await AsyncStorage.setItem('startupId', data.startup.id);
        await AsyncStorage.setItem('startupCompanyName', data.startup.companyName);
        alert(`Welcome back, ${data.startup.founderName}!`);
        // Navigate to the startup dashboard
        router.navigate({
          pathname: '/startup-dashboard',
          params: { companyName: data.startup.companyName }
        });
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Could not connect to the backend server. Please make sure the database is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <Rocket size={18} color="#ffffff" />
            </View>
            <Text style={styles.headerTitle}>Start Up Portal</Text>
          </View>

          {/* Welcome section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>Sign in to access your founder admin dashboard</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#9ca3af" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="name@company.com"
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
                <TouchableOpacity onPress={() => router.push({ pathname: '/forgot-password', params: { role: 'startup' } })}>
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

            {/* Back link and registration */}
            <View style={styles.bottomNavContainer}>
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={styles.registerLink} onPress={() => router.push('/startup-register')}>
                  Register Startup
                </Text>
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.backHomeButton} 
              onPress={() => router.navigate('/')}
            >
              <ArrowLeft size={16} color="#64748b" style={{ marginRight: 6 }} />
              <Text style={styles.backHomeText}>Back to Home</Text>
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
    padding: 24,
    paddingBottom: 48,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    alignSelf: 'center',
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  welcomeSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: TEXT_GRAY,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    backgroundColor: BG_LIGHT,
    height: 48,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: TEXT_DARK,
  },
  eyeIcon: {
    padding: 4,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 11,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomNavContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  registerText: {
    fontSize: 13,
    color: '#64748b',
  },
  registerLink: {
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  backHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  backHomeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
});
