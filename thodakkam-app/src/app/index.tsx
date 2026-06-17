import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView, ScrollView, Platform, Dimensions, Image, useWindowDimensions, LayoutAnimation } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Briefcase, GraduationCap, ShieldCheck, ArrowRight, Sparkles, Star, MessageSquare, CheckCircle2, Check, Zap, Activity, TrendingUp, UserCog, X, ChevronLeft, ChevronRight, Rocket } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOutDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
const { width } = Dimensions.get('window');
const PRIMARY = '#722DB6';
const PRIMARY_DARK = '#5A279B';
const BG = '#f8fafc';

const CARDS = [
  {
    id: 'student',
    title: 'For Students',
    shortTitle: 'Students',
    subtitle: 'Land your first startup role',
    description: 'Build your profile, showcase skills, and get matched with fast-growing startups using our AI resume analyzer.',
    buttonText: 'Student Login',
    route: '/register',
    Icon: GraduationCap,
    accent: '#3b82f6', // Blue accent
  },
  {
    id: 'startup',
    title: 'For Startups',
    shortTitle: 'Startups',
    subtitle: 'Discover vetted talent fast',
    description: 'Post innovative job roles, manage assessments, and hire top-tier students instantly with our AI engine.',
    buttonText: 'Startup Login',
    route: '/startup-register',
    Icon: Briefcase,
    accent: '#10b981', // Green accent
  },
  {
    id: 'admin',
    title: 'For Administrators',
    shortTitle: 'Admin',
    subtitle: 'Manage ecosystem health',
    description: 'Monitor platform analytics, verify startup authenticity, and oversee the entire Thodakkam network.',
    buttonText: 'Admin Login',
    route: '/admin-login',
    Icon: ShieldCheck,
    accent: '#f43f5e', // Rose accent
  },
];

function FloatingNavBar() {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeCard = CARDS.find(c => c.id === activeId);

  return (
    <View style={styles.floatingNavContainer}>
      {/* Tooltip Bubble */}
      {activeCard && (
        <Animated.View
          entering={FadeInDown.duration(300).springify()}
          exiting={FadeOutDown.duration(200)}
          style={styles.tooltipBubble}
        >
          <Text style={[styles.tooltipTitle, { color: activeCard.accent }]}>
            {activeCard.title}
          </Text>
          <Text style={styles.tooltipDesc}>{activeCard.description}</Text>
          <View style={styles.tooltipArrow} />
        </Animated.View>
      )}

      {/* Navigation Icons */}
      <View style={styles.navBar}>
        {CARDS.map((card, index) => {
          const isActive = activeId === card.id;
          return (
            <Pressable
              key={card.id}
              onHoverIn={() => setActiveId(card.id)}
              onHoverOut={() => setActiveId(null)}
              onPress={() => {
                if (isActive) {
                  router.push(card.route as any);
                } else {
                  setActiveId(card.id);
                }
              }}
              style={({ pressed }) => [
                { alignItems: 'center', justifyContent: 'center' },
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <View style={[
                styles.navIconWrapper,
                card.id === 'startup' && {
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  marginTop: -20,
                  marginBottom: 0,
                  backgroundColor: '#ffffff',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  boxShadow: `0 -4px 15px rgba(124, 58, 237, 0.15)`,
                  elevation: 6,
                },
                isActive && card.id === 'startup' && {
                  transform: [{ translateY: -4 }, { scale: 1.05 }],
                  boxShadow: `0 -6px 25px rgba(124, 58, 237, 0.3)`,
                },
                isActive && card.id !== 'startup' && {
                  transform: [{ translateY: -6 }, { scale: 1.1 }],
                  backgroundColor: `${card.accent}15`,
                  boxShadow: `0 0 20px ${card.accent}`,
                  elevation: 8,
                }
              ]}>
                <card.Icon
                  size={card.id === 'startup' ? 32 : 24}
                  color={isActive ? card.accent : PRIMARY}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </View>
              <Text style={{
                fontSize: 10,
                marginTop: 4,
                fontWeight: '600',
                color: isActive ? card.accent : '#64748b'
              }}>
                {card.shortTitle}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FeatureSection() {
  const { width } = Dimensions.get('window');
  // 750px is the total width required to comfortably show the 460px ring + 140px card overflows on each side
  const scaleRatio = Math.min(1, width / 750);

  return (
    <View style={styles.featureSection}>
      <View style={styles.featureBadge}>
        <Text style={styles.featureBadgeText}>AI-POWERED MATCHING</Text>
      </View>
      <Text style={styles.featureHeading}>
        Connect with the <Text style={{ color: PRIMARY }}>Right Talent</Text>, Instantly
      </Text>
      <Text style={styles.featureSubtext}>
        Our intelligent matching engine orchestrates every step of the hiring journey, connecting vetted students directly with fast-growing startups.
      </Text>

      <View style={{ width: 750 * scaleRatio, height: 460 * scaleRatio, alignItems: 'center', justifyContent: 'center', marginVertical: 60 }}>
        <View style={{ width: 750, height: 460, transform: [{ scale: scaleRatio }], alignItems: 'center', justifyContent: 'center' }}>
          <View style={[styles.orbitContainer, { marginVertical: 0 }]}>
            {/* The dashed circular ring */}
            <View style={styles.orbitRing} />

          {/* Top Floating Badge */}
          <Animated.View style={[styles.floatingBadge, { top: 10, left: 70 }]} entering={FadeInUp.delay(200)}>
            <Star size={16} color={PRIMARY} fill={PRIMARY} />
            <View style={{ marginLeft: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: PRIMARY }}>Top 1% Match</Text>
              <Text style={{ fontSize: 10, color: '#64748b' }}>AI Shortlisted</Text>
            </View>
          </Animated.View>

          {/* Left Floating Card: Job Match */}
          <Animated.View style={[styles.floatingCard, { top: 160, left: -100 }]} entering={FadeInDown.delay(400)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: PRIMARY, padding: 8, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>JOB MATCH</Text>
              <Text style={{ color: '#fff', fontSize: 10 }}>Active</Text>
            </View>
            <View style={{ padding: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ backgroundColor: `${PRIMARY}20`, padding: 8, borderRadius: 20, marginRight: 8 }}>
                  <Briefcase size={16} color={PRIMARY} />
                </View>
                <View>
                  <Text style={{ fontWeight: '700', fontSize: 12 }}>Frontend Intern</Text>
                  <Text style={{ color: '#64748b', fontSize: 10 }}>Echo Digital • Remote</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: '#64748b' }}>AI Match Score</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: PRIMARY }}>98%</Text>
              </View>
              <View style={{ backgroundColor: PRIMARY_DARK, padding: 8, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>Apply with 1-Click</Text>
              </View>
            </View>
          </Animated.View>

          {/* Center Profile Image */}
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' }}
            style={styles.orbitCenterImage}
          />

          {/* Top Node */}
          <View style={styles.orbitNode} />

          {/* Right Floating Card: AI Screening */}
          <Animated.View style={[styles.floatingCard, { top: 170, right: -120, padding: 12, width: 240 }]} entering={FadeInDown.delay(600)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 }} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: PRIMARY }}>AI SCREENING PASSED</Text>
            </View>
            <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderBottomLeftRadius: 0, marginBottom: 8 }}>
              <Text style={{ fontSize: 11, color: '#334155' }}>"Hey Ananya! Loved your projects. Free to chat tomorrow?"</Text>
            </View>
            <View style={{ backgroundColor: PRIMARY_DARK, padding: 10, borderRadius: 8, borderBottomRightRadius: 0, alignSelf: 'flex-end', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, color: '#fff' }}>"Yes! I'd love to join."</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={12} color="#10b981" />
              <Check size={12} color="#10b981" style={{ marginLeft: -6, marginRight: 4 }} />
              <Text style={{ fontSize: 10, color: '#64748b' }}>Interview Scheduled (in 2 days)</Text>
            </View>
          </Animated.View>

          {/* Bottom Left Floating Badge: Candidate Hired */}
          <Animated.View style={[styles.floatingBadge, { bottom: 10, left: 30, paddingHorizontal: 16 }]} entering={FadeInUp.delay(800)}>
            <CheckCircle2 size={16} color="#10b981" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginLeft: 8 }}>Candidate Hired!</Text>
          </Animated.View>

          {/* Bottom Right Floating Badge: Success Rate */}
          <Animated.View style={[styles.floatingBadge, { bottom: 30, right: 20, flexDirection: 'column', paddingVertical: 12 }]} entering={FadeInUp.delay(1000)}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#10b981' }}>98% //</Text>
            <Text style={{ fontSize: 8, fontWeight: '700', color: '#64748b', marginTop: 2 }}>PLACEMENT SUCCESS</Text>
          </Animated.View>
        </View>
      </View>
      </View>
    </View>
  );
}

