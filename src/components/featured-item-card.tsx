
import Link from 'next/link';
import Image from 'next/image';
import type { Item, User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { UserAvatar } from './user-avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from './ui/badge';

type FeaturedItemCardProps = {
  item: Item;
  seller: User;
};

export function FeaturedItemCard({ item, seller }: FeaturedItemCardProps) {
  const imageUrl = item.imageUrls?.[0];
  const placeholder = PlaceHolderImages.find(p => p.imageUrl === imageUrl || p.id === imageUrl);
  const timeAgo = new Intl.RelativeTimeFormat('en', { style: 'short' }).format(
      Math.round((new Date(item.postedAt).getTime() - Date.now()) / (1000 * 60 * 60)), // in hours
      'hour'
  );


  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg bg-muted border-none">
       <Link href={`/items/${item.id}`} className="block">
        <CardContent className="p-0">
          {placeholder && (
            <div className="aspect-video w-full overflow-hidden relative">
              <Image
                src={placeholder.imageUrl}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
                data-ai-hint={placeholder.imageHint}
              />
               <Badge variant="secondary" className="absolute top-2 left-2">{timeAgo}</Badge>
            </div>
          )}
           <div className="p-4 space-y-2">
                <h3 className="font-headline text-lg font-semibold truncate">{item.name}</h3>
                <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-primary">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                        <UserAvatar name={seller.name} avatarUrl={seller.avatarUrl} className="h-6 w-6" />
                        <span className="text-sm font-medium text-muted-foreground">{seller.name}</span>
                    </div>
                </div>
            </div>
        </CardContent>
      </Link>
    </Card>
  );
}
