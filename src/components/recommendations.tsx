'use client';

import { useEffect, useState } from 'react';
import type { Item, User } from '@/lib/types';
import { recommendRelevantItems } from '@/ai/flows/recommend-relevant-items';
import { ItemCard } from './item-card';
import { Skeleton } from './ui/skeleton';

export function Recommendations({ allItems, allUsers, userHistoryData }: { allItems: Item[], allUsers: User[], userHistoryData: any }) {
  const [recommendedItems, setRecommendedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRecommendations = async () => {
      setLoading(true);
      try {
        const availableItemsStr = JSON.stringify(allItems.map(i => ({ id: i.id, name: i.name, description: i.description, category: i.category })));
        const userHistoryStr = JSON.stringify(userHistoryData);
        
        const result = await recommendRelevantItems({
          availableItems: availableItemsStr,
          userHistory: userHistoryStr
        });
        
        const recommendedNames = result.recommendedItems
          .split('\n')
          .map(name => name.replace(/^- /, '').trim().toLowerCase())
          .filter(Boolean);
        
        const filteredItems = allItems.filter(item => recommendedNames.includes(item.name.toLowerCase()));
        
        // If AI gives nothing, show some random items
        if(filteredItems.length === 0) {
            setRecommendedItems(allItems.slice(0, 2).sort(() => 0.5 - Math.random()));
        } else {
            setRecommendedItems(filteredItems);
        }

      } catch (error) {
        console.error("Failed to get recommendations:", error);
        // Fallback to showing some recent items on error
        setRecommendedItems(allItems.slice(0, 2));
      } finally {
        setLoading(false);
      }
    };

    getRecommendations();
  }, [allItems, userHistoryData]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
        </div>
      </div>
    );
  }

  if (recommendedItems.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {recommendedItems.map(item => {
        const seller = allUsers.find(u => u.id === item.sellerId);
        if (!seller) return null;
        return <ItemCard key={item.id} item={item} seller={seller} />;
      })}
    </div>
  );
}
