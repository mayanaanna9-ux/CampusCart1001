import { items, users, userHistory } from '@/lib/data';
import { ItemCard } from '@/components/item-card';
import { Recommendations } from '@/components/recommendations';

export default function HomePage() {
  const latestItems = items
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
    .slice(0, 6);

  return (
    <div className="container mx-auto max-w-5xl p-4 md:p-6">
      <section className="space-y-4">
        <h2 className="font-headline text-2xl font-bold">Recommended For You</h2>
        <Recommendations allItems={items} allUsers={users} userHistoryData={userHistory} />
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-headline text-2xl font-bold">Latest Items</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {latestItems.map((item) => {
            const seller = users.find((user) => user.id === item.sellerId);
            if (!seller) return null;
            return <ItemCard key={item.id} item={item} seller={seller} />;
          })}
        </div>
      </section>
    </div>
  );
}
