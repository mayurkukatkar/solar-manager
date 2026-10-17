import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackendConnectionStatus } from '../types';

// In-Memory fallback storage
const memoryStore: Record<string, string> = {};

export const SafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        const val = await AsyncStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // In-memory fallback
    }
    return memoryStore[key] || null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryStore[key] = value;
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, value);
      }
    } catch {
      // In-memory fallback
    }
  },
  removeItem: async (key: string): Promise<void> => {
    delete memoryStore[key];
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      }
    } catch {
      // In-memory fallback
    }
  },
};

// Default Backend URL based on runtime environment
// Android emulator uses 10.0.2.2 to reach host machine's localhost
export const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:5000',
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
});

const STORAGE_API_URL_KEY = '@solar_api_base_url';
const STORAGE_AUTH_TOKEN_KEY = '@solar_user_token';

let currentBaseUrl = DEFAULT_API_URL;

export const getApiBaseUrl = async (): Promise<string> => {
  try {
    const saved = await SafeStorage.getItem(STORAGE_API_URL_KEY);
    if (saved) {
      currentBaseUrl = saved;
      return saved;
    }
  } catch {
    // Return default
  }
  return currentBaseUrl;
};

export const setApiBaseUrl = async (newUrl: string): Promise<void> => {
  const cleaned = newUrl.replace(/\/+$/, '');
  currentBaseUrl = cleaned;
  await SafeStorage.setItem(STORAGE_API_URL_KEY, cleaned);
  apiClient.defaults.baseURL = cleaned;
};

// Create main Axios Instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: currentBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Auth Token
apiClient.interceptors.request.use(
  async (config) => {
    // Sync baseUrl
    const base = await getApiBaseUrl();
    config.baseURL = base;

    const token = await SafeStorage.getItem(STORAGE_AUTH_TOKEN_KEY);
    if (token && token !== 'mock-jwt-token') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format errors gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Network request failed';
    return Promise.reject(new Error(message));
  }
);

// Connectivity check helper
export const checkBackendHealth = async (): Promise<BackendConnectionStatus> => {
  const url = await getApiBaseUrl();
  const startTime = Date.now();
  try {
    // Attempt pinging me or root or auth
    const response = await axios.get(`${url}/api/auth/me`, {
      timeout: 3500,
      validateStatus: () => true, // Accept 200, 401, 403 as alive
    });

    const latency = Date.now() - startTime;
    const isAlive = response.status < 500;
    return {
      isOnline: isAlive,
      serverUrl: url,
      latencyMs: latency,
      lastChecked: new Date().toLocaleTimeString(),
    };
  } catch {
    return {
      isOnline: false,
      serverUrl: url,
      lastChecked: new Date().toLocaleTimeString(),
    };
  }
};
