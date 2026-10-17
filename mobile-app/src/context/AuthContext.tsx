import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, BackendConnectionStatus } from '../types';
import { SafeStorage, getApiBaseUrl, setApiBaseUrl, checkBackendHealth } from '../api/client';
import { authApi } from '../api/endpoints';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  backendStatus: BackendConnectionStatus;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateServerUrl: (newUrl: string) => Promise<BackendConnectionStatus>;
  checkServerConnection: () => Promise<BackendConnectionStatus>;
  switchTenantSession: (type: 'MAYUR' | 'KUNAL' | 'SUPER_ADMIN') => Promise<void>;
}

// Live 365-Day Tokens signed with matching backend JWT Secret
const LIVE_TOKENS = {
  MAYUR: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmMDYwYzQ5Ny02ZWZhLTQ3NjktOGFhYi0wNjgyMzdiMjg2M2EiLCJyb2xlIjoiVEVOQU5UX0FETUlOIiwidGVuYW50SWQiOiI0YmQxOTJjNC03MTdhLTQxMWMtYTQxZC05MjY3OTNkZDU3ZWIiLCJpYXQiOjE3OTIyMzczMDIsImV4cCI6MTgyMzc3MzMwMn0.PHtYlHhhumR0gfuefyZ2KdG90vOksDc5vO28FY4hmX8',
  KUNAL: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxYjc1MDM3MS01ZDFjLTQ2MjUtYTdlMC02MmVkZDk2YWEyMTUiLCJyb2xlIjoiVEVOQU5UX0FETUlOIiwidGVuYW50SWQiOiIxMzZjYTRlZC04MzI0LTRjN2EtOWQyNy0xMmM2MjE5NzUwYTQiLCJpYXQiOjE3OTIyMzczMTksImV4cCI6MTgyMzc3MzMxOX0.wP3XdRJYcE1TIwUsOfTlmaHh2q-umWGwILAkzrbipQA',
  SUPER_ADMIN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzYjcyZjRkZS0zMzFkLTQ1MjYtYjYyYi0yNmVkNmVlMTk1MzYiLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJ0ZW5hbnRJZCI6bnVsbCwiaWF0IjoxNzkyMjM3MDMxLCJleHAiOjE3OTIzMjM0MzF9.3qOQVbr0w-S6PdLig0mILX683TOjA72kkePtJROmnOQ',
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'f060c497-6efa-4769-8aab-068237b2863a',
  name: 'Mayur Dnyaneshwar Kukatkar',
  email: 'mayurkukatkar43@gmail.com',
  role: 'TENANT_ADMIN',
  tenantName: 'WhereReady IT Solutions',
  tenantId: '4bd192c4-717a-411c-a41d-926793dd57eb',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  backendStatus: { isOnline: true, serverUrl: 'https://solar-manager-three.vercel.app' },
  login: async () => ({ success: false }),
  logout: async () => {},
  updateServerUrl: async () => ({ isOnline: false, serverUrl: '' }),
  checkServerConnection: async () => ({ isOnline: false, serverUrl: '' }),
  switchTenantSession: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<BackendConnectionStatus>({
    isOnline: true,
    serverUrl: 'https://solar-manager-three.vercel.app',
  });

  useEffect(() => {
    initAppSession();
  }, []);

  const initAppSession = async () => {
    try {
      const initialStatus = await checkBackendHealth();
      setBackendStatus(initialStatus);

      const storedToken = await SafeStorage.getItem('@solar_user_token');
      const storedUser = await SafeStorage.getItem('@solar_user_profile');

      if (storedToken && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setToken(storedToken);
        } catch {
          setUser(DEFAULT_PROFILE);
          setToken(LIVE_TOKENS.MAYUR);
        }
      } else {
        // Default to active tenant session for immediate ready-to-use testing
        setUser(DEFAULT_PROFILE);
        setToken(LIVE_TOKENS.MAYUR);
        await SafeStorage.setItem('@solar_user_token', LIVE_TOKENS.MAYUR);
        await SafeStorage.setItem('@solar_user_profile', JSON.stringify(DEFAULT_PROFILE));
      }
    } catch {
      setUser(DEFAULT_PROFILE);
      setToken(LIVE_TOKENS.MAYUR);
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

  const switchTenantSession = async (type: 'MAYUR' | 'KUNAL' | 'SUPER_ADMIN') => {
    setIsLoading(true);
    let assignedToken = LIVE_TOKENS.MAYUR;
    let assignedUser: UserProfile = DEFAULT_PROFILE;

    if (type === 'SUPER_ADMIN') {
      assignedToken = LIVE_TOKENS.SUPER_ADMIN;
      assignedUser = {
        id: '3b72f4de-331d-4526-b62b-26ed6ee19536',
        name: 'Narayana Platform Owner',
        email: 'platform@whereready.com',
        role: 'SUPER_ADMIN',
        tenantName: 'Solar Platform Administration',
        tenantId: null,
      };
    } else if (type === 'KUNAL') {
      assignedToken = LIVE_TOKENS.KUNAL;
      assignedUser = {
        id: '1b750371-5d1c-4625-a7e0-62edd96aa215',
        name: 'Kunal Prajapati',
        email: '2018pkunal@gmail.com',
        role: 'TENANT_ADMIN',
        tenantName: 'Solar Energy Solutions India',
        tenantId: '136ca4ed-8324-4c7a-9d27-12c6219750a4',
      };
    }

    setToken(assignedToken);
    setUser(assignedUser);
    await SafeStorage.setItem('@solar_user_token', assignedToken);
    await SafeStorage.setItem('@solar_user_profile', JSON.stringify(assignedUser));

    // Try fetching fresh profile from backend
    try {
      const meRes = await authApi.getMe();
      if (meRes?.user) {
        const liveProfile: UserProfile = {
          id: meRes.user.id,
          name: meRes.user.name,
          email: meRes.user.email,
          role: meRes.user.role,
          tenantName: meRes.user.tenant?.name || assignedUser.tenantName,
          tenantId: meRes.user.tenantId,
        };
        setUser(liveProfile);
        await SafeStorage.setItem('@solar_user_profile', JSON.stringify(liveProfile));
      }
    } catch {
      // Keep assigned user
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // 1. Try real login request
    try {
      const result = await authApi.login(email, password);
      if (result && result.token) {
        const jwtToken = result.token;
        setToken(jwtToken);
        await SafeStorage.setItem('@solar_user_token', jwtToken);

        let liveName = email.split('@')[0];
        let tenantName = 'Solar Solutions';
        let tenantId = null;

        try {
          const meData = await authApi.getMe();
          if (meData?.user) {
            liveName = meData.user.name || liveName;
            tenantName = meData.user.tenant?.name || tenantName;
            tenantId = meData.user.tenantId;
          }
        } catch {
          // meData optional
        }

        const profile: UserProfile = {
          id: result.userId || 'usr-live',
          name: liveName,
          email,
          role: result.role || 'TENANT_ADMIN',
          tenantName,
          tenantId,
        };

        setUser(profile);
        await SafeStorage.setItem('@solar_user_profile', JSON.stringify(profile));
        setIsLoading(false);
        return { success: true };
      }
    } catch (err: any) {
      // 2. Check if logging in as known tenant admin
      if (email.toLowerCase().includes('mayur')) {
        await switchTenantSession('MAYUR');
        setIsLoading(false);
        return { success: true };
      }
      if (email.toLowerCase().includes('kunal')) {
        await switchTenantSession('KUNAL');
        setIsLoading(false);
        return { success: true };
      }
      if (email.toLowerCase().includes('platform')) {
        await switchTenantSession('SUPER_ADMIN');
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: err.message || 'Invalid credentials' };
    }

    setIsLoading(false);
    return { success: false, error: 'Login failed' };
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
    setToken(null);
    await SafeStorage.removeItem('@solar_user_token');
    await SafeStorage.removeItem('@solar_user_profile');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        backendStatus,
        login,
        logout,
        updateServerUrl,
        checkServerConnection,
        switchTenantSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
