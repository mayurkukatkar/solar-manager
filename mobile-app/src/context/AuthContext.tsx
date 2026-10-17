import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  token: string | null;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
}

const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  OWNER: {
    id: 'usr-owner-001',
    name: 'Mayur Kukatkar',
    email: 'owner@ekvarta.com',
    role: 'OWNER',
    tenantName: 'Ekvarta Energy Solutions',
    tenantId: 'ten-001',
  },
  SALES_AGENT: {
    id: 'usr-sales-002',
    name: 'Rahul Sharma',
    email: 'rahul.sales@ekvarta.com',
    role: 'SALES_AGENT',
    tenantName: 'Ekvarta Energy Solutions',
    tenantId: 'ten-001',
  },
  TECHNICIAN: {
    id: 'usr-tech-003',
    name: 'Amit Verma',
    email: 'amit.installer@ekvarta.com',
    role: 'TECHNICIAN',
    tenantName: 'Ekvarta Energy Solutions',
    tenantId: 'ten-001',
  },
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'OWNER',
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  switchRole: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('OWNER');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedRole = (await AsyncStorage.getItem('@solar_user_role')) as UserRole | null;
      const storedToken = await AsyncStorage.getItem('@solar_user_token');
      if (storedRole && DEFAULT_USERS[storedRole]) {
        setRole(storedRole);
        setUser(DEFAULT_USERS[storedRole]);
        setToken(storedToken || 'mock-jwt-token');
      } else {
        // Default to Owner view for immediate ready testing
        setRole('OWNER');
        setUser(DEFAULT_USERS.OWNER);
        setToken('mock-jwt-token');
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, requestedRole?: UserRole) => {
    setIsLoading(true);
    let targetRole: UserRole = requestedRole || 'OWNER';
    if (!requestedRole) {
      if (email.includes('sales')) targetRole = 'SALES_AGENT';
      else if (email.includes('tech') || email.includes('install')) targetRole = 'TECHNICIAN';
      else targetRole = 'OWNER';
    }

    const selectedUser = { ...DEFAULT_USERS[targetRole], email };
    setUser(selectedUser);
    setRole(targetRole);
    setToken('jwt-session-token');

    await AsyncStorage.setItem('@solar_user_role', targetRole);
    await AsyncStorage.setItem('@solar_user_token', 'jwt-session-token');
    setIsLoading(false);
  };

  const switchRole = async (newRole: UserRole) => {
    setRole(newRole);
    const updatedUser = DEFAULT_USERS[newRole];
    setUser(updatedUser);
    await AsyncStorage.setItem('@solar_user_role', newRole);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('@solar_user_role');
    await AsyncStorage.removeItem('@solar_user_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isLoading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
