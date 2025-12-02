'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, PlusSquare, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/sell', icon: PlusSquare, label: 'Sell' },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const hasNotifications = true; // mock

  return (
    <nav className="fixed bottom-0 z-10 w-full border-t bg-background/80 backdrop-blur-md md:hidden">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 text-muted-foreground relative"
            >
              <item.icon
                className={cn(
                  'h-6 w-6',
                  isActive && 'text-primary'
                )}
              />
              {item.href === '/notifications' && hasNotifications && (
                 <div className="absolute top-1 right-3 h-2 w-2 rounded-full bg-red-500"></div>
              )}
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
