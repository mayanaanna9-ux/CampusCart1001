'use client';

import { notFound, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import type { Item, UserProfile } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, ShoppingCart, Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

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
                    <div className="space-y-4">
                        <div className="flex gap-2">
                           <Skeleton className="h-6 w-20 rounded-full" />
                           <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-12 w-1/4" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Card>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-24" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>

                                </div>
                                <Skeleton className="h-10 w-32" />
                            </CardContent>
                        </Card>
                    </div>
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
    )
}

export default function ItemPage({ params }: ItemPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser, loading: userLoading } = useUser();
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const routeParams = useParams();
  const id = routeParams.id as string;

  const itemRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'items', id);
  }, [firestore, id]);

  const { data: item, isLoading: itemLoading } = useDoc<Item>(itemRef);

  const sellerId = item?.sellerId;
  const sellerRef = useMemoFirebase(() => {
    if (!firestore || !sellerId) return null;
    return doc(firestore, 'users', sellerId);
  }, [firestore, sellerId]);

  const { data: seller, isLoading: sellerLoading } = useDoc<UserProfile>(sellerRef);
  
  const isLoading = userLoading || itemLoading || sellerLoading;

  if (isLoading) {
    return <ItemPageSkeleton />;
  }

  if (!item) {
    notFound();
  }

  const handleMessageSeller = async () => {
    if (!currentUser || !seller || !firestore || !item) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to message a seller.' });
        return;
    }
    if (currentUser.uid === seller.id) {
        toast({ variant: 'destructive', title: 'Error', description: 'You cannot message yourself.' });
        return;
    }

    setIsCreatingThread(true);
    const threadId = [currentUser.uid, seller.id].sort().join('_') + `_${item.id}`;
    
    const userThreadRef = doc(firestore, 'users', currentUser.uid, 'messageThreads', threadId);

    try {
        const threadDoc = await getDoc(userThreadRef);
        if (!threadDoc.exists()) {
             const batch = writeBatch(firestore);
             const timestamp = serverTimestamp();
             
             const threadData = {
                id: threadId,
                itemId: item.id,
                participants: [currentUser.uid, seller.id],
                participantDetails: {
                    [currentUser.uid]: {
                        name: currentUser.displayName,
                        avatarUrl: currentUser.photoURL,
                    },
                    [seller.id]: {
                        name: seller.displayName,
                        avatarUrl: seller.profilePictureUrl,
                    }
                },
                itemPreview: {
                    name: item.name,
                    imageUrl: item.imageUrls[0],
                },
                lastMessageText: 'Started a new conversation!',
                lastMessageTimestamp: timestamp,
             }

            // Create thread for current user
            batch.set(userThreadRef, threadData);
            
            // Create thread for seller
            const sellerThreadRef = doc(firestore, 'users', seller.id, 'messageThreads', threadId);
            batch.set(sellerThreadRef, threadData);

            await batch.commit();
        }
        
        router.push(`/messages/${threadId}`);

    } catch (error) {
        console.error("Error creating chat thread:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not start a conversation.' });
    } finally {
        setIsCreatingThread(false);
    }
  }

  const images = (item.imageUrls || []).map(url => ({ imageUrl: url, imageHint: 'product image' }));

  const conditionMap: { [key: string]: string } = {
    'new': 'New',
    'used-like-new': 'Used - Like New',
    'used-good': 'Used - Good',
    'used-fair': 'Used - Fair',
  };
  const conditionDisplay = item.condition ? conditionMap[item.condition] : 'N/A';

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Carousel className="w-full">
            <CarouselContent>
              {images.length > 0 ? images.map((img, index) => (
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
              )) : (
                 <CarouselItem>
                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="aspect-square w-full relative bg-muted flex items-center justify-center">
                                <ShoppingCart className="h-24 w-24 text-muted-foreground/50" />
                            </div>
                        </CardContent>
                    </Card>
                 </CarouselItem>
              )}
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
                <Badge variant="outline">{conditionDisplay}</Badge>
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
                            <p className="text-sm text-muted-foreground">Seller</p>
                        </div>
                    </div>
                     <Button variant="outline" onClick={handleMessageSeller} disabled={isCreatingThread || currentUser?.uid === seller.id}>
                        {isCreatingThread ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <MessageSquare className="mr-2 h-4 w-4" />
                        )}
                        Message
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
