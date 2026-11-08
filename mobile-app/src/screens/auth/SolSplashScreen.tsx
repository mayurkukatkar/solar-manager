import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  StatusBar,
} from 'react-native';
import { GuideCharacter } from '../../components/GuideCharacter';
import { GridBackground } from '../../components/common/GridBackground';
import { useTheme } from '../../theme';

interface SolSplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export const SolSplashScreen: React.FC<SolSplashScreenProps> = ({
  onFinish,
  durationMs = 2200,
}) => {
  const { colors, isDark } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(20)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance animation sequence
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Delayed brand title reveal
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(brandTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 3. Auto-finish callback after duration
    if (onFinish) {
      const timer = setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }, durationMs);

      return () => clearTimeout(timer);
    }
  }, [scaleAnim, opacityAnim, brandTranslateY, brandOpacity, onFinish, durationMs]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.background : '#FFFFFF',
          opacity: opacityAnim,
        },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      {/* Background Engineering Square Grid */}
      <GridBackground isDark={isDark} />

      <View style={styles.centerStage}>
        {/* Animated Brand Mascot */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
        >
          <GuideCharacter
            pose="wave"
            size={110}
            speechText="Welcome to Solar OS!"
            animated={true}
          />
        </Animated.View>

        {/* Brand Lockup */}
        <Animated.View
          style={[
            styles.brandLockup,
            {
              opacity: brandOpacity,
              transform: [{ translateY: brandTranslateY }],
            },
          ]}
        >
          <View style={styles.brandRow}>
            <View style={[styles.logoBox, { borderColor: isDark ? colors.border : '#E2E8F0' }]}>
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={[styles.brandTitle, { color: isDark ? colors.text : '#0F172A' }]}>
                WhereReady
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.osBadge}>
                  <Text style={styles.osBadgeText}>SOLAR OS</Text>
                </View>
                <Text style={styles.versionText}>FIELD COMPANION</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.tagline, { color: isDark ? colors.textSecondary : '#64748B' }]}>
            Where Growth Gets Ready.
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Energizing Indicator */}
      <View style={styles.bottomFooter}>
        <View style={styles.pulseDot} />
        <Text style={styles.footerText}>Energizing Solar Workspaces...</Text>
      </View>
    </Animated.View>
  );
};

export default SolSplashScreen;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLockup: {
    alignItems: 'center',
    marginTop: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  osBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  osBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  versionText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    letterSpacing: 0.2,
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
});
