
import { doc, getDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { updateProfile, type UserCredential } from 'firebase/auth';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { UserProfile } from '@/lib/types';

/**
 * Handles creating or merging a user profile in Firestore after authentication.
 */
export const handleUserCreation = async (
  userCredential: UserCredential, 
  firestore: Firestore,
  name?: string | null, 
  username?: string | null,
  location?: string | null,
  contactNumber?: string | null
) => {
  const user = userCredential.user;
  const userDocRef = doc(firestore, 'users', user.uid);

  // For new users, their display name in Auth might be null initially.
  const displayName = name || user.displayName || (user.isAnonymous ? 'Guest' : user.email);

  // Update the Auth user profile if a new name is provided.
  if (displayName && user.displayName !== displayName) {
    await updateProfile(user, { displayName });
  }

  // Check if the document already exists to avoid overwriting username on login.
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    // On login, just ensure the basic info is there but don't overwrite existing fields.
    const existingData = docSnap.data();
    const profileData: Partial<UserProfile> = {
      id: user.uid,
      email: user.email,
      displayName: displayName || existingData.displayName,
      profilePictureUrl: user.photoURL || existingData.profilePictureUrl || '',
    };
    // Important: Use the authenticated user's UID for the document reference.
    setDocumentNonBlocking(doc(firestore, 'users', user.uid), profileData, { merge: true });
  } else {
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
    // Important: Use the authenticated user's UID for the document reference.
    setDocumentNonBlocking(doc(firestore, 'users', user.uid), userProfile, { merge: true });
  }
};
