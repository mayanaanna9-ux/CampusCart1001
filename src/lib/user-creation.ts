
import { doc, serverTimestamp, setDoc, Firestore } from 'firebase/firestore';
import { updateProfile, type UserCredential } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';

/**
 * Handles creating or merging a user profile in Firestore after authentication.
 */
export const handleUserCreation = async (
  userCredential: UserCredential, 
  firestore: Firestore,
  name?: string, 
  username?: string,
  location?: string,
  contactNumber?: string
) => {
  const user = userCredential.user;
  const userDocRef = doc(firestore, 'users', user.uid);

  // For new users, their display name in Auth might be null initially.
  const displayName = name || user.displayName || (user.isAnonymous ? 'Guest' : user.email);

  // Update the Auth user profile if a new name is provided.
  if (displayName && user.displayName !== displayName) {
    await updateProfile(user, { displayName });
  }

  // On sign-up, create the full document for the new user.
  const userProfile: Omit<UserProfile, 'createdAt'> & { createdAt: any } = {
    id: user.uid,
    email: user.email,
    displayName: displayName || '',
    username: username || '',
    profilePictureUrl: user.photoURL || '',
    createdAt: serverTimestamp(),
    location: location || '',
    contactNumber: contactNumber || '',
  };
  
  // Use the authenticated user's UID for the document reference.
  await setDoc(userDocRef, userProfile, { merge: true });
};
