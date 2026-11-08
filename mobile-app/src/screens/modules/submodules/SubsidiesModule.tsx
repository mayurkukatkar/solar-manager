import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Landmark,
  Check,
  Clock,
} from 'lucide-react-native';
import { subsidyApi } from '../../../api/endpoints';
import { SubsidyApplication } from '../../../types';
import { EmptyState, SkeletonLoader } from '../../../components/common';
import { useTheme } from '../../../theme';

export interface SubsidiesModuleProps {
  onClose: () => void;
  initialParams?: any;
}

export const SubsidiesModule: React.FC<SubsidiesModuleProps> = ({
  onClose,
  initialParams,
}) => {
  const { colors, isDark } = useTheme();

  const [subsidies, setSubsidies] = useState<SubsidyApplication[]>([]);
  const [subsidyMetrics, setSubsidyMetrics] = useState<any>({});
  const [loadingSubsidies, setLoadingSubsidies] = useState(false);

  useEffect(() => {
    fetchSubsidies();
  }, []);

  const fetchSubsidies = async () => {
    setLoadingSubsidies(true);
    try {
      const res = await subsidyApi.getSubsidies();
      if (res?.subsidies) {
        setSubsidies(res.subsidies);
        setSubsidyMetrics(res.metrics || {});
      }
    } catch (err: any) {
      console.warn('Subsidies fetch notice:', err.message);
    } finally {
      setLoadingSubsidies(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.cardSectionHeader, { color: colors.text }]}>
        PM Surya Ghar CFA National Portal Track
      </Text>

      {/* SLAB CARDS */}
      <View style={styles.subsidySlabRow}>
        <View style={[styles.slabBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.slabTitle, { color: colors.textSecondary }]}>1 kW System</Text>
          <Text style={[styles.slabAmount, { color: colors.text }]}>₹30,000</Text>
          <Text style={[styles.slabDesc, { color: colors.textMuted }]}>CFA Credit</Text>
        </View>
        <View style={[styles.slabBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.slabTitle, { color: colors.textSecondary }]}>2 kW System</Text>
          <Text style={[styles.slabAmount, { color: colors.text }]}>₹60,000</Text>
          <Text style={[styles.slabDesc, { color: colors.textMuted }]}>CFA Credit</Text>
        </View>
        <View style={[styles.slabBox, { borderColor: '#10b981', backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5' }]}>
          <Text style={[styles.slabTitle, { color: isDark ? '#34d399' : '#047857' }]}>3 kW+ System</Text>
          <Text style={[styles.slabAmount, { color: isDark ? '#34d399' : '#047857' }]}>₹78,000</Text>
          <Text style={[styles.slabDesc, { color: isDark ? '#34d399' : '#047857' }]}>Max Subsidy</Text>
        </View>
      </View>

      {/* 7-STAGE WORKFLOW GUIDE */}
      <Text style={[styles.cardSectionHeader, { marginTop: 18, color: colors.text }]}>
        Official 7-Stage Portal Track
      </Text>
      <View style={[styles.stageTrackBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {[
          { step: '1', title: 'Consumer Selection', desc: 'Vendor tagged on pmsuryaghar.gov.in', done: true },
          { step: '2', title: 'Feasibility Review', desc: 'DISCOM technical verification', done: true },
          { step: '3', title: 'Feasibility Approved', desc: 'Plant capacity sanctioned', done: true },
          { step: '4', title: 'Work Completed', desc: 'Installation & DCR module serials uploaded', done: false },
          { step: '5', title: 'Net Meter Inspection', desc: 'DISCOM commissioning report cleared', done: false },
          { step: '6', title: 'Claim Sanctioned', desc: 'National subsidy voucher generated', done: false },
          { step: '7', title: 'DBT Disbursed', desc: 'Direct credit into customer Aadhaar bank account', done: false },
        ].map((st) => (
          <View key={st.step} style={styles.trackItemRow}>
            <View style={[styles.trackCircle, { backgroundColor: isDark ? colors.surfaceRecessed : '#cbd5e1' }, st.done && styles.trackCircleDone]}>
              {st.done ? (
                <Check size={12} color="#ffffff" strokeWidth={3} />
              ) : (
                <Text style={[styles.trackCircleText, { color: isDark ? colors.textSecondary : '#334155' }]}>{st.step}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trackItemTitle, { color: colors.text }]}>{st.title}</Text>
              <Text style={[styles.trackItemDesc, { color: colors.textSecondary }]}>{st.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ACTIVE SUBSIDY APPLICATIONS */}
      <Text style={[styles.cardSectionHeader, { marginTop: 24, color: colors.text }]}>
        Portal Applications ({subsidies.length})
      </Text>
      {loadingSubsidies ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <SkeletonLoader.Card />
          <SkeletonLoader.Card />
        </View>
      ) : subsidies.length === 0 ? (
        <EmptyState
          icon={<Landmark size={32} color={colors.textSecondary} />}
          title="No Active Subsidy Claims"
          description="Applications submitted to the National Portal will synchronize here for real-time DBT tracking."
          compact
        />
      ) : (
        subsidies.map((sub) => (
          <View
            key={sub.id}
            style={[styles.subsidyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.appNumber, { color: colors.primary }]}>
                {sub.nationalPortalAppNo || 'NM-PORTAL-APP'}
              </Text>
              <Text style={[styles.consumerName, { color: colors.text }]}>
                {sub.customerName || 'Consumer'}
              </Text>
              <Text style={[styles.consumerDetail, { color: colors.textSecondary }]}>
                CA: {sub.consumerNumber} • {sub.discomName || 'DISCOM'} • {sub.proposedCapacity || 3.3} kW
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7' }]}>
              <Text style={[styles.statusText, { color: isDark ? '#fbbf24' : '#92400e' }]}>
                {sub.dbtStatus || sub.status || 'IN_PROGRESS'}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  cardSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  subsidySlabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  slabBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  slabTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  slabAmount: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  slabDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  stageTrackBox: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  trackItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackCircleDone: {
    backgroundColor: '#059669',
  },
  trackCircleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
  trackItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  trackItemDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  subsidyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  appNumber: {
    fontSize: 11,
    fontWeight: '800',
  },
  consumerName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  consumerDetail: {
    fontSize: 11,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
