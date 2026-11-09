import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Sparkles,
  Award,
  CheckCircle2,
  Share2,
  ArrowRight,
  ShieldCheck,
  Zap,
  MessageCircle,
  X,
} from 'lucide-react-native';
import { GuideCharacter } from './GuideCharacter';
import { openWhatsAppMilestoneCelebration } from '../services/whatsappService';
import { haptics } from '../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface CelebrationModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  stageName?: string;
  xpAwarded?: number;
  badgeUnlocked?: string;
  peaceOfMindPoints?: string[];
  customerName?: string;
  customerPhone?: string;
  projectName?: string;
  capacityKw?: number;
  nextActionLabel?: string;
  onNextAction?: () => void;
  onClose: () => void;
}

const CONFETTI_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FCD34D', '#06B6D4'];

interface ConfettiPiece {
  id: number;
  startX: number;
  endX: number;
  color: string;
  size: number;
  rotation: number;
  anim: Animated.Value;
  rotAnim: Animated.Value;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  title,
  subtitle,
  stageName = 'Milestone Reached',
  xpAwarded = 50,
  badgeUnlocked,
  peaceOfMindPoints = [
    'Changes verified & secured locally + cloud synchronized',
    'Customer timeline updated with zero paperwork stress',
    'Next workflow stage unlocked & ready for 1-tap execution',
  ],
  customerName,
  customerPhone,
  projectName,
  capacityKw,
  nextActionLabel = 'Continue Journey',
  onNextAction,
  onClose,
}) => {
  // Modal scale & opacity animation
  const cardScale = useRef(new Animated.Value(0.75)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const xpBadgeScale = useRef(new Animated.Value(0)).current;

  // Generate 24 randomized confetti pieces
  const [confettiPieces] = useState<ConfettiPiece[]>(() => {
    return Array.from({ length: 26 }).map((_, i) => ({
      id: i,
      startX: Math.random() * SCREEN_WIDTH,
      endX: Math.random() * SCREEN_WIDTH + (Math.random() * 80 - 40),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: Math.random() * 8 + 6,
      rotation: Math.random() * 360,
      anim: new Animated.Value(0),
      rotAnim: new Animated.Value(0),
    }));
  });

  useEffect(() => {
    if (visible) {
      haptics.notificationSuccess();

      // Entrance springs
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(180),
          Animated.spring(xpBadgeScale, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Confetti burst animation
      confettiPieces.forEach((p, idx) => {
        p.anim.setValue(0);
        p.rotAnim.setValue(0);
        Animated.parallel([
          Animated.timing(p.anim, {
            toValue: 1,
            duration: 2200 + (idx % 6) * 200,
            delay: (idx % 8) * 40,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(p.rotAnim, {
            toValue: 1,
            duration: 2000 + (idx % 6) * 300,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      cardScale.setValue(0.75);
      cardOpacity.setValue(0);
      xpBadgeScale.setValue(0);
    }
  }, [visible, cardScale, cardOpacity, xpBadgeScale, confettiPieces]);

  const handleShareWhatsApp = async () => {
    if (!customerName) return;
    haptics.selection();
    await openWhatsAppMilestoneCelebration({
      customerName,
      customerPhone,
      projectName,
      capacityKw,
      stageTitle: stageName,
      highlightNote: subtitle,
    });
  };

  const handleNext = () => {
    haptics.selection();
    if (onNextAction) {
      onNextAction();
    } else {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Floating Confetti Layer */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {confettiPieces.map((p) => {
            const translateY = p.anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-30, SCREEN_HEIGHT + 30],
            });
            const translateX = p.anim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [p.startX, (p.startX + p.endX) / 2 + 15, p.endX],
            });
            const rotate = p.rotAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '720deg'],
            });
            const opacity = p.anim.interpolate({
              inputRange: [0, 0.1, 0.85, 1],
              outputRange: [0, 1, 1, 0],
            });

            return (
              <Animated.View
                key={p.id}
                style={[
                  styles.confettiPiece,
                  {
                    width: p.size,
                    height: p.size * 1.6,
                    backgroundColor: p.color,
                    borderRadius: 2,
                    transform: [{ translateX }, { translateY }, { rotate }],
                    opacity,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Central Modal Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {/* Close button in top-right */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={18} color="#64748B" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
            {/* Mascot in Celebration Pose */}
            <View style={styles.mascotWrapper}>
              <GuideCharacter
                pose="celebrate"
                size={84}
                animated={true}
                speechText="Woohoo! Stellar progress!"
              />
            </View>

            {/* Title & Subtitle */}
            <View style={styles.headerBlock}>
              <View style={styles.milestoneTag}>
                <Sparkles size={13} color="#F59E0B" />
                <Text style={styles.milestoneTagText}>{stageName.toUpperCase()}</Text>
              </View>
              <Text style={styles.titleText}>{title}</Text>
              <Text style={styles.subtitleText}>{subtitle}</Text>
            </View>

            {/* Solar XP & Badge Highlight */}
            <Animated.View
              style={[
                styles.xpBadgeContainer,
                {
                  transform: [{ scale: xpBadgeScale }],
                },
              ]}
            >
              <View style={styles.xpBadgeGlow}>
                <Zap size={18} color="#F59E0B" />
                <Text style={styles.xpBadgeValue}>+{xpAwarded} Solar XP</Text>
                <Text style={styles.xpBadgeLabel}>Added to Profile</Text>
              </View>
              {badgeUnlocked ? (
                <View style={styles.achievementRow}>
                  <Award size={15} color="#10B981" />
                  <Text style={styles.achievementText}>Achievement Unlocked: {badgeUnlocked}!</Text>
                </View>
              ) : null}
            </Animated.View>

            {/* Peace-of-Mind Assurance Box */}
            <View style={styles.peaceCard}>
              <View style={styles.peaceHeader}>
                <ShieldCheck size={16} color="#10B981" />
                <Text style={styles.peaceTitle}>Peace of Mind Certified</Text>
              </View>
              {peaceOfMindPoints.map((point, index) => (
                <View key={index} style={styles.peaceItem}>
                  <CheckCircle2 size={14} color="#10B981" style={{ marginTop: 2 }} />
                  <Text style={styles.peaceText}>{point}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonGroup}>
              {customerName ? (
                <TouchableOpacity
                  style={styles.whatsAppShareBtn}
                  onPress={handleShareWhatsApp}
                  activeOpacity={0.85}
                >
                  <MessageCircle size={18} color="#FFFFFF" />
                  <Text style={styles.whatsAppShareText}>
                    Send Celebration Card to {customerName.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.primaryNextBtn}
                onPress={handleNext}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryNextText}>{nextActionLabel}</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: SCREEN_HEIGHT * 0.88,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    paddingTop: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  scrollInner: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  mascotWrapper: {
    marginTop: -8,
    marginBottom: 10,
    alignItems: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 14,
  },
  milestoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  milestoneTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  xpBadgeContainer: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  xpBadgeGlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpBadgeValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#B45309',
  },
  xpBadgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  peaceCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  peaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  peaceTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  peaceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  peaceText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    fontWeight: '500',
  },
  actionButtonGroup: {
    width: '100%',
    gap: 10,
  },
  whatsAppShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  whatsAppShareText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0066FF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryNextText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

