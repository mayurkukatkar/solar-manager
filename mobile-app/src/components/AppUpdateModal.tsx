import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import {
  Download,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react-native';
import { GuideCharacter } from './GuideCharacter';
import { versionService, AppUpdateInfo } from '../services/versionService';
import { useTheme } from '../theme';

export interface AppUpdateModalProps {
  forceVisible?: boolean;
  onDismiss?: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  forceVisible = false,
  onDismiss,
}) => {
  const { colors, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);

  useEffect(() => {
    checkVersion();
  }, [forceVisible]);

  const checkVersion = async () => {
    const info = await versionService.checkAppUpdate(forceVisible);
    if (info && info.hasUpdate) {
      setUpdateInfo(info);
      setVisible(true);
    } else if (forceVisible) {
      // If forced check but already on latest
      setVisible(false);
      if (onDismiss) onDismiss();
    }
  };

  const handleUpdatePress = async () => {
    if (!updateInfo) return;
    const targetUrl =
      Platform.OS === 'android' && updateInfo.playStoreUrl
        ? updateInfo.playStoreUrl
        : updateInfo.downloadUrl;

    try {
      const supported = await Linking.canOpenURL(targetUrl);
      if (supported) {
        await Linking.openURL(targetUrl);
      } else {
        await Linking.openURL(updateInfo.downloadUrl);
      }
    } catch {
      await Linking.openURL(updateInfo.downloadUrl);
    }
  };

  const handleDismiss = async () => {
    if (updateInfo) {
      await versionService.dismissUpdate(updateInfo.latestVersion);
    }
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!visible || !updateInfo) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={updateInfo.isMandatory ? undefined : handleDismiss}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.borderSubtle : '#E2E8F0',
            },
          ]}
        >
          {/* HEADER ROW */}
          <View style={styles.headerRow}>
            <View style={styles.badgeRow}>
              <View style={styles.updateBadge}>
                <Sparkles size={11} color="#FFFFFF" />
                <Text style={styles.updateBadgeText}>UPDATE AVAILABLE</Text>
              </View>
              <View style={[styles.versionPill, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                <Text style={[styles.versionPillText, { color: isDark ? '#94A3B8' : '#475569' }]}>
                  v{updateInfo.currentVersion} → <Text style={{ color: '#0066FF', fontWeight: '800' }}>v{updateInfo.latestVersion}</Text>
                </Text>
              </View>
            </View>

            {!updateInfo.isMandatory && (
              <TouchableOpacity
                onPress={handleDismiss}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close update dialog"
              >
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* SOL MASCOT IN CELEBRATE POSE */}
          <View style={styles.mascotArea}>
            <GuideCharacter
              pose="celebrate"
              size={82}
              speechText="New update ready!"
              animated={true}
            />
          </View>

          {/* TITLE & SUMMARY */}
          <Text style={[styles.title, { color: isDark ? colors.text : '#0F172A' }]}>
            {updateInfo.title}
          </Text>
          <Text style={[styles.summary, { color: isDark ? '#94A3B8' : '#475569' }]}>
            {updateInfo.summary}
          </Text>

          {/* WHAT'S NEW BULLET POINTS */}
          <View style={[styles.notesContainer, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.borderSubtle }]}>
            <Text style={[styles.notesHeader, { color: isDark ? colors.text : '#0F172A' }]}>
              WHAT'S NEW IN THIS VERSION:
            </Text>
            <ScrollView style={styles.notesScroll} showsVerticalScrollIndicator={false}>
              {updateInfo.releaseNotes.map((note, idx) => (
                <View key={idx} style={styles.noteItem}>
                  <CheckCircle2 size={13} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
                  <Text style={[styles.noteText, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                    {note}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionRow}>
            {!updateInfo.isMandatory && (
              <TouchableOpacity
                style={[
                  styles.laterBtn,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={handleDismiss}
                activeOpacity={0.7}
              >
                <Text style={[styles.laterBtnText, { color: colors.textSecondary }]}>
                  Remind Later
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.updateBtn, { flex: updateInfo.isMandatory ? 1 : 2 }]}
              onPress={handleUpdatePress}
              activeOpacity={0.88}
            >
              <Download size={15} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
              <Text style={styles.updateBtnText}>
                Download & Install v{updateInfo.latestVersion}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AppUpdateModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0066FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  updateBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  versionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  versionPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  mascotArea: {
    alignItems: 'center',
    marginVertical: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  summary: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 12,
  },
  notesContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    maxHeight: 180,
  },
  notesHeader: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  notesScroll: {
    maxHeight: 140,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  laterBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

