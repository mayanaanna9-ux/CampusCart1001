
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ProfilePictureContextType {
  optimisticProfilePicture: string | null;
  setOptimisticProfilePicture: (url: string | null) => void;
  setFinalProfilePicture: (url: string) => void;
}

const ProfilePictureContext = createContext<ProfilePictureContextType | undefined>(undefined);

export function ProfilePictureProvider({ children }: { children: ReactNode }) {
  const [optimisticProfilePicture, setOptimisticProfilePictureState] = useState<string | null>(null);

  const setOptimisticProfilePicture = useCallback((url: string | null) => {
    setOptimisticProfilePictureState(url);
  }, []);

  const setFinalProfilePicture = useCallback((url: string) => {
    setOptimisticProfilePictureState(null); 
  }, []);

  const value = {
    optimisticProfilePicture,
    setOptimisticProfilePicture,
    setFinalProfilePicture,
  };

  return (
    <ProfilePictureContext.Provider value={value}>
      {children}
    </ProfilePictureContext.Provider>
  );
}

export function useProfilePicture() {
  const context = useContext(ProfilePictureContext);
  if (context === undefined) {
    throw new Error('useProfilePicture must be used within a ProfilePictureProvider');
  }
  return context;
}
