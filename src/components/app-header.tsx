import { Bell, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl font-bold">Campus Cart</span>
        </Link>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  );
}
