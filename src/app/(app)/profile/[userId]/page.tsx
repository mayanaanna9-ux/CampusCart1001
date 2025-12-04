
'use client';

import { UserAvatar } from '@/components/user-avatar';
import { ItemCard } from '@/components/item-card';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquare, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { UserProfile, Item, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const { user: authUser, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const routeParams = useParams();
  const { toast } = useToast();
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  // This is the user whose profile we are viewing.
  const profileUserId = routeParams.userId as string;
  const isOwnProfile = authUser?.uid === profileUserId;
  
  useEffect(() => {
    // If the user is trying to view their own profile via this dynamic route,
    // redirect them to the canonical /profile page.
    if (isOwnProfile) {
        router.replace('/profile');
    }
  }, [isOwnProfile, router]);


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
  
  // If we are redirecting, show skeleton
  if (isOwnProfile) {
    return <ProfileSkeleton />;
  }
  
  if (isLoading) {
    return <ProfileSkeleton />;
  }
  
  if (!userProfile) {
    return (
        <div className="container mx-auto max-w-4xl p-4 md:p-6 text-center">
            <h1 className="font-headline text-2xl font-bold">User not found</h1>
            <p className="text-muted-foreground">This profile could not be loaded.</p>
        </div>
    )
  }
  
    const handleMessageUser = async () => {
        if (!authUser || !userProfile || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to message a user.' });
            return;
        }

        setIsCreatingThread(true);
        // Generic thread ID for user-to-user chat, not item-specific
        const threadId = [authUser.uid, userProfile.id].sort().join('_');
        
        const userThreadRef = doc(firestore, 'users', authUser.uid, 'messageThreads', threadId);

        
        const threadDoc = await getDoc(userThreadRef);
        if (!threadDoc.exists()) {
            const batch = writeBatch(firestore);
            const timestamp = serverTimestamp();
            
            const threadData = {
                id: threadId,
                itemId: null, // No specific item
                participants: [authUser.uid, userProfile.id],
                participantDetails: {
                    [authUser.uid]: {
                        name: authUser.displayName,
                        avatarUrl: authUser.photoURL,
                    },
                    [userProfile.id]: {
                        name: userProfile.displayName,
                        avatarUrl: userProfile.profilePictureUrl,
                    }
                },
                itemPreview: {
                    name: `Chat with ${userProfile.displayName}`,
                    imageUrl: userProfile.profilePictureUrl || null,
                },
                lastMessageText: `Started a conversation with ${userProfile.displayName}`,
                lastMessageTimestamp: timestamp,
            }

            // Create thread for current user
            batch.set(userThreadRef, threadData);
            
            // Create thread for other user
            const otherUserThreadRef = doc(firestore, 'users', userProfile.id, 'messageThreads', threadId);
            batch.set(otherUserThreadRef, threadData);

            await batch.commit().then(() => {
                router.push(`/messages/${threadId}`);
            }).catch(error => {
                const permissionError = new FirestorePermissionError({
                    path: userThreadRef.path, // We can use either ref path, they are related
                    operation: 'write',
                    requestResourceData: threadData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });

        } else {
             router.push(`/messages/${threadId}`);
        }

        setIsCreatingThread(false);

    }


  const displayUser: User = {
    id: userProfile.id,
    name: userProfile.displayName || 'User',
    avatarUrl: userProfile.profilePictureUrl || '',
  };

  const getJoinDate = (createdAt: any) => {
    if (!createdAt) return null;
    if (typeof createdAt.toDate === 'function') {
      return createdAt.toDate();
    }
    if (typeof createdAt === 'string') {
      return new Date(createdAt);
    }
    return null;
  }
  const joinDate = getJoinDate(userProfile.createdAt);
  

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      <div className="flex flex-col items-center space-y-4 mb-8 md:flex-row md:items-start md:space-y-0 md:space-x-6 md:items-center">
        <div className="relative">
            <UserAvatar name={displayUser.name} avatarUrl={displayUser.avatarUrl} className="h-28 w-28 border-4 border-card" />
        </div>
        <div className="flex-1 text-center md:text-left">
            <h1 className="font-headline text-3xl font-bold">{displayUser.name}</h1>
            {userProfile.username && <p className="text-lg text-muted-foreground">@{userProfile.username}</p>}
            {userProfile.bio && <p className="mt-2 text-foreground max-w-prose">{userProfile.bio}</p>}
            {joinDate && (
                <p className="text-sm text-muted-foreground mt-2">
                    Joined {joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
            )}
            <Button variant="outline" className="mt-4" onClick={handleMessageUser} disabled={isCreatingThread}>
                {isCreatingThread ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                Message
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
                            This user hasn't listed any items.
                        </p>
                    </div>
                )}
            </div>
        </TabsContent>
        <TabsContent value="favorites">
            <div className="text-center py-12">
                 <p className="text-muted-foreground">
                    This user has no favorited items.
                </p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

