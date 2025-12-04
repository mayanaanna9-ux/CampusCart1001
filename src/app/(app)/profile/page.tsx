
'use client';

import { UserAvatar } from '@/components/user-avatar';
import { ItemCard } from '@/components/item-card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import type { UserProfile, Item, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      <div className="flex items-center gap-6 mb-8">
        <Skeleton className="h-28 w-28 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
       <Tabs defaultValue="selling" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="selling">Selling (0)</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <TabsContent value="selling">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex items-center gap-3 p-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-5 flex-1" />
                        </div>
                        <Skeleton className="aspect-square w-full" />
                        <div className="p-3">
                            <Skeleton className="h-6 w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        </TabsContent>
        </Tabs>
    </div>
  )
}


export default function OwnProfilePage() {
  const { user: authUser, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const profileUserId = authUser?.uid;

  useEffect(() => {
    // If not loading and still no authenticated user, redirect to login.
    if (!userLoading && !authUser) {
      router.push('/');
    }
  }, [userLoading, authUser, router]);


  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !profileUserId) return null;
    return doc(firestore, 'users', profileUserId);
  }, [firestore, profileUserId]);

  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userDocRef);
  
  const userItemsQuery = useMemoFirebase(() => {
    if (!firestore || !profileUserId) return null;
    return query(collection(firestore, 'items'), where('sellerId', '==', profileUserId));
  }, [firestore, profileUserId]);

  const { data: userItems, isLoading: itemsLoading } = useCollection<Item>(userItemsQuery);

  const isLoading = userLoading || profileLoading || itemsLoading;
  
  // This is the key change: handle loading and missing user states gracefully.
  if (isLoading || !profileUserId) {
    return <ProfileSkeleton />;
  }
  
  // If the user profile data could not be fetched for the given ID.
  if (!userProfile) {
    return (
        <div className="container mx-auto max-w-4xl p-4 md:p-6 text-center">
            <h1 className="font-headline text-2xl font-bold">User not found</h1>
            <p className="text-muted-foreground">This profile could not be loaded.</p>
        </div>
    )
  }
  
  const displayUser: User = {
    id: userProfile.id,
    name: userProfile.displayName || 'User',
    avatarUrl: userProfile.profilePictureUrl || '',
  };

  const creationTime = authUser?.metadata.creationTime;
  const joinDate = creationTime ? new Date(creationTime) : null;
  

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      <div className="flex flex-col items-center space-y-4 mb-8 md:flex-row md:items-start md:space-y-0 md:space-x-6">
        <div className="relative">
            <UserAvatar name={displayUser.name} avatarUrl={displayUser.avatarUrl} className="h-28 w-28 border-4 border-card" />
        </div>
        <div className="flex-1 text-center md:text-left">
            <h1 className="font-headline text-3xl font-bold">{displayUser.name}</h1>
            {userProfile.username && <p className="text-lg text-muted-foreground">@{userProfile.username}</p>}
            {joinDate && (
                <p className="text-sm text-muted-foreground mt-2">
                    Joined {joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
            )}
            {userProfile.bio && <p className="mt-2 text-foreground max-w-prose">{userProfile.bio}</p>}
            <Button variant="outline" asChild className="mt-4">
                <Link href="/profile/edit">
                <Settings className="mr-2 h-4 w-4" /> Edit Profile
                </Link>
            </Button>
        </div>
      </div>

      <Tabs defaultValue="selling" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="selling">Selling ({userItems?.length || 0})</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <TabsContent value="selling">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                {userItems && userItems.length > 0 ? (
                    userItems.map(item => (
                        <ItemCard key={item.id} item={item} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <p className="text-muted-foreground">
                            You haven't listed any items yet.
                        </p>
                        <Button variant="link" asChild>
                            <Link href="/sell">Sell an item</Link>
                        </Button>
                    </div>
                )}
            </div>
        </TabsContent>
        <TabsContent value="favorites">
            <div className="text-center py-12">
                 <p className="text-muted-foreground">
                    You have no favorited items.
                </p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
 
