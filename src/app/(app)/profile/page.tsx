import { items, users } from '@/lib/data';
import { UserAvatar } from '@/components/user-avatar';
import { ItemCard } from '@/components/item-card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfilePage() {
  const currentUser = users[0]; // Mock current user
  const userItems = items.filter(item => item.sellerId === currentUser.id);

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      <div className="flex flex-col items-center space-y-4 mb-8">
        <div className="relative">
            <UserAvatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} className="h-28 w-28 border-4 border-card" />
        </div>
        <div className="text-center">
            <h1 className="font-headline text-3xl font-bold">{currentUser.name}</h1>
            <p className="text-muted-foreground">Joined {new Date().getFullYear()}</p>
        </div>
        <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      </div>

      <Tabs defaultValue="selling" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="selling">Selling ({userItems.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <TabsContent value="selling">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                {userItems.length > 0 ? (
                    userItems.map(item => (
                        <ItemCard key={item.id} item={item} seller={currentUser} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <p className="text-muted-foreground">You haven't listed any items yet.</p>
                        <Button variant="link" asChild>
                            <a href="/sell">Sell an item</a>
                        </Button>
                    </div>
                )}
            </div>
        </TabsContent>
        <TabsContent value="favorites">
            <div className="text-center py-12">
                 <p className="text-muted-foreground">You have no favorited items.</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
