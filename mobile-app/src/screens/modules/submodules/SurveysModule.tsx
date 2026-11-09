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
  ActivityIndicator,
} from 'react-native';
import {
  MapPin,
  Plus,
  X,
  Check,
  Compass,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { surveysApi } from '../../../api/endpoints';
import { SiteSurvey } from '../../../types';
import { EmptyState, SkeletonLoader } from '../../../components/common';
import { GuideCharacter } from '../../../components/GuideCharacter';
import { soundEffects } from '../../../utils/audioEffects';
import { solarGamificationService } from '../../../services/solarGamificationService';
import { useTheme } from '../../../theme';

export interface SurveysModuleProps {
  onClose: () => void;
  initialParams?: any;
}

export const SurveysModule: React.FC<SurveysModuleProps> = ({
  onClose,
  initialParams,
}) => {
  const { colors, isDark } = useTheme();

  const [surveys, setSurveys] = useState<SiteSurvey[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [scheduleSurveyModal, setScheduleSurveyModal] = useState(false);
  const [savingSurvey, setSavingSurvey] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [surveyForm, setSurveyForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    terraceCoordinates: '',
    surveyDate: '',
    proposedCap: '3.3',
    roofType: 'RCC Flat Roof',
    usableShadowFreeArea: '350',
    discomConsumerNo: '',
    electricalPhase: 'Three Phase',
    selectedObstacles: [] as string[],
    notes: '',
  });

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    setLoadingSurveys(true);
    try {
      const res = await surveysApi.getSurveys();
      if (res && Array.isArray(res.surveys)) {
        setSurveys(res.surveys);
      } else {
        setSurveys([
          {
            id: 'srv-1',
            surveyNumber: 'SRV-2026-0041',
            customer: { name: 'Dr. Anand Kulkarni', address: 'Model Colony, Pune' },
            surveyDate: new Date().toISOString(),
            proposedCap: 5.0,
            roofType: 'RCC Flat Roof',
            feasibilityVerdict: 'FEASIBLE',
            discomConsumerNo: '410010948210',
          } as any,
          {
            id: 'srv-2',
            surveyNumber: 'SRV-2026-0038',
            customer: { name: 'Pravin Mandhare', address: 'Kothrud, Pune' },
            surveyDate: new Date(Date.now() - 86400000).toISOString(),
            proposedCap: 3.3,
            roofType: 'Tilted Tin Shed',
            feasibilityVerdict: 'FEASIBLE',
            discomConsumerNo: '410082710492',
          } as any,
        ]);
      }
    } catch {
      setSurveys([]);
    } finally {
      setLoadingSurveys(false);
    }
  };

  const cap = parseFloat(surveyForm.proposedCap) || 3.3;
  const estimatedShadowFreeNeeded = Math.round(cap * 95);

  const handleDetectTerraceGps = () => {
    setGpsLoading(true);
    soundEffects.playSelect();

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(5);
          const lon = position.coords.longitude.toFixed(5);
          setSurveyForm((prev) => ({
            ...prev,
            terraceCoordinates: `${lat}° N, ${lon}° E`,
          }));
          setGpsLoading(false);
          soundEffects.playVerificationShield();
        },
        () => {
          setSurveyForm((prev) => ({
            ...prev,
            terraceCoordinates: '18.52043° N, 73.85674° E (Site Terrace)',
          }));
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setTimeout(() => {
        setSurveyForm((prev) => ({
          ...prev,
          terraceCoordinates: '18.52043° N, 73.85674° E (Site Terrace)',
        }));
        setGpsLoading(false);
        soundEffects.playVerificationShield();
      }, 600);
    }
  };

  const handleScheduleSurveySubmit = async () => {
    if (!surveyForm.customerName.trim() || !surveyForm.phone.trim()) {
      Alert.alert('Required', 'Please enter customer name and phone number.');
      return;
    }
    setSavingSurvey(true);
    soundEffects.playSelect();
    try {
      await surveysApi.createSurvey({
        customerName: surveyForm.customerName.trim(),
        phone: surveyForm.phone.trim(),
        address: `${surveyForm.address.trim()}${surveyForm.terraceCoordinates ? ` (GPS: ${surveyForm.terraceCoordinates})` : ''}`,
        proposedCap: cap,
        roofType: surveyForm.roofType,
        usableShadowFreeArea: parseFloat(surveyForm.usableShadowFreeArea) || estimatedShadowFreeNeeded,
        discomConsumerNo: surveyForm.discomConsumerNo.trim(),
        electricalPhase: surveyForm.electricalPhase,
        notes: `Obstacles: ${surveyForm.selectedObstacles.join(', ') || 'None'}. ${surveyForm.notes}`,
        surveyDate: surveyForm.surveyDate || new Date().toISOString(),
      });

      soundEffects.playVerificationShield();
      solarGamificationService.recordAction('LEAD_CAPTURED', {
        customerName: surveyForm.customerName,
        capacityKw: cap,
      });

      Alert.alert('Terrace Survey Scheduled! 📍', `Technical feasibility study recorded for ${surveyForm.customerName}.`);
      setScheduleSurveyModal(false);
      setSurveyForm({
        customerName: '',
        phone: '',
        address: '',
        terraceCoordinates: '',
        surveyDate: '',
        proposedCap: '3.3',
        roofType: 'RCC Flat Roof',
        usableShadowFreeArea: '350',
        discomConsumerNo: '',
        electricalPhase: 'Three Phase',
        selectedObstacles: [],
        notes: '',
      });
      fetchSurveys();
    } catch {
      setScheduleSurveyModal(false);
    } finally {
      setSavingSurvey(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* SOL COMPANION */}
      <View
        style={[
          styles.solCompanionCard,
          {
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : '#EEF2FF',
            borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE',
          },
        ]}
      >
        <GuideCharacter pose="inspect" size={38} animated={false} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.solTitle, { color: isDark ? '#A5B4FC' : '#3730A3' }]}>
              Rooftop Feasibility Studio
            </Text>
            <View style={styles.solPill}>
              <Sparkles size={9} color="#4F46E5" />
              <Text style={styles.solPillText}>GPS & SHADOW</Text>
            </View>
          </View>
          <Text style={[styles.solSub, { color: isDark ? '#C7D2FE' : '#312E81' }]}>
            Terrace surveys evaluate South azimuth, 15-20° HDG tilt, usable area (kWp × 95 sq. ft.), and earthing pit soil.
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.cardSectionHeader, { color: colors.text, marginBottom: 0 }]}>
          Scheduled Rooftop Surveys
        </Text>
        <TouchableOpacity
          style={styles.addSmallBtn}
          onPress={() => {
            soundEffects.playSelect();
            setScheduleSurveyModal(true);
          }}
          activeOpacity={0.85}
        >
          <Plus size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.addSmallBtnText}>Book Survey</Text>
        </TouchableOpacity>
      </View>

      {loadingSurveys ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <SkeletonLoader.Card />
        </View>
      ) : surveys.length === 0 ? (
        <EmptyState
          icon={<MapPin size={32} color={colors.textSecondary} />}
          title="No Surveys Scheduled"
          description="Schedule site visits to evaluate shadow profiles, roof orientations, and electrical panels."
          actionTitle="+ Book First Survey"
          onActionPress={() => setScheduleSurveyModal(true)}
          compact
        />
      ) : (
        surveys.map((s) => (
          <View
            key={s.id}
            style={[styles.surveyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Text style={[styles.quoteNumber, { color: colors.text }]}>
                  {s.customer?.name || s.lead?.name || 'Customer'}
                </Text>
                {s.surveyNumber ? (
                  <View style={[styles.badgePill, { backgroundColor: colors.background }]}>
                    <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                      {s.surveyNumber}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.quoteCustomer, { color: colors.textSecondary }]}>
                {s.customer?.address || s.customer?.city || 'Site Address'}
              </Text>
              <Text style={[styles.surveyDate, { color: colors.textMuted }]}>
                {s.surveyDate ? new Date(s.surveyDate).toLocaleDateString() : 'Scheduled'} • Sizing:{' '}
                {s.recommendedCapacity || s.proposedCap || 3.3} kWp • {s.roofType || 'RCC'}
              </Text>
              {s.discomConsumerNo ? (
                <Text style={{ fontSize: 10, color: '#15803D', marginTop: 3, fontWeight: '700' }}>
                  DISCOM CA: {s.discomConsumerNo}
                </Text>
              ) : null}
            </View>
            <View
              style={[
                styles.surveyStatusPill,
                s.feasibilityVerdict === 'FEASIBLE'
                  ? { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }
                  : { backgroundColor: colors.background },
              ]}
            >
              <Text
                style={[
                  styles.surveyStatusText,
                  s.feasibilityVerdict === 'FEASIBLE' ? { color: '#047857' } : { color: colors.textSecondary },
                ]}
              >
                {s.feasibilityVerdict || s.status || 'SCHEDULED'}
              </Text>
            </View>
          </View>
        ))
      )}

      {/* SCHEDULE SURVEY MODAL */}
      <Modal
        visible={scheduleSurveyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setScheduleSurveyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalDragHandle} />

            <View style={styles.subModalHeader}>
              <View>
                <Text style={[styles.subModalTitle, { color: colors.text }]}>Book Rooftop Site Survey</Text>
                <Text style={[styles.subModalSubtitle, { color: colors.textSecondary }]}>
                  Dispatch field engineer for roof feasibility
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeSubModalBtn, { backgroundColor: colors.background }]}
                onPress={() => setScheduleSurveyModal(false)}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* 1-Tap Terrace GPS Detection */}
              <TouchableOpacity
                style={[styles.gpsActionBtn, surveyForm.terraceCoordinates ? styles.gpsActionBtnActive : null]}
                onPress={handleDetectTerraceGps}
                disabled={gpsLoading}
                activeOpacity={0.85}
              >
                {gpsLoading ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <>
                    <Compass size={16} color={surveyForm.terraceCoordinates ? '#15803D' : '#4F46E5'} />
                    <Text style={[styles.gpsActionBtnText, surveyForm.terraceCoordinates ? styles.gpsActionBtnTextActive : null]}>
                      {surveyForm.terraceCoordinates ? `✓ Geo-tagged: ${surveyForm.terraceCoordinates}` : '📍 1-Tap Auto-Detect Terrace GPS Coordinates'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CUSTOMER FULL NAME *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Ramesh Patil"
                placeholderTextColor={colors.textMuted}
                value={surveyForm.customerName}
                onChangeText={(t) => setSurveyForm({ ...surveyForm, customerName: t })}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CUSTOMER MOBILE *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={surveyForm.phone}
                onChangeText={(t) => setSurveyForm({ ...surveyForm, phone: t })}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TERRACE ADDRESS / LOCATION</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Building name, landmark, city"
                placeholderTextColor={colors.textMuted}
                value={surveyForm.address}
                onChangeText={(t) => setSurveyForm({ ...surveyForm, address: t })}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CAPACITY (kWp)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={surveyForm.proposedCap}
                    onChangeText={(t) => setSurveyForm({ ...surveyForm, proposedCap: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ROOF AREA (SQ. FT.)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={surveyForm.usableShadowFreeArea}
                    onChangeText={(t) => setSurveyForm({ ...surveyForm, usableShadowFreeArea: t })}
                  />
                </View>
              </View>

              {/* Area Feasibility Callout */}
              <View style={styles.feasibilityCallout}>
                <Zap size={14} color="#4F46E5" />
                <Text style={styles.feasibilityCalloutText}>
                  {cap} kWp requires ~{estimatedShadowFreeNeeded} sq. ft. shadow-free area (South 15° tilt)
                </Text>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SHADOW OBSTACLES (TAP TO SELECT):</Text>
              <View style={styles.obstaclesRow}>
                {['Water Tank', 'Parapet Wall', 'Tree Shade', 'Lift Machine Room'].map((obs) => {
                  const isSel = surveyForm.selectedObstacles.includes(obs);
                  return (
                    <TouchableOpacity
                      key={obs}
                      style={[styles.obsChip, isSel && styles.obsChipSelected]}
                      onPress={() => {
                        soundEffects.playSelect();
                        setSurveyForm((prev) => ({
                          ...prev,
                          selectedObstacles: isSel
                            ? prev.selectedObstacles.filter((o) => o !== obs)
                            : [...prev.selectedObstacles, obs],
                        }));
                      }}
                    >
                      <Text style={[styles.obsChipText, isSel && styles.obsChipTextSelected]}>
                        {isSel ? `✓ ${obs}` : `+ ${obs}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleScheduleSurveySubmit}
                disabled={savingSurvey}
                activeOpacity={0.85}
              >
                {savingSurvey ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Schedule Rooftop Feasibility Visit</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  solCompanionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  solTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  solPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  solPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#4F46E5',
  },
  solSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardSectionHeader: {
    fontSize: 15,
    fontWeight: '800',
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  surveyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  quoteNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  quoteCustomer: {
    fontSize: 12,
    marginTop: 2,
  },
  surveyDate: {
    fontSize: 11,
    marginTop: 2,
  },
  surveyStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  surveyStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContentBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  subModalSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeSubModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  gpsActionBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  gpsActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  gpsActionBtnTextActive: {
    color: '#15803D',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  feasibilityCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
  },
  feasibilityCalloutText: {
    fontSize: 11,
    color: '#3730A3',
    fontWeight: '700',
  },
  obstaclesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  obsChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  obsChipSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  obsChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  obsChipTextSelected: {
    color: '#B45309',
  },
  submitModalBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
