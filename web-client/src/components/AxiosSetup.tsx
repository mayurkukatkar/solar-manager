"use client";

import { useEffect } from 'react';
import axios from 'axios';

export default function AxiosSetup({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = typeof window !== 'undefined' 
          ? (localStorage.getItem('token') || localStorage.getItem('auth_token')) 
          : null;
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.withCredentials = true;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (typeof window !== 'undefined') {
          const isSuspended =
            error.response?.status === 403 &&
            (error.response?.data?.code === 'TENANT_SUSPENDED' ||
             error.response?.data?.isSuspended ||
             String(error.response?.data?.error || '').toLowerCase().includes('suspended'));

          if (isSuspended) {
            localStorage.removeItem('token');
            localStorage.removeItem('auth_token');
            if (window.location.pathname !== '/suspended') {
              window.location.href = '/suspended';
            }
          } else if (error.response?.status === 401 && window.location.pathname.startsWith('/tenant')) {
            localStorage.removeItem('token');
            localStorage.removeItem('auth_token');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login?expired=true';
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return <>{children}</>;
}
