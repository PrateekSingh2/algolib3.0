import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, runTransaction } from "firebase/database";
// Import signInWithRedirect for the Brave Browser fallback
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

// EXISTING: Realtime Database (for your counter API)
const db = getDatabase(app);

// NEW: Auth & Firestore (for the Community section)
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const firestoreDB = getFirestore(app);

// AUTH LOGIC WITH BRAVE BROWSER FALLBACK
const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Logged in successfully:", result.user.displayName);
  } catch (error: any) {
    console.error("Full Auth Error:", error);
    
    // If Brave/Safari blocks the popup or 3rd party cookies, fallback to Redirect
    if (
      error.code === 'auth/popup-blocked' || 
      error.code === 'auth/popup-closed-by-user' || 
      error.code === 'auth/unauthorized-domain' ||
      error.message.includes('cross-origin')
    ) {
      console.warn("Browser blocked popup or cookies. Falling back to Redirect mode...");
      alert("Privacy shields detected. Redirecting to secure login...");
      
      await signInWithRedirect(auth, googleProvider);
    } else {
      alert(`Sign-in failed: ${error.message} (Code: ${error.code})`);
    }
  }
};

const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

// Export both the old counter tools and the new community tools
export { 
  db, ref, get, set, runTransaction, 
  auth, googleProvider, firestoreDB, loginWithGoogle, logout 
};