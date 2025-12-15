
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import Image from 'next/image';

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();

  const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="font-headline text-3xl font-bold mb-6">Shopping Cart</h1>
      {cartItems.length > 0 ? (
        <div className="space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                    {cartItems.map(item => (
                        <div key={item.id} className="flex items-center p-4 gap-4">
                            <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                                <Image 
                                    src={item.imageUrls[0] || '/placeholder.svg'} 
                                    alt={item.name} 
                                    fill
                                    sizes="64px"
                                    className="object-cover" 
                                />
                            </div>
                            <div className="flex-1">
                                <Link href={`/items/${item.id}`} className="font-semibold hover:underline">{item.name}</Link>
                                <p className="text-sm text-muted-foreground">{item.condition}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-primary">₱{item.price.toFixed(2)}</p>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeFromCart(item.id!)}>
                                    <Trash2 className="h-4 w-4"/>
                                    <span className="sr-only">Remove item</span>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
                 <Card>
                    <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₱{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground text-sm">
                            <span>Taxes & Fees</span>
                            <span>Calculated at checkout</span>
                        </div>
                         <div className="flex justify-between font-bold text-lg pt-2">
                            <span>Total</span>
                            <span>₱{subtotal.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={clearCart} className="w-full">Clear Cart</Button>
                </div>
            </div>
        </div>
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
