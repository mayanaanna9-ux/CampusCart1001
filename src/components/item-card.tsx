
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Item, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { UserAvatar } from './user-avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { MoreVertical, Trash2, Pencil } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import React from 'react';


type ItemCardProps = {
  item: Item;
};

export function ItemCard({ item }: ItemCardProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const sellerRef = useMemoFirebase(() => {
    if (!firestore || !item.sellerId) return null;
    return doc(firestore, 'users', item.sellerId);
  }, [firestore, item.sellerId]);
  
  const { data: seller, isLoading: sellerLoading } = useDoc<UserProfile>(sellerRef);

  const rawImageUrl = item.imageUrls?.[0];
  const placeholder = PlaceHolderImages.find(p => p.id === rawImageUrl || p.imageUrl === rawImageUrl);
  const displayUrl = placeholder?.imageUrl || rawImageUrl;
  const imageHint = placeholder?.imageHint;
  
  const isOwner = currentUser && currentUser.uid === item.sellerId;

  const handleDelete = async () => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'items', item.id));
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

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg group">
      <CardHeader className="flex-row items-center gap-3 p-3 justify-between">
          {sellerLoading ? (
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 flex-1" />
            </div>
          ) : seller ? (
            <Link href={`/profile/${seller.id}`} className="flex items-center gap-3 flex-1 overflow-hidden">
              <UserAvatar name={seller.displayName} avatarUrl={seller.profilePictureUrl || ''} className="h-8 w-8" />
              <p className="flex-1 truncate font-headline text-sm font-semibold hover:underline">{seller.displayName}</p>
            </Link>
          ) : <div className="flex-1" />}
         
          {isOwner && (
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0">
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
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Post
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your item posting.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
      </CardHeader>
      
      <CardContent className="p-0">
        <Link href={`/items/${item.id}`} className="block">
          {displayUrl && (
            <div className="aspect-square w-full overflow-hidden bg-muted relative">
              <Image
                src={displayUrl}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={imageHint}
              />
            </div>
          )}
        </Link>
        <div className="p-3">
          <Link href={`/items/${item.id}`}>
            <h3 className="font-semibold truncate hover:underline">{item.name}</h3>
          </Link>
          <p className="text-lg font-bold text-primary">${item.price.toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
