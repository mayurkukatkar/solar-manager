import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme';
import { GuideCharacter } from './GuideCharacter';
import { GridBackground } from './common/GridBackground';

const LOADING_MESSAGES = [
  'Calibrating solar arrays...',
  'Syncing project telemetry...',
  'Aligning photovoltaic circuits...',
  'Preparing EPC field workspace...',
  'Energizing WhereReady Solar OS...',
];

interface SolLoadingScreenProps {
  message?: string;
  subtext?: string;
}

export const SolLoadingScreen: React.FC<SolLoadingScreenProps> = ({
  message,
  subtext = 'Where Growth Gets Ready.',
}) => {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const [messageIndex, setMessageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0.15)).current;

  // Cycle through engaging solar loading messages
  useEffect(() => {
    if (message) return;

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();

      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2400);

    return () => clearInterval(interval);
  }, [fadeAnim, message]);

  // Smooth pulsating progress bar animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 0.85,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0.35,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [progressAnim]);

  const currentMessage = message || LOADING_MESSAGES[messageIndex];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
      {/* Background Engineering Square Grid */}
      <GridBackground isDark={isDark} />

      <View style={styles.content}>
        {/* Animated Brand Ambassador Mascot */}
        <GuideCharacter
          pose="wave"
          size={84}
          speechText="Solar OS"
          animated={true}
        />

        {/* Dynamic Loading Message */}
        <Animated.View style={[styles.textWrapper, { opacity: fadeAnim }]}>
          <Text style={[styles.title, { color: isDark ? colors.text : '#0F172A' }]}>
            {currentMessage}
          </Text>
        </Animated.View>

        {/* Sleek Solar Progress Bar */}
        <View style={[styles.progressBarTrack, { backgroundColor: isDark ? colors.surfaceRecessed : '#F1F5F9' }]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Subtext / Tagline */}
        <Text style={[styles.subtext, { color: isDark ? colors.textMuted : '#94A3B8' }]}>
          {subtext}
        </Text>
      </View>
    </View>
  );
};

export default SolLoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    maxWidth: 360,
    width: '100%',
  },
  textWrapper: {
    marginTop: 22,
    marginBottom: 16,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  progressBarTrack: {
    width: 140,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  subtext: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});

