import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const DEFAULT_FIREBASE_CONFIG = {
  projectId: "digital-encoder-5c9s2",
  appId: "1:148565703112:web:d76e73620c7a72934468fd",
  apiKey: "AIzaSyAwbIbFA1EBMrSb8A3QlEp7qqWTO89b5hI",
  authDomain: "digital-encoder-5c9s2.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-liveschool-f9e6cb59-6753-4dea-bd3f-6221f571b290",
  storageBucket: "digital-encoder-5c9s2.firebasestorage.app",
  messagingSenderId: "148565703112",
  measurementId: "",
  oAuthClientId: "148565703112-8ftvmp5jc7oi3cdt2td8ibcpb5iurjia.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// Initialize Firebase App instance safely
const app = getApps().length > 0 ? getApp() : initializeApp(DEFAULT_FIREBASE_CONFIG);

// Initialize Cloud Firestore with explicit database ID
export const db = getFirestore(
  app,
  DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId && DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId !== '(default)'
    ? DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId
    : undefined
);

export default app;
