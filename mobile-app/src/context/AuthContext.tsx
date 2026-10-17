import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, BackendConnectionStatus } from '../types';
import { SafeStorage, getApiBaseUrl, setApiBaseUrl, checkBackendHealth } from '../api/client';
import { authApi } from '../api/endpoints';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  token: string | null;
  isLoading: boolean;
  backendStatus: BackendConnectionStatus;
  login: (email: string, password?: string, requestedRole?: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
  updateServerUrl: (newUrl: string) => Promise<BackendConnectionStatus>;
  checkServerConnection: () => Promise<BackendConnectionStatus>;
}

const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  OWNER: {
    id: 'usr-owner-001',
    name: 'Mayur Kukatkar',
    email: 'mayurkukatkar43@gmail.com',
    role: 'OWNER',
    tenantName: 'WhereReady IT Solutions',
    tenantId: '4bd192c4-717a-411c-a41d-926793dd57eb',
    backendRole: 'TENANT_ADMIN',
  },
  SALES_AGENT: {
    id: 'usr-sales-002',
    name: 'Rahul Sharma',
    email: 'rahul.sales@whereready.com',
    role: 'SALES_AGENT',
    tenantName: 'WhereReady IT Solutions',
    tenantId: '4bd192c4-717a-411c-a41d-926793dd57eb',
    backendRole: 'TENANT_SUB_ADMIN',
  },
  TECHNICIAN: {
    id: 'usr-tech-003',
    name: 'Amit Verma',
    email: 'amit.installer@whereready.com',
    role: 'TECHNICIAN',
    tenantName: 'WhereReady IT Solutions',
    tenantId: '4bd192c4-717a-411c-a41d-926793dd57eb',
    backendRole: 'TENANT_SUB_ADMIN',
  },
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'OWNER',
  token: null,
  isLoading: true,
  backendStatus: { isOnline: false, serverUrl: 'http://localhost:5000' },
  login: async () => false,
  logout: async () => {},
  switchRole: async () => {},
  updateServerUrl: async () => ({ isOnline: false, serverUrl: '' }),
  checkServerConnection: async () => ({ isOnline: false, serverUrl: '' }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('OWNER');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<BackendConnectionStatus>({
    isOnline: false,
    serverUrl: 'http://localhost:5000',
  });

  useEffect(() => {
    initAppSession();
  }, []);

  const initAppSession = async () => {
    try {
      const currentUrl = await getApiBaseUrl();
      const initialStatus = await checkBackendHealth();
      setBackendStatus(initialStatus);

      const storedRole = (await SafeStorage.getItem('@solar_user_role')) as UserRole | null;
      const storedToken = await SafeStorage.getItem('@solar_user_token');
      const storedUser = await SafeStorage.getItem('@solar_user_profile');

      if (storedToken && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setRole(parsed.role || storedRole || 'OWNER');
          setToken(storedToken);
        } catch {
          setRole(storedRole || 'OWNER');
          setUser(DEFAULT_USERS[storedRole || 'OWNER']);
          setToken(storedToken || 'mock-jwt-token');
        }
      } else {
        const activeRole = storedRole || 'OWNER';
        setRole(activeRole);
        setUser(DEFAULT_USERS[activeRole]);
        setToken(storedToken || 'mock-jwt-token');
      }
    } catch {
      setRole('OWNER');
      setUser(DEFAULT_USERS.OWNER);
      setToken('mock-jwt-token');
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

  const login = async (
    email: string,
    password?: string,
    requestedRole?: UserRole
  ): Promise<boolean> => {
    setIsLoading(true);
    let targetRole: UserRole = requestedRole || 'OWNER';
    if (!requestedRole) {
      if (email.includes('sales')) targetRole = 'SALES_AGENT';
      else if (email.includes('tech') || email.includes('install')) targetRole = 'TECHNICIAN';
      else targetRole = 'OWNER';
    }

    try {
      // 1. Try real backend authentication
      const result = await authApi.login(email, password);
      if (result && result.token) {
        const jwtToken = result.token;
        setToken(jwtToken);
        await SafeStorage.setItem('@solar_user_token', jwtToken);

        // Map backend role to mobile workspace
        let mappedRole: UserRole = 'OWNER';
        if (result.role === 'TENANT_ADMIN' || result.role === 'SUPER_ADMIN') {
          mappedRole = 'OWNER';
        } else if (targetRole) {
          mappedRole = targetRole;
        }

        // Fetch real user & tenant info if available
        let profileName = email.split('@')[0];
        let tenantTitle = 'Solar Solutions ERP';
        let tenantId = 'ten-001';

        try {
          const meData = await authApi.getMe();
          if (meData?.user) {
            profileName = meData.user.name || profileName;
            tenantTitle = meData.user.tenant?.name || tenantTitle;
            tenantId = meData.user.tenantId || tenantId;
          }
        } catch {
          // meData optional
        }

        const liveProfile: UserProfile = {
          id: result.userId || 'usr-live',
          name: profileName,
          email,
          role: mappedRole,
          tenantName: tenantTitle,
          tenantId,
          backendRole: result.role,
        };

        setUser(liveProfile);
        setRole(mappedRole);
        await SafeStorage.setItem('@solar_user_role', mappedRole);
        await SafeStorage.setItem('@solar_user_profile', JSON.stringify(liveProfile));
        setBackendStatus(prev => ({ ...prev, isOnline: true }));
        setIsLoading(false);
        return true;
      }
    } catch (err: any) {
      console.warn('Backend login attempt fell back to offline demo profile:', err.message);
    }

    // Graceful offline fallback
    const offlineProfile: UserProfile = {
      ...DEFAULT_USERS[targetRole],
      email,
    };
    setUser(offlineProfile);
    setRole(targetRole);
    setToken('mock-jwt-token');
    await SafeStorage.setItem('@solar_user_role', targetRole);
    await SafeStorage.setItem('@solar_user_profile', JSON.stringify(offlineProfile));
    await SafeStorage.setItem('@solar_user_token', 'mock-jwt-token');

    setIsLoading(false);
    return true;
  };

  const switchRole = async (newRole: UserRole) => {
    setRole(newRole);
    const updatedUser = {
      ...DEFAULT_USERS[newRole],
      tenantName: user?.tenantName || DEFAULT_USERS[newRole].tenantName,
      tenantId: user?.tenantId || DEFAULT_USERS[newRole].tenantId,
    };
    setUser(updatedUser);
    await SafeStorage.setItem('@solar_user_role', newRole);
    await SafeStorage.setItem('@solar_user_profile', JSON.stringify(updatedUser));
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // offline logout
    }
    setUser(null);
    setToken(null);
    await SafeStorage.removeItem('@solar_user_role');
    await SafeStorage.removeItem('@solar_user_profile');
    await SafeStorage.removeItem('@solar_user_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isLoading,
        backendStatus,
        login,
        logout,
        switchRole,
        updateServerUrl,
        checkServerConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
