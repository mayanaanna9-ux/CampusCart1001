'use client';
import {useEffect, useState} from 'react';

import {FirebaseProvider, initializeFirebase} from '@/firebase';

export function FirebaseClientProvider({children}: {children: React.ReactNode}) {
  const [firebase, setFirebase] = useState<ReturnType<typeof initializeFirebase> | null>(null);

  useEffect(() => {
    setFirebase(initializeFirebase());
  }, []);

  if (!firebase) {
    return null;
  }
  return <FirebaseProvider {...firebase}>{children}</FirebaseProvider>;
}
