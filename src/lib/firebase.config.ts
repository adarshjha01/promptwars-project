// src/lib/firebase.config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { type Analytics, getAnalytics, isSupported } from 'firebase/analytics';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Diagnostic check to ensure environment variables are loaded
if (!apiKey || apiKey.includes('your-')) {
  console.error("CRITICAL: Firebase API Key is missing or invalid in the environment.");
} else {
  console.log("Firebase initializing with key prefix:", apiKey.substring(0, 5));
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Firebase Analytics — only initialized on the client.
 * `isSupported()` guards against environments where Analytics cannot run
 * (SSR, some privacy-focused browsers, Node test runners, etc.).
 */
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
export { analytics };