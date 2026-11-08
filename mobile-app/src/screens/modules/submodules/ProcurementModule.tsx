import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Truck } from 'lucide-react-native';
import { procurementApi } from '../../../api/endpoints';
import { EmptyState, SkeletonLoader } from '../../../components/common';
import { useTheme } from '../../../theme';

export interface ProcurementModuleProps {
  onClose: () => void;
  initialParams?: any;
}

export const ProcurementModule: React.FC<ProcurementModuleProps> = ({
  onClose,
  initialParams,
}) => {
  const { colors } = useTheme();

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loadingProcurement, setLoadingProcurement] = useState(false);

  useEffect(() => {
    fetchProcurement();
  }, []);

  const fetchProcurement = async () => {
    setLoadingProcurement(true);
    try {
      const res = await procurementApi.getPurchaseOrders();
      if (res?.purchaseOrders) {
        setPurchaseOrders(res.purchaseOrders);
      }
    } catch (err: any) {
      console.warn('Procurement fetch notice:', err.message);
    } finally {
      setLoadingProcurement(false);
    }
  };

  const inventoryItems = [
    {
      id: 'inv-1',
      title: 'Waaree 550Wp Mono PERC PV Modules (DCR Compliant)',
      category: 'Supplier: Waaree Solar • Status: In Stock',
      stock: '48 Units',
    },
    {
      id: 'inv-2',
      title: 'Growatt 3.3kW & 5kW Dual-MPPT Inverters',
      category: 'Supplier: Growatt New Energy • Status: In Stock',
      stock: '6 Units',
    },
    {
      id: 'inv-3',
      title: 'HDG Elevated Rooftop Structure Kits (60-80μ)',
      category: 'Supplier: Metalkraft Infra • Status: In Transit',
      stock: '4 Kits',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.cardSectionHeader, { color: colors.text }]}>
        Procurement & Stock Status
      </Text>

      <View style={{ gap: 10 }}>
        {inventoryItems.map((item) => (
          <View
            key={item.id}
            style={[styles.inventoryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.invTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.invCategory, { color: colors.textSecondary }]}>{item.category}</Text>
            </View>
            <Text style={[styles.invStock, { color: colors.primary }]}>{item.stock}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.cardSectionHeader, { marginTop: 24, color: colors.text }]}>
        Purchase Orders ({purchaseOrders.length})
      </Text>

      {loadingProcurement ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <SkeletonLoader.Card />
        </View>
      ) : purchaseOrders.length === 0 ? (
        <EmptyState
          icon={<Truck size={32} color={colors.textSecondary} />}
          title="No Purchase Orders"
          description="Purchase orders created for module, inverter, and BOS procurement will appear here."
          compact
        />
      ) : (
        purchaseOrders.map((po) => (
          <View
            key={po.id}
            style={[styles.inventoryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.invTitle, { color: colors.text }]}>{po.poNumber || 'PO-RECORD'}</Text>
              <Text style={[styles.invCategory, { color: colors.textSecondary }]}>
                Vendor: {po.vendorName || 'Supplier'} • Status: {po.status || 'ORDERED'}
              </Text>
            </View>
            <Text style={[styles.invStock, { color: '#059669' }]}>
              ₹{(po.totalAmount || 0).toLocaleString('en-IN')}
            </Text>
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
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  invTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  invCategory: {
    fontSize: 11,
    marginTop: 3,
  },
  invStock: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 8,
  },
});
