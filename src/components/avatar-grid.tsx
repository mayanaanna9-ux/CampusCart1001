

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
import { Upload, Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth, useStorage } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { setDoc, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import Link from 'next/link';

export function AvatarGrid() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const avatars = PlaceHolderImages.filter(p => p.id.startsWith('avatar'));
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  const isGuest = auth?.currentUser?.isAnonymous;

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
    
    setIsSubmitting(true);
    toast({ title: "Setting up your profile..."});
    
    const user = auth.currentUser;
    const isNewImageUpload = selectedAvatarUrl.startsWith('data:');
    let finalProfilePictureUrl = selectedAvatarUrl;

    if (isGuest && isNewImageUpload) {
        toast({
            variant: 'destructive',
            title: 'Action Not Allowed',
            description: 'Guest users cannot upload custom profile pictures. Please select an avatar or create an account.',
        });
        setIsSubmitting(false);
        return;
    }

    try {
        if (isNewImageUpload && storage) {
            const storageRef = ref(storage, `profile-pictures/${user.uid}/${Date.now()}`);
            const uploadTask = await uploadString(storageRef, selectedAvatarUrl, 'data_url');
            finalProfilePictureUrl = await getDownloadURL(uploadTask.ref);
        }

        await updateProfile(user, { photoURL: finalProfilePictureUrl });

        const userProfileData = {
            id: user.uid,
            email: user.email,
            displayName: user.displayName || user.email,
            profilePictureUrl: finalProfilePictureUrl,
        };
        const userDocRef = doc(firestore, 'users', user.uid);
        
        await setDoc(userDocRef, userProfileData, { merge: true });

        toast({ title: "Profile setup complete!"});
        router.push('/home');

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: error.message || 'Could not update profile picture.',
        });
    } finally {
        setIsSubmitting(false);
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
                    disabled={isSubmitting}
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
            
            {isGuest ? (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/50 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Account Required</AlertTitle>
                    <AlertDescription>
                        Want to upload your own picture?
                        <Button variant="link" asChild className="p-1 h-auto text-destructive">
                            <Link href="/signup">
                                Create a full account.
                            </Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : (
                <div className='flex flex-col items-center gap-4'>
                    <Label htmlFor="picture-upload-btn" className="text-center font-headline text-xl font-semibold">Upload your own</Label>
                    {uploadedImagePreview && (
                        <Image src={uploadedImagePreview} alt="Uploaded preview" width={96} height={96} className="h-24 w-24 rounded-full object-cover border-4 border-primary" />
                    )}
                    <div className="flex justify-center">
                        <Label htmlFor="picture-upload-btn" className="w-full max-w-xs">
                            <Button asChild variant="destructive" className="w-full" disabled={isSubmitting}>
                                <div className='w-full text-center'>
                                    {'Upload Image'}
                                    <Input id="picture-upload-btn" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} disabled={isSubmitting} />
                                </div>
                            </Button>
                        </Label>
                    </div>
                </div>
            )}


            <Button onClick={handleContinue} className="w-full font-bold" size="lg" disabled={!selectedAvatarUrl || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
