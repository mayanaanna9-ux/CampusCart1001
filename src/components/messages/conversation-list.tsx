
'use client';

import type { User } from 'firebase/auth';
import type { MessageThread } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/user-avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  threads: MessageThread[];
  currentUser: User | null;
  onSelectThread: (thread: MessageThread) => void;
  selectedThreadId: string | null;
}

export function ConversationList({ threads, currentUser, onSelectThread, selectedThreadId }: ConversationListProps) {

  if (!currentUser) return null;

  return (
    <>
      <div className="p-4 border-b">
        <h1 className="font-headline text-2xl font-bold">Messages</h1>
        <Input placeholder="Search messages..." className="mt-2" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {threads.map(thread => {
          const otherParticipantId = thread.participants.find(p => p !== currentUser.uid);
          if (!otherParticipantId) return null;
          
          const otherParticipant = thread.participantDetails[otherParticipantId];
          const lastMessageTimestamp = thread.lastMessageTimestamp?.toDate();
          
          return (
            <div 
              key={thread.id} 
              className={cn(
                "flex gap-3 p-4 items-start cursor-pointer hover:bg-muted/50 border-b",
                selectedThreadId === thread.id && "bg-muted/50"
                )}
              onClick={() => onSelectThread(thread)}
            >
              {otherParticipant && <UserAvatar name={otherParticipant.name} avatarUrl={otherParticipant.avatarUrl} className="h-10 w-10 shrink-0" />}
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <p className="font-bold truncate">{otherParticipant?.name}</p>
                  {lastMessageTimestamp && (
                    <p className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(lastMessageTimestamp, { addSuffix: true })}
                    </p>
                  )}
                </div>
                <p className="text-sm font-semibold truncate text-muted-foreground">{thread.itemPreview.name}</p>
                <p className="text-sm text-muted-foreground truncate">{thread.lastMessageText}</p>
              </div>
            </div>
          )
        })}
         {threads.length === 0 && (
            <div className="text-center p-8">
                <p className="text-muted-foreground">No conversations yet.</p>
            </div>
         )}
      </div>
    </>
  );
}
