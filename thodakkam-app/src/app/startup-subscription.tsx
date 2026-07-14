import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';
import { CheckCircle, ShieldCheck, Zap } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import StartupHeader from '../components/StartupHeader';

export default function StartupSubscription() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { colors, isDark } = useAppTheme();
  const router = useRouter();

  // ... (keeping handleCheckout unchanged) ...

  const handleCheckout = async () => {
    setLoading(true);
    setResult('');
    try {
      const token = await AsyncStorage.getItem("startupToken");
      if (!token) {
        setResult("Error: Please log in to continue.");
        setLoading(false);
        return;
      }

      // Step 1: Create Order
      const res = await fetch(`${BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: 79900 })
      });
      const resData = await res.json();
      
      if (!resData.success) {
        setResult('Error creating order: ' + resData.message);
        setLoading(false);
        return;
      }
      const data = resData.data;

      // Step 2: Inject script for Web
      if (Platform.OS === 'web' && !(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // Step 3: Open Razorpay Modal
      const options = {
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || data.razorpay_key,
        amount: data.amount,
        currency: data.currency,
        name: 'Thodakkam',
        description: 'Premium Startup Plan',
        order_id: data.order_id,
        handler: async function (response: any) {
          try {
            // Step 4: Verify Signature
            const verifyRes = await fetch(`${BASE_URL}/api/startup/subscription/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setIsSuccess(true);
              setResult('Payment Successful! Your premium features are unlocked.');
            } else {
              setResult('Verification Failed: ' + verifyData.message);
            }
          } catch (err: any) {
            setResult('Verification Error: ' + err.message);
          }
        },
        prefill: {
          name: 'Startup Founder',
          email: 'founder@example.com',
          contact: '9999999999'
        },
        theme: {
          color: colors.primary
        }
      };

      if (Platform.OS === 'web' && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setResult(`Payment Failed: ${response.error.description}`);
        });
        rzp.open();
      } else {
        setResult('Razorpay SDK is only supported on Web in this demo.');
      }
      
    } catch (err: any) {
      setResult('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StartupHeader companyName="My Startup" />
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.header}>
          <ShieldCheck size={48} color={colors.primary} style={{ marginBottom: 16 }} />
          <Text style={[styles.title, { color: colors.text }]}>Premium Plan</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Unlock full access to candidate profiles and hire the best talent instantly.
          </Text>
        </View>

        <View style={styles.features}>
          {['Unlimited Job Postings', 'AI Candidate Matching', 'Direct Messaging', 'Analytics Dashboard'].map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <CheckCircle size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.pricing}>
          <Text style={[styles.price, { color: colors.text }]}>₹799</Text>
          <Text style={[styles.period, { color: colors.textSecondary }]}>/ 10 days</Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={handleCheckout} 
          disabled={loading || isSuccess}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <Zap size={20} color="#fff" />
              <Text style={styles.buttonText}>{isSuccess ? 'Activated' : 'Upgrade Now'}</Text>
            </View>
          )}
        </TouchableOpacity>

        {result ? (
          <View style={[styles.resultBox, { backgroundColor: isSuccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderColor: isSuccess ? '#22c55e' : '#ef4444' }]}>
            <Text style={[styles.resultText, { color: isSuccess ? '#16a34a' : '#dc2626' }]}>{result}</Text>
          </View>
        ) : null}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    marginBottom: 32,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 32,
  },
  price: {
    fontSize: 48,
    fontWeight: '800',
  },
  period: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  resultBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
  }
});
