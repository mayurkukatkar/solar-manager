import { apiClient, SafeStorage } from '../api/client';

export const CURRENT_APP_VERSION = '1.0.0';
export const CURRENT_VERSION_CODE = 1;

const STORAGE_DISMISSED_VERSION_KEY = '@solar_dismissed_update_version';

export interface AppUpdateInfo {
  hasUpdate: boolean;
  isMandatory: boolean;
  latestVersion: string;
  currentVersion: string;
  versionCode: number;
  releaseDate?: string;
  title: string;
  summary: string;
  releaseNotes: string[];
  downloadUrl: string;
  playStoreUrl?: string;
}

export const versionService = {
  getCurrentVersion(): string {
    return CURRENT_APP_VERSION;
  },

  getCurrentVersionCode(): number {
    return CURRENT_VERSION_CODE;
  },

  /**
   * Compares semver versions: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  compareVersions(v1: string, v2: string): number {
    const p1 = v1.split('.').map((n) => parseInt(n, 10) || 0);
    const p2 = v2.split('.').map((n) => parseInt(n, 10) || 0);
    const maxLen = Math.max(p1.length, p2.length);

    for (let i = 0; i < maxLen; i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  },

  /**
   * Queries the backend to determine if an update is available for this installation
   */
  async checkAppUpdate(force = false): Promise<AppUpdateInfo | null> {
    try {
      const res = await apiClient.get('/api/app/version', { timeout: 6000 });
      const data = res.data;
      if (!data || !data.latestVersion) return null;

      const hasUpdate =
        this.compareVersions(data.latestVersion, CURRENT_APP_VERSION) > 0 ||
        (data.versionCode && data.versionCode > CURRENT_VERSION_CODE);

      if (!hasUpdate) return null;

      // Check if user dismissed this specific version previously (unless mandatory or forced check)
      if (!force && !data.isMandatory) {
        const dismissedVersion = await SafeStorage.getItem(STORAGE_DISMISSED_VERSION_KEY);
        if (dismissedVersion === data.latestVersion) {
          return null;
        }
      }

      return {
        hasUpdate: true,
        isMandatory: Boolean(data.isMandatory),
        latestVersion: data.latestVersion,
        currentVersion: CURRENT_APP_VERSION,
        versionCode: data.versionCode || 2,
        releaseDate: data.releaseDate,
        title: data.title || `WhereReady Solar OS v${data.latestVersion} Ready!`,
        summary: data.summary || 'A new updated version is ready with performance fixes and new features.',
        releaseNotes: Array.isArray(data.releaseNotes) ? data.releaseNotes : [],
        downloadUrl: data.downloadUrl || 'https://solar-manager-three.vercel.app/download/whereready-solar-os-latest.apk',
        playStoreUrl: data.playStoreUrl,
      };
    } catch (err: any) {
      // Non-blocking error handling
      console.warn('App version check note:', err?.message || err);
      return null;
    }
  },

  async dismissUpdate(version: string): Promise<void> {
    try {
      await SafeStorage.setItem(STORAGE_DISMISSED_VERSION_KEY, version);
    } catch {}
  },

  async clearDismissedUpdate(): Promise<void> {
    try {
      await SafeStorage.removeItem(STORAGE_DISMISSED_VERSION_KEY);
    } catch {}
  },
};

