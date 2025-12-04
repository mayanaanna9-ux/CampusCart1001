
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Item } from '@/lib/types';

interface CartContextType {
  cartItems: Item[];
  addToCart: (item: Item) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  hasNewItems: boolean;
  clearCartNotification: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<Item[]>(() => {
     if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cartItems');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  const [hasNewItems, setHasNewItems] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = (item: Item) => {
    setCartItems(prevItems => {
        // Prevent adding the same item multiple times
        if (prevItems.find(i => i.id === item.id)) {
            return prevItems;
        }
        setHasNewItems(true);
        return [...prevItems, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const clearCartNotification = () => {
    setHasNewItems(false);
  }

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, hasNewItems, clearCartNotification }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
