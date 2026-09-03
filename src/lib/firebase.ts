/* ------------------------------------------------------------------ */
/* Firebase client bootstrap. All credentials come from environment     */
/* variables (VITE_FIREBASE_*) — see .env.example. Nothing is baked     */
/* into the bundle except the public web config Firebase requires       */
/* client-side.                                                          */
/* ------------------------------------------------------------------ */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';

export interface FbEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function readFirebaseEnv(): FbEnv | null {
  const v = (k: string): string => (import.meta.env[k] as string | undefined)?.trim() ?? '';
  const cfg: FbEnv = {
    apiKey: v('VITE_FIREBASE_API_KEY'),
    authDomain: v('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: v('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: v('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: v('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: v('VITE_FIREBASE_APP_ID'),
  };
  const missing = Object.entries(cfg).filter(([, x]) => !x).map(([k]) => k);
  if (missing.length) {
    console.error(
      `[venturesetu] Firebase is not configured: missing ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in your Firebase web app config, then restart the dev server.'
    );
    return null;
  }
  return cfg;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export function fbReady(): boolean {
  return app !== null;
}

export function fbApp(): FirebaseApp {
  if (!app) throw new Error('Firebase not initialised — is .env configured?');
  return app;
}
export function fbAuth(): Auth {
  if (!auth) throw new Error('Firebase Auth not initialised — is .env configured?');
  return auth;
}
export function fbDb(): Firestore {
  if (!db) throw new Error('Firestore not initialised — is .env configured?');
  return db;
}
export function fbStorage(): FirebaseStorage {
  if (!storage) throw new Error('Storage not initialised — is .env configured?');
  return storage;
}

/** True when VITE_USE_EMULATORS=1 — local dev ONLY (see .env.example). */
function emulatorMode(): boolean {
  const v = (import.meta.env.VITE_USE_EMULATORS as string | undefined)?.trim().toLowerCase();
  return v === '1' || v === 'true';
}

/**
 * Initialise once. Returns false when env config is missing/blank.
 * Production contract is untouched: the six VITE_FIREBASE_* values are
 * always required. Emulator mode additionally points every SDK at the
 * local emulators (npm run emulators) and is meant for development and
 * end-to-end testing only — never set VITE_USE_EMULATORS on a real build.
 */
export function initFirebase(): boolean {
  if (app) return true;
  const cfg = readFirebaseEnv();
  if (!cfg) return false;
  app = initializeApp(cfg);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  if (emulatorMode()) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
  }
  return true;
}

/* ------------------------------------------------------------- helpers */
/** Clean slug for storage filenames (keeps .pdf etc). */
export function safeFileName(name: string): string {
  const base = name.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 120);
  return base || 'file';
}

export const MAX_DECK_MB = 25;
