import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Zap } from 'lucide-react-native';
import { useTheme } from '../../../theme';

export interface DiscomModuleProps {
  onClose: () => void;
  initialParams?: any;
}

export const DiscomModule: React.FC<DiscomModuleProps> = ({
  onClose,
  initialParams,
}) => {
  const { colors, isDark } = useTheme();

  const [discomList] = useState([
    {
      id: 'disc-1',
      consumerName: 'Surendra Sharma',
      consumerNumber: '028510293812',
      discomName: 'MSEDCL',
      division: 'Pune Urban (Shivajinagar)',
      sanctionedLoadKw: 3.3,
      status: 'FEASIBILITY_CLEARED',
      meterSerial: 'MTR-MH-8842',
      appNo: 'NM-MS-2026-9921',
    },
    {
      id: 'disc-2',
      consumerName: 'Pooja Deshmukh',
      consumerNumber: '019284729103',
      discomName: 'MSEDCL',
      division: 'Nashik Urban',
      sanctionedLoadKw: 5.0,
      status: 'METER_INSTALLED',
      meterSerial: 'MTR-MH-7411',
      appNo: 'NM-MS-2026-8714',
    },
    {
      id: 'disc-3',
      consumerName: 'Anil Godbole',
      consumerNumber: '031849102834',
      discomName: 'Tata Power',
      division: 'Mumbai North',
      sanctionedLoadKw: 6.0,
      status: 'INSPECTION_PENDING',
      meterSerial: 'MTR-TP-1923',
      appNo: 'NM-TP-2026-1049',
    },
  ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.cardSectionHeader, { color: colors.text }]}>
        DISCOM Net-Metering Tracker
      </Text>

      {discomList.map((disc) => (
        <View
          key={disc.id}
          style={[styles.quoteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Zap size={14} color="#0d9488" />
              <Text style={[styles.quoteNumber, { color: '#0d9488' }]}>{disc.appNo}</Text>
            </View>
            <Text style={[styles.quoteCustomer, { color: colors.text }]}>{disc.consumerName}</Text>
            <Text style={[styles.surveyDate, { color: colors.textSecondary }]}>
              Consumer #: {disc.consumerNumber} • {disc.discomName} ({disc.division})
            </Text>
            <Text style={[styles.surveyDate, { color: colors.textMuted }]}>
              Meter Serial: {disc.meterSerial} • Sanction: {disc.sanctionedLoadKw} kW
            </Text>
          </View>
          <View style={[styles.surveyStatusPill, { backgroundColor: isDark ? 'rgba(13, 148, 136, 0.2)' : '#f0fdfa' }]}>
            <Text style={[styles.surveyStatusText, { color: isDark ? '#2dd4bf' : '#0d9488' }]}>{disc.status}</Text>
          </View>
        </View>
      ))}
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
    fontSize: 12,
    fontWeight: '800',
  },
  quoteCustomer: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },
  surveyDate: {
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
