import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, runTransaction, increment, update } from "firebase/database";
// NEW: Import Auth and Firestore
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
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

// NEW: Auth helper functions
const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Logged in successfully:", result.user.displayName);
  } catch (error: any) {
    console.error("Full Auth Error:", error);
    alert(`Sign-in failed: ${error.message} (Code: ${error.code})`);
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
export const rtdb = getDatabase(app);
export { 
  db, ref, get, set, runTransaction, increment, update,
  auth, googleProvider, firestoreDB, loginWithGoogle, logout 
};