function TrustedSection() {
  const partners = [
    { name: 'Nexyuga Innovations Private Limited', image: require('../../assets/images/nexyuga-logo.png') },
    { name: 'ZENTRO SOLUTIONS', image: require('../../assets/images/zentro-logo.png') },
    { name: 'ECHODIGITALWORKS', image: require('../../assets/images/echo-digital-logo.png') },
    { name: 'Echo Digital', image: require('../../assets/images/echo-digital-logo.png') },
    { name: 'BITS Pilani', icon: GraduationCap, color: '#3b82f6', bg: '#dbeafe' },
    { name: 'IIT Madras', icon: Star, color: '#ef4444', bg: '#fee2e2' },
    { name: 'StayVista', icon: Briefcase, color: '#3b82f6', bg: '#dbeafe' },
    { name: 'EatFit', icon: Sparkles, color: '#10b981', bg: '#dcfce7' },
  ];

  const [contentWidth, setContentWidth] = useState(0);
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    if (contentWidth > 0) {
      translateX.value = 0;
      translateX.value = withRepeat(
        withTiming(-contentWidth, {
          duration: 21050,
          easing: Easing.linear,
        }),
        -1, // infinite repeat
        false // no reverse
      );
    }
  }, [contentWidth, translateX]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      flexDirection: 'row',
      alignSelf: 'flex-start',
      flexWrap: 'nowrap',
    };
  });

  const renderPartner = (partner: any, index: number, prefix: string) => (
    <View key={`${prefix}-${index}`} style={[styles.trustedCard, { marginRight: 16 }]}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: partner.bg || 'transparent', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {partner.image ? (
          <ExpoImage source={partner.image} style={{ width: '100%', height: '100%' }} contentFit="contain" />
        ) : (
          partner.icon && <partner.icon size={16} color={partner.color} />
        )}
      </View>
      <Text style={styles.trustedCardText}>{partner.name}</Text>
    </View>
  );

  return (
    <View style={styles.trustedSection}>
      <Text style={styles.trustedHeading}>TRUSTED BY FAST-GROWING STARTUPS ACROSS INDIA</Text>
      <View style={{ width: '100%', overflow: 'hidden' }}>
        <Animated.View style={animatedStyle}>
          <View
            onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
            style={{ flexDirection: 'row' }}
          >
            {partners.map((p, i) => renderPartner(p, i, '1'))}
          </View>
          <View style={{ flexDirection: 'row' }}>
            {partners.map((p, i) => renderPartner(p, i, '2'))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function SuperchargeSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const floatY = useSharedValue(0);

  React.useEffect(() => {
    floatY.value = withRepeat(
      withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [floatY]);

  const animatedFloatingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatY.value }]
    };
  });

  return (
    <View style={{ width: '100%', maxWidth: 1000, alignSelf: 'center', paddingVertical: 80, alignItems: 'flex-start' }}>
      
      {/* Badge */}
      <View style={{ backgroundColor: '#f3e8ff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 24, borderWidth: 1, borderColor: '#e9d5ff' }}>
        <Text style={{ color: PRIMARY, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>FOR STARTUPS (HIRING)</Text>
      </View>

      {/* Heading */}
      <Text style={{ fontSize: isMobile ? 32 : 42, fontWeight: '800', color: '#0f172a', marginBottom: 24, lineHeight: isMobile ? 40 : 50, letterSpacing: -1 }}>
        Supercharge Your Recruitment with AI Screening
      </Text>

      {/* Description */}
      <Text style={{ fontSize: 16, color: '#475569', lineHeight: 28, marginBottom: 48, maxWidth: 800 }}>
        Say goodbye to generic job boards and endless manual screening. Thodakkam automates sourcing, resume parsing, and compatibility analysis to deliver shortlisted, highly qualified student talent in minutes.
      </Text>

      {/* Bullets */}
      <View style={{ gap: 32, marginBottom: 64, width: '100%' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 20, marginTop: 2, borderWidth: 1, borderColor: '#e2e8f0' }}>
            <Check size={20} color={PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 }}>Automated ATS Match shortlists</Text>
            <Text style={{ fontSize: 15, color: '#64748b', lineHeight: 24 }}>Our matching engine scores resumes against role requirements instantly so you only review fit candidates.</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 20, marginTop: 2, borderWidth: 1, borderColor: '#e2e8f0' }}>
            <Check size={20} color={PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 }}>Vetted student project portfolios</Text>
            <Text style={{ fontSize: 15, color: '#64748b', lineHeight: 24 }}>Skip resume keyword filters. Inspect live Figma, GitHub repos, and deployed applications directly.</Text>
          </View>
        </View>
      </View>

      {/* Mockup Box (Stacked under the text, animated) */}
      <Animated.View entering={FadeInUp.duration(1000).delay(300).springify()} style={[{ width: '100%', backgroundColor: '#ffffff', borderRadius: 24, padding: isMobile ? 16 : 32, borderWidth: 1, borderColor: '#f1f5f9', ...Platform.select({ web: { boxShadow: '0 20px 60px rgba(0,0,0,0.06)' } }) }, animatedFloatingStyle]}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 24 }}>Active Shortlist • Frontend Developer</Text>
        
        {/* Item 1 */}
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: isMobile ? 12 : 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginRight: isMobile ? 12 : 16 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>AS</Text>
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>Shabari</Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>React • TailwindCSS</Text>
            </View>
          </View>
          <View style={{ backgroundColor: '#f3e8ff', paddingHorizontal: isMobile ? 8 : 12, paddingVertical: 8, borderRadius: 20 }}>
            <Text style={{ color: PRIMARY, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>98% MATCH</Text>
          </View>
        </View>

        {/* Item 2 */}
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: isMobile ? 12 : 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#c084fc', alignItems: 'center', justifyContent: 'center', marginRight: isMobile ? 12 : 16 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>MU</Text>
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>Mukesh</Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Vue.js • Node.js</Text>
            </View>
          </View>
          <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: isMobile ? 8 : 12, paddingVertical: 8, borderRadius: 20 }}>
            <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>92% MATCH</Text>
          </View>
        </View>

      </Animated.View>

    </View>
  );
}

