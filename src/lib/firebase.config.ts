import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

/* ── Hard-check: surface the key prefix so we can confirm what's loaded ── */
console.log(
  "Firebase initializing with key prefix:",
  apiKey?.substring(0, 5),
);

if (!apiKey || apiKey === "your-api-key-here" || apiKey.startsWith("YOUR_")) {
  console.error(
    "⚠️  Firebase API key is missing or is a placeholder. " +
      "Set NEXT_PUBLIC_FIREBASE_API_KEY in .env.local to a valid key.",
  );
}

const firebaseConfig = {
  apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
