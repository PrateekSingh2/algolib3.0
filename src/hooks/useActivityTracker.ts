import { useEffect, useRef, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, increment } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export type ActiveUser = {
  uid: string;
  email: string;
  displayName: string;
};

// --- NEW: Helper to dynamically change the tracked activity from any component ---
export const setTrackedActivity = (activityName: string) => {
  window.dispatchEvent(new CustomEvent('changeActivity', { detail: activityName }));
};

export const useActivityTracker = (initialActivity: string, user: ActiveUser | null) => {
  const [currentActivity, setCurrentActivity] = useState(initialActivity);
  const unsyncedTimes = useRef<Record<string, number>>({});
  const currentActivityStartTime = useRef<number>(Date.now());
  const lastActivity = useRef<string>(initialActivity);

  // Listen for custom events to switch the activity target dynamically
  useEffect(() => {
    const handleActivityChange = (e: any) => {
      setCurrentActivity(e.detail);
    };
    window.addEventListener('changeActivity', handleActivityChange);
    return () => window.removeEventListener('changeActivity', handleActivityChange);
  }, []);

  const flushToFirebase = async () => {
    if (!user || !user.uid) return;

    const now = Date.now();
    const timeSpentMs = now - currentActivityStartTime.current;
    
    if (timeSpentMs > 0 && lastActivity.current && document.visibilityState === 'visible') {
      unsyncedTimes.current[lastActivity.current] = (unsyncedTimes.current[lastActivity.current] || 0) + timeSpentMs;
    }
    
    currentActivityStartTime.current = now;

    const updates: Record<string, any> = {};
    let totalTimeMinsToSync = 0;
    let hasData = false;

    for (const [activityName, timeMs] of Object.entries(unsyncedTimes.current)) {
      // --- NEW: Convert to minutes with 2 decimal precision (e.g. 1.50 mins) ---
      const timeMins = Number((timeMs / 60000).toFixed(2));
      
      if (timeMins > 0) {
        let safeActivityName = activityName === '/' ? 'home' : activityName.replace(/[^a-zA-Z0-9-]/g, '_'); 
        // Remove leading underscores for a cleaner database view
        if (safeActivityName.startsWith('_')) safeActivityName = safeActivityName.substring(1);

        updates[`activityUsage.${safeActivityName}`] = increment(timeMins);
        totalTimeMinsToSync += timeMins;
        hasData = true;
        
        // Reset the local timer for this activity since we just synced it
        unsyncedTimes.current[activityName] = 0; 
      }
    }

    if (hasData) {
      updates['lifetimeActiveTimeMins'] = increment(totalTimeMinsToSync);
      updates['lastActiveDate'] = new Date();
      updates['email'] = user.email;
      updates['displayName'] = user.displayName;
      
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, updates, { merge: true }); // Keeps view count safe
      } catch (error) {
        console.error("Activity sync failed:", error);
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    const now = Date.now();
    const timeSpentMs = now - currentActivityStartTime.current;
    
    if (document.visibilityState === 'visible') {
        unsyncedTimes.current[lastActivity.current] = (unsyncedTimes.current[lastActivity.current] || 0) + timeSpentMs;
    }

    currentActivityStartTime.current = now;
    lastActivity.current = currentActivity;
  }, [currentActivity, user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(flushToFirebase, 30000); 

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushToFirebase();
      else currentActivityStartTime.current = Date.now();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', flushToFirebase);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', flushToFirebase);
      flushToFirebase(); 
    };
  }, [user]); 
};