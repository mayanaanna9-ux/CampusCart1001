
'use client';

import { useEffect, useState, useRef } from 'react';
import type { Item } from '@/lib/types';
import { recommendRelevantItems } from '@/ai/flows/recommend-relevant-items';
import { ItemCard } from './item-card';
import { Skeleton } from './ui/skeleton';

export function Recommendations({ allItems, userHistoryData }: { allItems: Item[], userHistoryData: any }) {
  const [recommendedItems, setRecommendedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const recommendationsFetched = useRef(false);

  useEffect(() => {
    // Only run if we have items and haven't fetched recommendations yet.
    if (recommendationsFetched.current || allItems.length === 0) {
      if (allItems.length > 0 && loading) {
        // If we have items but already fetched, just stop loading.
        setLoading(false);
      }
      return;
    }
    
    recommendationsFetched.current = true;
    setLoading(true);

    const getRecommendations = async () => {
      try {
        const availableItemsStr = JSON.stringify(allItems.map(i => ({ id: i.id, name: i.name, description: i.description })));
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
        
        if (filteredItems.length > 0) {
            setRecommendedItems(filteredItems.slice(0, 2));
        } else {
            // Fallback if AI returns no matches or junk
            const sortedByDate = [...allItems].sort((a, b) => {
                const dateA = a.postedAt ? new Date((a.postedAt as any).seconds * 1000).getTime() : 0;
                const dateB = b.postedAt ? new Date((b.postedAt as any).seconds * 1000).getTime() : 0;
                return dateB - dateA;
            });
            setRecommendedItems(sortedByDate.slice(0, 2));
        }

      } catch (error) {
        console.error("AI recommendations failed, falling back to recent items:", error);
        // Fallback to showing the 2 most recent items on any error
        const sortedByDate = [...allItems].sort((a, b) => {
            const dateA = a.postedAt ? new Date((a.postedAt as any).seconds * 1000).getTime() : 0;
            const dateB = b.postedAt ? new Date((b.postedAt as any).seconds * 1000).getTime() : 0;
            return dateB - dateA;
        });
        setRecommendedItems(sortedByDate.slice(0, 2));
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
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-6 w-3/4 mt-2" />
            <Skeleton className="h-6 w-1/4" />
        </div>
        <div className="space-y-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-6 w-3/4 mt-2" />
            <Skeleton className="h-6 w-1/4" />
        </div>
      </div>
    );
  }

  if (recommendedItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No items to recommend right now.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {recommendedItems.map(item => {
        return <ItemCard key={item.id} item={item} />;
      })}
    </div>
  );
}
