import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const BASE_URL = 'http://localhost:5000'; // Make sure this matches your actual backend URL or use your machine's IP address

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Master Admin login successful!');
        router.replace('/admin-dashboard');
      } else {
        setErrorMessage(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      setErrorMessage('Network error. Make sure backend server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Top Purple Gradient / Header Area */}
          <View style={styles.headerSection}>
            <View style={styles.badgeContainer}>
              <View style={styles.shieldWrapper}>
                <ShieldCheck size={16} color="#ffffff" />
              </View>
              <Text style={styles.badgeText}>MA-Startup</Text>
            </View>

            <Text style={styles.headerTitle}>Master Admin{'\n'}Security Portal</Text>
            
            <Text style={styles.headerSubtitle}>
              High-clearance access required. Unauthorized entry attempts are logged and reported to the security operations center.
            </Text>

            <View style={styles.statusRow}>
              <View style={styles.statusCol}>
                <View style={styles.statusHeader}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusLabel}>SYSTEM STATUS:</Text>
                </View>
                <Text style={styles.statusValue}>OPERATIONAL</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.statusCol}>
                <Text style={styles.statusLabel}>SECURITY</Text>
                <Text style={styles.statusValue}>PROTOCOLS</Text>
              </View>
            </View>
          </View>

          {/* Form Area */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>Login to continue your career journey</Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="student@university.edu"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/forgot-password', params: { role: 'admin' } })}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, loading && { opacity: 0.7 }]} 
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                Don't have an account?{' '}
                <Text style={styles.signupBold} onPress={() => {/* Handle Register */}}>
                  Sign Up
                </Text>
              </Text>
            </View>

          </View>

          {/* Footer Area */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerLink}>TERMS OF SERVICE</Text>
            <Text style={styles.footerLink}>PRIVACY POLICY</Text>
            <Text style={styles.footerLink}>HELP CENTER</Text>
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
    alignItems: 'center',
    paddingBottom: 24,
  },
  headerSection: {
    backgroundColor: '#5A279B', // Base purple, representing gradient
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    // Add simple shadow or gradient simulation if needed
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  shieldWrapper: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 6,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 38,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 40,
    maxWidth: '90%',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusCol: {
    flex: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981', // Green dot
    marginRight: 6,
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusValue: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 32,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#f87171',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    letterSpacing: 0.5,
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
    color: '#5A279B', // Purple matching the theme
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 15,
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#5A279B',
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    // Add subtle shadow
    shadowColor: '#5A279B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    alignItems: 'center',
  },
  signupText: {
    color: '#64748b',
    fontSize: 14,
  },
  signupBold: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 24,
  },
  footerLink: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  }
});
