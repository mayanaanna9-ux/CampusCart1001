
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

export type Notification = {
    id: string;
    recipientId: string; // The user who should receive the notification
    senderId: string; // The user who triggered the notification
    itemId: string; // The item related to the notification
    type: 'buy_now' | 'new_message' | 'item_sold'; // Type of notification
    text: string; // The content of the notification
    read: boolean; // Whether the notification has been read
    createdAt: Timestamp | any; // Using `any` for serverTimestamp()
};
