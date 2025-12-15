

'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Item, UserProfile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from './user-avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from './ui/badge';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useUser } from '@/auth/use-user';
import { doc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { MoreVertical, Trash2, Pencil, ShoppingCart, Book, Shirt, Utensils, VenetianMask } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Smartphone } from 'lucide-react';


type FeaturedItemCardProps = {
  item: Item;
};

const CategoryIcon = ({ category }: { category?: string }) => {
    switch (category) {
        case 'gadgets':
            return <Smartphone className="h-4 w-4" />;
        case 'school-materials':
            return <Book className="h-4 w-4" />;
        case 'clothes':
            return <Shirt className="h-4 w-4" />;
        case 'food':
            return <Utensils className="h-4 w-4" />;
        case 'other':
            return <VenetianMask className="h-4 w-4" />;
        default:
            return null;
    }
}

export function FeaturedItemCard({ item }: FeaturedItemCardProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const sellerRef = useMemoFirebase(() => {
    if (!firestore || !item.sellerId) return null;
    return doc(firestore, 'users', item.sellerId);
  }, [firestore, item.sellerId]);
  
  const { data: seller, isLoading: sellerLoading } = useDoc<UserProfile>(sellerRef);

  const displayUrl = item.imageUrls?.[0] || '';
  const imageHint = 'product image';
  
  let timeAgo = '';
  if (item.postedAt) {
    const postedDate = (item.postedAt as any)?.toDate ? (item.postedAt as any).toDate() : new Date(item.postedAt);
    const hoursAgo = Math.round((Date.now() - postedDate.getTime()) / (1000 * 60 * 60));
    if (hoursAgo < 1) {
        timeAgo = 'Just now';
    } else if (hoursAgo < 24) {
        timeAgo = `${hoursAgo}h ago`;
    } else {
        timeAgo = new Intl.RelativeTimeFormat('en', { style: 'short' }).format(-Math.floor(hoursAgo/24), 'day');
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'items', item.id!));
      toast({
        title: 'Success',
        description: 'Your item has been deleted.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete item. Please try again.',
      });
    }
  };

  const isOwner = currentUser && item.id && currentUser.uid === item.sellerId;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg bg-card border-none group">
      <div className="relative">
         {isOwner && (
          <div className="absolute top-2 right-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/60 hover:bg-background">
                      <MoreVertical className="h-4 w-4" />
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                      <Link href={`/items/${item.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Post
                      </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()} onClick={handleDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Post
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        )}
        {item.category && (
            <div className="absolute top-2 left-2 z-10 bg-background/50 text-foreground p-1.5 rounded-full backdrop-blur-sm">
                <CategoryIcon category={item.category} />
            </div>
        )}
        <CardContent className="p-0">
          <Link href={`/items/${item.id}`} className="block aspect-video w-full overflow-hidden relative">
            {displayUrl ? (
                <Image
                    src={displayUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={imageHint}
                />
            ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
                </div>
            )}
            {timeAgo && <Badge variant="secondary" className="absolute bottom-2 left-2">{timeAgo}</Badge>}
          </Link>
          <div className="p-4 space-y-2">
                  <Link href={`/items/${item.id}`}><h3 className="font-headline text-lg font-semibold truncate hover:underline">{item.name}</h3></Link>
                  <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-primary">₱{item.price.toFixed(2)}</p>
                      {sellerLoading ? (
                          <div className="flex items-center gap-2">
                              <Skeleton className="h-6 w-6 rounded-full" />
                              <Skeleton className="h-5 w-16" />
                          </div>
                      ) : seller && (
                          <Link href={`/profile/${seller.id}`} className="flex items-center gap-2">
                              <UserAvatar userId={seller.id} name={seller.displayName} avatarUrl={seller.profilePictureUrl || ''} className="h-6 w-6" />
                              <span className="text-sm font-medium text-muted-foreground hover:underline">{seller.displayName}</span>
                          </Link>
                      )}
                  </div>
              </div>
        </CardContent>
      </div>
    </Card>
  );
}
