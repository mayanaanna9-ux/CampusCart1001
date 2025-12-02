

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
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);


  const handleAvatarSelect = (url: string) => {
    setSelectedAvatarUrl(url);
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
    
    const user = auth.currentUser;
    const isNewImageUpload = selectedAvatarUrl.startsWith('data:');

    // 1. Always include the ID when creating the profile document in Firestore
    const userProfileData = {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || user.email,
        profilePictureUrl: selectedAvatarUrl,
    };
    const userDocRef = doc(firestore, 'users', user.uid);
    
    // 2. Optimistically set the document in Firestore with the temporary (or static) URL.
    // This will create the document if it doesn't exist.
    setDocumentNonBlocking(userDocRef, userProfileData, { merge: true });

    // 3. If it's a static avatar URL, just update the Auth profile and we are done.
    if (!isNewImageUpload) {
        updateProfile(user, { photoURL: selectedAvatarUrl }).catch(error => {
             toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error.message || 'Could not update profile picture.',
            });
        });
        return; // Exit
    }

    // 4. If it's a new image upload, handle the upload in the background.
    if (isNewImageUpload && storage) {
        setIsUploading(true);
        const storageRef = ref(storage, `profile-pictures/${user.uid}/${Date.now()}`);
        
        uploadString(storageRef, selectedAvatarUrl, 'data_url')
          .then(uploadTask => getDownloadURL(uploadTask.ref))
          .then(downloadURL => {
              // Once uploaded, update both Auth and Firestore with the permanent URL
              if (auth.currentUser) {
                  updateProfile(auth.currentUser, { photoURL: downloadURL });
                  // We only need to update the picture URL field now.
                  setDocumentNonBlocking(userDocRef, { profilePictureUrl: downloadURL }, { merge: true });
              }
          })
          .catch(error => {
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload image.' });
          })
          .finally(() => {
            setIsUploading(false);
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
                            <div className='w-full text-center'>
                                {'Upload Image'}
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

    