
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useUser } from '@/firebase';
import { AIAssistantChatView } from '@/components/messages/ai-assistant-chat-view';
import { Skeleton } from '@/components/ui/skeleton';

function AIChatPageSkeleton() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 p-4 border-b">
                <Button variant="ghost" size="icon" className="md:hidden">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex items-end gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <Skeleton className="h-12 w-64 rounded-2xl" />
                </div>
                 <div className="flex items-end gap-3 justify-end">
                    <Skeleton className="h-12 w-48 rounded-2xl" />
                </div>
                 <div className="flex items-end gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <Skeleton className="h-20 w-56 rounded-2xl" />
                </div>
            </div>
            <div className="p-4 border-t bg-background">
                <Skeleton className="h-12 w-full rounded-md" />
            </div>
        </div>
    )
}

export default function AIAssistantPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  if (userLoading) {
    return <AIChatPageSkeleton />;
  }

  if (!user) {
    router.push('/');
    return <AIChatPageSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background z-10 md:hidden">
        <div className="flex items-center p-2 border-b">
          <Button variant="ghost" size="icon" onClick={() => router.push('/messages')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <AIAssistantChatView currentUser={user} />
    </div>
  );
}
