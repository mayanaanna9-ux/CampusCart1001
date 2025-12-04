
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
}

export type Item = {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: 'gadgets' | 'books' | 'clothes' | 'food' | 'other';
  condition?: 'new' | 'used-like-new' | 'used-good' | 'used-fair';
  sellerId: string;
  imageUrls: string[];
  postedAt: Timestamp | string; // Allow both for optimistic updates and server values
};

export type MessageThread = {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  messages: Message[];
  itemPreview: {
    name: string;
    imageUrl: string;
  }
  lastMessageText: string;
  lastMessageTimestamp: Timestamp;
  participants: string[]; // Array of user IDs
  participantDetails: {
    [key: string]: {
      name: string;
      avatarUrl: string;
    }
  }
};

export type Message = {
  id?:string;
  senderId: string;
  text: string;
  timestamp: Timestamp; // ISO string
};
