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
import { useAuth, useStorage } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export function AvatarGrid() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const avatars = PlaceHolderImages.filter(p => p.id.startsWith('avatar'));
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPromise, setUploadPromise] = useState<Promise<string> | null>(null);

  const handleAvatarSelect = (url: string) => {
    setSelectedAvatarUrl(url);
    setUploadPromise(null); // Clear any pending upload if an avatar is selected
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     if (!auth?.currentUser || !storage) return;
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setSelectedAvatarUrl(dataUrl); // Show preview
        
        setIsUploading(true);
        const storageRef = ref(storage, `profile-pictures/${auth.currentUser!.uid}/${Date.now()}`);
        
        const promise = uploadString(storageRef, dataUrl, 'data_url')
          .then(uploadTask => getDownloadURL(uploadTask.ref))
          .catch(error => {
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload image.' });
            return Promise.reject(error);
          })
          .finally(() => {
            setIsUploading(false);
          });

        setUploadPromise(promise);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = async () => {
    if (!auth || !auth.currentUser || !selectedAvatarUrl || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be signed in and select an avatar or upload an image.',
      });
      return;
    }
    
    toast({
      title: 'Setting up your profile...',
      description: 'Please wait a moment.',
    });

    try {
      let finalAvatarUrl = selectedAvatarUrl;

      // If an upload was initiated, wait for it to complete to get the final URL
      if (uploadPromise) {
        finalAvatarUrl = await uploadPromise;
      }

      await updateProfile(auth.currentUser, {
        photoURL: finalAvatarUrl,
      });

      const userProfile = {
        id: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName || auth.currentUser.email,
        profilePictureUrl: finalAvatarUrl,
      };

      const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
      setDocumentNonBlocking(userDocRef, userProfile, { merge: true });

      toast({
        title: 'Profile updated!',
        description: 'Your avatar has been set.',
      });

      router.push('/home');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'Could not update profile.',
      });
    }
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
                    onClick={() => handleAvatarSelect(avatar.imageUrl)}
                    className={cn(
                      'relative aspect-square overflow-hidden rounded-full border-4 transition-all',
                      selectedAvatarUrl === avatar.imageUrl ? 'border-primary scale-110' : 'border-transparent hover:border-primary/50'
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
                            {selectedAvatarUrl && !avatars.find(a => a.imageUrl === selectedAvatarUrl) ? (
                                <Image src={selectedAvatarUrl} alt="Uploaded preview" width={80} height={80} className="h-20 w-20 rounded-full object-cover" />
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG</p>
                                </>
                            )}
                        </div>
                        <Input id="picture-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} disabled={isUploading} />
                    </Label>
                </div> 
            </div>

            <Button onClick={handleContinue} className="w-full font-bold" size="lg" disabled={!selectedAvatarUrl}>
              {isUploading ? 'Uploading...' : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
