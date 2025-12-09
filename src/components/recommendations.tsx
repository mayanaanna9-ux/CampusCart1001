
'use client';

import { useEffect, useState } from 'react';
import type { Item, User } from '@/lib/types';
import { recommendRelevantItems } from '@/ai/flows/recommend-relevant-items';
import { ItemCard } from './item-card';
import { Skeleton } from './ui/skeleton';

export function Recommendations({ allItems, userHistoryData }: { allItems: Item[], userHistoryData: any }) {
  const [recommendedItems, setRecommendedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRecommendations = async () => {
      setLoading(true);
      try {
        if (allItems.length === 0) {
            setRecommendedItems([]);
            setLoading(false);
            return;
        }

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
        
        if (filteredItems.length === 0 && allItems.length > 0) {
            // Fallback if AI returns no matches
            const sortedByDate = [...allItems].sort((a, b) => {
                const dateA = a.postedAt ? new Date((a.postedAt as any).seconds * 1000).getTime() : 0;
                const dateB = b.postedAt ? new Date((b.postedAt as any).seconds * 1000).getTime() : 0;
                return dateB - dateA;
            });
            setRecommendedItems(sortedByDate.slice(0, 2));
        } else {
            setRecommendedItems(filteredItems);
        }

      } catch (error) {
        console.error("AI recommendations failed, falling back to recent items:", error);
        if (allItems.length > 0) {
          // Fallback to showing the 2 most recent items on any error
           const sortedByDate = [...allItems].sort((a, b) => {
                const dateA = a.postedAt ? new Date((a.postedAt as any).seconds * 1000).getTime() : 0;
                const dateB = b.postedAt ? new Date((b.postedAt as any).seconds * 1000).getTime() : 0;
                return dateB - dateA;
            });
          setRecommendedItems(sortedByDate.slice(0, 2));
        }
      } finally {
        setLoading(false);
      }
    };

    // Use a timeout to avoid immediate re-render issues in strict mode
    const timer = setTimeout(() => {
        getRecommendations();
    }, 0);


    return () => clearTimeout(timer);

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
        <p className="text-muted-foreground">No recommendations available right now.</p>
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
