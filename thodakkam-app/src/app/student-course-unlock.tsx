import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, Clock, Users, BookOpen, Infinity, Award, ShieldCheck, Zap, ChevronRight, Lock } from 'lucide-react-native';
import { BASE_URL } from '../config/api';

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Infinity': return <Infinity size={20} color="#7c3aed" />;
    case 'BookOpen': return <BookOpen size={20} color="#3b82f6" />;
    case 'Award': return <Award size={20} color="#f59e0b" />;
    case 'ShieldCheck': return <ShieldCheck size={20} color="#10b981" />;
    case 'Code': return <Zap size={32} color="#fff" />;
    case 'Layers': return <Zap size={32} color="#fff" />;
    case 'Palette': return <Zap size={32} color="#fff" />;
    default: return <Star size={20} color="#64748b" />;
  }
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function StudentCourseUnlockScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 900;
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    if (Platform.OS !== 'web') {
      alert("Payment is only supported on Web for now.");
      return;
    }
    
    setProcessing(true);
    
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load");
      setProcessing(false);
      return;
    }
    
    try {
      const amountInPaise = Math.round(course.discountedPrice * 100);
      const orderResponse = await fetch(`${BASE_URL}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountInPaise })
      });
      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        alert("Failed to create order: " + orderData.message);
        setProcessing(false);
        return;
      }
      
      const options = {
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: "Thodakkam AI",
        description: `Unlock ${course.title}`,
        order_id: orderData.data.order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${BASE_URL}/api/payment/verify-signature`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              alert("Payment Successful! Course Unlocked.");
              router.back();
            } else {
              alert("Payment verification failed.");
            }
          } catch (e) {
             alert("Error verifying payment.");
          }
        },
        prefill: {
          name: "Student",
          email: "student@example.com",
          contact: "9999999999"
        },
        theme: {
          color: course.themeColor || "#7c3aed"
        }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert("Payment failed: " + response.error.description);
      });
      rzp.open();
      
    } catch (err) {
      console.error(err);
      alert("Error initiating checkout.");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    
    const fetchCourseDetails = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/practice/course/${id}`);
        const responseData = await response.json();
        
        if (responseData.success) {
          setCourse(responseData.data);
        } else {
          setError(responseData.message || 'Failed to load course details');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Course not found'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.pageHeader}>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <ChevronRight size={16} color="#64748b" style={{ transform: [{ rotate: '180deg' }] }} />
          <Text style={styles.backLinkText}>Back to Practice</Text>
        </Pressable>
      </View>

      <View style={[styles.mainLayout, isMobile && { flexDirection: 'column' }]}>
        
        {/* Left Column: Course Details */}
        <View style={[styles.leftColumn, isMobile && { width: '100%', marginBottom: 32 }]}>
          <View style={styles.courseHeader}>
            <View style={[styles.courseIconBox, { backgroundColor: course.themeColor }]}>
              {getIcon(course.icon)}
            </View>
            <View style={styles.badgesRow}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{course.level}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Star size={14} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.ratingText}>{course.rating}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.unlockTitle}>Unlock</Text>
          <Text style={[styles.courseTitle, { color: course.themeColor }]}>{course.title}</Text>
          <Text style={styles.courseSubtitle}>{course.description}</Text>

          <View style={styles.metaInfoRow}>
            <View style={styles.metaPill}>
              <Clock size={14} color="#64748b" />
              <Text style={styles.metaPillText}>{course.hours} hrs</Text>
            </View>
            <View style={styles.metaPill}>
              <Users size={14} color="#64748b" />
              <Text style={styles.metaPillText}>{course.students.toLocaleString()} students</Text>
            </View>
            <View style={styles.metaPill}>
              <BookOpen size={14} color="#64748b" />
              <Text style={styles.metaPillText}>{course.topics} topics</Text>
            </View>
          </View>

          <View style={styles.benefitsList}>
            {course.benefits?.map((benefit: any) => (
              <View key={benefit.id} style={styles.benefitItem}>
                <View style={styles.benefitIconBox}>
                  {getIcon(benefit.icon)}
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDesc}>{benefit.subtitle}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Right Column: Pricing & Checkout */}
        <View style={[styles.rightColumn, isMobile && { width: '100%' }]}>
          <View style={styles.pricingCard}>
            <View style={styles.limitedOfferBadge}>
              <Zap size={12} color="#7c3aed" />
              <Text style={styles.limitedOfferText}>LIMITED OFFER</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.originalPrice}>₹{course.originalPrice}</Text>
              <Text style={styles.discountedPrice}>₹{course.discountedPrice}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>
                  {Math.round((1 - course.discountedPrice / course.originalPrice) * 100)}% OFF
                </Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              {Object.entries(course.features || {}).map(([key, value]: any) => (
                <View key={key} style={styles.featureItem}>
                  <Text style={styles.featureKey}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                  </Text>
                  <View style={styles.featureValueBadge}>
                    <Text style={styles.featureValueText}>{value}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Today</Text>
              <Text style={styles.totalValue}>₹{course.discountedPrice}</Text>
            </View>

            <Pressable 
              style={[styles.buyButton, { backgroundColor: course.themeColor, opacity: processing ? 0.7 : 1 }]}
              onPress={handleCheckout}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Zap size={16} color="#fff" />
              )}
              <Text style={styles.buyButtonText}>
                {processing ? "Processing..." : `Get Instant Access • ₹${course.discountedPrice}`}
              </Text>
              {!processing && <ChevronRight size={16} color="#fff" />}
            </Pressable>

            <View style={styles.secureFooter}>
              <View style={styles.secureItem}>
                <Lock size={12} color="#94a3b8" />
                <Text style={styles.secureText}>256-bit SSL secured</Text>
              </View>
              <View style={styles.secureItem}>
                <ShieldCheck size={12} color="#94a3b8" />
                <Text style={styles.secureText}>Safe & encrypted</Text>
              </View>
            </View>
          </View>
        </View>

      </View>
    </ScrollView>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  pageHeader: {
    width: '100%',
    maxWidth: 1000,
    marginBottom: 24,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backLinkText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  mainLayout: {
    width: '100%',
    maxWidth: 1000,
    flexDirection: 'row',
    gap: 48,
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    width: 400,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 24,
  },
  courseIconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  levelBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ratingText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  unlockTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 56,
  },
  courseTitle: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
    marginBottom: 16,
  },
  courseSubtitle: {
    fontSize: 18,
    color: '#64748b',
    lineHeight: 28,
    marginBottom: 32,
  },
  metaInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 48,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  metaPillText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  benefitsList: {
    gap: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  benefitIconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
      },
      default: {
        elevation: 8,
      }
    })
  },
  limitedOfferBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 16,
  },
  limitedOfferText: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 32,
  },
  originalPrice: {
    fontSize: 24,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  discountedPrice: {
    fontSize: 48,
    fontWeight: '800',
    color: '#7c3aed',
  },
  discountBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  discountBadgeText: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '700',
  },
  featuresList: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 24,
    gap: 16,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureKey: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  featureValueBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureValueText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 16,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secureFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  secureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secureText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#475569',
    fontWeight: '600',
  }
});
