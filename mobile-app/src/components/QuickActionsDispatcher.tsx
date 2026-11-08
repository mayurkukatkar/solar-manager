import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  BackHandler,
} from 'react-native';
import {
  UserPlus,
  Zap,
  QrCode,
  Receipt,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme, spacing, radii, typography } from '../theme';
import { Badge } from './common';
import { hasPermission } from '../utils/rbac';
import { haptics } from '../utils/haptics';

export interface QuickActionsDispatcherProps {
  visible: boolean;
  onClose: () => void;
  onOpenNewLead: () => void;
  onOpenQuickQuote: () => void;
  onOpenScanHardware: () => void;
  onOpenRecordPayment: () => void;
}

interface ActionDefinition {
  id: string;
  title: string;
  description: string;
  badgeLabel: string;
  badgeVariant: 'primary' | 'warning' | 'success' | 'accent';
  icon: React.ReactNode;
  iconBg: string;
  permissionCheck: (user: any) => boolean;
  onPress: () => void;
}

export const QuickActionsDispatcher: React.FC<QuickActionsDispatcherProps> = ({
  visible,
  onClose,
  onOpenNewLead,
  onOpenQuickQuote,
  onOpenScanHardware,
  onOpenRecordPayment,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  // Android Hardware Back Button
  useEffect(() => {
    if (!visible) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [visible, onClose]);

  // Operational Action Definitions
  const actions: ActionDefinition[] = [
    {
      id: 'new_lead',
      title: 'New Lead',
      description: 'Capture prospect details & power bill OCR',
      badgeLabel: 'CRM',
      badgeVariant: 'primary',
      icon: <UserPlus size={22} color={colors.primary} strokeWidth={2.2} />,
      iconBg: colors.primaryLight,
      permissionCheck: (u) => hasPermission(u, 'leads.create'),
      onPress: () => {
        haptics.impactLight();
        onClose();
        onOpenNewLead();
      },
    },
    {
      id: 'quick_quote',
      title: 'Quick Quote',
      description: 'Solar sizing, ALMM modules & PM Surya Ghar DBT',
      badgeLabel: 'Sales',
      badgeVariant: 'warning',
      icon: <Zap size={22} color="#f59e0b" strokeWidth={2.2} />,
      iconBg: isDark ? '#451a03' : '#fef3c7',
      permissionCheck: (u) =>
        hasPermission(u, 'quotations.create') || hasPermission(u, 'quotations.view'),
      onPress: () => {
        haptics.impactLight();
        onClose();
        onOpenQuickQuote();
      },
    },
    {
      id: 'scan_hardware',
      title: 'Scan Hardware',
      description: '2D barcode verification & DCR certificate',
      badgeLabel: 'Operations',
      badgeVariant: 'success',
      icon: <QrCode size={22} color="#059669" strokeWidth={2.2} />,
      iconBg: isDark ? '#064e3b' : '#d1fae5',
      permissionCheck: (u) =>
        hasPermission(u, 'operations.scan') ||
        hasPermission(u, 'hardware.scan') ||
        hasPermission(u, 'projects.edit') ||
        hasPermission(u, 'operations.view'),
      onPress: () => {
        haptics.impactLight();
        onClose();
        onOpenScanHardware();
      },
    },
    {
      id: 'record_payment',
      title: 'Record Payment',
      description: 'Create tax invoice or record milestone receipt',
      badgeLabel: 'Finance',
      badgeVariant: 'accent',
      icon: <Receipt size={22} color="#8b5cf6" strokeWidth={2.2} />,
      iconBg: isDark ? '#2e1065' : '#ede9fe',
      permissionCheck: (u) =>
        hasPermission(u, 'finance.create_invoice') ||
        hasPermission(u, 'finance.record_payment'),
      onPress: () => {
        haptics.impactLight();
        onClose();
        onOpenRecordPayment();
      },
    },
  ];

  // Authorized Action Filtering
  const authorizedActions = actions.filter((act) => act.permissionCheck(user));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheetContainer,
                {
                  backgroundColor: colors.surface,
                  paddingBottom: Math.max(insets.bottom, 24),
                },
              ]}
            >
              {/* SHEET HANDLE */}
              <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

              {/* SHEET HEADER */}
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>Quick Actions</Text>
                  <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                    Fast operational dispatch for field & office
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.closeIconBtn, { backgroundColor: colors.surfaceRecessed }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Close quick actions"
                >
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* ACTION LIST */}
              {authorizedActions.length > 0 ? (
                <View style={styles.actionsGrid}>
                  {authorizedActions.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={[
                        styles.actionCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                      onPress={action.onPress}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={action.title}
                    >
                      <View style={[styles.actionIconBox, { backgroundColor: action.iconBg }]}>
                        {action.icon}
                      </View>

                      <View style={styles.actionTextCol}>
                        <View style={styles.actionTitleRow}>
                          <Text style={[styles.actionTitle, { color: colors.text }]}>
                            {action.title}
                          </Text>
                          <Badge
                            label={action.badgeLabel}
                            variant={action.badgeVariant}
                            size="sm"
                          />
                        </View>
                        <Text
                          style={[styles.actionDescription, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {action.description}
                        </Text>
                      </View>

                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.unauthorizedBox}>
                  <ShieldAlert size={36} color={colors.warning} style={{ marginBottom: 8 }} />
                  <Text style={[styles.unauthorizedTitle, { color: colors.text }]}>
                    No Authorized Actions
                  </Text>
                  <Text style={[styles.unauthorizedSub, { color: colors.textSecondary }]}>
                    Your user role does not have authorization to trigger quick actions. Contact your tenant administrator.
                  </Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingTop: spacing[3],
    paddingHorizontal: spacing[4],
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: radii.full,
    alignSelf: 'center',
    marginBottom: spacing[3],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
    paddingHorizontal: spacing[1],
  },
  sheetTitle: {
    fontSize: typography.sizes.lead,
    fontWeight: typography.weight.bold,
  },
  sheetSubtitle: {
    fontSize: typography.sizes.caption,
    marginTop: 2,
  },
  closeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsGrid: {
    gap: spacing[2],
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1,
    minHeight: 64,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  actionTextCol: {
    flex: 1,
    marginRight: spacing[2],
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  actionTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weight.semibold,
  },
  actionDescription: {
    fontSize: typography.sizes.caption,
  },
  unauthorizedBox: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
  },
  unauthorizedTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weight.semibold,
    marginBottom: 4,
  },
  unauthorizedSub: {
    fontSize: typography.sizes.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
});
