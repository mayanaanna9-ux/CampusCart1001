'use client';
import {FirebaseApp, getApp, getApps, initializeApp} from 'firebase/app';
import {Auth, getAuth} from 'firebase/auth';
import {Firestore, getFirestore} from 'firebase/firestore';

import {firebaseConfig} from './config';

export * from './provider';

// `initializeFirebase` is idempotent.
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  return {firebaseApp, auth, firestore};
}
