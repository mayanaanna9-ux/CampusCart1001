export type User = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type Item = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'gadgets' | 'books' | 'clothes' | 'food' | 'other';
  condition: 'new' | 'used-like-new' | 'used-good' | 'used-fair';
  sellerId: string;
  imageIds: string[];
  postedAt: string; // ISO string
};

export type MessageThread = {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  messages: Message[];
  itemPreview: {
    name: string;
    imageId: string;
  }
};

export type Message = {
  id:string;
  senderId: string;
  text: string;
  timestamp: string; // ISO string
};
