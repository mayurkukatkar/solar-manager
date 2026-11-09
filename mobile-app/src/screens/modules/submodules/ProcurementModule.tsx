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
} from 'react-native';
import {
  Truck,
  Box,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Plus,
  X,
  ShieldCheck,
  Check,
} from 'lucide-react-native';
import { procurementApi } from '../../../api/endpoints';
import { EmptyState, SkeletonLoader } from '../../../components/common';
import { GuideCharacter } from '../../../components/GuideCharacter';
import { CelebrationModal } from '../../../components/CelebrationModal';
import { soundEffects } from '../../../utils/audioEffects';
import { solarGamificationService } from '../../../services/solarGamificationService';
import { useTheme } from '../../../theme';

export interface ProcurementModuleProps {
  onClose: () => void;
  initialParams?: any;
}

interface InventoryItem {
  id: string;
  title: string;
  sku: string;
  supplier: string;
  status: 'IN_STOCK' | 'IN_TRANSIT' | 'LOW_STOCK';
  stock: number;
  unit: string;
  runway: string;
  dcrCompliant: boolean;
}

export const ProcurementModule: React.FC<ProcurementModuleProps> = ({
  onClose,
  initialParams,
}) => {
  const { colors, isDark } = useTheme();

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loadingProcurement, setLoadingProcurement] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'IN_STOCK' | 'IN_TRANSIT' | 'LOW_STOCK'>('ALL');

  // Interactive BOM Dispatch Checklist for active project
  const [bomChecklist, setBomChecklist] = useState([
    { id: 'b1', name: 'Waaree 550Wp DCR Mono PERC Panels (6 Units)', checked: true },
    { id: 'b2', name: 'Growatt 3.3kW Dual-MPPT Inverter + WiFi Stick', checked: true },
    { id: 'b3', name: 'HDG 80μ Elevated Rooftop Structure Kit', checked: false },
    { id: 'b4', name: 'ACDB & DCDB Boxes with Type-II SPD Protectors', checked: true },
    { id: 'b5', name: 'Polycab 4 sq.mm UV Solar DC Cable (60m)', checked: false },
    { id: 'b6', name: '3x Chemical Earthing Electrodes & BFC Compound', checked: false },
  ]);

  // Inventory State
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: 'inv-1',
      title: 'Waaree 550Wp Mono PERC PV Modules',
      sku: 'WAA-550-DCR',
      supplier: 'Waaree Energies Ltd',
      status: 'IN_STOCK',
      stock: 48,
      unit: 'Panels',
      runway: '8 Projects (~26 kWp)',
      dcrCompliant: true,
    },
    {
      id: 'inv-2',
      title: 'Growatt 3.3kW & 5kW Dual-MPPT Inverters',
      sku: 'GRW-MIC-3300TL',
      supplier: 'Growatt New Energy',
      status: 'LOW_STOCK',
      stock: 2,
      unit: 'Units',
      runway: '2 Projects (Reorder Urgently)',
      dcrCompliant: false,
    },
    {
      id: 'inv-3',
      title: 'HDG Elevated Rooftop Structure Kits (60-80μ)',
      sku: 'STR-HDG-ELEV-03',
      supplier: 'Metalkraft Infra',
      status: 'IN_TRANSIT',
      stock: 4,
      unit: 'Kits',
      runway: 'Arriving Tomorrow',
      dcrCompliant: false,
    },
    {
      id: 'inv-4',
      title: 'Polycab 4 sq.mm UV-Resistant Solar DC Cable',
      sku: 'POL-DC-4MM',
      supplier: 'Polycab India Ltd',
      status: 'IN_STOCK',
      stock: 1200,
      unit: 'Meters',
      runway: '20 Projects',
      dcrCompliant: true,
    },
    {
      id: 'inv-5',
      title: 'Copper-Bonded Chemical Earthing Rods (17.2mm)',
      sku: 'EARTH-CP-172',
      supplier: 'TruePower Earthings',
      status: 'IN_STOCK',
      stock: 18,
      unit: 'Rods',
      runway: '6 Projects',
      dcrCompliant: true,
    },
  ]);

  // Create PO Modal
  const [createPoVisible, setCreatePoVisible] = useState(false);
  const [poVendorInput, setPoVendorInput] = useState('Waaree Energies Ltd');
  const [poItemInput, setPoItemInput] = useState('550Wp Mono PERC DCR Modules (30 Units)');
  const [poAmountInput, setPoAmountInput] = useState('275000');
  const [submittingPo, setSubmittingPo] = useState(false);

  // Celebration state
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationData, setCelebrationData] = useState({
    title: '',
    subtitle: '',
    xp: 50,
  });

  useEffect(() => {
    fetchProcurement();
  }, []);

  const fetchProcurement = async () => {
    setLoadingProcurement(true);
    try {
      const res = await procurementApi.getPurchaseOrders();
      if (res?.purchaseOrders && Array.isArray(res.purchaseOrders)) {
        setPurchaseOrders(res.purchaseOrders);
      }
    } catch (err: any) {
      console.warn('Procurement fetch notice:', err.message);
    } finally {
      setLoadingProcurement(false);
    }
  };

  const handleToggleBomItem = (id: string) => {
    soundEffects.playSelect();
    const updated = bomChecklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setBomChecklist(updated);

    const allChecked = updated.every((i) => i.checked);
    if (allChecked) {
      soundEffects.playCelebrationFanfare();
      solarGamificationService.recordAction('QA_CERTIFIED', {
        projectName: 'BOM Material Dispatch 100% Verified',
      });
      setCelebrationData({
        title: 'BOM Kit 100% Ready for Dispatch!',
        subtitle: 'All Tier-1 modules, inverter, structures & earthing gear confirmed for site delivery.',
        xp: 75,
      });
      setCelebrationVisible(true);
    }
  };

  const handleCreatePo = async () => {
    if (!poVendorInput.trim() || !poItemInput.trim()) {
      Alert.alert('Required Fields', 'Please enter vendor and item details.');
      return;
    }
    setSubmittingPo(true);
    try {
      const amount = parseFloat(poAmountInput) || 0;
      const res = await procurementApi.createPurchaseOrder({
        vendorName: poVendorInput.trim(),
        itemsDescription: poItemInput.trim(),
        totalAmount: amount,
        status: 'ORDERED',
      });
      soundEffects.playCashChime();
      solarGamificationService.recordAction('STAGE_ADVANCED', {
        projectName: `PO Issued: ${poVendorInput}`,
      });
      Alert.alert('PO Issued Successfully', `Purchase Order PO-${Date.now().toString().slice(-4)} sent to ${poVendorInput}.`);
      setCreatePoVisible(false);
      setPoVendorInput('Waaree Energies Ltd');
      setPoItemInput('');
      setPoAmountInput('');
      fetchProcurement();
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'PO generated in offline buffer.');
      setCreatePoVisible(false);
    } finally {
      setSubmittingPo(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.status === activeFilter;
  });

  const checkedCount = bomChecklist.filter((b) => b.checked).length;
  const dispatchProgress = Math.round((checkedCount / bomChecklist.length) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      {/* SOL MASCOT COMPANION */}
      <GuideCharacter
        pose="inspect"
        speechText="Smart Supply Chain Radar! Tracking ALMM DCR solar panels, inverters & galvanized structure kits with zero project delay."
      />

      {/* DISPATCH READINESS RADAR */}
      <View
        style={[
          styles.dispatchCard,
          {
            backgroundColor: isDark ? '#1E293B' : '#F0FDF4',
            borderColor: isDark ? '#065F46' : '#BBF7D0',
          },
        ]}
      >
        <View style={styles.dispatchHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={18} color="#059669" />
              <Text style={[styles.dispatchTitle, { color: isDark ? '#34D399' : '#065F46' }]}>
                BOM Dispatch Readiness
              </Text>
            </View>
            <Text style={[styles.dispatchSubtitle, { color: colors.textSecondary }]}>
              Active Site: Deshmukh Residence (3.3 kWp)
            </Text>
          </View>
          <View style={styles.progressPill}>
            <Text style={styles.progressPillText}>{dispatchProgress}% READY</Text>
          </View>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${dispatchProgress}%` }]} />
        </View>

        {/* CHECKLIST ITEMS */}
        <View style={{ gap: 8, marginTop: 12 }}>
          {bomChecklist.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.bomRow,
                {
                  backgroundColor: item.checked
                    ? (isDark ? 'rgba(5, 150, 105, 0.15)' : '#FFFFFF')
                    : colors.surface,
                  borderColor: item.checked
                    ? (isDark ? '#059669' : '#86EFAC')
                    : colors.border,
                },
              ]}
              onPress={() => handleToggleBomItem(item.id)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkCircle,
                  item.checked && { backgroundColor: '#059669', borderColor: '#059669' },
                ]}
              >
                {item.checked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text
                style={[
                  styles.bomText,
                  {
                    color: item.checked ? colors.text : colors.textSecondary,
                    textDecorationLine: item.checked ? 'line-through' : 'none',
                  },
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* INVENTORY RUNWAY & STOCK SECTION */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Hardware & Stock Runway</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Live warehouse balance & supplier lead times
          </Text>
        </View>
        <TouchableOpacity
          style={styles.reorderBtn}
          onPress={() => {
            soundEffects.playSelect();
            setCreatePoVisible(true);
          }}
          activeOpacity={0.85}
        >
          <Plus size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.reorderBtnText}>New PO</Text>
        </TouchableOpacity>
      </View>

      {/* FILTER CHIPS */}
      <View style={styles.filterRow}>
        {(['ALL', 'IN_STOCK', 'IN_TRANSIT', 'LOW_STOCK'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.filterTab,
              { borderColor: colors.border, backgroundColor: colors.background },
              activeFilter === tab && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => {
              soundEffects.playGlide();
              setActiveFilter(tab);
            }}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: colors.textSecondary },
                activeFilter === tab && { color: '#ffffff', fontWeight: '800' },
              ]}
            >
              {tab.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* INVENTORY LIST */}
      <View style={{ gap: 10, marginTop: 12 }}>
        {filteredInventory.map((item) => {
          const isLow = item.status === 'LOW_STOCK';
          const isTransit = item.status === 'IN_TRANSIT';
          return (
            <View
              key={item.id}
              style={[
                styles.inventoryCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isLow ? '#EF4444' : isTransit ? '#F59E0B' : colors.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.invTitle, { color: colors.text }]}>{item.title}</Text>
                  {item.dcrCompliant && (
                    <View style={styles.dcrBadge}>
                      <Text style={styles.dcrBadgeText}>ALMM DCR</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.invSub, { color: colors.textSecondary }]}>
                  {item.supplier} • SKU: {item.sku}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  <Clock size={12} color={colors.textMuted} />
                  <Text style={[styles.runwayText, { color: isLow ? '#EF4444' : colors.textMuted }]}>
                    Runway: {item.runway}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                <Text style={[styles.stockQty, { color: isLow ? '#EF4444' : colors.primary }]}>
                  {item.stock} {item.unit}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isLow
                        ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2')
                        : isTransit
                          ? (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB')
                          : (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5'),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color: isLow ? '#EF4444' : isTransit ? '#D97706' : '#059669',
                      },
                    ]}
                  >
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* PURCHASE ORDERS AUDIT LOG */}
      <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 10, color: colors.text }]}>
        Purchase Orders & Supplier Invoices ({purchaseOrders.length})
      </Text>

      {loadingProcurement ? (
        <View style={{ gap: 10 }}>
          <SkeletonLoader.Card />
          <SkeletonLoader.Card />
        </View>
      ) : purchaseOrders.length === 0 ? (
        <EmptyState
          icon={<Truck size={32} color={colors.textSecondary} />}
          title="No Active POs"
          description="Purchase orders created for solar panels, inverters & BOS will appear here."
          compact
        />
      ) : (
        purchaseOrders.map((po) => (
          <View
            key={po.id}
            style={[styles.inventoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.invTitle, { color: colors.text }]}>
                {po.poNumber || 'PO-SUPPLY'}
              </Text>
              <Text style={[styles.invSub, { color: colors.textSecondary }]}>
                Vendor: {po.vendorName || 'Solar Vendor'} • {po.itemsDescription || 'BOM Package'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.stockQty, { color: '#059669' }]}>
                ₹{(po.totalAmount || 0).toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.invSub, { color: colors.textMuted }]}>
                {po.status || 'ORDERED'}
              </Text>
            </View>
          </View>
        ))
      )}

      {/* CREATE PO MODAL */}
      <Modal
        visible={createPoVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreatePoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>New Purchase Order</Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                  Issue equipment requisition to Tier-1 solar suppliers
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.background }]}
                onPress={() => setCreatePoVisible(false)}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>VENDOR / SUPPLIER</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={poVendorInput}
                onChangeText={setPoVendorInput}
                placeholder="e.g. Waaree, Adani, Growatt"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ITEMS / BILL OF MATERIALS</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, height: 80 }]}
                value={poItemInput}
                onChangeText={setPoItemInput}
                placeholder="e.g. 550Wp Mono PERC DCR Modules (30 Units)"
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ESTIMATED AMOUNT (₹)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={poAmountInput}
                onChangeText={setPoAmountInput}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity
                style={styles.submitPoBtn}
                onPress={handleCreatePo}
                disabled={submittingPo}
                activeOpacity={0.85}
              >
                <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitPoBtnText}>
                  {submittingPo ? 'Issuing PO...' : 'Confirm & Issue Purchase Order'}
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
        stageName="BOM Dispatch Confirmed"
        xpAwarded={celebrationData.xp}
        peaceOfMindPoints={[
          'All solar hardware physically verified against project BOM',
          'DCR compliance certificates verified for subsidy eligibility',
          'Field technicians informed of incoming site arrival',
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
  dispatchCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginTop: 14,
    marginBottom: 20,
  },
  dispatchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dispatchTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  dispatchSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  progressPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  progressPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  bomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bomText: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  reorderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 10,
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inventoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  invTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  dcrBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dcrBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  invSub: {
    fontSize: 11,
    marginTop: 3,
  },
  runwayText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stockQty: {
    fontSize: 14,
    fontWeight: '900',
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  submitPoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  submitPoBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
