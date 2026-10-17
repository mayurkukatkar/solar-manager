import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, BackendConnectionStatus } from '../types';
import {
  SafeStorage,
  getApiBaseUrl,
  setApiBaseUrl,
  checkBackendHealth,
  setUnauthorizedHandler,
} from '../api/client';
import { authApi } from '../api/endpoints';

export interface LoginResult {
  success: boolean;
  requiresPasswordReset?: boolean;
  email?: string;
  error?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  sessionExpired: boolean;
  backendStatus: BackendConnectionStatus;
  login: (email: string, password: string) => Promise<LoginResult>;
  forceResetPassword: (
    email: string,
    tempPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateServerUrl: (newUrl: string) => Promise<BackendConnectionStatus>;
  checkServerConnection: () => Promise<BackendConnectionStatus>;
  clearSessionExpired: () => void;
}

const STORAGE_AUTH_TOKEN_KEY = '@solar_user_token';
const STORAGE_USER_PROFILE_KEY = '@solar_user_profile';

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  sessionExpired: false,
  backendStatus: { isOnline: true, serverUrl: 'https://solar-manager-three.vercel.app' },
  login: async () => ({ success: false }),
  forceResetPassword: async () => ({ success: false }),
  logout: async () => {},
  updateServerUrl: async () => ({ isOnline: false, serverUrl: '' }),
  checkServerConnection: async () => ({ isOnline: false, serverUrl: '' }),
  clearSessionExpired: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendConnectionStatus>({
    isOnline: true,
    serverUrl: 'https://solar-manager-three.vercel.app',
  });

  const handleSessionExpiry = useCallback(async () => {
    setUser(null);
    setToken(null);
    setSessionExpired(true);
    await SafeStorage.removeItem(STORAGE_AUTH_TOKEN_KEY);
    await SafeStorage.removeItem(STORAGE_USER_PROFILE_KEY);
  }, []);

  useEffect(() => {
    // Register global 401 interceptor handler
    setUnauthorizedHandler(handleSessionExpiry);
    initSession();
  }, [handleSessionExpiry]);

  const initSession = async () => {
    try {
      const initialStatus = await checkBackendHealth();
      setBackendStatus(initialStatus);

      const storedToken = await SafeStorage.getItem(STORAGE_AUTH_TOKEN_KEY);
      const storedUser = await SafeStorage.getItem(STORAGE_USER_PROFILE_KEY);

      if (storedToken && storedUser) {
        // Validate session against live backend
        try {
          const meData = await authApi.getMe();
          if (meData?.user) {
            const verifiedProfile: UserProfile = {
              id: meData.user.id,
              name: meData.user.name,
              email: meData.user.email,
              role: meData.user.role,
              tenantName: meData.user.tenant?.name || 'Solar Solutions',
              tenantId: meData.user.tenantId,
            };
            setUser(verifiedProfile);
            setToken(storedToken);
            await SafeStorage.setItem(STORAGE_USER_PROFILE_KEY, JSON.stringify(verifiedProfile));
          } else {
            // Token expired or invalid
            await handleSessionExpiry();
          }
        } catch {
          // Fall back to stored profile if offline, but keep valid token
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setToken(storedToken);
        }
      }
    } catch {
      // No active session
    } finally {
      setIsLoading(false);
    }
  };

  const checkServerConnection = async (): Promise<BackendConnectionStatus> => {
    const status = await checkBackendHealth();
    setBackendStatus(status);
    return status;
  };

  const updateServerUrl = async (newUrl: string): Promise<BackendConnectionStatus> => {
    await setApiBaseUrl(newUrl);
    const status = await checkBackendHealth();
    setBackendStatus(status);
    return status;
  };

  const clearSessionExpired = () => {
    setSessionExpired(false);
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    setSessionExpired(false);

    try {
      const res = await authApi.login(email, password);

      // 1. Check if temporary password needs reset
      if (res.requiresPasswordReset) {
        setIsLoading(false);
        return {
          success: false,
          requiresPasswordReset: true,
          email: res.email || email,
        };
      }

      // 2. Validate token
      if (res.token) {
        const jwtToken = res.token;
        setToken(jwtToken);
        await SafeStorage.setItem(STORAGE_AUTH_TOKEN_KEY, jwtToken);

        // Fetch verified user profile from server
        let profileName = email.split('@')[0];
        let tenantName = 'Solar Solutions';
        let tenantId = null;

        try {
          const meData = await authApi.getMe();
          if (meData?.user) {
            profileName = meData.user.name || profileName;
            tenantName = meData.user.tenant?.name || tenantName;
            tenantId = meData.user.tenantId;
          }
        } catch {
          // meData optional
        }

        const profile: UserProfile = {
          id: res.userId || 'usr-live',
          name: profileName,
          email: email.trim().toLowerCase(),
          role: res.role || 'TENANT_ADMIN',
          tenantName,
          tenantId,
        };

        setUser(profile);
        await SafeStorage.setItem(STORAGE_USER_PROFILE_KEY, JSON.stringify(profile));
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Authentication failed: No token received.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Invalid email or password.' };
    }
  };

  const forceResetPassword = async (
    email: string,
    tempPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await authApi.forceResetPassword(email, tempPassword, newPassword);
      // Auto-login with the new password
      const loginRes = await login(email, newPassword);
      setIsLoading(false);
      return loginRes;
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Failed to reset password.' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
    setToken(null);
    await SafeStorage.removeItem(STORAGE_AUTH_TOKEN_KEY);
    await SafeStorage.removeItem(STORAGE_USER_PROFILE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        sessionExpired,
        backendStatus,
        login,
        forceResetPassword,
        logout,
        updateServerUrl,
        checkServerConnection,
        clearSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
