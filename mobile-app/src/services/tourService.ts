import { SafeStorage } from '../api/client';

export const APP_ONBOARDING_STORAGE_KEY = '@solar_app_onboarding_completed_v1';
export const INSTALLER_GUIDE_STORAGE_KEY = '@solar_installer_guide_completed_v1';
export const TOUR_GLOBAL_STORAGE_KEY = '@solar_tour_completed';
export const DASHBOARD_TOUR_BANNER_KEY = '@solar_dashboard_tour_banner_dismissed';

let inMemoryTourCompleted: boolean | null = null;
let inMemoryBannerDismissed: boolean | null = null;

export const tourService = {
  /**
   * Returns whether the tour or onboarding has already been completed or dismissed.
   * Checks in-memory cache, global storage keys, and optional per-user key.
   * Ensures the tour ONLY ever shows for a genuine first-time user and NEVER repeats.
   */
  async isTourCompleted(userId?: string | null): Promise<boolean> {
    if (inMemoryTourCompleted === true) {
      return true;
    }

    try {
      // 1. Check global tour key
      const globalDone = await SafeStorage.getItem(TOUR_GLOBAL_STORAGE_KEY);
      if (globalDone === 'true' || globalDone === '1') {
        inMemoryTourCompleted = true;
        return true;
      }

      // 2. Check App Onboarding key
      const onboardingDone = await SafeStorage.getItem(APP_ONBOARDING_STORAGE_KEY);
      if (onboardingDone === 'true' || onboardingDone === '1') {
        inMemoryTourCompleted = true;
        return true;
      }

      // 3. Check Installer Guide key
      const installerDone = await SafeStorage.getItem(INSTALLER_GUIDE_STORAGE_KEY);
      if (installerDone === 'true' || installerDone === '1') {
        inMemoryTourCompleted = true;
        return true;
      }

      // 4. Check user-specific key if userId provided
      if (userId) {
        const userDone = await SafeStorage.getItem(`@solar_tour_seen_${userId}`);
        if (userDone === 'true' || userDone === '1') {
          inMemoryTourCompleted = true;
          return true;
        }
      }

      return false;
    } catch {
      // In case of storage read errors, default to suppressing rather than repeatedly bugging the user
      return inMemoryTourCompleted ?? true;
    }
  },

  /**
   * Permanently marks the tour as completed across all storage keys and updates in-memory cache.
   */
  async markTourCompleted(userId?: string | null): Promise<void> {
    inMemoryTourCompleted = true;
    try {
      const writes: Promise<void>[] = [
        SafeStorage.setItem(TOUR_GLOBAL_STORAGE_KEY, 'true'),
        SafeStorage.setItem(APP_ONBOARDING_STORAGE_KEY, 'true'),
        SafeStorage.setItem(INSTALLER_GUIDE_STORAGE_KEY, 'true'),
      ];

      if (userId) {
        writes.push(SafeStorage.setItem(`@solar_tour_seen_${userId}`, 'true'));
      }

      await Promise.all(writes);
    } catch {
      // Best-effort persistence; memory flag is already set
    }
  },

  /**
   * Checks whether the user has dismissed the dashboard spotlight button tour banner.
   */
  async isDashboardBannerDismissed(): Promise<boolean> {
    if (inMemoryBannerDismissed !== null) {
      return inMemoryBannerDismissed;
    }

    try {
      const dismissed = await SafeStorage.getItem(DASHBOARD_TOUR_BANNER_KEY);
      const isDismissed = dismissed === 'true' || dismissed === '1';
      inMemoryBannerDismissed = isDismissed;
      return isDismissed;
    } catch {
      return false;
    }
  },

  /**
   * Permanently dismisses the dashboard button tour banner.
   */
  async dismissDashboardBanner(): Promise<void> {
    inMemoryBannerDismissed = true;
    try {
      await SafeStorage.setItem(DASHBOARD_TOUR_BANNER_KEY, 'true');
    } catch {
      // Best-effort persistence
    }
  },

  /**
   * Explicit reset (only invoked if user taps "Replay Product Tour" in Settings/Profile).
   */
  async resetTour(userId?: string | null): Promise<void> {
    inMemoryTourCompleted = false;
    inMemoryBannerDismissed = false;
    try {
      const removes: Promise<void>[] = [
        SafeStorage.removeItem(TOUR_GLOBAL_STORAGE_KEY),
        SafeStorage.removeItem(APP_ONBOARDING_STORAGE_KEY),
        SafeStorage.removeItem(INSTALLER_GUIDE_STORAGE_KEY),
        SafeStorage.removeItem(DASHBOARD_TOUR_BANNER_KEY),
      ];

      if (userId) {
        removes.push(SafeStorage.removeItem(`@solar_tour_seen_${userId}`));
      }

      await Promise.all(removes);
    } catch {}
  },
};

export default tourService;

