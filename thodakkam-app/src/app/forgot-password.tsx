import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const PRIMARY_COLOR = '#6a1b9a'; // Using the standard purple from your screenshots
const BG_COLOR = '#f8f9fa';
const BG_LIGHT = '#ffffff';
const TEXT_DARK = '#1e293b';
const BORDER_COLOR = '#e2e8f0';
const BACKEND_URL = Platform.OS === 'android' ? 'https://thodakkam-backend.onrender.com' : 'https://thodakkam-backend.onrender.com';

export default function ForgotPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = (params.role as string) || 'student';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      const data = await res.json();
      
      if (data.success) {
        setStep(2);
      } else {
        setError(data.message || 'Error sending OTP');
      }
    } catch (err) {
      setError('Network error. Could not reach server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      
      if (data.success) {
        setStep(3);
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error. Could not reach server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill out all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password, role })
      });
      const data = await res.json();
      
      if (data.success) {
        Alert.alert("Success", "Password updated successfully", [
          { text: "OK", onPress: () => {
              if (role === 'student') router.replace('/login');
              else if (role === 'startup') router.replace('/startup-login');
              else if (role === 'admin') router.replace('/admin-login');
              else router.back();
          } }
        ]);
      } else {
        setError(data.message || 'Error updating password');
      }
    } catch (err) {
      setError('Network error. Could not reach server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => step > 1 ? setStep((s) => (s - 1) as any) : router.back()}>
            <ArrowLeft size={24} color={TEXT_DARK} />
          </TouchableOpacity>

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Reset Password</Text>
            <Text style={styles.welcomeSubtitle}>
              {step === 1 && `Enter your registered ${role} email`}
              {step === 2 && 'Enter the 6-digit OTP sent to your email'}
              {step === 3 && 'Create a new secure password'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            
            {/* STEP 1: EMAIL */}
            {step === 1 && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={18} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="email@example.com"
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={(t) => { setEmail(t); setError(''); }}
                    />
                  </View>
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <TouchableOpacity style={styles.primaryButton} onPress={handleRequestOtp} disabled={isLoading}>
                  <Text style={styles.primaryButtonText}>{isLoading ? 'Sending OTP...' : 'Send OTP'}</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2: OTP */}
            {step === 2 && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>ENTER OTP</Text>
                  <View style={styles.inputWrapper}>
                    <KeyRound size={18} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="123456"
                      placeholderTextColor="#9ca3af"
                      keyboardType="number-pad"
                      value={otp}
                      onChangeText={(t) => { setOtp(t); setError(''); }}
                    />
                  </View>
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOtp} disabled={isLoading}>
                  <Text style={styles.primaryButtonText}>{isLoading ? 'Verifying...' : 'Verify OTP'}</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 3: NEW PASSWORD */}
            {step === 3 && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>NEW PASSWORD</Text>
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
                      {showPassword ? <Eye size={18} color="#9ca3af" /> : <EyeOff size={18} color="#9ca3af" />}
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>CONFIRM PASSWORD</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="••••••"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                    />
                  </View>
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword} disabled={isLoading}>
                  <Text style={styles.primaryButtonText}>{isLoading ? 'Updating...' : 'Reset Password'}</Text>
                </TouchableOpacity>
              </>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: BG_LIGHT,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      }
    }),
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_DARK,
    letterSpacing: 0.5,
    marginBottom: 8,
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
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center'
  }
});
