import { useEffect, useState } from 'react';

const ADMIN_UNLOCK_KEY = 'team-plan-view-admin-unlocked-v1';

export function isAdminUnlocked(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

/** Reactive admin-unlocked flag. Polls sessionStorage every second so that
 *  unlocking via the AdminDrawer updates other components without a reload. */
export function useAdminUnlocked(): boolean {
  const [unlocked, setUnlocked] = useState(isAdminUnlocked);
  useEffect(() => {
    const tick = () => setUnlocked(isAdminUnlocked());
    const interval = setInterval(tick, 1000);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', tick);
    };
  }, []);
  return unlocked;
}
