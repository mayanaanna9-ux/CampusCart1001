
'use client';

import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Item } from '@/lib/types';
import { Recommendations } from '@/components/recommendations';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { FeaturedItemCard } from '@/components/featured-item-card';
import { Skeleton } from '@/components/ui/skeleton';
import { users, userHistory } from '@/lib/data'; // Keep for recommendations for now

function HomeSkeleton() {
    return (
        <div className="container mx-auto max-w-5xl p-4 md:p-6">
             <section className="mt-8 space-y-4">
                <h2 className="font-headline text-2xl font-bold">New Today</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="aspect-video w-full" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-6 w-1/4" />
                        </div>
                    ))}
                </div>
            </section>
             <section className="space-y-4 mt-8">
                <h2 className="font-headline text-2xl font-bold">Recommended For You</h2>
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
            </section>
        </div>
    )
}


export default function HomePage() {
  const firestore = useFirestore();

  const itemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'items'), orderBy('postedAt', 'desc'), limit(10));
  }, [firestore]);

  const { data: items, isLoading: itemsLoading } = useCollection<Item>(itemsQuery);

  if (itemsLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="container mx-auto max-w-5xl p-4 md:p-6">
      <section className="mt-8 space-y-4">
        <h2 className="font-headline text-2xl font-bold">Latest Sales Today✨🔥</h2>
        {items && items.length > 0 ? (
            <Carousel
                opts={{
                    align: 'start',
                    loop: items.length > 1,
                }}
                className="w-full"
                >
                <CarouselContent>
                    {items.map((item) => (
                        <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
                            <FeaturedItemCard item={item} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
            </Carousel>
        ) : (
            <div className="flex items-center justify-center rounded-lg bg-muted/50 p-12">
                <p className="text-muted-foreground">No new items posted today. Check back later!</p>
            </div>
        )}
      </section>
      
      <section className="space-y-4 mt-8">
        <h2 className="font-headline text-2xl font-bold">Recommended For You</h2>
        <Recommendations allItems={items || []} userHistoryData={userHistory} />
      </section>

    </div>
  );
}
