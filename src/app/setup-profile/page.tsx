import { AvatarGrid } from '@/components/avatar-grid';

export default function SetupProfilePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="space-y-4 text-center mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Welcome to Campus Cart!
        </h1>
        <p className="text-lg text-muted-foreground">
          Let's set up your profile. Pick an avatar to get started.
        </p>
      </div>
      <AvatarGrid />
    </div>
  );
}
