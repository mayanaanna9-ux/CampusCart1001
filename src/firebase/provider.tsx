'use client';

import {createContext, useContext} from 'react';
import type {FirebaseApp} from 'firebase/app';
import type {Auth} from 'firebase/auth';
import type {Firestore} from 'firebase/firestore';

const FirebaseContext = createContext<{
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} | null>(null);

export function FirebaseProvider({
  children,
  ...value
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}) {
  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

export function useFirebase() {
  const context = useContext(FirebaseContext);

  if (context === null) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }

  return context;
}

export function useFirebaseApp() {
  return useFirebase().firebaseApp;
}

export function useAuth() {
  return useFirebase().auth;
}

export function useFirestore() {
  return useFirebase().firestore;
}
