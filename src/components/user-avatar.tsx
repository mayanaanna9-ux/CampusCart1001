

'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfilePicture } from "@/context/profile-picture-context";
import { useUser } from "@/firebase";

type UserAvatarProps = {
    userId?: string;
    name?: string;
    avatarUrl?: string;
    className?: string;
}

export function UserAvatar({ userId, name, avatarUrl, className }: UserAvatarProps) {
    const { user: currentUser } = useUser();
    const { optimisticProfilePicture } = useProfilePicture();
    const fallback = name ? name.charAt(0).toUpperCase() : '';

    // Only show the optimistic image if the avatar is for the current user.
    const isCurrentUser = currentUser && userId === currentUser.uid;
    const displayUrl = isCurrentUser ? optimisticProfilePicture || avatarUrl : avatarUrl;

    return (
        <Avatar className={cn("bg-muted", className)}>
            {displayUrl && <AvatarImage src={displayUrl} alt={name || 'User avatar'} />}
            <AvatarFallback>
                <span className="sr-only">{name}</span>
                {fallback || <UserIcon className="h-4 w-4" />}
            </AvatarFallback>
        </Avatar>
    );
}
