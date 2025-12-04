
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  // This is a placeholder. In a real app, you'd fetch cart items from state or a database.
  const cartItems: any[] = [];

  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="font-headline text-3xl font-bold mb-6">Shopping Cart</h1>
      {cartItems.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            {/* We will list cart items here in the future */}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-20 rounded-lg bg-card border">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <ShoppingCart className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <p className="text-muted-foreground mt-2">
            Looks like you haven't added any items yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/home">Start Shopping</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
