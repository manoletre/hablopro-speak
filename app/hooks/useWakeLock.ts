import { useRef, useCallback } from 'react';

export const useWakeLock = () => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isSupported = 'wakeLock' in navigator;

  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Wake Lock API is not supported');
      return false;
    }

    // Don't request if we already have an active wake lock
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      console.log('Wake lock already active');
      return true;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      console.log('Screen wake lock acquired');

      // Listen for release (but don't update state to avoid re-renders)
      wakeLockRef.current.addEventListener('release', () => {
        console.log('Screen wake lock was released');
        wakeLockRef.current = null;
      });

      return true;
    } catch (err) {
      console.error('Failed to acquire screen wake lock:', err);
      return false;
    }
  }, [isSupported]);

  const releaseWakeLock = useCallback(async (): Promise<void> => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      try {
        await wakeLockRef.current.release();
        console.log('Screen wake lock released manually');
      } catch (err) {
        console.error('Failed to release screen wake lock:', err);
      }
    }
    wakeLockRef.current = null;
  }, []);

  const isActive = useCallback((): boolean => {
    return wakeLockRef.current !== null && !wakeLockRef.current.released;
  }, []);

  return {
    isSupported,
    isActive,
    requestWakeLock,
    releaseWakeLock
  };
}; 