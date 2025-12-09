
'use client';

import { notFound, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Item, UserProfile, Notification } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, ShoppingCart, Loader2, ArrowLeft, Heart, Mail, Phone, MapPin, Facebook, Send } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, Suspense } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCart } from '@/context/cart-context';
import { AppHeader } from '@/components/app-header';
import Loading from '@/app/loading';


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
                <div className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex gap-2">
                           <Skeleton className="h-6 w-20 rounded-full" />
                           <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-12 w-1/4" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
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
                    <div className="space-y-2 pt-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function ItemPageComponent({ params }: ItemPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser, loading: userLoading } = useUser();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const routeParams = useParams();
  const id = routeParams.id as string;
  const { addToCart } = useCart();

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
  
  const handleBuyItem = async () => {
    if (!currentUser || !firestore || !item || !seller) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to buy an item.' });
        return;
    }
    setIsSendingNotification(true);
    const notification: Omit<Notification, 'id'> = {
        recipientId: seller.id,
        senderId: currentUser.uid,
        itemId: item.id!,
        type: 'buy_now',
        text: `wants to buy your item: ${item.name}`,
        read: false,
        createdAt: serverTimestamp(),
    };

    try {
        const notificationsCollection = collection(firestore, 'users', seller.id, 'notifications');
        await addDoc(notificationsCollection, notification);
        toast({
            title: 'Notification Sent!',
            description: `The seller has been notified that you want to buy "${item.name}".`,
        });
    } catch (error) {
         console.error('Error sending notification:', error);
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not send notification. Please try again.',
        });
    } finally {
        setIsSendingNotification(false);
    }
  }


  const handleAddToCart = async () => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to add items to your cart.' });
        return;
    }
    if (!item) return;

    setIsAddingToCart(true);
    
    addToCart(item);

    toast({
        title: 'Added to cart!',
        description: `${item.name} has been added to your cart.`
    });
    
    setTimeout(() => {
        setIsAddingToCart(false);
    }, 1000);
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
      <Button asChild variant="link" className="mb-4 pl-0 text-primary">
        <Link href="/home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
        </Link>
      </Button>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Carousel className="w-full">
            <CarouselContent>
              {images.length > 0 ? images.map((img, index) => (
                <CarouselItem key={index}>
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-square w-full relative">
                        {img && img.imageUrl && (
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
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-accent-foreground">{item.name}</h1>
            <p className="text-4xl font-bold text-primary mt-2">₱{item.price.toFixed(2)}</p>
          </div>

          <div>
            <h2 className="font-headline text-lg font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{item.description}</p>
          </div>
          
          {seller && (
            <div>
              <h2 className="font-headline text-lg font-semibold mb-2">Seller Information</h2>
                <Card className="transition-all hover:shadow-md hover:bg-muted/50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <Link href={`/profile/${seller.id}`} className="flex items-center gap-3">
                            <UserAvatar name={seller.displayName} avatarUrl={seller.profilePictureUrl || ''} className="h-12 w-12" />
                            <div>
                                <p className="font-semibold">{seller.displayName}</p>
                                <p className="text-sm text-muted-foreground">Seller</p>
                            </div>
                        </Link>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button>CONTACT</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Contact Information</h4>
                                        <p className="text-sm text-muted-foreground">
                                        Reach out to the seller.
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        {item.email && (
                                            <div className="grid grid-cols-[20px_1fr] items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-mono">{item.email}</span>
                                            </div>
                                        )}
                                        {item.contactNumber && (
                                            <div className="grid grid-cols-[20px_1fr] items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{item.contactNumber}</span>
                                            </div>
                                        )}
                                        {item.location && (
                                            <div className="grid grid-cols-[20px_1fr] items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{item.location}</span>
                                            </div>
                                        )}
                                        {item.facebookProfileUrl && (
                                            <div className="grid grid-cols-[20px_1fr] items-center gap-2">
                                                <Facebook className="h-4 w-4 text-muted-foreground" />
                                                <a href={item.facebookProfileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                        Facebook Profile
                                                    </a>
                                            </div>
                                        )}
                                        {!item.email && !item.contactNumber && !item.location && !item.facebookProfileUrl &&(
                                            <p className="text-sm text-muted-foreground">No contact information provided.</p>
                                        )}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </CardContent>
                </Card>
            </div>
          )}
          
          <div className="space-y-2 pt-2">
             {currentUser?.uid !== seller?.id && (
                <>
                    <Button size="lg" className="w-full font-bold" onClick={handleBuyItem} disabled={isSendingNotification}>
                         {isSendingNotification ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         ) : (
                            <Send className="mr-2 h-4 w-4" />
                         )}
                         Buy Item
                    </Button>
                    <Button size="lg" variant="outline" className="w-full font-bold" onClick={handleAddToCart} disabled={isAddingToCart}>
                        {isAddingToCart ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ShoppingCart className="mr-2 h-4 w-4" />
                        )}
                        Add to Cart
                    </Button>
                </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ItemPage({ params }: ItemPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 bg-muted/20">
            <Suspense fallback={<Loading />}>
                <ItemPageComponent params={params} />
            </Suspense>
        </main>
    </div>
  )
}
