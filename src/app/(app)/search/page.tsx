
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Item } from '@/lib/types';
import { ItemCard } from '@/components/item-card';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function SearchSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
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
    )
}

export default function SearchPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const itemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (submittedSearch) {
        // This is a simple text search, for more complex scenarios, a dedicated search service like Algolia is recommended.
        // This query will not find substrings, only exact matches on keywords.
        // A more robust solution would involve creating a 'keywords' array in your item documents.
        return query(collection(firestore, 'items'), where('name', '>=', submittedSearch), where('name', '<=', submittedSearch + '\uf8ff'));
    }
    return query(collection(firestore, 'items'), orderBy('postedAt', 'desc'));
  }, [firestore, submittedSearch]);

  const { data: items, isLoading: itemsLoading } = useCollection<Item>(itemsQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(searchTerm);
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <Input 
            placeholder="Search for items..." 
            className="h-12 text-base" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button type="submit" size="lg">
          <SearchIcon className="mr-2" /> Search
        </Button>
      </form>

      <div>
        <h2 className="font-headline text-2xl font-bold mb-4">
            {submittedSearch ? `Results for "${submittedSearch}"` : 'Browse All Items'}
        </h2>
        {itemsLoading ? (
            <SearchSkeleton />
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items && items.length > 0 ? (
                    items.map(item => (
                        <ItemCard key={item.id} item={item} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <p className="text-muted-foreground">No items found. Try a different search.</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
