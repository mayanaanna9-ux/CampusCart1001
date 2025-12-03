
'use client';

import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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
    return query(collection(firestore, 'items'), orderBy('postedAt', 'desc'));
  }, [firestore]);

  const { data: items, isLoading: itemsLoading } = useCollection<Item>(itemsQuery);

  if (itemsLoading) {
    return <HomeSkeleton />;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getComparableDate = (postedAt: any): Date => {
    if (!postedAt) return new Date(0); // Return a very old date if undefined
    if (postedAt.toDate) return postedAt.toDate(); // It's a Firestore Timestamp
    if (typeof postedAt === 'string') return new Date(postedAt); // It's an ISO string
    if (postedAt instanceof Date) return postedAt; // It's already a Date object
    return new Date(0); // Fallback for unknown types
  };

  const todaysItems = (items || [])
    .filter(item => getComparableDate(item.postedAt) >= today)
    .sort((a, b) => getComparableDate(b.postedAt).getTime() - getComparableDate(a.postedAt).getTime());


  return (
    <div className="container mx-auto max-w-5xl p-4 md:p-6">
      <section className="mt-8 space-y-4">
        <h2 className="font-headline text-2xl font-bold">Latest Sales Today✨🔥</h2>
        {todaysItems.length > 0 ? (
            <Carousel
                opts={{
                    align: 'start',
                    loop: todaysItems.length > 1,
                }}
                className="w-full"
                >
                <CarouselContent>
                    {todaysItems.map((item) => (
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
        <Recommendations allItems={items || []} allUsers={users} userHistoryData={userHistory} />
      </section>

    </div>
  );
}
