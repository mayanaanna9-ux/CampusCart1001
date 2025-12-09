
import type { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type UserProfile = {
    id: string;
    email: string | null;
    displayName: string;
    username: string;
    profilePictureUrl?: string;
    avatarId?: string;
    bio?: string;
    createdAt?: Timestamp;
    location?: string;
    contactNumber?: string;
}

export type Item = {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  sellerId: string;
  imageUrls: string[];
  postedAt: Timestamp | string; // Allow both for optimistic updates and server values
  contactNumber?: string;
  location?: string;
  email?: string;
  facebookProfileUrl?: string;
};

    