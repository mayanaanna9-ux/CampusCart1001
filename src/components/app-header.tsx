
'use client';

import { Bell, ShoppingCart, User, LogOut, UserPlus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { UserAvatar } from './user-avatar';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

export function AppHeader() {
  const auth = useAuth();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userDocRef);

  const handleSignOut = async () => {
    if (auth) {
      try {
        await signOut(auth);
        toast({
          title: 'Signed out successfully',
        });
        router.push('/');
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Uh oh!',
          description: 'Failed to sign out.',
        });
      }
    }
  };

  const isLoading = userLoading || profileLoading;
  const isAnonymous = user?.isAnonymous;
  const displayName = isAnonymous ? 'Guest' : (userProfile?.displayName || user?.displayName || user?.email || 'User');
  const avatarUrl = userProfile?.profilePictureUrl || user?.photoURL || '';

  const hasNotifications = true; // Mock data for notification dot

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl font-bold">Campus Cart</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href="/search">
              <Search className="h-5 w-5" />
              <span className="sr-only">Browse</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/notifications">
                {hasNotifications && (
                    <span className="absolute bottom-2 left-2 block h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background"></span>
                )}
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Link>
          </Button>
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted" />
          ) : user && auth ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <UserAvatar
                    name={displayName}
                    avatarUrl={avatarUrl}
                    className="h-8 w-8"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {displayName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || (isAnonymous && 'Guest Account')}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {isAnonymous && (
                  <DropdownMenuItem asChild>
                    <Link href="/signup">
                      <UserPlus className="mr-2" />
                      Create Account
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
