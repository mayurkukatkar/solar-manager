import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { amcApi } from '../../../api/endpoints';
import { EmptyState, SkeletonLoader } from '../../../components/common';
import { useTheme } from '../../../theme';

export interface AmcModuleProps {
  onClose: () => void;
  initialParams?: any;
}

export const AmcModule: React.FC<AmcModuleProps> = ({
  onClose,
  initialParams,
}) => {
  const { colors, isDark } = useTheme();

  const [amcs, setAmcs] = useState<any[]>([]);
  const [loadingAmcs, setLoadingAmcs] = useState(false);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.cardSectionHeader, { color: colors.text }]}>
        Active Maintenance Contracts & Service
      </Text>

      {loadingAmcs ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <SkeletonLoader.Card />
          <SkeletonLoader.Card />
        </View>
      ) : amcs.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={32} color={colors.textSecondary} />}
          title="No Active AMCs"
          description="Solar maintenance packages will appear here once registered."
          compact
        />
      ) : (
        amcs.map((amc: any) => (
          <View
            key={amc.id}
            style={[styles.quoteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.quoteNumber, { color: colors.primary }]}>
                {amc.planName || 'Comprehensive Solar AMC'}
              </Text>
              <Text style={[styles.quoteCustomer, { color: colors.text }]}>
                {amc.customer?.name || 'Customer'}
              </Text>
              <Text style={[styles.amcDetails, { color: colors.textSecondary }]}>
                Duration: {amc.durationYears || 5} Years • Visits: {amc.visitsPerYear || 4}/yr
              </Text>
            </View>
            <View style={[styles.surveyStatusPill, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5' }]}>
              <Text style={[styles.surveyStatusText, { color: isDark ? '#34d399' : '#047857' }]}>
                {amc.status || 'ACTIVE'}
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
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  quoteNumber: {
    fontSize: 13,
    fontWeight: '800',
  },
  quoteCustomer: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  amcDetails: {
    fontSize: 11,
    marginTop: 3,
  },
  surveyStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  surveyStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
