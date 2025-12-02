import { LoadingSpinner } from '@/components/loading-spinner';

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner className="h-16 w-16 text-primary" />
    </div>
  );
}
