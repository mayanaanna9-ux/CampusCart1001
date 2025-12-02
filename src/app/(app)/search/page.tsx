
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';
import { items, users } from '@/lib/data';
import { ItemCard } from '@/components/item-card';

export default function SearchPage() {
  const allItems = items;

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      <div className="flex gap-2 mb-6">
        <Input placeholder="Search for items..." className="h-12 text-base" />
        <Button size="lg">
          <SearchIcon className="mr-2" /> Search
        </Button>
      </div>

      <div>
        <h2 className="font-headline text-2xl font-bold mb-4">Browse All Items</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allItems.map(item => {
                 const seller = users.find(u => u.id === item.sellerId);
                 if (!seller) return null;
                 return <ItemCard key={item.id} item={item} seller={seller} />
            })}
        </div>
      </div>
    </div>
  );
}
