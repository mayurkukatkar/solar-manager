import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

export interface OtaUpdateStatus {
  isEnabled: boolean;
  isEmbedded: boolean;
  updateId: string | null;
  runtimeVersion: string | null;
  channel: string | null;
  createdAt: Date | null;
}

export const otaUpdateService = {
  isChecking: false,

  getStatus(): OtaUpdateStatus {
    return {
      isEnabled: Updates.isEnabled,
      isEmbedded: Updates.isEmbeddedLaunch,
      updateId: Updates.updateId,
      runtimeVersion: Updates.runtimeVersion,
      channel: Updates.channel,
      createdAt: Updates.createdAt,
    };
  },

  /**
   * Checks for updates from the EAS Update server and downloads + reloads if available.
   * If silent is true, runs without user-facing alert popups unless an update is applying.
   */
  async checkAndApplyUpdate(options: { silent?: boolean } = {}): Promise<{
    available: boolean;
    reloaded: boolean;
    message?: string;
  }> {
    const { silent = true } = options;

    if (__DEV__) {
      if (!silent) {
        Alert.alert('Development Mode', 'OTA cloud updates are disabled in local development mode.');
      }
      return { available: false, reloaded: false, message: 'Development mode' };
    }

    if (!Updates.isEnabled) {
      if (!silent) {
        Alert.alert(
          'Updates Disabled',
          'Cloud updates are not supported in this runtime environment. Please download the latest APK build.'
        );
      }
      return { available: false, reloaded: false, message: 'Updates disabled' };
    }

    if (this.isChecking) {
      return { available: false, reloaded: false, message: 'Check already in progress' };
    }

    this.isChecking = true;

    try {
      const check = await Updates.checkForUpdateAsync();

      if (check.isAvailable) {
        if (!silent) {
          Alert.alert('Update Found', 'A new update was found. Downloading now...');
        }

        const fetchResult = await Updates.fetchUpdateAsync();

        if (fetchResult.isNew) {
          // Instruct native runtime to restart the JS bundle with the new update
          await Updates.reloadAsync();
          return { available: true, reloaded: true };
        } else {
          return { available: true, reloaded: false, message: 'Update already cached' };
        }
      } else {
        if (!silent) {
          Alert.alert('Up to Date', 'Your app is already running the latest version.');
        }
        return { available: false, reloaded: false, message: 'Already up to date' };
      }
    } catch (err: any) {
      const msg = err?.message || 'Could not verify updates with EAS server.';
      console.warn('OTA check error:', msg);
      if (!silent) {
        Alert.alert('Update Check', `Could not fetch update: ${msg}`);
      }
      return { available: false, reloaded: false, message: msg };
    } finally {
      this.isChecking = false;
    }
  },
};
