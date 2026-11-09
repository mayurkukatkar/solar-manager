import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Zap,
  Flame,
  Award,
  ShieldCheck,
  Leaf,
  Sun,
  X,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react-native';
import {
  solarGamificationService,
  UserCareerStats,
  AchievementBadge,
} from '../services/solarGamificationService';
import { GuideCharacter } from './GuideCharacter';
import { haptics } from '../utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const GamificationPill: React.FC = () => {
  const [stats, setStats] = useState<UserCareerStats>(solarGamificationService.getStats());
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    return solarGamificationService.subscribe((updated) => {
      setStats(updated);
    });
  }, []);

  const handleOpen = () => {
    haptics.selection();
    setModalVisible(true);
  };

  const handleClose = () => {
    haptics.selection();
    setModalVisible(false);
  };

  return (
    <>
      {/* Visual Compact Pill for Dashboard & Headers */}
      <TouchableOpacity
        style={styles.pillContainer}
        onPress={handleOpen}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Solar Career Level ${stats.level}: ${stats.levelTitle}, ${stats.xp} XP`}
      >
        {/* Level & XP */}
        <View style={styles.levelBadge}>
          <Zap size={13} color="#F59E0B" />
          <Text style={styles.levelText}>Lvl {stats.level}</Text>
        </View>

        <View style={styles.xpBarTrack}>
          <View style={[styles.xpBarFill, { width: `${stats.progressPct}%` }]} />
        </View>

        <Text style={styles.xpNumberText}>{stats.xp} XP</Text>

        {/* Daily Streak */}
        <View style={styles.streakBadge}>
          <Flame size={13} color="#EF4444" />
          <Text style={styles.streakText}>{stats.streakDays}d</Text>
        </View>
      </TouchableOpacity>

      {/* Comprehensive Solar Career & Achievements Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Solar Career Cockpit</Text>
                <Text style={styles.modalSubtitle}>Your Operational Mastery & Impact</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Sol Mascot & Career Rank Card */}
              <View style={styles.careerHeroCard}>
                <GuideCharacter
                  pose="wave"
                  size={64}
                  animated={true}
                  speechText={`Keep shining! You're on Level ${stats.level}!`}
                />
                <View style={styles.heroRankTextGroup}>
                  <View style={styles.tierTag}>
                    <Sparkles size={12} color="#D97706" />
                    <Text style={styles.tierTagText}>TIER {stats.level}</Text>
                  </View>
                  <Text style={styles.rankTitle}>{stats.levelTitle}</Text>
                  <Text style={styles.rankProgressSub}>
                    {stats.xp} / {stats.nextLevelXp} XP to next level
                  </Text>
                  {/* Big progress bar */}
                  <View style={styles.bigProgressBarTrack}>
                    <View style={[styles.bigProgressBarFill, { width: `${stats.progressPct}%` }]} />
                  </View>
                </View>
              </View>

              {/* Environmental Clean Energy Impact Metrics */}
              <View style={styles.sectionHeaderRow}>
                <Leaf size={16} color="#10B981" />
                <Text style={styles.sectionTitle}>Real-World Green Impact</Text>
              </View>

              <View style={styles.impactGrid}>
                <View style={styles.impactCard}>
                  <Sun size={20} color="#F59E0B" />
                  <Text style={styles.impactValue}>{stats.totalKwEnergized} kWp</Text>
                  <Text style={styles.impactLabel}>Clean Power Planted</Text>
                </View>
                <View style={styles.impactCard}>
                  <ShieldCheck size={20} color="#3B82F6" />
                  <Text style={styles.impactValue}>{stats.co2SavedTons} Tons</Text>
                  <Text style={styles.impactLabel}>CO₂ Prevented</Text>
                </View>
                <View style={styles.impactCard}>
                  <Leaf size={20} color="#10B981" />
                  <Text style={styles.impactValue}>{stats.treesPlanted}</Text>
                  <Text style={styles.impactLabel}>Trees Equivalent</Text>
                </View>
              </View>

              {/* Badges & Achievements */}
              <View style={styles.sectionHeaderRow}>
                <Award size={16} color="#0066FF" />
                <Text style={styles.sectionTitle}>Mastery Badges ({stats.badges.filter(b => b.unlockedAt).length}/{stats.badges.length})</Text>
              </View>

              <View style={styles.badgeList}>
                {stats.badges.map((badge) => {
                  const isUnlocked = Boolean(badge.unlockedAt);
                  return (
                    <View
                      key={badge.id}
                      style={[
                        styles.badgeItem,
                        isUnlocked ? styles.badgeItemUnlocked : styles.badgeItemLocked,
                      ]}
                    >
                      <View
                        style={[
                          styles.badgeIconBox,
                          isUnlocked ? styles.badgeIconUnlocked : styles.badgeIconLocked,
                        ]}
                      >
                        {isUnlocked ? (
                          <Award size={20} color="#FFFFFF" />
                        ) : (
                          <Lock size={18} color="#94A3B8" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.badgeTitleRow}>
                          <Text
                            style={[
                              styles.badgeItemTitle,
                              !isUnlocked && { color: '#94A3B8' },
                            ]}
                          >
                            {badge.title}
                          </Text>
                          {isUnlocked ? (
                            <View style={styles.unlockedPill}>
                              <CheckCircle2 size={11} color="#059669" />
                              <Text style={styles.unlockedPillText}>UNLOCKED</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.badgeItemDesc}>{badge.description}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Recent XP Activity Stream */}
              {stats.recentEvents.length > 0 ? (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Zap size={16} color="#F59E0B" />
                    <Text style={styles.sectionTitle}>Recent Accomplishments</Text>
                  </View>
                  <View style={styles.recentList}>
                    {stats.recentEvents.slice(0, 5).map((evt) => (
                      <View key={evt.id} style={styles.recentItem}>
                        <View style={styles.recentLeft}>
                          <Text style={styles.recentTitle}>{evt.title}</Text>
                          <Text style={styles.recentTime}>
                            {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <View style={styles.recentXpBadge}>
                          <Text style={styles.recentXpText}>+{evt.xpGained} XP</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 3,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  xpBarTrack: {
    width: 38,
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 3,
  },
  xpNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  streakText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  careerHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 14,
  },
  heroRankTextGroup: {
    flex: 1,
  },
  tierTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  tierTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  rankProgressSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  bigProgressBarTrack: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bigProgressBarFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  impactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  impactValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 6,
  },
  impactLabel: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
  },
  badgeList: {
    gap: 10,
    marginBottom: 20,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  badgeItemUnlocked: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  badgeItemLocked: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  badgeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIconUnlocked: {
    backgroundColor: '#10B981',
  },
  badgeIconLocked: {
    backgroundColor: '#E2E8F0',
  },
  badgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  badgeItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  unlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  unlockedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  badgeItemDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  recentList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  recentLeft: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  recentTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  recentXpBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recentXpText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
});

