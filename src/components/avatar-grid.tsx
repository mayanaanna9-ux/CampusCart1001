'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload } from 'lucide-react';

export function AvatarGrid() {
  const router = useRouter();
  const avatars = PlaceHolderImages.filter(p => p.id.startsWith('avatar'));
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const handleContinue = () => {
    // In a real app, you would save the user's choice here.
    router.push('/home');
  };

  return (
    <div className="w-full max-w-2xl">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 font-headline text-xl font-semibold text-center">Choose an Avatar</h3>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                {avatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar.imageUrl)}
                    className={cn(
                      'relative aspect-square overflow-hidden rounded-full border-4 transition-all',
                      selectedAvatar === avatar.imageUrl ? 'border-primary scale-110' : 'border-transparent hover:border-primary/50'
                    )}
                  >
                    <Image
                      src={avatar.imageUrl}
                      alt={avatar.description}
                      fill
                      sizes="(max-width: 768px) 33vw, 16vw"
                      className="object-cover"
                      data-ai-hint={avatar.imageHint}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div>
              <Label htmlFor="picture" className="mb-2 block text-center font-headline text-xl font-semibold">Upload your own</Label>
               <div className="flex items-center justify-center w-full">
                    <Label htmlFor="picture-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 800x400px)</p>
                        </div>
                        <Input id="picture-upload" type="file" className="hidden" />
                    </Label>
                </div> 
            </div>

            <Button onClick={handleContinue} className="w-full font-bold" size="lg" disabled={!selectedAvatar}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
