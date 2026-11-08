import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Layers } from 'lucide-react-native';
import { superAdminApi } from '../../../api/endpoints';
import { Tenant } from '../../../types';
import { EmptyState, SkeletonLoader } from '../../../components/common';
import { useTheme } from '../../../theme';

export interface SuperAdminModuleProps {
  onClose: () => void;
  initialParams?: any;
}

export const SuperAdminModule: React.FC<SuperAdminModuleProps> = ({
  onClose,
  initialParams,
}) => {
  const { colors, isDark } = useTheme();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoadingTenants(true);
    try {
      const res = await superAdminApi.getTenants();
      if (res && Array.isArray(res.tenants)) {
        setTenants(res.tenants);
      }
    } catch (err: any) {
      console.warn('Tenants fetch notice:', err.message);
    } finally {
      setLoadingTenants(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.cardSectionHeader, { color: colors.text }]}>
        Platform Governance & Registered Tenants
      </Text>

      {loadingTenants ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <SkeletonLoader.Card />
          <SkeletonLoader.Card />
        </View>
      ) : tenants.length === 0 ? (
        <EmptyState
          icon={<Layers size={32} color={colors.textSecondary} />}
          title="No Registered Tenants"
          description="Enterprise tenant accounts will appear here for super administrative audit."
          compact
        />
      ) : (
        tenants.map((t) => (
          <View
            key={t.id}
            style={[styles.quoteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.quoteNumber, { color: colors.primary }]}>{t.name}</Text>
              <Text style={[styles.quoteCustomer, { color: colors.textSecondary }]}>
                {t.email} • {t.city || 'India'}
              </Text>
              <Text style={[styles.tenantPlan, { color: colors.textMuted }]}>
                Plan: {(t as any).plan || 'ENTERPRISE'} • Active Users: {(t as any).userCount || 1}
              </Text>
            </View>
            <View
              style={[
                styles.surveyStatusPill,
                t.status === 'ACTIVE'
                  ? { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5' }
                  : { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2' },
              ]}
            >
              <Text
                style={[
                  styles.surveyStatusText,
                  t.status === 'ACTIVE'
                    ? { color: isDark ? '#34d399' : '#047857' }
                    : { color: isDark ? '#f87171' : '#dc2626' },
                ]}
              >
                {t.status || 'ACTIVE'}
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
    fontSize: 14,
    fontWeight: '800',
  },
  quoteCustomer: {
    fontSize: 12,
    marginTop: 2,
  },
  tenantPlan: {
    fontSize: 11,
    marginTop: 2,
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
