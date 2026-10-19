import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackendConnectionStatus } from '../types';

// In-Memory fallback storage for environments where native storage is unavailable
const memoryStore: Record<string, string> = {};

export const SafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        const val = await AsyncStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // Memory fallback
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
      // Memory fallback
    }
  },
  removeItem: async (key: string): Promise<void> => {
    delete memoryStore[key];
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      }
    } catch {
      // Memory fallback
    }
  },
};

// Production Live Backend URL
export const DEFAULT_API_URL = 'https://solar-manager-three.vercel.app';

const STORAGE_API_URL_KEY = '@solar_api_base_url';
const STORAGE_AUTH_TOKEN_KEY = '@solar_user_token';

let currentBaseUrl = DEFAULT_API_URL;
let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
  unauthorizedHandler = handler;
};

// Security check: validate URL structure and enforce HTTPS for external endpoints
export const sanitizeApiUrl = (url: string): string => {
  const cleaned = url.trim().replace(/\/+$/, '');
  const isLocal =
    cleaned.includes('localhost') ||
    cleaned.includes('10.0.2.2') ||
    cleaned.startsWith('http://192.168.');
  if (!isLocal && cleaned.startsWith('http://')) {
    return cleaned.replace(/^http:\/\//, 'https://');
  }
  return cleaned;
};

export const getApiBaseUrl = async (): Promise<string> => {
  try {
    const saved = await SafeStorage.getItem(STORAGE_API_URL_KEY);
    if (saved) {
      currentBaseUrl = sanitizeApiUrl(saved);
      return currentBaseUrl;
    }
  } catch {
    // Return default
  }
  return currentBaseUrl;
};

export const setApiBaseUrl = async (newUrl: string): Promise<void> => {
  const sanitized = sanitizeApiUrl(newUrl);
  currentBaseUrl = sanitized;
  await SafeStorage.setItem(STORAGE_API_URL_KEY, sanitized);
  apiClient.defaults.baseURL = sanitized;
};

// Create main production Axios Instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: currentBaseUrl,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Authenticated Bearer Token
apiClient.interceptors.request.use(
  async (config) => {
    const base = await getApiBaseUrl();
    config.baseURL = base;

    const token = await SafeStorage.getItem(STORAGE_AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Session Expiry & Format Sanitized Errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Session expired or revoked
      await SafeStorage.removeItem(STORAGE_AUTH_TOKEN_KEY);
      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'Request timed out due to slow network. Please retry.'
        : error.message === 'Network Error'
        ? 'Network connection issue. Please verify internet connectivity.'
        : error.message || 'Network request failed.');

    return Promise.reject(new Error(message));
  }
);

// Connectivity check helper
export const checkBackendHealth = async (): Promise<BackendConnectionStatus> => {
  const url = await getApiBaseUrl();
  const startTime = Date.now();
  try {
    const response = await axios.get(`${url}/api/auth/me`, {
      timeout: 5000,
      validateStatus: () => true, // Accept 200, 401, 403 as reachable
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
