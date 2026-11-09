import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Sparkles,
  Building,
} from 'lucide-react-native';
import { GuideCharacter } from '../../../components/GuideCharacter';
import { soundEffects } from '../../../utils/audioEffects';
import { solarGamificationService } from '../../../services/solarGamificationService';
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

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'FEASIBILITY' | 'METER_INSTALLED' | 'INSPECTION'>('ALL');

  const [discomList, setDiscomList] = useState([
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
      statutoryComplete: true,
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
      statutoryComplete: true,
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
      statutoryComplete: false,
    },
    {
      id: 'disc-4',
      consumerName: 'Rajesh Varma',
      consumerNumber: '049102948192',
      discomName: 'MSEDCL',
      division: 'Nagpur East',
      sanctionedLoadKw: 10.0,
      status: 'FEASIBILITY_CLEARED',
      meterSerial: 'MTR-MH-1092',
      appNo: 'NM-MS-2026-3021',
      statutoryComplete: true,
    },
  ]);

  const filteredDiscoms = discomList.filter((d) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'FEASIBILITY') return d.status === 'FEASIBILITY_CLEARED';
    if (activeFilter === 'METER_INSTALLED') return d.status === 'METER_INSTALLED';
    if (activeFilter === 'INSPECTION') return d.status === 'INSPECTION_PENDING';
    return true;
  });

  const handleVerifyStatutoryPack = (item: any) => {
    soundEffects.playVerificationShield();
    solarGamificationService.recordAction('STAGE_ADVANCED', {
      projectName: `${item.consumerName} Statutory Interconnection Verified`,
      capacityKw: item.sanctionedLoadKw,
    });
    Alert.alert(
      'DISCOM Interconnection Sealed 🛡️',
      `All 8 statutory parameters for ${item.consumerName} (${item.discomName}) verified with zero defects. WCR Dossier ready for submission.`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* SOL COMPANION */}
      <View
        style={[
          styles.solCompanionCard,
          {
            backgroundColor: isDark ? 'rgba(13, 148, 136, 0.12)' : '#F0FDFA',
            borderColor: isDark ? 'rgba(13, 148, 136, 0.3)' : '#99F6E4',
          },
        ]}
      >
        <GuideCharacter pose="inspect" size={38} animated={false} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.solTitle, { color: isDark ? '#5EEAD4' : '#115E59' }]}>
              DISCOM Net-Metering Studio
            </Text>
            <View style={styles.solPill}>
              <Sparkles size={9} color="#0D9488" />
              <Text style={styles.solPillText}>ZERO DEFECT SEAL</Text>
            </View>
          </View>
          <Text style={[styles.solSub, { color: isDark ? '#99F6E4' : '#134E4A' }]}>
            Generates 3-page Work Completion Report (WCR) & Annexure-A with verified ALMM DCR barcodes.
          </Text>
        </View>
      </View>

      {/* FILTER CHIPS */}
      <View style={styles.filterChipRow}>
        {[
          { id: 'ALL', label: 'All Accounts' },
          { id: 'FEASIBILITY', label: 'Feasibility Cleared' },
          { id: 'METER_INSTALLED', label: 'Net-Meter Installed' },
          { id: 'INSPECTION', label: 'Inspection Pending' },
        ].map((f) => {
          const isSel = activeFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, isSel && styles.filterChipActive]}
              onPress={() => {
                soundEffects.playSelect();
                setActiveFilter(f.id as any);
              }}
            >
              <Text style={[styles.filterChipText, isSel && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.cardSectionHeader, { color: colors.text, marginTop: 12 }]}>
        Grid Interconnection Dossiers ({filteredDiscoms.length})
      </Text>

      {filteredDiscoms.map((disc) => (
        <View
          key={disc.id}
          style={[styles.quoteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Zap size={14} color="#0D9488" />
              <Text style={styles.appNoText}>{disc.appNo}</Text>
            </View>
            <Text style={[styles.quoteCustomer, { color: colors.text }]}>{disc.consumerName}</Text>
            <Text style={[styles.surveyDate, { color: colors.textSecondary }]}>
              Consumer #: {disc.consumerNumber} • {disc.discomName} ({disc.division})
            </Text>
            <Text style={[styles.surveyDate, { color: colors.textMuted }]}>
              Bi-Directional Meter: {disc.meterSerial} • Sanction: {disc.sanctionedLoadKw} kW
            </Text>

            <TouchableOpacity
              style={styles.verifyStatutoryBtn}
              onPress={() => handleVerifyStatutoryPack(disc)}
              activeOpacity={0.8}
            >
              <ShieldCheck size={14} color="#0D9488" />
              <Text style={styles.verifyStatutoryBtnText}>Verify 8-Point Statutory Seal</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusCol}>
            <View
              style={[
                styles.surveyStatusPill,
                disc.status === 'METER_INSTALLED'
                  ? { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5' }
                  : { backgroundColor: isDark ? 'rgba(13, 148, 136, 0.2)' : '#F0FDFA' },
              ]}
            >
              <Text
                style={[
                  styles.surveyStatusText,
                  disc.status === 'METER_INSTALLED' ? { color: '#047857' } : { color: '#0D9488' },
                ]}
              >
                {disc.status}
              </Text>
            </View>
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
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  solPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0D9488',
  },
  solSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#5EEAD4',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#0D9488',
  },
  cardSectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  appNoText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D9488',
  },
  quoteCustomer: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  surveyDate: {
    fontSize: 11,
    marginTop: 2,
  },
  verifyStatutoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  verifyStatutoryBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
  },
  statusCol: {
    alignItems: 'flex-end',
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
});
