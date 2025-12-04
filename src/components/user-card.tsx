
'use client';

import Link from 'next/link';
import { UserAvatar } from './user-avatar';
import type { UserProfile } from '@/lib/types';

type UserCardProps = {
  user: UserProfile;
};

export function UserCard({ user }: UserCardProps) {
  return (
    <Link href={`/profile/${user.id}`} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
        <UserAvatar name={user.displayName} avatarUrl={user.profilePictureUrl || ''} className="h-12 w-12" />
        <div>
          <p className="font-semibold truncate">{user.displayName}</p>
          {user.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
        </div>
    </Link>
  );
}
