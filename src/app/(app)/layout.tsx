
'use client';

import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { Suspense } from 'react';
import Loading from '../loading';
import { CartProvider } from '@/context/cart-context';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex-1 bg-muted/20 pb-16 md:pb-0">
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </main>
          <BottomNav />
        </div>
    </CartProvider>
  );
}
