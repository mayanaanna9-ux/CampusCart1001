
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, Plus, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/cart-context';
import { useEffect } from 'react';

const navItems = [
  { href: '/cart', icon: ShoppingCart, label: 'Cart' },
  { href: '/sell', icon: Plus, label: 'Sell' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { cartItems, hasNewItems, clearCartNotification } = useCart();

  useEffect(() => {
    if (pathname === '/cart') {
      clearCartNotification();
    }
  }, [pathname, clearCartNotification]);


  return (
    <nav className="fixed bottom-0 z-10 w-full border-t bg-background/80 backdrop-blur-md md:hidden">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-3 items-center px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.href === '/sell') {
            return (
              <Link key={item.href} href={item.href} className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg">
                  <item.icon className="h-6 w-6" />
                  <span className="sr-only">{item.label}</span>
                </div>
              </Link>
            )
          }

          const isCart = item.href === '/cart';
          const showNotification = isCart && cartItems.length > 0 && hasNewItems;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 text-muted-foreground relative"
            >
              <div className="relative">
                <item.icon
                  className={cn(
                    'h-6 w-6',
                    isActive && 'text-primary'
                  )}
                />
                 {showNotification && (
                  <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background"></span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  isActive && 'text-primary'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
