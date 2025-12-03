import { items, users, userHistory } from '@/lib/data';
import { Recommendations } from '@/components/recommendations';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { FeaturedItemCard } from '@/components/featured-item-card';

export default function HomePage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysItems = items
    .filter(item => new Date(item.postedAt) >= today)
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

  return (
    <div className="container mx-auto max-w-5xl p-4 md:p-6">
      <section className="mt-8 space-y-4">
        <h2 className="font-headline text-2xl font-bold">New Today</h2>
        {todaysItems.length > 0 ? (
            <Carousel
                opts={{
                    align: 'start',
                    loop: todaysItems.length > 1,
                }}
                className="w-full"
                >
                <CarouselContent>
                    {todaysItems.map((item) => {
                    const seller = users.find((user) => user.id === item.sellerId);
                    if (!seller) return null;
                    return (
                        <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
                            <FeaturedItemCard item={item} seller={seller} />
                        </CarouselItem>
                    );
                    })}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
            </Carousel>
        ) : (
            <div className="flex items-center justify-center rounded-lg bg-muted/50 p-12">
                <p className="text-muted-foreground">No new items posted today. Check back later!</p>
            </div>
        )}
      </section>
      
      <section className="space-y-4 mt-8">
        <h2 className="font-headline text-2xl font-bold">Recommended For You</h2>
        <Recommendations allItems={items} allUsers={users} userHistoryData={userHistory} />
      </section>

    </div>
  );
}
