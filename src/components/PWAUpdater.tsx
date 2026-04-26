/**
 * PWAUpdater — production-only component.
 *
 * This file is intentionally isolated so that `virtual:pwa-register/react`
 * is NEVER imported in development mode.  The static import at the top of
 * this module is what triggers vite-plugin-pwa's no-op stub; that stub is
 * resolved outside Vite's deduped React instance and sets the internal
 * dispatcher to null, causing:
 *
 *   TypeError: Cannot read properties of null (reading 'useContext')
 *
 * in every lazily-loaded chunk that runs afterwards.
 *
 * App.tsx imports this file via React.lazy() only when import.meta.env.DEV
 * is false — so in dev mode the import (and the stub) never execute.
 */
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAUpdater = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(swRegistration) {
      // Check for SW updates whenever the user brings the tab back into focus
      window.addEventListener('focus', () => {
        if (swRegistration) swRegistration.update();
      });

      // Also poll hourly as a fallback
      const intervalMS = 60 * 60 * 1000;
      setInterval(() => {
        if (swRegistration) swRegistration.update();
      }, intervalMS);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast.message('Platform Update Available', {
        duration: Infinity,
        description:
          'A new version of AlgoLib has been deployed. Update to apply new features.',
        action: {
          label: '⭮ Sync Update',
          onClick: async () => {
            if ('caches' in window) {
              try {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map((name) => caches.delete(name)));
              } catch (e) {
                console.error('Cache purge failed:', e);
              }
            }
            updateServiceWorker(true);
          },
        },
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
};

export default PWAUpdater;
