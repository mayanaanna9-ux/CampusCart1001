import { UserAvatar } from '@/components/user-avatar';
import { users, items } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Tag, DollarSign } from 'lucide-react';
import Link from 'next/link';

// Mock notifications data
const notifications = [
  {
    id: '1',
    type: 'new_message',
    userId: 'user1',
    itemId: 'item1',
    text: 'sent you a message about "Slightly Used MacBook Air".',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2',
    type: 'item_sold',
    userId: 'user3',
    itemId: 'item3',
    text: 'Your item "University Branded Hoodie" has been sold!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    type: 'new_item',
    userId: 'user2',
    itemId: 'item2',
    text: 'posted a new item: "Introduction to Psychology Textbook".',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'new_message':
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case 'item_sold':
      return <DollarSign className="h-5 w-5 text-green-500" />;
    case 'new_item':
      return <Tag className="h-5 w-5 text-purple-500" />;
    default:
      return null;
  }
};

export default function NotificationsPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="font-headline text-3xl font-bold mb-6">Notifications</h1>
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col">
            {notifications.map((notif, index) => {
              const user = users.find(u => u.id === notif.userId);
              if (!user) return null;

              const timeAgo = new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
                Math.round((new Date(notif.timestamp).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                'day'
              );

              return (
                <Link key={notif.id} href={notif.type === 'new_message' ? '/messages' : `/items/${notif.itemId}`} className="block hover:bg-muted/50 transition-colors">
                  <div className={`p-4 flex items-start gap-4 ${index < notifications.length -1 ? 'border-b' : ''}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <NotificationIcon type={notif.type} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={user.name} avatarUrl={user.avatarUrl} className="h-8 w-8" />
                        <p className="text-sm">
                          <span className="font-semibold">{user.name}</span> {notif.text}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
