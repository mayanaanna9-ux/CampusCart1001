
'use client';

import Link from 'next/link';
import { UserAvatar } from './user-avatar';
import { Card, CardContent } from './ui/card';
import type { UserProfile } from '@/lib/types';
import { ArrowRight } from 'lucide-react';

type UserCardProps = {
  user: UserProfile;
};

export function UserCard({ user }: UserCardProps) {
  return (
    <Link href={`/profile/${user.id}`}>
        <Card className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UserAvatar name={user.displayName} avatarUrl={user.profilePictureUrl || ''} className="h-10 w-10" />
                        <p className="font-semibold truncate">{user.displayName}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
            </CardContent>
        </Card>
    </Link>
  );
}
