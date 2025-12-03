
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Item, UserProfile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from './user-avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from './ui/badge';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';

type FeaturedItemCardProps = {
  item: Item;
};

export function FeaturedItemCard({ item }: FeaturedItemCardProps) {
  const firestore = useFirestore();
  const sellerRef = useMemoFirebase(() => {
    if (!firestore || !item.sellerId) return null;
    return doc(firestore, 'users', item.sellerId);
  }, [firestore, item.sellerId]);
  
  const { data: seller, isLoading: sellerLoading } = useDoc<UserProfile>(sellerRef);

  const rawImageUrl = item.imageUrls?.[0];
  const placeholder = PlaceHolderImages.find(p => p.id === rawImageUrl);
  const displayUrl = placeholder?.imageUrl || rawImageUrl;
  const imageHint = placeholder?.imageHint;
  
  let timeAgo = '';
  if (item.postedAt) {
    const postedDate = (item.postedAt as any)?.toDate ? (item.postedAt as any).toDate() : new Date(item.postedAt);
    const hoursAgo = Math.round((Date.now() - postedDate.getTime()) / (1000 * 60 * 60));
    timeAgo = new Intl.RelativeTimeFormat('en', { style: 'short' }).format(-hoursAgo, 'hour');
  }


  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg bg-card border-none">
       <Link href={`/items/${item.id}`} className="block">
        <CardContent className="p-0">
          {displayUrl && (
            <div className="aspect-video w-full overflow-hidden relative">
              <Image
                src={displayUrl}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
                data-ai-hint={imageHint}
              />
               <Badge variant="secondary" className="absolute top-2 left-2">{timeAgo}</Badge>
            </div>
          )}
           <div className="p-4 space-y-2">
                <h3 className="font-headline text-lg font-semibold truncate">{item.name}</h3>
                <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-primary">${item.price.toFixed(2)}</p>
                     {sellerLoading ? (
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                    ) : seller && (
                        <div className="flex items-center gap-2">
                            <UserAvatar name={seller.displayName} avatarUrl={seller.profilePictureUrl || ''} className="h-6 w-6" />
                            <span className="text-sm font-medium text-muted-foreground">{seller.displayName}</span>
                        </div>
                    )}
                </div>
            </div>
        </CardContent>
      </Link>
    </Card>
  );
}
