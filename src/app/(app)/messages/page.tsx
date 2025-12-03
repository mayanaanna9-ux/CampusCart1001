
'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { MessageThread } from '@/lib/types';
import { ConversationList } from '@/components/messages/conversation-list';
import { ChatView } from '@/components/messages/chat-view';
import { MessageSquare, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function MessagesSkeleton() {
  return (
    <div className="h-full border-t md:grid md:grid-cols-3">
       <div className="flex flex-col border-r">
          <div className="p-4 border-b">
              <h1 className="font-headline text-2xl font-bold">Messages</h1>
              <Skeleton className="h-10 w-full mt-2" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 p-4 items-start border-b">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 overflow-hidden space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ))}
          </div>
       </div>
       <div className="hidden md:col-span-2 md:flex md:flex-col items-center justify-center bg-muted/30">
          <MessageSquare className="h-16 w-16 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">Select a conversation to start chatting</p>
       </div>
    </div>
  )
}


export default function MessagesPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);

  const threadsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // Query for message threads nested under the current user's document
    return query(
        collection(firestore, 'users', user.uid, 'messageThreads'),
        orderBy('lastMessageTimestamp', 'desc')
    );
  }, [user, firestore]);

  const { data: threads, isLoading: threadsLoading } = useCollection<MessageThread>(threadsQuery);

  const isLoading = userLoading || threadsLoading;

  if (isLoading) {
    return <MessagesSkeleton />;
  }

  return (
    <div className="h-full border-t md:grid md:grid-cols-3">
      <div className="relative flex flex-col border-r h-full">
        <ConversationList 
          threads={threads || []} 
          currentUser={user} 
          onSelectThread={setSelectedThread}
          selectedThreadId={selectedThread?.id || null}
        />
        <Button asChild className="absolute bottom-4 right-4 h-14 w-14 rounded-full shadow-lg" variant="destructive">
          <Link href="/messages/ai-assistant">
            <Plus className="h-8 w-8" />
            <span className="sr-only">New AI Chat</span>
          </Link>
        </Button>
      </div>
      <div className="hidden md:col-span-2 md:flex md:flex-col">
        {selectedThread && user ? (
          <ChatView thread={selectedThread} currentUser={user} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-muted/30">
            <MessageSquare className="h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
