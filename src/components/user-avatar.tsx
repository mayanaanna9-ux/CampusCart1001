

'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfilePicture } from "@/context/profile-picture-context";

type UserAvatarProps = {
    name?: string;
    avatarUrl?: string;
    className?: string;
}

export function UserAvatar({ name, avatarUrl, className }: UserAvatarProps) {
    const { optimisticProfilePicture } = useProfilePicture();
    const fallback = name ? name.charAt(0).toUpperCase() : '';

    const displayUrl = optimisticProfilePicture || avatarUrl;

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
