import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  Camera,
  Image as ImageIcon,
  FolderOpen,
  Settings,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useTheme, spacing, radii, typography } from '../../theme';
import { Button } from './Button';

export type PermissionType = 'camera' | 'mediaLibrary' | 'storage';

export interface PermissionRationaleModalProps {
  visible: boolean;
  permissionType: PermissionType;
  title?: string;
  description?: string;
  statutoryReason?: string;
  isPermanentlyDenied?: boolean;
  onRequestNativePermission: () => Promise<void> | void;
  onDismiss: () => void;
  onFallbackManualEntry?: () => void;
}

export const PermissionRationaleModal: React.FC<PermissionRationaleModalProps> = ({
  visible,
  permissionType,
  title,
  description,
  statutoryReason,
  isPermanentlyDenied = false,
  onRequestNativePermission,
  onDismiss,
  onFallbackManualEntry,
}) => {
  const { colors, isDark } = useTheme();

  const getPermissionDetails = () => {
    switch (permissionType) {
      case 'camera':
        return {
          icon: <Camera size={32} color={colors.primary} />,
          defaultTitle: isPermanentlyDenied ? 'Camera Access Required in Settings' : 'Camera Access Required',
          defaultDesc: isPermanentlyDenied
            ? 'Camera permission has been disabled for WhereReady Solar OS. To scan panel barcodes or take inspection photos, enable Camera in Android Settings.'
            : 'WhereReady Solar OS needs access to your device camera to scan Tier-1 PV module barcodes and capture on-site commissioning photos.',
          defaultStatutory: 'Mandatory under PM Surya Ghar & MNRE guidelines for central DBT subsidy release and ALMM domestic content verification.',
        };
      case 'mediaLibrary':
        return {
          icon: <ImageIcon size={32} color="#059669" />,
          defaultTitle: isPermanentlyDenied ? 'Photo Gallery Access Required' : 'Photo Library Access Required',
          defaultDesc: isPermanentlyDenied
            ? 'Gallery permission has been disabled. To select KYC documents or rooftop photos, enable Photos and Videos in Android Settings.'
            : 'WhereReady Solar OS requires photo library access to upload customer KYC documents (Aadhaar, PAN, Electricity Bill) and site photos.',
          defaultStatutory: 'Required for statutory DISCOM net-metering applications and MSEDCL consumer verification.',
        };
      case 'storage':
      default:
        return {
          icon: <FolderOpen size={32} color="#d97706" />,
          defaultTitle: isPermanentlyDenied ? 'Storage Access Required' : 'Document Storage Access',
          defaultDesc: 'Access is needed to download, generate, and store statutory DISCOM forms, SLD blueprints, and milestone PDF invoices.',
          defaultStatutory: 'Statutory compliance storage for electrical inspection dossiers.',
        };
    }
  };

  const details = getPermissionDetails();

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      // Fallback
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Top Icon Badge */}
          <View style={[styles.iconCircle, { backgroundColor: colors.surfaceRecessed }]}>
            {isPermanentlyDenied ? <ShieldAlert size={32} color={colors.warning} /> : details.icon}
          </View>

          {/* Title & Description */}
          <Text style={[styles.title, { color: colors.text }]}>
            {title || details.defaultTitle}
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description || details.defaultDesc}
          </Text>

          {/* Statutory Compliance Callout */}
          <View style={[styles.statutoryBox, { backgroundColor: colors.surfaceRecessed, borderColor: colors.borderSubtle }]}>
            <ShieldCheck size={16} color={colors.primary} style={{ marginTop: 2, marginRight: 8 }} />
            <Text style={[styles.statutoryText, { color: colors.textMuted }]}>
              {statutoryReason || details.defaultStatutory}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsColumn}>
            {isPermanentlyDenied ? (
              <Button
                title="Open Android Settings"
                variant="primary"
                fullWidth
                onPress={handleOpenSettings}
                icon={<Settings size={18} color="#ffffff" />}
                style={styles.primaryBtn}
              />
            ) : (
              <Button
                title="Grant Permission"
                variant="primary"
                fullWidth
                onPress={onRequestNativePermission}
                icon={details.icon}
                style={styles.primaryBtn}
              />
            )}

            {onFallbackManualEntry && (
              <Button
                title="Enter Details Manually"
                variant="outline"
                fullWidth
                onPress={() => {
                  onDismiss();
                  onFallbackManualEntry();
                }}
                style={styles.secondaryBtn}
              />
            )}

            <TouchableOpacity style={styles.cancelLink} onPress={onDismiss} activeOpacity={0.7}>
              <Text style={[styles.cancelLinkText, { color: colors.textMuted }]}>Not Now / Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing[6],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    fontSize: typography.size.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  statutoryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing[3],
    marginBottom: spacing[6],
    width: '100%',
  },
  statutoryText: {
    flex: 1,
    fontSize: typography.size.sub,
    lineHeight: 16,
  },
  actionsColumn: {
    width: '100%',
    gap: spacing[2],
  },
  primaryBtn: {
    minHeight: 48,
  },
  secondaryBtn: {
    minHeight: 48,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  cancelLinkText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semibold,
  },
});

export default PermissionRationaleModal;
