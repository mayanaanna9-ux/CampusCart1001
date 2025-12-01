import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";

type UserAvatarProps = {
    name: string;
    avatarUrl: string;
    className?: string;
}

export function UserAvatar({ name, avatarUrl, className }: UserAvatarProps) {
    const fallback = name.charAt(0).toUpperCase();

    return (
        <Avatar className={className}>
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>
                <span className="sr-only">{name}</span>
                {fallback || <UserIcon className="h-4 w-4" />}
            </AvatarFallback>
        </Avatar>
    );
}