function OperationsSection() {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(1);

  const handlePrev = () => setActiveIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () => setActiveIndex((prev) => Math.min(2, prev + 1));

  const cardsData = [
    {
      id: 'analytics',
      content: (
        <>
          <View style={[styles.opIconWrapper, { backgroundColor: '#f0f9ff', borderColor: '#e0f2fe', borderWidth: 1 }]}>
            <TrendingUp size={24} color="#0ea5e9" />
          </View>
          <Text style={styles.opCardTitle}>Ecosystem Analytics</Text>
          <Text style={styles.opCardDesc}>
            Observe student placement status, pipeline conversions, interview ratios, and successful matches. Dynamic database statistics are generated automatically.
          </Text>
          <View style={styles.opWidget}>
            <View style={styles.opStatRow}>
              <Text style={styles.opStatLabel}>Sourcing Match{'\n'}Rate</Text>
              <View style={styles.opProgressBarContainer}>
                <View style={[styles.opProgressBar, { width: '92%', backgroundColor: '#0ea5e9' }]} />
              </View>
              <View style={{ width: 36, alignItems: 'flex-end' }}>
                <Text style={styles.opStatValue}>92%</Text>
              </View>
            </View>
            <View style={styles.opStatRow}>
              <Text style={styles.opStatLabel}>Avg. Matching{'\n'}Days</Text>
              <View style={styles.opProgressBarContainer}>
                <View style={[styles.opProgressBar, { width: '30%', backgroundColor: '#8b5cf6' }]} />
              </View>
              <View style={{ width: 36, alignItems: 'flex-end' }}>
                <Text style={styles.opStatValue}>14</Text>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#0f172a' }}>Days</Text>
              </View>
            </View>
          </View>
        </>
      )
    },
    {
      id: 'vetting',
      content: (
        <>
          <View style={[styles.opIconWrapper, { backgroundColor: '#faf5ff', borderColor: '#f3e8ff', borderWidth: 1 }]}>
            <ShieldCheck size={24} color="#722DB6" />
          </View>
          <Text style={styles.opCardTitle}>Vetting & Verification</Text>
          <Text style={styles.opCardDesc}>
            Verify registration documents, tax status, and founder credentials for onboarding startups. Fully managed moderation pipelines filter out unvetted companies automatically.
          </Text>
          <View style={styles.opWidget}>
            <View style={styles.opWidgetItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.opWidgetIndicator, { backgroundColor: '#10b981' }]} />
                <Text style={styles.opWidgetText}>Echo Digital Works</Text>
              </View>
              <View style={styles.opApprovedBadge}>
                <Text style={styles.opApprovedText}>Approved</Text>
              </View>
            </View>
            <View style={styles.opWidgetItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.opWidgetIndicator, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.opWidgetText}>Acme Software Corp</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={[styles.opActionBtn, { backgroundColor: '#10b981' }]}>
                  <Check size={12} color="#fff" strokeWidth={3} />
                </View>
                <View style={[styles.opActionBtn, { backgroundColor: '#ef4444' }]}>
                  <X size={12} color="#fff" strokeWidth={3} />
                </View>
              </View>
            </View>
          </View>
        </>
      )
    },
    {
      id: 'security',
      content: (
        <>
          <View style={[styles.opIconWrapper, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7', borderWidth: 1 }]}>
            <UserCog size={24} color="#10b981" />
          </View>
          <Text style={styles.opCardTitle}>Security & Auditing</Text>
          <Text style={styles.opCardDesc}>
            Audit user activities, monitor platform logs, manage server configurations, and moderate job postings to maintain the ecosystem's high-standard vetting standards.
          </Text>
          <View style={styles.opWidget}>
            <Text style={styles.opLogText}>
              <Text style={styles.opLogTime}>[14:32:01]</Text> Startup Approved: Echo Digitals
            </Text>
            <Text style={styles.opLogText}>
              <Text style={styles.opLogTime}>[14:35:12]</Text> Database Backup Successful
            </Text>
            <Text style={styles.opLogText}>
              <Text style={styles.opLogTime}>[14:40:45]</Text> Match Engine: Shortlisted 12 candidates
            </Text>
          </View>
        </>
      )
    }
  ];

  return (
    <View style={styles.operationsSection}>
      <View style={styles.operationsHeader}>
        <View style={styles.operationsBadge}>
          <View style={styles.operationsBadgeDot} />
          <Text style={styles.operationsBadgeText}>ECOSYSTEM OPERATIONS</Text>
        </View>
        <Text style={styles.operationsTitle}>
          Complete Control from <Text style={{ color: PRIMARY }}>Master{'\n'}Admin Command Center</Text>
        </Text>
        <Text style={styles.operationsSubtitle}>
          Thodakkam's administrative engine empowers platform administrators with centralized workflows, detailed verification verification, and real-time moderation widgets.
        </Text>
      </View>

      <View style={styles.operationsGrid}>

        {cardsData.map((card, index) => {
          let positionStyle: any = {};
          
          if (index === activeIndex) {
            positionStyle = {
              zIndex: 3,
              marginLeft: -160,
              transform: [{ scale: 1.05 }, { translateY: -10 }],
              ...Platform.select({ web: { boxShadow: '0 25px 50px rgba(0,0,0,0.15)' } })
            };
          } else if (index < activeIndex) {
            positionStyle = {
              zIndex: 1,
              marginLeft: -300,
              transform: [{ scale: 0.9 }, { rotate: '-6deg' }, { translateY: 20 }],
              ...Platform.select({ web: { boxShadow: '0 15px 35px rgba(0,0,0,0.08)' } })
            };
          } else {
            positionStyle = {
              zIndex: 2,
              marginLeft: -20,
              transform: [{ scale: 0.9 }, { rotate: '6deg' }, { translateY: 20 }],
              ...Platform.select({ web: { boxShadow: '0 15px 35px rgba(0,0,0,0.08)' } })
            };
          }

          return (
            <Animated.View key={card.id} style={[styles.operationsCard, positionStyle]}>
              {card.content}
              {index !== activeIndex && (
                <Pressable 
                  style={StyleSheet.absoluteFill}
                  onPress={() => {
                    if (index < activeIndex) handlePrev();
                    else if (index > activeIndex) handleNext();
                  }}
                />
              )}
            </Animated.View>
          );
        })}

      </View>
    </View>
  );
}

function Floating3DCard({ children, delayMs = 0, style, intensity = 1 }: any) {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      translateY.value = withRepeat(
        withTiming(-15 * intensity, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      rotateX.value = withRepeat(
        withTiming(8 * intensity, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      rotateY.value = withRepeat(
        withTiming(8 * intensity, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }, delayMs);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { translateY: translateY.value },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` }
      ],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}



function JourneySection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const steps = [
    {
      id: 1,
      title: 'Students Phase',
      description: 'Students showcase their achievements and projects on community posts, apply for companies, and attend interviews to get their offer letter.',
      features: [
        'Post that achievements here',
        'Automated ATS analyzers'
      ],
      animations: [
        { label: 'Build your profile', icon: <UserCog size={16} color="#722DB6" /> },
        { label: 'Post your projects', icon: <Briefcase size={16} color="#722DB6" /> },
        { label: 'Share your achievements', icon: <Star size={16} color="#722DB6" /> },
        { label: 'Apply for the company', icon: <CheckCircle2 size={16} color="#722DB6" /> },
      ],
      color: '#722DB6', // Primary
    },
    {
      id: 2,
      title: 'Startups Define Their Needs',
      description: 'Here, startups can pick their intern students by uploading jobs and pick them by conducting assessments and interviews with their company procedures.',
      features: [
        'Smart Job Descriptions',
        'Cultural Preference Tuning'
      ],
      animations: [
        { label: 'Post your job posting', icon: <Zap size={16} color="#10b981" /> },
        { label: 'Let the candidates find you', icon: <TrendingUp size={16} color="#10b981" /> },
        { label: 'Filtering & Eliminating', icon: <ShieldCheck size={16} color="#10b981" /> },
        { label: 'Onboarding', icon: <GraduationCap size={16} color="#10b981" /> },
      ],
      color: '#722DB6', // Primary
    },
    {
      id: 3,
      title: 'ATS-ANALYZER',
      description: 'An Applicant Tracking System is a digital tool that handles a company\'s hiring needs from end to end—from posting a job to onboarding a new employee.',
      features: [
        'ATS - Analyzer',
        'One-click Interview Scheduling'
      ],
      animations: [
        { label: 'Keyword Matching', icon: <Check size={16} color="#10b981" /> },
        { label: 'Resume Scoring & Ranking', icon: <Check size={16} color="#10b981" /> },
        { label: 'Filtering', icon: <Check size={16} color="#10b981" /> },
      ],
      color: '#722DB6', // Primary
    }
  ];

  return (
    <View style={styles.journeySection}>
      <View style={styles.journeyHeader}>
        <View style={styles.journeyBadge}>
          <Text style={styles.journeyBadgeText}>HIRING PIPELINE</Text>
        </View>
        <Text style={styles.journeyTitle}>
          How Thodakkam Connects{'\n'}<Text style={{ color: PRIMARY }}>Builders & Startups</Text>
        </Text>
        <Text style={styles.journeySubtitle}>
          A simple, transparent three-step journey that brings startups and top student talent together through automated AI matching and verified work verification.
        </Text>
      </View>

      <View style={styles.journeyGrid}>
        {steps.map((step, index) => (
          <View key={step.id} style={[styles.journeyStepContainer, isMobile && { flexDirection: 'column' }]}>
            {/* Left Content */}
            <View style={[styles.journeyContentLeft, isMobile && { width: '100%', paddingRight: 0, marginBottom: 40 }]}>
              <View style={[styles.journeyNumber, { backgroundColor: step.color }]}>
                <Text style={styles.journeyNumberText}>{step.id}</Text>
              </View>
              <Text style={styles.journeyStepTitle}>{step.title}</Text>
              <Text style={styles.journeyStepDesc}>{step.description}</Text>
              <View style={styles.journeyFeatures}>
                {step.features.map((feature, fIndex) => (
                  <View key={fIndex} style={styles.journeyFeatureItem}>
                    <View style={[styles.journeyFeatureIcon, { backgroundColor: `${step.color}15` }]}>
                      <CheckCircle2 size={16} color={step.color} />
                    </View>
                    <Text style={styles.journeyFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Right Content */}
            <View style={[styles.journeyContentRight, isMobile && { width: '100%', alignItems: 'center' }]}>
              {step.id === 1 && (
                <View style={[styles.journeyMockupBox, { position: 'relative', height: 320, padding: 0, justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 0, ...Platform.select({web:{boxShadow:'none'}}) }]}>
                  {/* Dashed Connecting Line */}
                  <View style={{ position: 'absolute', top: 40, bottom: 40, left: '50%', width: 2, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' }} />
                  
                  {/* Card 1 */}
                  <Animated.View entering={FadeInUp.delay(200)} style={{ position: 'absolute', top: 20, left: 10, zIndex: 10 }}>
                    <Floating3DCard delayMs={0} intensity={1} style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', width: 200, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }})}}>
                      <Image source={{uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80'}} style={{width: 36, height: 36, borderRadius: 18}} />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ fontWeight: '700', fontSize: 13, color: '#0f172a' }}>Build your profile</Text>
                        <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, marginTop: 4 }} />
                      </View>
                    </Floating3DCard>
                  </Animated.View>

                  {/* Card 2 */}
                  <Animated.View entering={FadeInUp.delay(500)} style={{ position: 'absolute', top: 110, right: 0, zIndex: 10 }}>
                    <Floating3DCard delayMs={400} intensity={0.8} style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', width: 200, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }})}}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3e8ff', alignItems: 'center', justifyContent: 'center' }}>
                        <Briefcase color="#722DB6" size={18} />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ fontWeight: '700', fontSize: 13, color: '#0f172a' }}>Post your projects</Text>
                        <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>E-commerce App</Text>
                      </View>
                    </Floating3DCard>
                  </Animated.View>

                  {/* Card 3 */}
                  <Animated.View entering={FadeInUp.delay(800)} style={{ position: 'absolute', bottom: 30, left: 30, zIndex: 10 }}>
                    <Floating3DCard delayMs={800} intensity={1.2} style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', width: 210, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }})}}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 color="#10b981" size={18} />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ fontWeight: '700', fontSize: 13, color: '#0f172a' }}>Apply for the company</Text>
                      </View>
                    </Floating3DCard>
                  </Animated.View>
                </View>
              )}

              {step.id === 2 && (
                <View style={[styles.journeyMockupBox, { position: 'relative', height: 320, padding: 0, justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 0, ...Platform.select({web:{boxShadow:'none'}}) }]}>
                  {/* Connecting Line */}
                  <View style={{ position: 'absolute', top: 40, bottom: 40, left: '50%', width: 2, backgroundColor: '#e2e8f0' }} />
                  
                  {/* Card 1 */}
                  <Animated.View entering={FadeInUp.delay(200)} style={{ position: 'absolute', top: 20, right: 10, zIndex: 10 }}>
                    <Floating3DCard delayMs={100} intensity={0.9} style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', width: 200, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }})}}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap color="#f59e0b" size={18} />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ fontWeight: '700', fontSize: 13, color: '#0f172a' }}>Post your job posting</Text>
                      </View>
                    </Floating3DCard>
                  </Animated.View>

                  {/* Card 2 */}
                  <Animated.View entering={FadeInUp.delay(500)} style={{ position: 'absolute', top: 110, left: 0, zIndex: 10 }}>
                    <Floating3DCard delayMs={500} intensity={1.1} style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', width: 210, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }})}}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp color="#4f46e5" size={18} />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ fontWeight: '700', fontSize: 13, color: '#0f172a' }}>Let candidates find you</Text>
                      </View>
                    </Floating3DCard>
                  </Animated.View>

                  {/* Card 3 */}
                  <Animated.View entering={FadeInUp.delay(800)} style={{ position: 'absolute', bottom: 30, right: 20, zIndex: 10 }}>
                    <Floating3DCard delayMs={900} intensity={0.8} style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', width: 200, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }})}}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck color="#ef4444" size={18} />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={{ fontWeight: '700', fontSize: 13, color: '#0f172a' }}>Filtering & Eliminating</Text>
                        <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '800', marginTop: 2 }}>Top 5%</Text>
                      </View>
                    </Floating3DCard>
                  </Animated.View>
                </View>
              )}

              {step.id === 3 && (
                <View style={[styles.journeyMockupBox, { position: 'relative', height: 320, padding: 0, justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 0, ...Platform.select({web:{boxShadow:'none'}}) }]}>
                  {/* Central ATS Box */}
                  <Animated.View entering={FadeInUp.delay(200)} style={{ zIndex: 10, width: '100%' }}>
                    <Floating3DCard delayMs={200} intensity={0.6} style={{ backgroundColor: '#ffffff', padding: 24, borderRadius: 24, width: '100%', borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0 15px 40px rgba(0,0,0,0.1)' }})}}>
                      <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                          <Text style={{ fontSize: 20, fontWeight: '800', color: '#3b82f6' }}>97%</Text>
                        </View>
                        <Text style={{ fontWeight: '700', fontSize: 14, color: '#0f172a' }}>Match Accuracy</Text>
                      </View>
                      
                      <View style={{ gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 10 }}>
                          <CheckCircle2 color="#10b981" size={16} />
                          <Text style={{ marginLeft: 10, fontSize: 13, fontWeight: '600', color: '#334155' }}>Keyword Matching</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 10 }}>
                          <CheckCircle2 color="#10b981" size={16} />
                          <Text style={{ marginLeft: 10, fontSize: 13, fontWeight: '600', color: '#334155' }}>Resume Scoring & Ranking</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 10 }}>
                          <CheckCircle2 color="#10b981" size={16} />
                          <Text style={{ marginLeft: 10, fontSize: 13, fontWeight: '600', color: '#334155' }}>Filtering</Text>
                        </View>
                      </View>
                    </Floating3DCard>
                  </Animated.View>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ShowcaseSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.showcaseSection}>
      {/* Item 1 */}
      <View style={[styles.showcaseItem, { marginBottom: 80 }]}>
        <Animated.View entering={FadeInUp.delay(200)} style={[styles.showcaseTextContainer, isMobile && { alignItems: 'center' }]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PROOF OF WORK</Text>
          </View>
          <Text style={[styles.showcaseTitle, isMobile && { fontSize: 28, textAlign: 'center' }]}>
            Ditch Text Resumes. Showcase What You Build.
          </Text>
          <Text style={[styles.showcaseBody, isMobile && { textAlign: 'center' }]}>
            PDF resumes with dry bullet points fail to capture your true potential. Thodakkam allows students to showcase live project repos, Figma files, and working links verified by automated platform assessments.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <Text style={{ color: PRIMARY, fontWeight: '600', fontSize: 14 }}>Learn how to build your profile</Text>
            <ArrowRight size={14} color={PRIMARY} style={{ marginLeft: 4 }} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.showcaseGraphicContainer}>
          <Floating3DCard delayMs={200} intensity={0.7} style={styles.ecommerceCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: '#0f172a' }}>E-Commerce API Integration</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Check size={12} color="#10b981" />
                <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Verified Build</Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: '#64748b', lineHeight: 20, marginBottom: 16 }}>
              Node.js backend with Redis caching layer and Stripe webhooks integrations tested live.
            </Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Star size={12} color="#64748b" />
                <Text style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>42 GitHub Stars</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#64748b' }}>• Deployed on Render</Text>
            </View>
          </Floating3DCard>
        </Animated.View>
      </View>

      {/* Item 2 */}
      <View style={styles.showcaseItem}>
        <Animated.View entering={FadeInUp.delay(200)} style={[styles.showcaseTextContainer, isMobile && { alignItems: 'center' }]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SOURCING EFFICIENCY</Text>
          </View>
          <Text style={[styles.showcaseTitle, isMobile && { fontSize: 28, textAlign: 'center' }]}>
            Zero Sourcing Friction. Full Candidate Clarity.
          </Text>
          <Text style={[styles.showcaseBody, isMobile && { textAlign: 'center' }]}>
            No more scheduling phone calls just to check basic qualifications. Thodakkam's AI pre-screens resumes, evaluates technical portfolios, and validates skills parameters automatically, providing shortlists in minutes.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <Text style={{ color: PRIMARY, fontWeight: '600', fontSize: 14 }}>Schedule a platform demo</Text>
            <ArrowRight size={14} color={PRIMARY} style={{ marginLeft: 4 }} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.showcaseGraphicContainer}>
          <Floating3DCard delayMs={400} intensity={0.7} style={styles.ecommerceCard}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#0f172a', marginBottom: 20 }}>AI Screening Insights</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500' }}>Framework Experience</Text>
              <Text style={{ fontSize: 13, color: PRIMARY, fontWeight: '700' }}>React (2+ Years)</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500' }}>Test Coverage Quality</Text>
              <Text style={{ fontSize: 13, color: '#10b981', fontWeight: '700' }}>94% Verified</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}>
              <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500' }}>Database Familiarity</Text>
              <Text style={{ fontSize: 13, color: PRIMARY, fontWeight: '700' }}>PostgreSQL, Redis</Text>
            </View>

          </Floating3DCard>
        </Animated.View>
      </View>
    </View>
  );
}

function StatsSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  const stats = [
    { number: '6+', label: 'AMBITIOUS STUDENTS' },
    { number: '3+', label: 'HIGH-GROWTH STARTUPS' },
    { number: '14 Days', label: 'AVG. TIME-TO-HIRE' },
    { number: '92%', label: 'SUCCESS MATCHING RATE' }
  ];

  return (
    <View style={[styles.statsSection, { flexWrap: 'wrap', gap: 0, justifyContent: 'center', maxWidth: 800, paddingVertical: 40, position: 'relative' }]}>
      
      {/* Horizontal glowing line */}
      <View style={{
        position: 'absolute',
        left: '5%',
        right: '5%',
        top: '50%',
        height: 2,
        backgroundColor: '#E2CDF3',
        ...Platform.select({
          web: { boxShadow: '0 0 10px #E2CDF3, 0 0 20px #E2CDF3' },
          default: { shadowColor: '#E2CDF3', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 15, elevation: 10 }
        })
      }} />
      
      {/* Vertical glowing line */}
      <View style={{
        position: 'absolute',
        top: '5%',
        bottom: '5%',
        left: '50%',
        width: 2,
        backgroundColor: '#E2CDF3',
        ...Platform.select({
          web: { boxShadow: '0 0 10px #E2CDF3, 0 0 20px #E2CDF3' },
          default: { shadowColor: '#E2CDF3', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 15, elevation: 10 }
        })
      }} />

      {stats.map((stat, i) => (
        <View 
          key={i} 
          style={[
            styles.statBox, 
            { 
              width: '50%', 
              paddingVertical: isMobile ? 30 : 40,
              paddingHorizontal: 10,
            }
          ]}
        >
          <Text style={[styles.statNumber, isMobile && { fontSize: 36 }]}>{stat.number}</Text>
          <Text style={[styles.statLabel, { textAlign: 'center' }, isMobile && { fontSize: 10 }]}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

function CTASection() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.ctaSection}>
      <Animated.View entering={FadeInUp.delay(200)} style={{ alignItems: 'center' }}>
        <Text style={[styles.ctaTitle, isMobile && { fontSize: 28, lineHeight: 36 }]}>
          Join the Future of <Text style={{ color: '#b24bf3' }}>Startup Hiring Today</Text>
        </Text>
        <Text style={[styles.ctaSubtitle, isMobile && { fontSize: 13, lineHeight: 22 }]}>
          Whether you're ready to hire high-growth student talent in minutes or land your first startup role with verified proof of work, Thodakkam has you covered.
        </Text>
      </Animated.View>

      <View style={[styles.ctaCardsContainer, isMobile && { flexDirection: 'column' }]}>
        {/* Startup Card */}
        <Animated.View entering={FadeInUp.delay(400)} style={[styles.ctaCard, isMobile && { width: '100%' }]}>
          <View style={styles.ctaIconBox}>
            <Briefcase size={24} color="#722DB6" />
          </View>
          <Text style={styles.ctaCardTitle}>For Startups</Text>
          <Text style={styles.ctaCardDesc}>Post vetting-backed jobs and hire top talent in minutes.</Text>
          
          <Pressable 
            style={({ pressed }) => [styles.ctaPrimaryBtn, pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 }]} 
            onPress={() => router.push('/startup-register')}
          >
            <Text style={styles.ctaPrimaryBtnText}>Post a Job (Hire)</Text>
          </Pressable>
          <Pressable 
            style={({ pressed }) => [styles.ctaSecondaryBtn, pressed && { transform: [{ scale: 0.96 }], opacity: 0.7 }]} 
            onPress={() => router.push('/startup-login')}
          >
            <Text style={styles.ctaSecondaryBtnText}>Startup Login</Text>
          </Pressable>
        </Animated.View>

        {/* Student Card */}
        <Animated.View entering={FadeInUp.delay(600)} style={[styles.ctaCard, isMobile && { width: '100%' }]}>
          <View style={styles.ctaIconBox}>
            <GraduationCap size={24} color="#722DB6" />
          </View>
          <Text style={styles.ctaCardTitle}>For Students</Text>
          <Text style={styles.ctaCardDesc}>Verify your proof of work and secure your dream internship.</Text>
          
          <Pressable 
            style={({ pressed }) => [styles.ctaPrimaryBtn, { backgroundColor: '#b24bf3' }, pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 }]} 
            onPress={() => router.push('/register')}
          >
            <Text style={styles.ctaPrimaryBtnText}>Join Free (Intern)</Text>
          </Pressable>
          <Pressable 
            style={({ pressed }) => [styles.ctaSecondaryBtn, pressed && { transform: [{ scale: 0.96 }], opacity: 0.7 }]} 
            onPress={() => router.push('/login')}
          >
            <Text style={styles.ctaSecondaryBtnText}>Student Login</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const SUCCESS_STORIES = [
  {
    id: 1,
    name: 'Shabari',
    role: 'UI/UX Designer at Echo Digitals',
    text: "As a UI/UX designer, having a platform that understands design portfolios and connects me with the right startups has been a massive boost to my career.",
    avatar: require('../../assets/images/shabari.png'),
  },
  {
    id: 2,
    name: 'Poovarasan S',
    role: 'Full Stack Developer at Echo Digitals',
    text: "Becoming a full stack developer at Echo Digitals was a dream come true. The AI matching perfectly aligned my skills with their requirements. I had an offer in less than a week!",
    avatar: require('../../assets/images/poovarasan.jpeg'),
  },
  {
    id: 3,
    name: 'Mukesh A',
    role: 'Full Stack Developer at Echo Digitals',
    text: "Echo Digitals is the perfect place to grow as a full stack developer. The quality of vetted opportunities on this platform is miles ahead of traditional job boards.",
    avatar: require('../../assets/images/mukesh.jpeg'),
  },

  {
    id: 6,
    name: 'Vishnuvardhan K',
    role: 'App developer at Echo Digitals',
    text: "Building scalable and performant apps has been an incredible journey. The platform enabled me to connect with visionary startups and showcase my mobile app development skills.",
    avatar: require('../../assets/images/vishnuvardhan.jpeg'),
  },
  {
    id: 7,
    name: 'Selva P',
    role: 'App developer at Echo Digitals',
    text: "This platform changed how I found opportunities as an App developer. The AI-driven process highlighted my strengths, helping me land a high-impact role swiftly.",
    avatar: require('../../assets/images/selva.jpeg'),
  }
];

function SuccessStoriesSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [activeIndex, setActiveIndex] = useState(0);

  const continuousIndex = React.useRef(0);
  const indicatorAngle = useSharedValue(-90);
  const indicatorWidth = useSharedValue(120 - 26);

  const ripple1 = useSharedValue(0);
  const ripple2 = useSharedValue(0);

  React.useEffect(() => {
    ripple1.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    setTimeout(() => {
      ripple2.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    }, 1500);

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % SUCCESS_STORIES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    let currentMod = continuousIndex.current % 5;
    if (currentMod < 0) currentMod += 5;
    
    if (activeIndex === 0 && currentMod === 4) {
       continuousIndex.current += 1;
    } else if (activeIndex === 4 && currentMod === 0) {
       continuousIndex.current -= 1;
    } else {
       continuousIndex.current += (activeIndex - currentMod);
    }

    const targetAngle = -90 + continuousIndex.current * 72;
    const targetRadius = (activeIndex % 2 === 0 ? 90 : 140) - 26;

    indicatorAngle.value = withTiming(targetAngle, { duration: 800, easing: Easing.out(Easing.back(1.2)) });
    indicatorWidth.value = withTiming(targetRadius, { duration: 800, easing: Easing.out(Easing.back(1.2)) });
  }, [activeIndex]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const w = indicatorWidth.value;
    return {
      width: w,
      transform: [
        { translateX: -(w / 2) },
        { rotate: `${indicatorAngle.value}deg` },
        { translateX: w / 2 }
      ]
    };
  });

  const animatedRippleStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ripple1.value * 8 }],
    opacity: 0.4 * (1 - ripple1.value),
  }));

  const animatedRippleStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ripple2.value * 8 }],
    opacity: 0.4 * (1 - ripple2.value),
  }));

  const activeStory = SUCCESS_STORIES[activeIndex];

  return (
    <View style={styles.successSection}>
      <Text style={styles.successTitle}>Success Stories</Text>
      <Text style={styles.successSubtitle}>
        Hear directly from the students using Thodakkam to launch their careers.
      </Text>

      <View style={[styles.successContent, isMobile && { flexDirection: 'column' }]}>
        <View style={styles.successOrbitContainer}>
           <View style={styles.successOrbitRing1} />
           <View style={styles.successOrbitRing2} />

           {/* Radar scanning ripples */}
           <Animated.View style={[{
             position: 'absolute',
             width: 48,
             height: 48,
             borderRadius: 24,
             backgroundColor: PRIMARY,
             zIndex: 5,
           }, animatedRippleStyle1]} />
           <Animated.View style={[{
             position: 'absolute',
             width: 48,
             height: 48,
             borderRadius: 24,
             backgroundColor: PRIMARY,
             zIndex: 5,
           }, animatedRippleStyle2]} />

           <View style={styles.successOrbitCenter}>
             <Star size={24} color="#fff" />
           </View>

           {/* The animated pointing line */}
           <Animated.View style={[{
             position: 'absolute',
             left: 160,
             top: 159,
             height: 2,
             backgroundColor: PRIMARY,
             zIndex: 8,
             opacity: 0.6,
           }, animatedIndicatorStyle]} />

           {SUCCESS_STORIES.map((story, i) => {
             const isActive = i === activeIndex;
             const angle = (i / SUCCESS_STORIES.length) * Math.PI * 2 - Math.PI / 2;
             const radius = i % 2 === 0 ? 90 : 140;
             const x = Math.cos(angle) * radius;
             const y = Math.sin(angle) * radius;
             
             return (
               <View 
                 key={story.id}
                 style={{ position: 'absolute', transform: [{ translateX: x }, { translateY: y }], zIndex: isActive ? 15 : 5 }}
               >
                 <View style={[
                   styles.successAvatarWrapper,
                   { position: 'relative' },
                   isActive && { borderColor: PRIMARY, borderWidth: 2, transform: [{ scale: 1.2 }] }
                 ]}>
                   <Pressable onPress={() => setActiveIndex(i)} style={{ width: '100%', height: '100%' }}>
                     <ExpoImage source={typeof story.avatar === 'string' ? { uri: story.avatar } : story.avatar} style={styles.successAvatar} contentFit="cover" />
                   </Pressable>
                 </View>
               </View>
             );
           })}
        </View>

        <Animated.View key={activeIndex} entering={FadeIn.duration(400)} style={styles.successCard}>
          <View style={styles.successCardBadge}>
            <Star size={12} color="#722DB6" fill="#722DB6" />
            <Text style={styles.successCardBadgeText}>SUCCESS STORY</Text>
          </View>
          <Text style={styles.successQuote}>"{activeStory.text}"</Text>
          
          <View style={styles.successAuthorRow}>
            <ExpoImage source={typeof activeStory.avatar === 'string' ? { uri: activeStory.avatar } : activeStory.avatar} style={styles.successAuthorAvatar} contentFit="cover" />
            <View>
              <Text style={styles.successAuthorName}>{activeStory.name}</Text>
              <Text style={styles.successAuthorRole}>{activeStory.role}</Text>
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                {[1,2,3,4,5].map(star => <Star key={star} size={10} color="#f59e0b" fill="#f59e0b" />)}
              </View>
            </View>
          </View>

          <View style={styles.successDots}>
            {SUCCESS_STORIES.map((_, i) => (
              <Pressable key={i} onPress={() => setActiveIndex(i)}>
                <View style={[styles.successDot, i === activeIndex && styles.successDotActive]} />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const TYPEWRITER_STRINGS = [
  "Creative Founders.",
  "Next-Gen Unicorns.",
  "Fast-Growing Startups.",
  "Future Innovators."
];

function TypewriterText({ strings }: { strings: string[] }) {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const i = loopNum % strings.length;
    const fullText = strings[i];

    if (isDeleting) {
      timeout = setTimeout(() => {
        setText(fullText.substring(0, text.length - 1));
      }, 50);
    } else {
      timeout = setTimeout(() => {
        setText(fullText.substring(0, text.length + 1));
      }, 100);
    }

    if (!isDeleting && text === fullText) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setLoopNum((prev) => prev + 1);
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, loopNum, strings]);

  const [cursorVisible, setCursorVisible] = useState(true);
  React.useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={{ color: PRIMARY }}>
      {text}
      <Text style={{ opacity: cursorVisible ? 1 : 0 }}>|</Text>
    </Text>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const isMobile = width < 768;

  const player = useVideoPlayer(require('../../assets/images/background-video.mp4'), (player: any) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Top Navigation / Logo */}
        <Animated.View entering={FadeInDown.duration(800).delay(100)} style={{ width: '100%', maxWidth: 1200, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 10 }}>
          <Image source={require('../../assets/images/Thodakkam logo.png')} style={{ width: 64, height: 64, marginRight: 16 }} resizeMode="contain" />
          <Text style={{ fontSize: 38, fontWeight: '900', color: '#9333ea', letterSpacing: -1 }}>Thodakkam</Text>
        </Animated.View>

        {/* Header / Hero Section */}
        <View style={[styles.heroWrapper, !isMobile && { minHeight: height }]}>
          <Animated.View style={styles.heroAnimationContainer} entering={FadeIn.duration(1000)}>
            {/* Background video */}
            {Platform.OS === 'web' ? (
              <video
                src={require('../../assets/images/background-video.mp4')}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                }}
              />
            ) : (
              <VideoView
                style={styles.heroAnimation}
                player={player}
                nativeControls={false}
                contentFit="cover"
              />
            )}
            {/* Frosted glass overlay to properly blend the background and pop the text */}
            <View style={styles.overlay} />
          </Animated.View>

          <Animated.View style={styles.heroContent} entering={FadeInDown.duration(1000).springify()}>
            <View style={styles.badge}>
              <Sparkles size={16} color={PRIMARY} />
              <Text style={[styles.badgeText, isMobile && { fontSize: 12 }]}>Powered by Echo Digital Works</Text>
            </View>
            <Text style={[
              styles.heroTitle, 
              isMobile && { fontSize: 32, lineHeight: 40 },
              { minHeight: isMobile ? 120 : 192 } // Pre-allocate height for up to 3 lines to prevent jumping
            ]}>
              Where Ambitious{'\n'}Students Meet <TypewriterText strings={TYPEWRITER_STRINGS} />
            </Text>
            <View style={[styles.glassTextContainer, isMobile && { padding: 12 }]}>
              <Text style={[styles.heroSubtitle, isMobile && { fontSize: 14, lineHeight: 22 }]}>
                India's AI-powered hiring ecosystem by Echo Digital Works. Startups discover verified student talent in minutes, while students build real-world proof of work and land high-growth internship roles.
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Feature Section: AI Matching */}
        <FeatureSection />

        {/* Trusted By Section */}
        <TrustedSection />

        {/* Supercharge Section */}
        <SuperchargeSection />

        {/* Operations Section */}
        <OperationsSection />

        {/* Journey Section */}
        <JourneySection />

        {/* Showcase & Stats Sections */}
        <ShowcaseSection />
        <StatsSection />
        <CTASection />

        {/* Success Stories Section */}
        <SuccessStoriesSection />

        {/* Footer */}
        <Animated.View style={styles.footer} entering={FadeInUp.delay(1000).duration(800)}>
          <Text style={styles.footerText}>© 2026 Thodakkam. All rights reserved.</Text>
        </Animated.View>

        {/* Spacer to ensure content isn't hidden behind the fixed bottom bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Tab Bar */}
      <View style={styles.fixedBottomNav}>
        <FloatingNavBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20, // Reduced from 60 to fit TopNav comfortably
    paddingBottom: 40,
    alignItems: 'center',
  },
  topNavContainer: {
    width: '100%',
    maxWidth: 1200,
    marginBottom: 40,
    marginTop: 10,
    ...Platform.select({
      web: {
        alignItems: 'center',
      }
    })
  },
  topNavScroll: {
    flexGrow: 1,
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start',
    gap: 8,
    paddingHorizontal: 10,
  },
  topNavLinkWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  topNavLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155', // Slate color matching reference
  },
  heroWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 80,
    width: '100%',
    paddingVertical: 80,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 800,
    zIndex: 2,
    paddingHorizontal: 20,
  },
  heroAnimationContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  }, 
  heroAnimation: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${PRIMARY}15`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  badgeText: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  heroTitle: {
    fontSize: Platform.OS === 'web' ? 56 : 40,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: Platform.OS === 'web' ? 64 : 48,
    marginBottom: 20,
  },
  glassTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }
    }),
  },
  heroSubtitle: {
    fontSize: Platform.OS === 'web' ? 20 : 16,
    color: '#334155', // Darker for better contrast against the blend
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 600,
  },
  featureSection: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 80,
    backgroundColor: '#ffffff',
  },
  featureBadge: {
    backgroundColor: `${PRIMARY}15`,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${PRIMARY}30`,
  },
  featureBadgeText: {
    color: PRIMARY,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  featureHeading: {
    fontSize: Platform.OS === 'web' ? 48 : 36,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 24,
  },
  featureSubtext: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 26,
    marginBottom: 80,
  },
  orbitContainer: {
    position: 'relative',
    width: 460,
    height: 460,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 60,
  },
  orbitRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 230,
  },
  orbitCenterImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  orbitNode: {
    position: 'absolute',
    top: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    borderWidth: 4,
    borderColor: '#f8fafc',
  },
  floatingCard: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: 220,
    ...Platform.select({
      ios: { shadowColor: PRIMARY_DARK, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24 },
      android: { elevation: 8 },
      web: { boxShadow: `0 12px 30px rgba(90, 39, 155, 0.1)` }
    }),
  },
  floatingBadge: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)' }
    }),
  },
  trustedSection: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 60,
    paddingBottom: 80,
    backgroundColor: '#ffffff',
  },
  trustedHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#64748b',
    marginBottom: 32,
  },
  trustedScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  trustedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }
    }),
  },
  trustedCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  fixedBottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  floatingNavContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
  },
  navBar: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'rgba(248, 250, 252, 0.75)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }
    }),
    paddingHorizontal: 30,
    paddingVertical: Platform.OS === 'ios' ? 16 : 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8, // Safe area padding
    justifyContent: 'center',
    gap: 80,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    boxShadow: '0 -4px 15px rgba(0, 0, 0, 0.2)',
    elevation: 16,
  },
  navIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: 0 }, { scale: 1 }], // Default state for animation
    ...Platform.select({
      web: {
        transitionDuration: '0.3s',
        transitionProperty: 'all',
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy spring effect
      }
    }),
  },
  tooltipBubble: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 90, // Positioned above the full-width nav bar
    backgroundColor: '#ffffff', // Clean white bubble
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: 280,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  tooltipDesc: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ffffff', // Matches tooltip bubble
  },
  footer: {
    marginTop: 80,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  operationsSection: {
    paddingVertical: 100,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  operationsHeader: {
    alignItems: 'center',
    maxWidth: 800,
    marginBottom: 60,
  },
  operationsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3e8ff',
  },
  operationsBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c084fc',
    marginRight: 8,
  },
  operationsBadgeText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  operationsTitle: {
    fontSize: Platform.OS === 'web' ? 42 : 32,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: Platform.OS === 'web' ? 52 : 40,
    letterSpacing: -1,
  },
  operationsSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 600,
  },
  operationsGrid: {
    position: 'relative',
    height: 440,
    width: '100%',
    maxWidth: 1100,
    marginTop: 20,
  },
  operationsCard: {
    position: 'absolute',
    left: '50%',
    top: 20,
    width: 320,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      web: { transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)' }
    })
  },
  carouselArrowLeft: {
    position: 'absolute',
    top: 180, // Vertically centered within the 400px card
    left: '50%',
    marginLeft: -230, // Perfectly mathematically centered in the 116px visible sliver of the side card
    zIndex: 20,
    elevation: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
    })
  },
  carouselArrowRight: {
    position: 'absolute',
    top: 180, // Vertically centered within the 400px card
    right: '50%',
    marginRight: -230, // Perfectly mathematically centered in the 116px visible sliver of the side card
    zIndex: 20,
    elevation: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
    })
  },
  opIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  opCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  opCardDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 32,
    flex: 1,
  },
  opWidget: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 16,
    elevation: 2,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }
    }),
  },
  opWidgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  opWidgetIndicator: {
    width: 3,
    height: 16,
    borderRadius: 2,
    marginRight: 10,
  },
  opWidgetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  opApprovedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  opApprovedText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  opActionBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  opStatLabel: {
    fontSize: 10,
    color: '#64748b',
    width: 80,
    lineHeight: 14,
  },
  opProgressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  opProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  opStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  opLogText: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
    marginBottom: 6,
  },
  opLogTime: {
    color: '#a855f7',
    fontWeight: '600',
  },
  journeySection: {
    paddingVertical: 100,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    width: '100%',
  },
  journeyHeader: {
    alignItems: 'center',
    maxWidth: 800,
    marginBottom: 80,
  },
  journeyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3e8ff',
  },
  journeyBadgeText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  journeyTitle: {
    fontSize: Platform.OS === 'web' ? 42 : 32,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: Platform.OS === 'web' ? 52 : 40,
    letterSpacing: -1,
  },
  journeySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 700,
  },
  journeyGrid: {
    width: '100%',
    maxWidth: 1000,
    gap: 80,
  },
  journeyStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  journeyContentLeft: {
    width: '45%',
    paddingRight: 40,
  },
  journeyNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(114, 45, 182, 0.2)' }
    })
  },
  journeyNumberText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  journeyStepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  journeyStepDesc: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 26,
    marginBottom: 24,
  },
  journeyFeatures: {
    gap: 16,
  },
  journeyFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyFeatureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  journeyFeatureText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  journeyContentRight: {
    width: '45%',
    alignItems: 'flex-start',
  },
  journeyMockupBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
    ...Platform.select({
      web: { boxShadow: '0 20px 40px rgba(0,0,0,0.04)' }
    })
  },
  journeyAnimItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }
    })
  },
  journeyAnimIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  journeyAnimText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  showcaseSection: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingVertical: 80,
    gap: 80,
  },
  showcaseItem: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 32,
  },
  showcaseTextContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  showcaseTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 16,
    lineHeight: 44,
  },
  showcaseBody: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 26,
    maxWidth: 600,
  },
  showcaseGraphicContainer: {
    width: '100%',
    alignItems: 'center',
  },
  ecommerceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 600,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    ...Platform.select({ web: { boxShadow: '0 20px 40px rgba(114, 45, 182, 0.05)' }})
  },
  statsSection: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 60,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 40,
    marginBottom: 80,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#722DB6', // PRIMARY
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
  },
  ctaSection: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  ctaTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 26,
    marginBottom: 60,
  },
  ctaCardsContainer: {
    flexDirection: 'row',
    gap: 30,
    width: '100%',
    justifyContent: 'center',
  },
  ctaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 40,
    width: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({ web: { boxShadow: '0 20px 60px rgba(178, 75, 243, 0.15)' } })
  },
  ctaIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({ web: { boxShadow: '0 10px 20px rgba(90, 39, 155, 0.3)' } })
  },
  ctaCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  ctaCardDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  ctaPrimaryBtn: {
    backgroundColor: '#5A279B',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  ctaSecondaryBtn: {
    backgroundColor: '#ffffff',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#b24bf3',
  },
  ctaSecondaryBtnText: {
    color: '#b24bf3',
    fontSize: 14,
    fontWeight: '700',
  },
  successSection: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingVertical: 80, alignItems: 'center' },
  successTitle: { fontSize: Platform.OS === 'web' ? 42 : 32, fontWeight: '800', color: '#0f172a', marginBottom: 12, textAlign: 'center', letterSpacing: -1 },
  successSubtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 60, maxWidth: 600, lineHeight: 24 },
  successContent: { flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 60 },
  successOrbitContainer: { width: 320, height: 320, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  successOrbitRing1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  successOrbitRing2: { position: 'absolute', width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  successOrbitCenter: { width: 48, height: 48, borderRadius: 24, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', zIndex: 10, ...Platform.select({ web: { boxShadow: `0 0 20px rgba(114, 45, 182, 0.4)` } }) },
  successAvatarWrapper: { position: 'absolute', width: 48, height: 48, borderRadius: 24, padding: 3, backgroundColor: '#ffffff', zIndex: 5, ...Platform.select({ web: { transition: 'all 0.3s ease' }}) },
  successAvatar: { width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden' },
  successCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 40, width: '100%', maxWidth: 500, borderWidth: 1, borderColor: '#f1f5f9', ...Platform.select({ web: { boxShadow: '0 20px 40px rgba(0,0,0,0.05)' } }) },
  successCardBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#faf5ff', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#f3e8ff' },
  successCardBadgeText: { color: PRIMARY, fontSize: 10, fontWeight: '800', marginLeft: 6, letterSpacing: 0.5 },
  successQuote: { fontSize: 18, color: '#1e293b', lineHeight: 28, fontWeight: '500', marginBottom: 32 },
  successAuthorRow: { flexDirection: 'row', alignItems: 'center' },
  successAuthorAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 16, overflow: 'hidden' },
  successAuthorName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  successAuthorRole: { fontSize: 12, color: '#64748b', marginTop: 2 },
  successDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, gap: 8 },
  successDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#cbd5e1', ...Platform.select({ web: { transition: 'all 0.3s ease' } }) },
  successDotActive: { width: 24, backgroundColor: PRIMARY },
});
