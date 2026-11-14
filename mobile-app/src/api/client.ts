import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BackendConnectionStatus } from '../types';

// In-Memory fallback storage for environments where native storage is unavailable
const memoryStore: Record<string, string> = {};

// Production Live Backend URL
export const DEFAULT_API_URL = 'https://solar-manager-three.vercel.app';

const STORAGE_API_URL_KEY = '@solar_api_base_url';
const STORAGE_AUTH_TOKEN_KEY = '@solar_user_token';

let currentBaseUrl = DEFAULT_API_URL;
let baseUrlInitialized = false;
let cachedAuthToken: string | null = null;
let tokenInitialized = false;

export const setCachedAuthToken = (token: string | null) => {
  cachedAuthToken = token;
  tokenInitialized = true;
};

export const getCachedAuthToken = () => cachedAuthToken;

export const SafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        const val = await AsyncStorage.getItem(key);
        if (val !== null) {
          memoryStore[key] = val;
          return val;
        }
      }
    } catch {
      // Memory fallback
    }
    return memoryStore[key] || null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryStore[key] = value;
    if (key === STORAGE_AUTH_TOKEN_KEY) {
      cachedAuthToken = value;
      tokenInitialized = true;
    } else if (key === STORAGE_API_URL_KEY) {
      currentBaseUrl = sanitizeApiUrl(value);
      baseUrlInitialized = true;
    }
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
    if (key === STORAGE_AUTH_TOKEN_KEY) {
      cachedAuthToken = null;
      tokenInitialized = true;
    } else if (key === STORAGE_API_URL_KEY) {
      currentBaseUrl = DEFAULT_API_URL;
      baseUrlInitialized = true;
    }
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      }
    } catch {
      // Memory fallback
    }
  },
};

let unauthorizedHandler: (() => void) | null = null;
let suspendedHandler: ((message: string) => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
  unauthorizedHandler = handler;
};

export const setSuspendedHandler = (handler: (message: string) => void) => {
  suspendedHandler = handler;
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
  if (baseUrlInitialized) {
    return currentBaseUrl;
  }
  try {
    const saved = await SafeStorage.getItem(STORAGE_API_URL_KEY);
    if (saved) {
      const sanitized = sanitizeApiUrl(saved);
      const isLocalhost = sanitized.includes('localhost') || sanitized.includes('127.0.0.1');
      if (Platform.OS !== 'web' && isLocalhost) {
        currentBaseUrl = DEFAULT_API_URL;
        baseUrlInitialized = true;
        return currentBaseUrl;
      }
      currentBaseUrl = sanitized;
      baseUrlInitialized = true;
      return currentBaseUrl;
    }
  } catch {
    // Return default
  }
  baseUrlInitialized = true;
  return currentBaseUrl;
};

