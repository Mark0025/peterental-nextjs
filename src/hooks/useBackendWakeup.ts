/**
 * Backend Wake-Up Hook
 *
 * Pings the backend /health endpoint to wake it up from Render cold start.
 * Shows loading state while backend is spinning up.
 */

import { useState, useEffect } from 'react';

interface WakeUpState {
  isWakingUp: boolean;
  isReady: boolean;
  error: string | null;
  retryCount: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://peterental-vapi-github-newer.onrender.com';
const MAX_RETRIES = 10; // 10 attempts
const RETRY_DELAY = 3000; // 3 seconds between retries

export function useBackendWakeup() {
  const [state, setState] = useState<WakeUpState>({
    isWakingUp: true,
    isReady: false,
    error: null,
    retryCount: 0,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const pingBackend = async (retryCount: number) => {
      try {
        console.log(`🔄 Pinging backend (attempt ${retryCount + 1}/${MAX_RETRIES})...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${BACKEND_URL}/health`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log('✅ Backend is ready!');
          if (isMounted) {
            setState({
              isWakingUp: false,
              isReady: true,
              error: null,
              retryCount,
            });
          }
          return;
        }
      } catch {
        console.log(`⚠️ Backend not ready yet (attempt ${retryCount + 1})...`);
      }

      // Retry if not ready
      if (retryCount < MAX_RETRIES - 1 && isMounted) {
        setState(prev => ({ ...prev, retryCount: retryCount + 1 }));
        timeoutId = setTimeout(() => {
          pingBackend(retryCount + 1);
        }, RETRY_DELAY);
      } else if (isMounted) {
        // Max retries reached
        console.error('❌ Backend failed to wake up after max retries');
        setState({
          isWakingUp: false,
          isReady: false,
          error: 'Backend is taking longer than expected to start. Please try refreshing the page.',
          retryCount,
        });
      }
    };

    // Start pinging
    pingBackend(0);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return state;
}
