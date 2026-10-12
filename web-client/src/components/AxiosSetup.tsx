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

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  return <>{children}</>;
}
