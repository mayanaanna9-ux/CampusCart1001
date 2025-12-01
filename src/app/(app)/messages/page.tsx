import { messageThreads, users } from '@/lib/data';
import { UserAvatar } from '@/components/user-avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function MessagesPage() {
    const currentUserId = 'user2'; // Mock current user
    const selectedThread = messageThreads[0];
    const otherUser = users.find(u => u.id === selectedThread.sellerId);

  return (
    <div className="h-full border-t md:grid md:grid-cols-3">
      <div className="flex flex-col border-r">
        <div className="p-4 border-b">
            <h1 className="font-headline text-2xl font-bold">Messages</h1>
            <Input placeholder="Search messages..." className="mt-2" />
        </div>
        <div className="flex-1 overflow-y-auto">
            {messageThreads.map(thread => {
                const item = items.find(i => i.id === thread.itemId);
                const otherParticipantId = thread.buyerId === currentUserId ? thread.sellerId : thread.buyerId;
                const otherParticipant = users.find(u => u.id === otherParticipantId);
                const lastMessage = thread.messages[thread.messages.length - 1];
                const image = PlaceHolderImages.find(p => p.id === thread.itemPreview.imageId);

                return (
                    <div key={thread.id} className="flex gap-3 p-4 items-start cursor-pointer hover:bg-muted/50 border-b">
                       {otherParticipant && <UserAvatar name={otherParticipant.name} avatarUrl={otherParticipant.avatarUrl} className="h-10 w-10 shrink-0" />}
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center">
                                <p className="font-bold truncate">{otherParticipant?.name}</p>
                                <p className="text-xs text-muted-foreground">{new Date(lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                            <p className="text-sm font-semibold truncate text-muted-foreground">{thread.itemPreview.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{lastMessage.text}</p>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
      <div className="hidden md:col-span-2 md:flex md:flex-col">
        {selectedThread && otherUser && (
            <>
            <div className="flex items-center gap-4 p-4 border-b">
                <UserAvatar name={otherUser.name} avatarUrl={otherUser.avatarUrl} className="h-10 w-10"/>
                <div>
                    <p className="font-bold">{otherUser.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedThread.itemPreview.name}</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedThread.messages.map(message => {
                    const isCurrentUser = message.senderId === currentUserId;
                    const sender = users.find(u => u.id === message.senderId);
                    return (
                        <div key={message.id} className={cn("flex items-end gap-3", isCurrentUser && "justify-end")}>
                            {!isCurrentUser && sender && <UserAvatar name={sender.name} avatarUrl={sender.avatarUrl} className="h-8 w-8" />}
                             <div className={cn("max-w-xs md:max-w-md rounded-2xl p-3", isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none")}>
                                <p>{message.text}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="p-4 border-t bg-background">
                <div className="relative">
                    <Input placeholder="Type a message..." className="pr-12 h-12"/>
                    <Button size="icon" className="absolute top-1/2 right-2 -translate-y-1/2">
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            </>
        )}
      </div>
    </div>
  );
}

// Dummy items data needed for preview - this would be fetched from a DB in a real app
const items = [
    {id: 'item1', name: 'Slightly Used MacBook Air'},
    {id: 'item3', name: 'University Branded Hoodie'}
]
