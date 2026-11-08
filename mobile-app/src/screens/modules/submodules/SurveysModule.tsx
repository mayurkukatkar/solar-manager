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
} from 'lucide-react-native';
import { surveysApi } from '../../../api/endpoints';
import { SiteSurvey } from '../../../types';
import { EmptyState, SkeletonLoader, Button, Input } from '../../../components/common';
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

  const [surveyForm, setSurveyForm] = useState({
    customerName: '',
    phone: '',
    address: '',
    surveyDate: '',
    proposedCap: '3.3',
    roofType: 'RCC Flat Roof',
    usableShadowFreeArea: '350',
    discomConsumerNo: '',
    electricalPhase: 'Three Phase',
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
      }
    } catch (err: any) {
      console.warn('Surveys fetch notice:', err.message);
    } finally {
      setLoadingSurveys(false);
    }
  };

  const handleScheduleSurveySubmit = async () => {
    if (!surveyForm.customerName.trim() || !surveyForm.phone.trim()) {
      Alert.alert('Required', 'Please enter a customer name and phone number.');
      return;
    }
    setSavingSurvey(true);
    try {
      await surveysApi.createSurvey({
        customerName: surveyForm.customerName.trim(),
        phone: surveyForm.phone.trim(),
        address: surveyForm.address.trim(),
        proposedCap: parseFloat(surveyForm.proposedCap) || 3.3,
        roofType: surveyForm.roofType,
        usableShadowFreeArea: parseFloat(surveyForm.usableShadowFreeArea) || 350,
        discomConsumerNo: surveyForm.discomConsumerNo.trim(),
        electricalPhase: surveyForm.electricalPhase,
        notes: surveyForm.notes,
        surveyDate: surveyForm.surveyDate || new Date().toISOString(),
      });
      Alert.alert('Survey Scheduled', 'Technical site evaluation recorded.');
      setScheduleSurveyModal(false);
      setSurveyForm({
        customerName: '',
        phone: '',
        address: '',
        surveyDate: '',
        proposedCap: '3.3',
        roofType: 'RCC Flat Roof',
        usableShadowFreeArea: '350',
        discomConsumerNo: '',
        electricalPhase: 'Three Phase',
        notes: '',
      });
      fetchSurveys();
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Survey scheduled.');
    } finally {
      setSavingSurvey(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.sectionTitleWithAction}>
        <Text style={[styles.cardSectionHeader, { color: colors.text }]}>
          Technical Site Evaluations
        </Text>
        <TouchableOpacity
          style={styles.addSmallBtn}
          onPress={() => setScheduleSurveyModal(true)}
          activeOpacity={0.85}
        >
          <Plus size={14} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.addSmallBtnText}>Book Survey</Text>
        </TouchableOpacity>
      </View>

      {loadingSurveys ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <SkeletonLoader.Card />
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
                <Text style={{ fontSize: 10, color: isDark ? '#34d399' : '#047857', marginTop: 2, fontWeight: '600' }}>
                  DISCOM CA: {s.discomConsumerNo}
                </Text>
              ) : null}
            </View>
            <View
              style={[
                styles.surveyStatusPill,
                s.status === 'APPROVED' || s.feasibilityVerdict === 'FEASIBLE'
                  ? { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5' }
                  : { backgroundColor: colors.background },
              ]}
            >
              <Text
                style={[
                  styles.surveyStatusText,
                  s.status === 'APPROVED' || s.feasibilityVerdict === 'FEASIBLE'
                    ? { color: isDark ? '#34d399' : '#047857' }
                    : { color: colors.textSecondary },
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

            <ScrollView style={{ padding: 20 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CLIENT / SITE NAME *</Text>
              <TextInput
                style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={surveyForm.customerName}
                onChangeText={(v) => setSurveyForm((prev) => ({ ...prev, customerName: v }))}
                placeholder="e.g. Ramesh Kulkarni"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CONTACT PHONE NUMBER *</Text>
              <TextInput
                style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                keyboardType="phone-pad"
                value={surveyForm.phone}
                onChangeText={(v) => setSurveyForm((prev) => ({ ...prev, phone: v }))}
                placeholder="9822012345"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SITE ADDRESS / LOCATION</Text>
              <TextInput
                style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={surveyForm.address}
                onChangeText={(v) => setSurveyForm((prev) => ({ ...prev, address: v }))}
                placeholder="Plot 42, Kothrud, Pune"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DISCOM CONSUMER NUMBER</Text>
              <TextInput
                style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                keyboardType="numeric"
                value={surveyForm.discomConsumerNo}
                onChangeText={(v) => setSurveyForm((prev) => ({ ...prev, discomConsumerNo: v }))}
                placeholder="12-digit MSEDCL / Utility CA"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PROPOSED CAPACITY (kWp)</Text>
              <TextInput
                style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                keyboardType="numeric"
                value={surveyForm.proposedCap}
                onChangeText={(v) => setSurveyForm((prev) => ({ ...prev, proposedCap: v }))}
                placeholder="3.3"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SHADOW FREE AREA (SQ. FT.)</Text>
              <TextInput
                style={[styles.calcInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                keyboardType="numeric"
                value={surveyForm.usableShadowFreeArea}
                onChangeText={(v) => setSurveyForm((prev) => ({ ...prev, usableShadowFreeArea: v }))}
                placeholder="350"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NOTES / OBSTRUCTIONS</Text>
              <TextInput
                style={[styles.calcInput, { height: 70, backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                multiline
                value={surveyForm.notes}
                onChangeText={(v) => setSurveyForm((prev) => ({ ...prev, notes: v }))}
                placeholder="Water tank in South-West, parapet wall height 3ft..."
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity
                style={[styles.primaryActionBtn, savingSurvey && { opacity: 0.7 }]}
                onPress={handleScheduleSurveySubmit}
                disabled={savingSurvey}
              >
                <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryActionBtnText}>
                  {savingSurvey ? 'Scheduling...' : 'Confirm & Dispatch Survey'}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
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
  sectionTitleWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
  },
  addSmallBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addSmallBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  surveyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  quoteNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  quoteCustomer: {
    fontSize: 12,
    marginTop: 2,
  },
  surveyDate: {
    fontSize: 11,
    marginTop: 3,
  },
  surveyStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  surveyStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContentBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  subModalSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeSubModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  calcInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  primaryActionBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
