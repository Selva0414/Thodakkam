import React, { useState, useRef } from 'react';
import { 
  StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, SafeAreaView, Platform, KeyboardAvoidingView, Image, ImageBackground, Modal
} from 'react-native';
import { 
  Rocket, Lock, Mail, Eye, EyeOff, ChevronDown, ArrowRight, ArrowLeft, Check, X
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const PRIMARY_COLOR = '#662483'; // Deep purple matching the screenshot
const TEXT_DARK = '#0f172a';
const TEXT_GRAY = '#6b7280';
const BORDER_COLOR = '#e5e7eb';
const BG_LIGHT = '#f9fafb';

const CATEGORIES = [
  'Technology & Software',
  'Healthcare & Life Sciences',
  'E-commerce & Retail',
  'Fintech & Financial Services',
  'Edtech & Education',
  'Marketing & Advertising',
  'Others'
];

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

function InputField({ label, placeholder, value, onChangeText, secureTextEntry, rightIcon: RightIcon, onRightIconPress, keyboardType, autoCapitalize }: any) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput 
          style={styles.input} 
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
        {RightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.inputRightIcon}>
            <RightIcon size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function StartupRegisterScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form states
  const [founderName, setFounderName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // OTP states
  const [otpVal, setOtpVal] = useState(['', '', '', '', '', '']);
  const otpInputsRef = useRef<Array<TextInput | null>>([]);

  const handleSendOtp = async () => {
    if (!founderName || !companyName || !registrationId || !email || !password || !category) {
      setErrorMessage('Please fill out all fields.');
      return;
    }
    if (!agreed) {
      setErrorMessage('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${BASE_URL}/api/startup/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, founderName, companyName })
      });

      const data = await response.json();

      if (response.ok) {
        setShowOtpScreen(true);
        alert(data.message);
      } else {
        setErrorMessage(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Network error. Make sure backend server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    const fullOtp = otpVal.join('');
    if (fullOtp.length < 6) {
      setErrorMessage('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${BASE_URL}/api/startup/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderName,
          companyName,
          registrationId,
          email,
          password,
          category,
          otp: fullOtp
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccessModal(true);
      } else {
        setErrorMessage(data.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network error. Make sure backend server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otpVal];
    newOtp[index] = cleanText;
    setOtpVal(newOtp);

    // Auto-focus next input
    if (cleanText && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpVal[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  if (showOtpScreen) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Success Modal */}
          <Modal
            visible={showSuccessModal}
            transparent={true}
            animationType="fade"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                    router.replace('/startup-login');
                  }}
                >
                  <X size={20} color="#662483" />
                </TouchableOpacity>

                <View style={styles.modalIconContainer}>
                  <Check size={40} color="#ffffff" strokeWidth={3} />
                </View>

                <Text style={styles.modalTitle}>Verified Successfully</Text>
                <Text style={styles.modalSubtitle}>
                  "Please wait for team approval. Once verified, we will notify you to allow access to the dashboard."
                </Text>
              </View>
            </View>
          </Modal>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconContainer}>
                <Rocket size={18} color="#ffffff" />
              </View>
              <Text style={styles.headerTitle}>Start Up Portal</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/startup-login')} style={styles.signInButton}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.otpCard}>
              {/* Mail Icon in Circle */}
              <View style={styles.mailIconCircle}>
                <Mail size={32} color="#0f172a" />
              </View>

              {/* Title & Description */}
              <Text style={styles.otpTitle}>Verify your email</Text>
              <Text style={styles.otpSubtext}>
                We've sent a 6-digit verification code to <Text style={styles.boldEmail}>{email}</Text>
              </Text>

              {/* Error Box */}
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* OTP Digits Row */}
              <View style={styles.otpInputRow}>
                {otpVal.map((digit, index) => (
                  <View key={index} style={styles.otpSingleWrapper}>
                    <TextInput
                      ref={(ref) => { otpInputsRef.current[index] = ref; }}
                      style={styles.otpSingleInput}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleOtpKeyPress(e, index)}
                      placeholder="0"
                      placeholderTextColor="#94a3b8"
                      selectTextOnFocus
                    />
                    <View style={styles.otpLine} />
                  </View>
                ))}
              </View>

              {/* Create Account Button */}
              <TouchableOpacity 
                style={[styles.submitButton, loading && { opacity: 0.7 }]} 
                onPress={handleVerifyAndRegister}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
                <ArrowRight size={18} color="#ffffff" style={styles.submitIcon} />
              </TouchableOpacity>

              {/* Resend Link */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>
                  Didn't receive the code?{' '}
                  <Text style={styles.resendTextBold} onPress={handleSendOtp}>
                    Resend Code
                  </Text>
                </Text>
              </View>

              {/* Back to Login / Register Link */}
              <TouchableOpacity 
                style={styles.backLinkButton}
                onPress={() => setShowOtpScreen(false)}
              >
                <ArrowLeft size={16} color="#475569" style={{ marginRight: 6 }} />
                <Text style={styles.backLinkText}>Back to registration</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <Rocket size={18} color="#ffffff" />
            </View>
            <Text style={styles.headerTitle}>Start Up Portal</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/startup-login')} style={styles.signInButton}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Hero Banner Card */}
          <View style={styles.heroCard}>
            <ImageBackground 
              source={require('../../assets/images/startup-hero-banner.png')} 
              style={styles.heroImage}
              imageStyle={{ borderRadius: 12 }}
            >
              <View style={styles.heroOverlay}>
                <Text style={styles.heroHeading}>Build your startup with the right foundation.</Text>
                <Text style={styles.heroSubtext}>Join over 10+ founders building the future with our master admin tools.</Text>
                
                <View style={styles.founderSection}>
                  <View style={styles.avatarRow}>
                    <View style={[styles.avatar, { backgroundColor: '#e2e8f0', zIndex: 3 }]}>
                      <Text style={styles.avatarText}>A</Text>
                    </View>
                    <View style={[styles.avatar, { backgroundColor: '#cbd5e1', zIndex: 2, marginLeft: -8 }]}>
                      <Text style={styles.avatarText}>B</Text>
                    </View>
                    <View style={[styles.avatar, { backgroundColor: '#94a3b8', zIndex: 1, marginLeft: -8 }]}>
                      <Text style={styles.avatarText}>C</Text>
                    </View>
                    <View style={styles.plusPill}>
                      <Text style={styles.plusText}>+10</Text>
                    </View>
                  </View>
                  <Text style={styles.founderTrustText}>Trusted by world-class founders</Text>
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* Form Header */}
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Create Your Account</Text>
            <Text style={styles.formSubtitle}>Get started with your 14-day free trial</Text>
          </View>

          {/* Error Box */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <InputField 
            label="Founder Name" 
            placeholder="Shabari E S" 
            value={founderName} 
            onChangeText={setFounderName} 
          />

          <InputField 
            label="Company Name" 
            placeholder="VS-Groups" 
            value={companyName} 
            onChangeText={setCompanyName} 
          />

          <InputField 
            label="Company Registration ID" 
            placeholder="UDYAM-XX-00-0000000" 
            value={registrationId} 
            onChangeText={setRegistrationId} 
          />

          <InputField 
            label="Email Address" 
            placeholder="name@company.com" 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField 
            label="Password" 
            placeholder="........" 
            secureTextEntry={!showPassword}
            value={password} 
            onChangeText={setPassword} 
            rightIcon={showPassword ? EyeOff : Eye}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          {/* Category Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity 
              style={styles.dropdownTrigger}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <Text style={[styles.dropdownValue, !category && { color: '#9ca3af' }]}>
                {category || 'Select Category'}
              </Text>
              <ChevronDown size={18} color="#4b5563" />
            </TouchableOpacity>

            {showCategoryDropdown && (
              <View style={styles.dropdownList}>
                {CATEGORIES.map((item) => (
                  <TouchableOpacity 
                    key={item} 
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCategory(item);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Checkbox Agreement */}
          <TouchableOpacity 
            style={styles.checkboxContainer} 
            activeOpacity={0.8}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.checkboxLabel}>
              I agree to the <Text style={styles.boldText}>Terms of Service</Text> and <Text style={styles.boldText}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && { opacity: 0.7 }]} 
            onPress={handleSendOtp}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Sending verification code...' : 'Verify Otp & Create Account'}
            </Text>
            <ArrowRight size={18} color="#ffffff" style={styles.submitIcon} />
          </TouchableOpacity>

          {/* Sign In Footer */}
          <View style={styles.footerLinkContainer}>
            <Text style={styles.footerLinkText}>
              Already have an account?{' '}
              <Text style={styles.footerLinkBold} onPress={() => router.push('/startup-login')}>
                Sign In
              </Text>
            </Text>
          </View>

          {/* Copyright Footer */}
          <Text style={styles.copyrightText}>© 2024 Start Up Portal. All rights reserved.</Text>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  signInButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
    maxWidth: 550,
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 32,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      }
    }),
  },
  heroImage: {
    width: '100%',
    minHeight: 180,
  },
  heroOverlay: {
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
  },
  heroHeading: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  heroSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  founderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  avatarText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155',
  },
  plusPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  plusText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  founderTrustText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '500',
  },
  formHeader: {
    marginBottom: 28,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748b',
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
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
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: TEXT_DARK,
  },
  inputRightIcon: {
    padding: 4,
    marginLeft: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    backgroundColor: BG_LIGHT,
    height: 48,
    paddingHorizontal: 16,
  },
  dropdownValue: {
    fontSize: 14,
    color: TEXT_DARK,
  },
  dropdownList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#334155',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    paddingRight: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: PRIMARY_COLOR,
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 1,
    backgroundColor: '#ffffff',
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: '#334155',
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      }
    }),
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  submitIcon: {
    marginLeft: 8,
  },
  footerLinkContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  footerLinkText: {
    fontSize: 13,
    color: '#64748b',
  },
  footerLinkBold: {
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  copyrightText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // OTP Verification Screen Styles
  otpCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      }
    }),
  },
  mailIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef3c7', // light peach/yellow circle
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  otpTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  otpSubtext: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  boldEmail: {
    fontWeight: '700',
    color: '#0f172a',
  },
  otpInputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 36,
    width: '100%',
  },
  otpSingleWrapper: {
    alignItems: 'center',
    width: 44,
  },
  otpSingleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    height: 48,
    width: '100%',
    padding: 0,
  },
  otpLine: {
    height: 2,
    backgroundColor: '#cbd5e1',
    width: '100%',
    marginTop: 4,
  },
  resendContainer: {
    marginBottom: 24,
  },
  resendText: {
    fontSize: 13,
    color: '#64748b',
  },
  resendTextBold: {
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },
  backLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      }
    }),
  },
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      }
    }),
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PRIMARY_COLOR,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
  },
});
