"use client";

import { useEffect } from 'react';
import axios from 'axios';

export default function AxiosSetup({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // Read token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        // If a token exists, add it to the Authorization header
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Ensure credentials (cookies) are still sent alongside headers just in case
        config.withCredentials = true;
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      // Clean up the interceptor when the component unmounts
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // This component doesn't render any UI, it just wraps children
  return <>{children}</>;
}
