
import type { User, Item, MessageThread } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { Timestamp } from 'firebase/firestore';

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

export const users: User[] = [
  { id: 'user1', name: 'Alice', avatarUrl: getImage('avatar1') },
  { id: 'user2', name: 'Bob', avatarUrl: getImage('avatar2') },
  { id: 'user3', name: 'Charlie', avatarUrl: getImage('avatar3') },
  { id: 'user4', name: 'Diana', avatarUrl: getImage('avatar4') },
];

export const items: Item[] = [
  {
    id: 'item1',
    name: 'Slightly Used MacBook Air',
    description: 'Selling my 2022 MacBook Air. It is in great condition, with only minor scuffs. Perfect for classes and assignments. Comes with the original charger.',
    price: 850,
    category: 'gadgets',
    condition: 'used-good',
    sellerId: 'user1',
    imageUrls: [getImage('item1_1'), getImage('item1_2')],
    postedAt: new Date().toISOString(),
  },
  {
    id: 'item2',
    name: 'Introduction to Psychology Textbook',
    description: 'Barely used textbook for PSY101. No highlights or marks. Latest edition.',
    price: 45,
    category: 'books',
    condition: 'used-like-new',
    sellerId: 'user2',
    imageUrls: [getImage('item2_1')],
    postedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'item3',
    name: 'University Branded Hoodie',
    description: 'Official university hoodie, size M. Only worn a few times. Very comfortable and warm.',
    price: 30,
    category: 'clothes',
    condition: 'used-good',
    sellerId: 'user3',
    imageUrls: [getImage('item3_1')],
    postedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'item4',
    name: 'Homemade Cupcakes (Box of 6)',
    description: 'Freshly baked chocolate cupcakes with vanilla frosting. Available for pickup today only!',
    price: 12,
    category: 'food',
    condition: 'new',
    sellerId: 'user4',
    imageUrls: [getImage('item4_1')],
    postedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'item5',
    name: 'Logitech Gaming Mouse',
    description: 'High-performance gaming mouse. Great for both gaming and productivity. In perfect working condition.',
    price: 50,
    category: 'gadgets',
    condition: 'used-like-new',
    sellerId: 'user1',
    imageUrls: [getImage('item5_1')],
    postedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'item6',
    name: 'Organic Chemistry Textbook',
    description: 'Required textbook for CHEM251. Some highlighting in early chapters. Otherwise good condition.',
    price: 60,
    category: 'books',
    condition: 'used-fair',
    sellerId: 'user2',
    imageUrls: [getImage('item6_1')],
    postedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

export const messageThreads: any[] = [
// This data is now fetched from Firestore. Keeping the file for other data.
];


// Mock user browsing history for AI recommendations
export const userHistory = {
  viewedItems: ['item2', 'item6'],
  searchedTerms: ['textbook', 'psychology', 'science'],
  purchasedItems: [],
};
