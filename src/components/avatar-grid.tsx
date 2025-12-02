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
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);


  const handleAvatarSelect = (url: string) => {
    setSelectedAvatarUrl(url);
    setUploadPromise(null); // Clear any pending upload if an avatar is selected
    setUploadedImagePreview(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     if (!auth?.currentUser || !storage) return;
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setUploadedImagePreview(dataUrl); // Show preview in the upload box
        setSelectedAvatarUrl(dataUrl); // Select the uploaded image
        
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
    
    router.push('/home');

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

            <div className='flex flex-col items-center gap-4'>
                <Label htmlFor="picture-upload-btn" className="text-center font-headline text-xl font-semibold">Upload your own</Label>
                {uploadedImagePreview && (
                    <Image src={uploadedImagePreview} alt="Uploaded preview" width={96} height={96} className="h-24 w-24 rounded-full object-cover border-4 border-primary" />
                )}
                <div className="flex justify-center">
                    <Label htmlFor="picture-upload-btn" className="w-full max-w-xs">
                        <Button asChild variant="destructive" className="w-full" disabled={isUploading}>
                            <div className='w-full'>
                                {isUploading ? 'Uploading...' : 'Upload Image'}
                                <Input id="picture-upload-btn" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} disabled={isUploading} />
                            </div>
                        </Button>
                    </Label>
                </div>
            </div>

            <Button onClick={handleContinue} className="w-full font-bold" size="lg" disabled={!selectedAvatarUrl || isUploading}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
