import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Animated,
  Easing,
} from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Ellipse,
  Circle,
  Path,
  Rect,
  Line,
  G,
} from 'react-native-svg';

export type CharacterPose =
  | 'wave'
  | 'point-right'
  | 'inspect'
  | 'celebrate'
  | 'guide'
  | 'mini';

export interface GuideCharacterProps {
  pose?: CharacterPose;
  size?: number;
  speechText?: string;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const GuideCharacter: React.FC<GuideCharacterProps> = ({
  pose = 'wave',
  size = 68,
  speechText,
  animated = true,
  style,
}) => {
  // Float Animation (Buoyant hover)
  const floatAnim = useRef(new Animated.Value(0)).current;
  // Shadow Scale Animation (Synchronized counter-motion)
  const shadowScaleAnim = useRef(new Animated.Value(1)).current;
  // Speech Bubble Pop-in
  const bubbleScaleAnim = useRef(new Animated.Value(0.85)).current;
  const bubbleOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    // Continuous floating hover loop
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: -5,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(shadowScaleAnim, {
            toValue: 0.9,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: 2,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(shadowScaleAnim, {
            toValue: 1.05,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    floatLoop.start();

    return () => {
      floatLoop.stop();
    };
  }, [animated, floatAnim, shadowScaleAnim]);

  useEffect(() => {
    if (speechText) {
      bubbleScaleAnim.setValue(0.8);
      bubbleOpacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(bubbleScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleOpacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [speechText, bubbleScaleAnim, bubbleOpacityAnim]);

  return (
    <View style={[styles.container, style]}>
      {/* Speech / Thought Bubble */}
      {speechText ? (
        <Animated.View
          style={[
            styles.speechContainer,
            {
              opacity: animated ? bubbleOpacityAnim : 1,
              transform: [{ scale: animated ? bubbleScaleAnim : 1 }],
            },
          ]}
        >
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>{speechText}</Text>
          </View>
          <View style={styles.speechTail} />
        </Animated.View>
      ) : null}

      {/* 2D Original Vector Character (WhereReady Solar Guide) */}
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {/* Animated Floating Character */}
        <Animated.View
          style={{
            width: size,
            height: size,
            transform: [{ translateY: animated ? floatAnim : 0 }],
          }}
        >
          <Svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            fill="none"
          >
            <Defs>
              {/* Subtle Ambient Radial Glow */}
              <RadialGradient id="guideGlow" cx="60" cy="60" r="50" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#93C5FD" stopOpacity="0.38" />
                <Stop offset="1" stopColor="#93C5FD" stopOpacity="0" />
              </RadialGradient>

              {/* WhereReady Blue Gradient */}
              <LinearGradient id="guideBodyGrad" x1="40" y1="50" x2="80" y2="105" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#3B82F6" />
                <Stop offset="1" stopColor="#1D4ED8" />
              </LinearGradient>

              {/* Solar Yellow Visor / Sun Beam Accent */}
              <LinearGradient id="guideSunGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#FDE68A" />
                <Stop offset="1" stopColor="#F59E0B" />
              </LinearGradient>
            </Defs>

            {/* Head Halo / Glow */}
            <Circle cx={60} cy={55} r={42} fill="url(#guideGlow)" />

            {/* 1. Character Body (Rounded Approachable Silhouette) */}
            <Path
              d="M 40 68 C 40 56, 80 56, 80 68 L 84 96 C 84 102, 36 102, 36 96 Z"
              fill="url(#guideBodyGrad)"
              stroke="#0F172A"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />

            {/* White Collar / Chest Harness */}
            <Path
              d="M 48 64 L 60 76 L 72 64"
              stroke="#FFFFFF"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Solar Core Badge (Small Solar-Yellow Accent) */}
            <Circle cx={60} cy={84} r={6} fill="url(#guideSunGrad)" stroke="#B45309" strokeWidth={1.5} />
            <Circle cx={60} cy={84} r={2.5} fill="#FFFFFF" />

            {/* 2. Character Head (Smooth Rounded Dome) */}
            <Rect
              x={38}
              y={24}
              width={44}
              height={40}
              rx={20}
              fill="#FFFFFF"
              stroke="#0F172A"
              strokeWidth={2.5}
            />

            {/* Solar-Yellow Guide Cap / Top Visor (Solar Accent) */}
            <Path
              d="M 38 40 C 38 27, 82 27, 82 40 Z"
              fill="url(#guideSunGrad)"
              stroke="#0F172A"
              strokeWidth={2}
            />

            {/* Antenna / Sun ray beacon */}
            <Line x1={60} y1={24} x2={60} y2={15} stroke="#0F172A" strokeWidth={2.5} strokeLinecap="round" />
            <Circle cx={60} cy={13} r={3.5} fill="#F59E0B" stroke="#0F172A" strokeWidth={1.5} />

            {/* Minimal Approachable Facial Features */}
            {/* Left Eye */}
            <Ellipse cx={50} cy={46} rx={3.5} ry={4.5} fill="#0F172A" />
            <Circle cx={48.5} cy={44.5} r={1.2} fill="#FFFFFF" />
            {/* Right Eye */}
            <Ellipse cx={70} cy={46} rx={3.5} ry={4.5} fill="#0F172A" />
            <Circle cx={68.5} cy={44.5} r={1.2} fill="#FFFFFF" />

            {/* Gentle Friendly Smile */}
            <Path
              d="M 54 53 Q 60 58 66 53"
              stroke="#0F172A"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />

            {/* Cheerful Blush Accents */}
            <Circle cx={43} cy={51} r={3} fill="#FCA5A5" fillOpacity={0.45} />
            <Circle cx={77} cy={51} r={3} fill="#FCA5A5" fillOpacity={0.45} />

            {/* 3. Pose-Specific Arms & Gestures */}

            {/* POSE A: WAVE */}
            {pose === 'wave' && (
              <G>
                {/* Left resting arm */}
                <Path
                  d="M 39 70 Q 30 82 34 94"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                <Circle cx={34} cy={94} r={4} fill="#FFFFFF" stroke="#0F172A" strokeWidth={2} />

                {/* Right waving arm */}
                <G>
                  <Path
                    d="M 81 70 Q 94 56 98 42"
                    stroke="#0F172A"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Friendly open waving palm */}
                  <Circle cx={98} cy={42} r={5} fill="#FFFFFF" stroke="#0F172A" strokeWidth={2} />
                  {/* Wave motion sparkle */}
                  <Path
                    d="M 106 38 L 109 35 M 104 31 L 105 27 M 99 29 L 97 26"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </G>
              </G>
            )}

            {/* POSE B: POINT RIGHT */}
            {pose === 'point-right' && (
              <G>
                <Path
                  d="M 39 70 Q 30 80 34 92"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                <Circle cx={34} cy={92} r={4} fill="#FFFFFF" stroke="#0F172A" strokeWidth={2} />
                <Path
                  d="M 81 70 L 108 66"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                <Rect x={105} y={62} width={10} height={7} rx={3} fill="#FFFFFF" stroke="#0F172A" strokeWidth={1.8} />
                <Line x1={114} y1={65} x2={119} y2={65} stroke="#0F172A" strokeWidth={2} strokeLinecap="round" />
              </G>
            )}

            {/* POSE C: INSPECT (Site Survey & Field Checklist) */}
            {pose === 'inspect' && (
              <G>
                <Path
                  d="M 39 70 Q 48 80 54 84"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M 81 70 Q 72 80 66 84"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                <G transform="translate(48, 72)">
                  <Rect x={0} y={0} width={24} height={30} rx={3} fill="#FEF3C7" stroke="#0F172A" strokeWidth={1.8} />
                  <Rect x={7} y={-3} width={10} height={4} rx={1.5} fill="#0F172A" />
                  <Line x1={4} y1={7} x2={20} y2={7} stroke="#3B82F6" strokeWidth={1.5} />
                  <Line x1={4} y1={13} x2={18} y2={13} stroke="#94A3B8" strokeWidth={1.2} />
                  <Line x1={4} y1={18} x2={16} y2={18} stroke="#94A3B8" strokeWidth={1.2} />
                  <Line x1={4} y1={23} x2={12} y2={23} stroke="#10B981" strokeWidth={1.5} />
                </G>
              </G>
            )}

            {/* POSE D: CELEBRATE (Commissioning & Handover) */}
            {pose === 'celebrate' && (
              <G>
                <Path
                  d="M 39 70 Q 24 52 20 38"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                <Circle cx={20} cy={38} r={4.5} fill="#FFFFFF" stroke="#0F172A" strokeWidth={2} />
                <Path
                  d="M 81 70 Q 96 52 100 38"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                <Circle cx={100} cy={38} r={4.5} fill="#FFFFFF" stroke="#0F172A" strokeWidth={2} />
                <Path d="M 12 28 L 14 33 L 19 33 L 15 36 L 17 41 L 12 38 L 7 41 L 9 36 L 5 33 L 10 33 Z" fill="#F59E0B" />
                <Path d="M 108 26 L 110 30 L 114 30 L 111 33 L 112 37 L 108 34 L 104 37 L 105 33 L 102 30 L 106 30 Z" fill="#F59E0B" />
              </G>
            )}

            {/* POSE E: GUIDE (Presenting Tools) */}
            {pose === 'guide' && (
              <G>
                <Path
                  d="M 39 70 Q 28 78 24 86"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path d="M 20 86 Q 24 82 28 86" stroke="#0F172A" strokeWidth={2} fill="#FFFFFF" />
                <Path
                  d="M 81 70 Q 96 76 102 84"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path d="M 98 84 Q 102 80 106 84" stroke="#0F172A" strokeWidth={2} fill="#FFFFFF" />
              </G>
            )}
          </Svg>
        </Animated.View>

        {/* Ambient Ground Shadow with Counter-Scale */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 2,
            width: size * 0.45,
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(15, 23, 42, 0.12)',
            transform: [{ scaleX: animated ? shadowScaleAnim : 1 }],
          }}
        />
      </View>
    </View>
  );
};

export default GuideCharacter;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  speechContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 2,
  },
  speechText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  speechTail: {
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
    zIndex: 1,
  },
});
