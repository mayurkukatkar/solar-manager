import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import {
  ShieldCheck,
  Calendar,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Clock,
  Sparkles,
  X,
  Check,
  Zap,
  Activity,
} from 'lucide-react-native';
import { amcApi } from '../../../api/endpoints';
import { EmptyState, SkeletonLoader } from '../../../components/common';
import { GuideCharacter } from '../../../components/GuideCharacter';
import { CelebrationModal } from '../../../components/CelebrationModal';
import { soundEffects } from '../../../utils/audioEffects';
import { solarGamificationService } from '../../../services/solarGamificationService';
import { useTheme } from '../../../theme';

export interface AmcModuleProps {
  onClose: () => void;
  initialParams?: any;
}

interface MaintenanceSchedule {
  quarter: string;
  title: string;
  focus: string;
  status: 'COMPLETED' | 'SCHEDULED' | 'PENDING';
  date: string;
  earthResistance?: string;
}

export const AmcModule: React.FC<AmcModuleProps> = ({
  onClose,
  initialParams,
}) => {
  const { colors, isDark } = useTheme();

  const [amcs, setAmcs] = useState<any[]>([]);
  const [loadingAmcs, setLoadingAmcs] = useState(false);
  const [selectedPlanTab, setSelectedPlanTab] = useState<'ACTIVE' | 'PLANS'>('ACTIVE');

  // Seasonal Maintenance Cycles
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([
    {
      quarter: 'Q1 (Pre-Monsoon)',
      title: 'Structure & Gasket Water-Tightness',
      focus: 'Inspect HDG clamps, cable ties, DC isolators & roof sealing',
      status: 'COMPLETED',
      date: 'May 14, 2026',
      earthResistance: '2.4 Ω',
    },
    {
      quarter: 'Q2 (Post-Monsoon)',
      title: 'Deep Soiling Wash & Thermal Scan',
      focus: 'High-pressure demineralized wash & infrared hotspot check',
      status: 'COMPLETED',
      date: 'Oct 02, 2026',
      earthResistance: '2.8 Ω',
    },
    {
      quarter: 'Q3 (Winter Check)',
      title: 'Inverter String MPPT & Efficiency',
      focus: 'Dual-MPPT open-circuit voltage & grid-tie sync parameters',
      status: 'SCHEDULED',
      date: 'Dec 18, 2026',
    },
    {
      quarter: 'Q4 (Annual Audit)',
      title: 'Statutory Earthing & Handover Audit',
      focus: 'Chemical earthing resistance test (< 5 Ω) & surge arrester check',
      status: 'PENDING',
      date: 'Mar 10, 2027',
    },
  ]);

  // Log Service Visit Modal
  const [logVisitVisible, setLogVisitVisible] = useState(false);
  const [targetSchedule, setTargetSchedule] = useState<MaintenanceSchedule | null>(null);
  const [earthReading, setEarthReading] = useState('2.6');
  const [dailyYield, setDailyYield] = useState('16.4');
  const [technicianNotes, setTechnicianNotes] = useState('All 6 panels cleaned. Inverter running at 98.4% efficiency. Zero micro-cracks detected.');
  const [savingVisit, setSavingVisit] = useState(false);

  // Celebration state
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationData, setCelebrationData] = useState({
    title: '',
    subtitle: '',
    xp: 75,
  });

  useEffect(() => {
    fetchAmcs();
  }, []);

  const fetchAmcs = async () => {
    setLoadingAmcs(true);
    try {
      const res = await amcApi.getAmcs();
      if (res && Array.isArray(res.amcs)) {
        setAmcs(res.amcs);
      }
    } catch (err: any) {
      console.warn('AMC fetch notice:', err.message);
    } finally {
      setLoadingAmcs(false);
    }
  };

  const handleOpenLogVisit = (sched: MaintenanceSchedule) => {
    soundEffects.playSelect();
    setTargetSchedule(sched);
    setLogVisitVisible(true);
  };

  const handleSaveVisit = () => {
    if (!targetSchedule) return;
    setSavingVisit(true);
    setTimeout(() => {
      soundEffects.playVerificationShield();
      setSchedules((prev) =>
        prev.map((s) =>
          s.quarter === targetSchedule.quarter
            ? { ...s, status: 'COMPLETED', earthResistance: `${earthReading} Ω` }
            : s
        )
      );
      solarGamificationService.recordAction('QA_CERTIFIED', {
        projectName: `Preventive AMC Visit: ${targetSchedule.quarter}`,
      });
      setSavingVisit(false);
      setLogVisitVisible(false);

      setCelebrationData({
        title: 'Preventive Health Audit Logged!',
        subtitle: `Earth resistance verified at ${earthReading} Ω (Statutory limit < 5 Ω). Generation guaranteed!`,
        xp: 75,
      });
      setCelebrationVisible(true);
    }, 400);
  };

  const handleSendAmcReminder = async (customerName: string, phone: string, quarter: string) => {
    soundEffects.playSelect();
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '919822012345';
    const message = `Hello *${customerName}*! 👋\n\nYour quarterly *Rooftop Solar Plant Health & Maintenance Inspection (${quarter})* is scheduled for this week.\n\n🛡️ *Included Checks:*\n• Panel De-Soiling & Hotspot Thermal Scan\n• Inverter MPPT Voltage & Efficiency Calibration\n• Chemical Earthing Pit Resistance Test (< 5 Ohms)\n\nOur certified solar technician will contact you prior to visiting.\n\n_WhereReady Solar Technologies — Lifetime Peace of Mind_`;
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Notice', 'Could not open WhatsApp.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      {/* SOL MASCOT COMPANION */}
      <GuideCharacter
        pose="celebrate"
        speechText="Solar Plant Health Guardian! 4 seasonal preventive visits ensure 25 years of peak 98%+ generation yield with zero downtime."
      />

      {/* HEALTH STATUS OVERVIEW BANNER */}
      <View
        style={[
          styles.healthCard,
          {
            backgroundColor: isDark ? '#1E293B' : '#ECFDF5',
            borderColor: isDark ? '#065F46' : '#A7F3D0',
          },
        ]}
      >
        <View style={styles.healthHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Activity size={18} color="#059669" />
              <Text style={[styles.healthTitle, { color: isDark ? '#34D399' : '#065F46' }]}>
                System Health: 99.2% Optimal
              </Text>
            </View>
            <Text style={[styles.healthSub, { color: colors.textSecondary }]}>
              Client: Rajesh Deshmukh • 3.3 kWp DCR Mono PERC
            </Text>
          </View>
          <View style={styles.healthScoreBadge}>
            <Text style={styles.healthScoreText}>A+ GRADE</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiVal, { color: '#059669' }]}>16.4 kWh</Text>
            <Text style={[styles.kpiLbl, { color: colors.textMuted }]}>DAILY YIELD</Text>
          </View>
          <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiVal, { color: '#0284C7' }]}>2.4 Ω</Text>
            <Text style={[styles.kpiLbl, { color: colors.textMuted }]}>EARTH RESISTANCE</Text>
          </View>
          <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiVal, { color: '#D97706' }]}>2/4 Done</Text>
            <Text style={[styles.kpiLbl, { color: colors.textMuted }]}>AMC VISITS</Text>
          </View>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            { borderColor: colors.border, backgroundColor: colors.background },
            selectedPlanTab === 'ACTIVE' && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => {
            soundEffects.playGlide();
            setSelectedPlanTab('ACTIVE');
          }}
        >
          <Text
            style={[
              styles.tabBtnText,
              { color: colors.textSecondary },
              selectedPlanTab === 'ACTIVE' && { color: '#FFFFFF', fontWeight: '800' },
            ]}
          >
            Seasonal Schedule (4 Visits)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            { borderColor: colors.border, backgroundColor: colors.background },
            selectedPlanTab === 'PLANS' && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => {
            soundEffects.playGlide();
            setSelectedPlanTab('PLANS');
          }}
        >
          <Text
            style={[
              styles.tabBtnText,
              { color: colors.textSecondary },
              selectedPlanTab === 'PLANS' && { color: '#FFFFFF', fontWeight: '800' },
            ]}
          >
            AMC Protection Plans
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4-VISIT SCHEDULE LIST */}
      {selectedPlanTab === 'ACTIVE' ? (
        <View style={{ gap: 12, marginTop: 14 }}>
          {schedules.map((sched, idx) => {
            const isDone = sched.status === 'COMPLETED';
            const isSched = sched.status === 'SCHEDULED';
            return (
              <View
                key={sched.quarter}
                style={[
                  styles.scheduleCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isDone ? '#10B981' : isSched ? '#0284C7' : colors.border,
                  },
                ]}
              >
                <View style={styles.schedHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} color={isDone ? '#10B981' : colors.textSecondary} />
                    <Text style={[styles.quarterText, { color: colors.text }]}>{sched.quarter}</Text>
                  </View>
                  <View
                    style={[
                      styles.schedStatusPill,
                      {
                        backgroundColor: isDone
                          ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5')
                          : isSched
                            ? (isDark ? 'rgba(2, 132, 199, 0.2)' : '#F0F9FF')
                            : (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB'),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.schedStatusText,
                        { color: isDone ? '#059669' : isSched ? '#0284C7' : '#D97706' },
                      ]}
                    >
                      {sched.status}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.schedTitle, { color: colors.text }]}>{sched.title}</Text>
                <Text style={[styles.schedFocus, { color: colors.textSecondary }]}>{sched.focus}</Text>

                <View style={styles.schedFooter}>
                  <Text style={[styles.schedDate, { color: colors.textMuted }]}>
                    Date: {sched.date} {sched.earthResistance ? `• Earth: ${sched.earthResistance}` : ''}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {!isDone && (
                      <TouchableOpacity
                        style={styles.logVisitBtn}
                        onPress={() => handleOpenLogVisit(sched)}
                        activeOpacity={0.85}
                      >
                        <Wrench size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.logVisitBtnText}>Log Audit</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.remindClientBtn}
                      onPress={() => handleSendAmcReminder('Rajesh Deshmukh', '+91 98220 12345', sched.quarter)}
                      activeOpacity={0.85}
                    >
                      <MessageCircle size={12} color="#059669" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        /* PROTECTION PLANS CAROUSEL */
        <View style={{ gap: 12, marginTop: 14 }}>
          {[
            {
              name: 'Basic Yield Care',
              price: '₹3,499 / Year',
              badge: 'STANDARD',
              features: [
                '2 Routine De-Soiling Panel Washes',
                'Inverter Diagnostic Scan',
                'Emergency Breakdown Support within 48h',
              ],
            },
            {
              name: 'Pro Generation Shield',
              price: '₹8,999 / 3 Years',
              badge: 'POPULAR',
              recommended: true,
              features: [
                '4 Seasonal Preventative Visits / Year',
                'Thermal Imaging Hotspot Detection',
                'Chemical Earth Resistance Audit (< 5 Ω)',
                'Priority 24h Technician Dispatch',
              ],
            },
            {
              name: 'Lifetime Platinum Care',
              price: '₹14,999 / 5 Years',
              badge: 'TOTAL PEACE OF MIND',
              features: [
                'All Pro Features Included',
                'Free Micro-Inverter / String Spare Replacement',
                'DISCOM Net-Metering Bi-Annual Recalibration',
                'Guaranteed 98%+ Generation SLA',
              ],
            },
          ].map((plan) => (
            <View
              key={plan.name}
              style={[
                styles.planCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: plan.recommended ? '#059669' : colors.border,
                },
              ]}
            >
              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                  <Text style={[styles.planPrice, { color: plan.recommended ? '#059669' : colors.primary }]}>
                    {plan.price}
                  </Text>
                </View>
                <View
                  style={[
                    styles.planBadge,
                    { backgroundColor: plan.recommended ? '#059669' : colors.border },
                  ]}
                >
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
              </View>

              <View style={{ gap: 6, marginVertical: 10 }}>
                {plan.features.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Check size={13} color="#059669" strokeWidth={3} />
                    <Text style={[styles.planFeatureText, { color: colors.textSecondary }]}>{f}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.enrollPlanBtn,
                  { backgroundColor: plan.recommended ? '#059669' : colors.primary },
                ]}
                onPress={() => {
                  soundEffects.playCelebrationFanfare();
                  solarGamificationService.recordAction('STAGE_ADVANCED', { projectName: plan.name });
                  Alert.alert('Protection Activated', `${plan.name} assigned to project. Certificate issued to client.`);
                }}
                activeOpacity={0.85}
              >
                <ShieldCheck size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.enrollPlanBtnText}>Activate Protection Plan</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* LOG VISIT MODAL */}
      <Modal
        visible={logVisitVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLogVisitVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Record Maintenance Audit</Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                  {targetSchedule?.quarter}: {targetSchedule?.title}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.background }]}
                onPress={() => setLogVisitVisible(false)}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                MEASURED CHEMICAL EARTHING RESISTANCE (OHMS) *
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={earthReading}
                onChangeText={setEarthReading}
                keyboardType="numeric"
                placeholder="Must be < 5.0 Ohms"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                CURRENT DAILY SOLAR YIELD (KWH / DAY) *
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={dailyYield}
                onChangeText={setDailyYield}
                keyboardType="numeric"
                placeholder="e.g. 16.4"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                ENGINEER AUDIT OBSERVATIONS
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, height: 75 }]}
                value={technicianNotes}
                onChangeText={setTechnicianNotes}
                multiline
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity
                style={styles.submitAuditBtn}
                onPress={handleSaveVisit}
                disabled={savingVisit}
                activeOpacity={0.85}
              >
                <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitAuditBtnText}>
                  {savingVisit ? 'Certifying Audit...' : 'Certify & Record Visit (+75 XP)'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CELEBRATION MODAL */}
      <CelebrationModal
        visible={celebrationVisible}
        title={celebrationData.title}
        subtitle={celebrationData.subtitle}
        stageName="Preventive Maintenance Complete"
        xpAwarded={celebrationData.xp}
        peaceOfMindPoints={[
          'Earth resistance verified under statutory 5.0 Ohm limit',
          'Panels cleaned & inverter peak operating efficiency confirmed',
          'Customer updated via instant WhatsApp maintenance dossier',
        ]}
        onClose={() => setCelebrationVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  healthCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 14,
    marginBottom: 16,
  },
  healthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  healthSub: {
    fontSize: 12,
    marginTop: 2,
  },
  healthScoreBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  healthScoreText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  kpiLbl: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 24,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scheduleCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  schedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quarterText: {
    fontSize: 12,
    fontWeight: '800',
  },
  schedStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  schedStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  schedTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  schedFocus: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  schedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  schedDate: {
    fontSize: 11,
    fontWeight: '600',
  },
  logVisitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  logVisitBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  remindClientBtn: {
    backgroundColor: '#ECFDF5',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  planCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  planFeatureText: {
    fontSize: 12,
    fontWeight: '600',
  },
  enrollPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  enrollPlanBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  submitAuditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  submitAuditBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
