import type { User, Item, MessageThread } from './types';
import { PlaceHolderImages } from './placeholder-images';

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
    imageIds: ['item1_1', 'item1_2'],
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
    imageIds: ['item2_1'],
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
    imageIds: ['item3_1'],
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
    imageIds: ['item4_1'],
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
    imageIds: ['item5_1'],
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
    imageIds: ['item6_1'],
    postedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

export const messageThreads: MessageThread[] = [
  {
    id: 'thread1',
    itemId: 'item1',
    buyerId: 'user2',
    sellerId: 'user1',
    itemPreview: { name: 'Slightly Used MacBook Air', imageId: 'item1_1'},
    messages: [
      { id: 'msg1', senderId: 'user2', text: 'Hi, is this still available?', timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
      { id: 'msg2', senderId: 'user1', text: 'Yes, it is!', timestamp: new Date(Date.now() - 1000 * 60 * 19).toISOString() },
      { id: 'msg3', senderId: 'user2', text: 'Great! Would you consider $800?', timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
    ],
  },
  {
    id: 'thread2',
    itemId: 'item3',
    buyerId: 'user4',
    sellerId: 'user3',
    itemPreview: { name: 'University Branded Hoodie', imageId: 'item3_1'},
    messages: [
      { id: 'msg4', senderId: 'user4', text: 'Hey! Can I pick this up tomorrow?', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    ],
  },
];

// Mock user browsing history for AI recommendations
export const userHistory = {
  viewedItems: ['item2', 'item6'],
  searchedTerms: ['textbook', 'psychology', 'science'],
  purchasedItems: [],
};
