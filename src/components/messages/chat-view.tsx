
'use client';

import { useState, useRef, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserAvatar } from '@/components/user-avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageThread, Message } from '@/lib/types';

interface ChatViewProps {
  thread: MessageThread;
  currentUser: User;
}

export function ChatView({ thread, currentUser }: ChatViewProps) {
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherParticipantId = thread.participants.find(p => p !== currentUser.uid);
  const otherParticipant = otherParticipantId ? thread.participantDetails[otherParticipantId] : null;

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'messageThreads', thread.id, 'messages'), 
        orderBy('timestamp', 'asc')
    );
  }, [firestore, thread.id]);
  
  const { data: messages, isLoading } = useCollection<Message>(messagesQuery);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !newMessage.trim()) return;

    const messagesCollection = collection(firestore, 'messageThreads', thread.id, 'messages');
    
    addDoc(messagesCollection, {
        senderId: currentUser.uid,
        text: newMessage,
        timestamp: serverTimestamp(),
    }).catch(error => console.error("Error sending message:", error));

    setNewMessage('');
  };


  return (
    <div className="flex flex-col h-full">
      {otherParticipant && (
        <div className="flex items-center gap-4 p-4 border-b">
          <UserAvatar name={otherParticipant.name} avatarUrl={otherParticipant.avatarUrl} className="h-10 w-10" />
          <div>
            <p className="font-bold">{otherParticipant.name}</p>
            <p className="text-sm text-muted-foreground">{thread.itemPreview.name}</p>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading && <p>Loading messages...</p>}
        {messages?.map((message, index) => {
          const isCurrentUser = message.senderId === currentUser.uid;
          const senderId = message.senderId;
          const sender = thread.participantDetails[senderId];

          return (
            <div key={message.id || index} className={cn("flex items-end gap-3", isCurrentUser && "justify-end")}>
              {!isCurrentUser && sender && <UserAvatar name={sender.name} avatarUrl={sender.avatarUrl} className="h-8 w-8" />}
              <div className={cn("max-w-xs md:max-w-md rounded-2xl p-3", isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none")}>
                <p>{message.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="relative">
          <Input 
            placeholder="Type a message..." 
            className="pr-24 h-12"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <div className="absolute top-1/2 right-2 -translate-y-1/2 flex gap-1">
             <Button type="button" size="icon" variant="ghost" disabled>
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
             </Button>
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
