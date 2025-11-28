'use client';

import { useEffect, useRef } from 'react';
import { logToTerminal } from '@/app/actions';

export const DebugBridge = () => {
  // Keep track of recent errors to prevent spam loops
  const recentErrors = useRef(new Set<string>());

  useEffect(() => {
    const handleError = (msg: string, context: string) => {
      const errorKey = `${msg}-${context}`;
      if (recentErrors.current.has(errorKey)) return;

      recentErrors.current.add(errorKey);
      
      // Clear from cache after 5 seconds so it can show again later if needed
      setTimeout(() => recentErrors.current.delete(errorKey), 5000);

      logToTerminal('error', [msg, context]);
    };

    const originalOnError = window.onerror;
    window.onerror = (msg, url, line, col, error) => {
      handleError(
        `Runtime Error: ${msg}`, 
        `Location: ${url}:${line}:${col}`
      );
      // Don't call originalOnError to prevent browser console duplication if desired
      // if (originalOnError) return originalOnError(msg, url, line, col, error);
    };

    const originalOnUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      handleError(
        'Unhandled Promise Rejection',
        String(event.reason)
      );
      // if (originalOnUnhandledRejection) return originalOnUnhandledRejection(event);
    };

    return () => {
      window.onerror = originalOnError;
      window.onunhandledrejection = originalOnUnhandledRejection;
    };
  }, []);

  return null;
};