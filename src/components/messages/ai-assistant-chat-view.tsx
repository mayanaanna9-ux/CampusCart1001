
'use client';

import { useState, useRef, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { UserAvatar } from '@/components/user-avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { askAIAssistant } from '@/ai/flows/ai-assistant-flow';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

interface AIAssistantChatViewProps {
  currentUser: User;
}

export function AIAssistantChatView({ currentUser }: AIAssistantChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiAvatar = PlaceHolderImages.find(p => p.id === 'avatar3')?.imageUrl || '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    // Initial greeting from the AI assistant
    setMessages([
        { role: 'model', content: `Hi ${currentUser.displayName || 'there'}! I'm Carty, your Campus Cart assistant. How can I help you today?` }
    ]);
  }, [currentUser.displayName]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: newMessage.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setNewMessage('');
    setIsLoading(true);

    try {
      const result = await askAIAssistant({ history: newMessages });
      const aiMessage: ChatMessage = { role: 'model', content: result.response };
      setMessages([...newMessages, aiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I'm having a little trouble right now. Please try again later." };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 p-4 border-b">
        <UserAvatar name="Carty" avatarUrl={aiAvatar} className="h-10 w-10" />
        <div>
          <p className="font-bold">Carty</p>
          <p className="text-sm text-muted-foreground">AI Assistant</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => {
          const isCurrentUser = message.role === 'user';
          return (
            <div key={index} className={cn("flex items-end gap-3", isCurrentUser && "justify-end")}>
              {!isCurrentUser && <UserAvatar name="Carty" avatarUrl={aiAvatar} className="h-8 w-8" />}
              <div className={cn(
                  "max-w-xs md:max-w-md rounded-2xl p-3", 
                  isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
              )}>
                <p>{message.content}</p>
              </div>
            </div>
          );
        })}
        {isLoading && (
            <div className="flex items-end gap-3">
                 <UserAvatar name="Carty" avatarUrl={aiAvatar} className="h-8 w-8" />
                 <div className="bg-muted rounded-2xl p-3 rounded-bl-none">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse delay-0"></span>
                        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse delay-150"></span>
                        <span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse delay-300"></span>
                    </div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="relative">
          <Input 
            placeholder="Ask Carty anything..." 
            className="pr-24 h-12"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isLoading}
          />
          <div className="absolute top-1/2 right-2 -translate-y-1/2 flex gap-1">
            <Button type="submit" size="icon" disabled={!newMessage.trim() || isLoading}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