export const setApiBaseUrl = async (newUrl: string): Promise<void> => {
  const sanitized = sanitizeApiUrl(newUrl);
  currentBaseUrl = sanitized;
  baseUrlInitialized = true;
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

// Request Interceptor: Attach Authenticated Bearer Token (In-memory optimized)
apiClient.interceptors.request.use(
  async (config) => {
    if (!baseUrlInitialized) {
      config.baseURL = await getApiBaseUrl();
    } else {
      config.baseURL = currentBaseUrl;
    }

    if (!tokenInitialized) {
      cachedAuthToken = await SafeStorage.getItem(STORAGE_AUTH_TOKEN_KEY);
      tokenInitialized = true;
    }

    if (cachedAuthToken) {
      config.headers.Authorization = `Bearer ${cachedAuthToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Network Status Event Broadcaster
type NetworkStatusCallback = (isOnline: boolean) => void;
const networkStatusListeners: NetworkStatusCallback[] = [];

export const addNetworkStatusListener = (cb: NetworkStatusCallback): (() => void) => {
  networkStatusListeners.push(cb);
  return () => {
    const idx = networkStatusListeners.indexOf(cb);
    if (idx !== -1) networkStatusListeners.splice(idx, 1);
  };
};

export const notifyNetworkStatus = (isOnline: boolean): void => {
  for (const listener of networkStatusListeners) {
    try {
      listener(isOnline);
    } catch (e) {
      console.warn('Network listener error:', e);
    }
  }
};

// High-speed device internet probe (< 300ms)
export const checkInternetConnectivity = async (): Promise<boolean> => {
  // 1. Probe our live backend API health endpoint first (most accurate check, no auth required)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${currentBaseUrl}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status >= 200 && res.status < 500) return true;
  } catch {}

  // 2. Probe Google 204 endpoint with GET (standard across all mobile carriers)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://www.google.com/generate_204', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status >= 200 && res.status < 400) return true;
  } catch {}

  // 3. Probe Cloudflare CDN trace with GET (direct hostname, avoiding 302 redirects)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://one.one.one.one/cdn-cgi/trace', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
};

// Response Interceptor: Handle 401 Session Expiry, 403 Account Suspension & Confirm Network Health
apiClient.interceptors.response.use(
  (response) => {
    notifyNetworkStatus(true);
    return response;
  },
  async (error) => {
    // If request was canceled/aborted by the app, it is NOT an offline event
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const config = error.config;
    // Auto-retry transient network drops / severed sockets (e.g. after resuming from WhatsApp or background)
    if (
      config &&
      !config._retry &&
      (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response)
    ) {
      config._retry = true;
      // Allow 850ms for device radio & WiFi to re-establish
      await new Promise((r) => setTimeout(r, 850));
      try {
        return await apiClient(config);
      } catch (retryError) {
        // If retry still fails, fall through to offline handling
        error = retryError;
      }
    }

    if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
      // Re-verify real connectivity before asserting offline
      checkInternetConnectivity().then((hasInternet) => {
        if (!hasInternet) {
          notifyNetworkStatus(false);
        } else {
          // Internet is alive; check backend health without locking user into offline
          checkBackendHealth().then((st) => {
            notifyNetworkStatus(st.isOnline);
          }).catch(() => {});
        }
      }).catch(() => {});
    }

    const isSuspended =
      error.response?.status === 403 &&
      (error.response?.data?.code === 'TENANT_SUSPENDED' ||
        error.response?.data?.isSuspended ||
        String(error.response?.data?.error || '').toLowerCase().includes('suspended'));

    if (isSuspended) {
      // Organization account frozen by Super Admin
      await SafeStorage.removeItem(STORAGE_AUTH_TOKEN_KEY);
      await SafeStorage.removeItem('@solar_user_profile');
      const suspendMsg =
        error.response?.data?.error ||
        'Account Suspended: Your organization account has been suspended by the platform administrator.';
      if (suspendedHandler) {
        suspendedHandler(suspendMsg);
      }
    } else if (error.response?.status === 401) {
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

    const errObj = new Error(message) as any;
    errObj.response = error.response;
    errObj.status = error.response?.status;
    errObj.data = error.response?.data;
    errObj.code = error.code;
    errObj.isAxiosError = true;

    return Promise.reject(errObj);
  }
);

// Connectivity check helper with internet validation and automatic fallback
export const checkBackendHealth = async (): Promise<BackendConnectionStatus> => {
  const url = await getApiBaseUrl();
  const startTime = Date.now();

  // 1. Probe backend server directly via public /api/health endpoint
  try {
    const response = await axios.get(`${url}/api/health`, {
      timeout: 6000,
      validateStatus: () => true, // Accept 200, 304, etc. as reachable
    });

    const latency = Date.now() - startTime;
    const isAlive = response.status < 500;
    notifyNetworkStatus(isAlive);
    return {
      isOnline: isAlive,
      serverUrl: url,
      latencyMs: latency,
      lastChecked: new Date().toLocaleTimeString(),
    };
  } catch {
    // 2. Probe general internet connectivity
    const hasInternet = await checkInternetConnectivity();

    // If custom URL failed but device has internet, try default production URL
    if (url !== DEFAULT_API_URL && hasInternet) {
      try {
        const fallbackRes = await axios.get(`${DEFAULT_API_URL}/api/health`, {
          timeout: 6000,
          validateStatus: () => true,
        });
        if (fallbackRes.status < 500) {
          await setApiBaseUrl(DEFAULT_API_URL);
          notifyNetworkStatus(true);
          return {
            isOnline: true,
            serverUrl: DEFAULT_API_URL,
            latencyMs: Date.now() - startTime,
            lastChecked: new Date().toLocaleTimeString(),
          };
        }
      } catch {}
    }

    // Only notify offline if general internet probe is truly dead
    const finalOnline = hasInternet;
    notifyNetworkStatus(finalOnline);
    return {
      isOnline: finalOnline,
      serverUrl: url,
      lastChecked: new Date().toLocaleTimeString(),
    };
  }
};
