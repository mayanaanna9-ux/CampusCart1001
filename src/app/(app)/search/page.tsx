
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Item, UserProfile } from '@/lib/types';
import { ItemCard } from '@/components/item-card';
import { UserCard } from '@/components/user-card';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function SearchSkeleton() {
    return (
        <div>
            <h2 className="font-headline text-2xl font-bold mb-4"><Skeleton className="h-8 w-32" /></h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(2)].map((_, i) => (
                     <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                ))}
            </div>
            <h2 className="font-headline text-2xl font-bold my-4"><Skeleton className="h-8 w-32 mt-4" /></h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
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
        </div>
    )
}

export default function SearchPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [searchBy, setSearchBy] = useState<'name' | 'username'>('name');

  const itemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (submittedSearch) {
        return query(
            collection(firestore, 'items'), 
            where('name', '>=', submittedSearch), 
            where('name', '<=', submittedSearch + '\uf8ff'),
            limit(20)
        );
    }
    return query(collection(firestore, 'items'), orderBy('postedAt', 'desc'), limit(20));
  }, [firestore, submittedSearch]);
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !submittedSearch) return null;
    return query(
        collection(firestore, 'users'), 
        where(searchBy === 'name' ? 'displayName' : 'username', '>=', submittedSearch), 
        where(searchBy === 'name' ? 'displayName' : 'username', '<=', submittedSearch + '\uf8ff'),
        limit(10)
    );
  }, [firestore, submittedSearch, searchBy]);


  const { data: items, isLoading: itemsLoading } = useCollection<Item>(itemsQuery);
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (term.startsWith('@')) {
        setSearchBy('username');
        setSubmittedSearch(term.substring(1));
    } else {
        setSearchBy('name');
        setSubmittedSearch(term);
    }
  };
  
  const isLoading = itemsLoading || usersLoading;

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <Input 
            placeholder="Search for items, or use '@' for usernames..." 
            className="h-12 text-base" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button type="submit" size="lg">
          <SearchIcon className="mr-2" /> Search
        </Button>
      </form>

      <div>
        {isLoading ? (
            <SearchSkeleton />
        ) : submittedSearch ? (
            <>
                <h2 className="font-headline text-2xl font-bold mb-4">
                    {`Results for "${submittedSearch}"`}
                </h2>
                <div>
                    <h3 className="font-headline text-xl font-semibold mb-3">Users</h3>
                     {users && users.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                           {users.map(user => (
                                <UserCard key={user.id} user={user} />
                           ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No users found.</p>
                    )}
                </div>

                <div className="mt-8">
                     <h3 className="font-headline text-xl font-semibold mb-3">Items</h3>
                     {items && items.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                           {items.map(item => (
                                <ItemCard key={item.id} item={item} />
                           ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No items found.</p>
                    )}
                </div>
            </>
        ) : (
             <div>
                <h2 className="font-headline text-2xl font-bold mb-4">
                    Browse All Items
                </h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items && items.length > 0 ? (
                        items.map(item => (
                            <ItemCard key={item.id} item={item} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-muted-foreground">No items to display.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
