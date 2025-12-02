import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <ShoppingCart className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
