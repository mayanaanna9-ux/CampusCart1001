
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Item, UserProfile } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { UserAvatar } from './user-avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';

type ItemCardProps = {
  item: Item;
};

export function ItemCard({ item }: ItemCardProps) {
  const firestore = useFirestore();
  const sellerRef = useMemoFirebase(() => {
    if (!firestore || !item.sellerId) return null;
    return doc(firestore, 'users', item.sellerId);
  }, [firestore, item.sellerId]);
  
  const { data: seller, isLoading: sellerLoading } = useDoc<UserProfile>(sellerRef);

  const imageUrl = item.imageUrls?.[0];
  const placeholder = PlaceHolderImages.find(p => p.imageUrl === imageUrl || p.id === imageUrl);

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/items/${item.id}`} className="block">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-3">
             {sellerLoading ? (
                <>
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-5 flex-1" />
                </>
            ) : seller ? (
                <>
                    <UserAvatar name={seller.displayName} avatarUrl={seller.profilePictureUrl || ''} className="h-8 w-8" />
                    <p className="flex-1 truncate font-headline text-sm font-semibold">{item.name}</p>
                </>
            ) : null}
          </div>
          {placeholder && (
            <div className="aspect-square w-full overflow-hidden bg-muted">
              <Image
                src={placeholder.imageUrl}
                alt={item.name}
                width={400}
                height={400}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                data-ai-hint={placeholder.imageHint}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="p-3">
          <p className="text-lg font-bold text-primary">${item.price.toFixed(2)}</p>
        </CardFooter>
      </Link>
    </Card>
  );
}
