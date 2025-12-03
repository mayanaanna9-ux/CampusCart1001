
'use client';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, ShoppingCart, Tag } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { Item, UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type ItemPageProps = {
  params: { id: string };
};


function ItemPageSkeleton() {
    return (
        <div className="container mx-auto max-w-4xl p-4 md:p-6">
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <Skeleton className="aspect-square w-full rounded-lg" />
                </div>
                <div className="space-y-6">
                    <div>
                        <div className="flex gap-2 mb-2">
                           <Skeleton className="h-6 w-20" />
                           <Skeleton className="h-6 w-24" />
                        </div>
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-12 w-1/3 mt-4" />
                    </div>
                    <div>
                        <Skeleton className="h-6 w-24 mb-2" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                     <div>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
    )
}

export default function ItemPage({ params }: ItemPageProps) {
  const firestore = useFirestore();

  const itemRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'items', params.id);
  }, [firestore, params.id]);

  const { data: item, isLoading: itemLoading } = useDoc<Item>(itemRef);

  const sellerRef = useMemoFirebase(() => {
    if (!firestore || !item?.sellerId) return null;
    return doc(firestore, 'users', item.sellerId);
  }, [firestore, item]);
  
  const { data: seller, isLoading: sellerLoading } = useDoc<UserProfile>(sellerRef);


  if (itemLoading || sellerLoading) {
    return <ItemPageSkeleton />;
  }

  if (!item) {
    notFound();
  }

  const images = (item.imageUrls || []).map(urlOrId => {
    const placeholder = PlaceHolderImages.find(p => p.id === urlOrId);
    if (placeholder) {
      return placeholder;
    }
    // It's a direct URL
    return { id: urlOrId, imageUrl: urlOrId, description: 'User uploaded image', imageHint: '' };
  }).filter(Boolean);


  const conditionMap = {
    'new': 'New',
    'used-like-new': 'Used - Like New',
    'used-good': 'Used - Good',
    'used-fair': 'Used - Fair',
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Carousel className="w-full">
            <CarouselContent>
              {images.map((img, index) => (
                <CarouselItem key={index}>
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-square w-full relative">
                        {img && (
                          <Image
                            src={img.imageUrl}
                            alt={`${item.name} image ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                            data-ai-hint={img.imageHint}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
                <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                </>
            )}
          </Carousel>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex gap-2 mb-2">
                {item.category && <Badge variant="secondary" className="capitalize">{item.category}</Badge>}
                <Badge variant="outline">{conditionMap[item.condition]}</Badge>
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold">{item.name}</h1>
            <p className="text-4xl font-bold text-primary mt-4">${item.price.toFixed(2)}</p>
          </div>

          <div>
            <h2 className="font-headline text-lg font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{item.description}</p>
          </div>
          
          {seller && (
            <div>
              <h2 className="font-headline text-lg font-semibold mb-2">Seller Information</h2>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UserAvatar name={seller.displayName} avatarUrl={seller.profilePictureUrl || ''} className="h-12 w-12" />
                        <div>
                            <p className="font-semibold">{seller.displayName}</p>
                            <Link href={`/profile/${seller.id}`} className="text-sm text-primary hover:underline">View Profile</Link>
                        </div>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/messages">
                            <MessageSquare className="mr-2 h-4 w-4" /> Message
                        </Link>
                    </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <Button size="lg" className="w-full font-bold">
            <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now
          </Button>

        </div>
      </div>
    </div>
  );
}
