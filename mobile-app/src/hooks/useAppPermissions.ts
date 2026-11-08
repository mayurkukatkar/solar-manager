import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export type PermissionKind = 'camera' | 'mediaLibrary';

export interface AppPermissionState {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export function useAppPermissions() {
  const [cameraPerm, requestCameraNative] = useCameraPermissions();
  const [mediaLibraryStatus, setMediaLibraryStatus] = useState<ImagePicker.PermissionResponse | null>(null);
  const [rationaleVisible, setRationaleVisible] = useState(false);
  const [activeKind, setActiveKind] = useState<PermissionKind>('camera');
  const [isPermanentlyDenied, setIsPermanentlyDenied] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // Refresh status from OS
  const refreshPermissions = useCallback(async () => {
    try {
      const ml = await ImagePicker.getMediaLibraryPermissionsAsync();
      setMediaLibraryStatus(ml);
    } catch {}
  }, []);

  // Listen to AppState (when user returns from Android Settings app)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshPermissions();
      }
    });
    refreshPermissions();
    return () => subscription.remove();
  }, [refreshPermissions]);

  /**
   * Request Camera with graceful rationale and permanent denial handling
   */
  const requestCamera = useCallback(async (onGranted?: () => void): Promise<boolean> => {
    // 1. Check if already granted
    if (cameraPerm?.granted) {
      if (onGranted) onGranted();
      return true;
    }

    // 2. Check if permanently denied on Android
    if (cameraPerm && !cameraPerm.granted && !cameraPerm.canAskAgain) {
      setActiveKind('camera');
      setIsPermanentlyDenied(true);
      setRationaleVisible(true);
      if (onGranted) setPendingCallback(() => onGranted);
      return false;
    }

    // 3. Request native permission
    const result = await requestCameraNative();
    if (result.granted) {
      if (onGranted) onGranted();
      return true;
    }

    // 4. Denied after prompt
    setActiveKind('camera');
    setIsPermanentlyDenied(!result.canAskAgain);
    setRationaleVisible(true);
    if (onGranted) setPendingCallback(() => onGranted);
    return false;
  }, [cameraPerm, requestCameraNative]);

  /**
   * Request Media Library with graceful rationale
   */
  const requestMediaLibrary = useCallback(async (onGranted?: () => void): Promise<boolean> => {
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    setMediaLibraryStatus(current);

    if (current.granted) {
      if (onGranted) onGranted();
      return true;
    }

    if (!current.canAskAgain) {
      setActiveKind('mediaLibrary');
      setIsPermanentlyDenied(true);
      setRationaleVisible(true);
      if (onGranted) setPendingCallback(() => onGranted);
      return false;
    }

    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setMediaLibraryStatus(result);
    if (result.granted) {
      if (onGranted) onGranted();
      return true;
    }

    setActiveKind('mediaLibrary');
    setIsPermanentlyDenied(!result.canAskAgain);
    setRationaleVisible(true);
    if (onGranted) setPendingCallback(() => onGranted);
    return false;
  }, []);

  return {
    cameraGranted: Boolean(cameraPerm?.granted),
    mediaLibraryGranted: Boolean(mediaLibraryStatus?.granted),
    rationaleVisible,
    activeKind,
    isPermanentlyDenied,
    requestCamera,
    requestMediaLibrary,
    closeRationale: () => {
      setRationaleVisible(false);
      setPendingCallback(null);
    },
    handleNativeRequest: async () => {
      if (activeKind === 'camera') {
        const res = await requestCameraNative();
        if (res.granted) {
          setRationaleVisible(false);
          if (pendingCallback) pendingCallback();
        } else {
          setIsPermanentlyDenied(!res.canAskAgain);
        }
      } else {
        const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (res.granted) {
          setRationaleVisible(false);
          if (pendingCallback) pendingCallback();
        } else {
          setIsPermanentlyDenied(!res.canAskAgain);
        }
      }
    },
  };
}

export default useAppPermissions;
