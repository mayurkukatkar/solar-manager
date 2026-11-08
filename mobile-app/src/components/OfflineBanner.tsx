import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { offlineSyncService, QueuedMutation } from '../services/offlineSyncService';
import { useTheme } from '../theme';

export const OfflineBanner: React.FC = () => {
  const { backendStatus, checkServerConnection } = useAuth();
  const { colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();

  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ synced: number; failed: number } | null>(null);

  const slideAnim = useRef(new Animated.Value(-60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const topSafeArea = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44
  );

  // Subscribe to offline queue changes
  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((queue: QueuedMutation[]) => {
      const pending = queue.filter((m) => m.status === 'PENDING' || m.status === 'SYNCING').length;
      setPendingCount(pending);
    });
    return unsubscribe;
  }, []);

  // Determine visibility state
  const isOffline = !backendStatus.isOnline;
  const shouldBeVisible = isOffline || isSyncing || showSuccess || pendingCount > 0;

  useEffect(() => {
    if (shouldBeVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -60,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldBeVisible]);

  // Handle manual sync trigger
  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await offlineSyncService.syncQueue();
      setLastSyncResult({ synced: res.synced, failed: res.failed });
      if (res.synced > 0 && res.failed === 0) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch { } finally {
      setIsSyncing(false);
    }
  };

  if (!shouldBeVisible) return null;

  // Determine theme colors based on operational status
  let barBg = '#78350f'; // Amber dark
  let barBorder = '#d97706';
  let barText = '#fef3c7';
  let IconComponent = WifiOff;

  if (showSuccess) {
    barBg = '#064e3b'; // Emerald dark
    barBorder = '#10b981';
    barText = '#d1fae5';
    IconComponent = CheckCircle2;
  } else if (isSyncing) {
    barBg = '#1e3a8a'; // Blue dark
    barBorder = '#3b82f6';
    barText = '#dbeafe';
  } else if (lastSyncResult && lastSyncResult.failed > 0) {
    barBg = '#7f1d1d'; // Red dark
    barBorder = '#ef4444';
    barText = '#fee2e2';
    IconComponent = AlertCircle;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: topSafeArea + 4,
          backgroundColor: barBg,
          borderColor: barBorder,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.contentRow}>
        <View style={styles.labelGroup}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={barText} style={{ marginRight: 8 }} />
          ) : (
            <IconComponent size={15} color={barText} style={{ marginRight: 8 }} />
          )}

          <Text style={[styles.statusText, { color: barText }]} numberOfLines={1}>
            {showSuccess
              ? 'Back online — All updates synchronized'
              : isSyncing
                ? `Connecting... Replaying queued updates (${pendingCount})`
                : isOffline
                  ? pendingCount > 0
                    ? `Working Offline — ${pendingCount} update(s) queued for sync`
                    : 'Working Offline — Viewing local cached data'
                  : pendingCount > 0
                    ? `${pendingCount} local update(s) pending sync`
                    : 'Network connected'}
          </Text>
        </View>

        {/* Action Button: Reconnect if offline */}
        {isOffline && (
          <TouchableOpacity
            style={[styles.syncBtn, { borderColor: barText }]}
            onPress={async () => {
              if (isReconnecting) return;
              setIsReconnecting(true);
              try {
                const st = await checkServerConnection();
                if (st.isOnline && pendingCount > 0) {
                  await offlineSyncService.syncQueue();
                }
              } catch {}
              finally {
                setIsReconnecting(false);
              }
            }}
            activeOpacity={0.7}
          >
            {isReconnecting ? (
              <ActivityIndicator size="small" color={barText} style={{ marginRight: 4 }} />
            ) : (
              <RefreshCw size={12} color={barText} style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.syncBtnText, { color: barText }]}>
              {isReconnecting ? 'Connecting...' : 'Reconnect'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Action Button: Sync if online */}
        {backendStatus.isOnline && pendingCount > 0 && !isSyncing && (
          <TouchableOpacity
            style={[styles.syncBtn, { borderColor: barText }]}
            onPress={handleTriggerSync}
            activeOpacity={0.7}
          >
            <RefreshCw size={12} color={barText} style={{ marginRight: 4 }} />
            <Text style={[styles.syncBtnText, { color: barText }]}>Sync</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
});

export default OfflineBanner;
