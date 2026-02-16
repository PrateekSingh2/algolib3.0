// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, runTransaction } from "firebase/database";

// REPLACE THIS WITH YOUR ACTUAL FIREBASE CONFIG FROM STEP 1
const firebaseConfig = {
  apiKey: "AIzaSyDhvG-6RWjDvtDQjvNOwSDslHeWOFJ1BFg",
  authDomain: "algolib-34931.firebaseapp.com",
  databaseURL: "https://algolib-34931-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "algolib-34931",
  storageBucket: "algolib-34931.firebasestorage.app",
  messagingSenderId: "260270114890",
  appId: "1:260270114890:web:b1526548662720a732beb3",
  measurementId: "G-HY0HC9MS7W"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, get, set, runTransaction };