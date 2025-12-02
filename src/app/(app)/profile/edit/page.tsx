

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase, useStorage } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { updateProfile, deleteUser } from 'firebase/auth';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { UserProfile } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Upload, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const formSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
  bio: z.string().max(160, 'Bio cannot exceed 160 characters.').optional(),
  profilePictureUrl: z.string().url('Invalid URL').optional(),
});

function EditProfileSkeleton() {
    return (
        <div className="container mx-auto max-w-2xl p-4 md:p-6">
            <div className="mb-6">
                <Skeleton className="h-8 w-24" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="space-y-4">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { user: authUser, loading: userLoading } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPromise, setUploadPromise] = useState<Promise<string> | null>(null);


  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userDocRef);
  
  const avatars = PlaceHolderImages.filter(p => p.id.startsWith('avatar'));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
        displayName: userProfile?.displayName || authUser?.displayName || '',
        bio: userProfile?.bio || '',
        profilePictureUrl: userProfile?.profilePictureUrl || authUser?.photoURL || ''
    },
    mode: 'onChange'
  });
  
  const isLoading = userLoading || profileLoading;

  if (isLoading || !authUser) {
    return <EditProfileSkeleton />;
  }

  const currentPhotoURL = form.watch('profilePictureUrl');

  const handleAvatarSelect = (url: string) => {
    form.setValue('profilePictureUrl', url, { shouldValidate: true, shouldDirty: true });
    setUploadPromise(null);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!authUser || !storage) return;

    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        form.setValue('profilePictureUrl', dataUrl, { shouldValidate: true, shouldDirty: true });
        
        setIsUploading(true);
        const storageRef = ref(storage, `profile-pictures/${authUser.uid}/${Date.now()}`);
        
        const promise = uploadString(storageRef, dataUrl, 'data_url')
          .then(uploadTask => getDownloadURL(uploadTask.ref))
          .then(downloadURL => {
              // This promise resolves with the final URL
              return downloadURL;
          })
          .catch(error => {
              toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload image.' });
              // Revert preview if needed, or just notify
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !auth.currentUser || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication not ready.' });
      return;
    }
    
    router.push('/profile');

    try {
        let finalProfilePictureUrl = values.profilePictureUrl;

        // If an upload is in progress or has finished, wait for its URL
        if (uploadPromise) {
            finalProfilePictureUrl = await uploadPromise;
        }

        const { displayName, bio } = values;

        // Update Firebase Auth profile
        await updateProfile(auth.currentUser, {
            displayName,
            photoURL: finalProfilePictureUrl,
        });

        // Update Firestore profile
        const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
        const updatedProfileData: Partial<UserProfile> = {
            id: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName,
            bio,
            profilePictureUrl: finalProfilePictureUrl,
        };
        setDocumentNonBlocking(userDocRef, updatedProfileData, { merge: true });

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'An unexpected error occurred.',
        });
    }
  }

  async function handleDeleteAccount() {
    if (!auth || !auth.currentUser || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication not ready.' });
      return;
    }

    try {
        const user = auth.currentUser;
        // First, delete the user's document from Firestore.
        const userDocRef = doc(firestore, 'users', user.uid);
        await deleteDoc(userDocRef);
        
        // Then, delete the user from Firebase Authentication.
        await deleteUser(user);

        toast({
            title: 'Account Deleted',
            description: 'Your account has been permanently deleted.',
        });
        router.push('/');
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: error.message || 'An unexpected error occurred while deleting your account.',
        });
    }
  }

  const isSaveDisabled = !form.formState.isDirty && !isUploading;

  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Edit Profile</CardTitle>
          <CardDescription>Make changes to your public profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
               <div className="space-y-4">
                <Label>Profile Picture</Label>
                <div className="flex items-start gap-4">
                    <div className="relative">
                        <Image src={currentPhotoURL || '/avatar_placeholder.png'} alt="Current avatar" width={96} height={96} className="h-24 w-24 rounded-full border-4 border-card object-cover" />
                        <Label htmlFor="picture-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                            <Upload className="h-6 w-6 text-white" />
                        </Label>
                        <Input id="picture-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} disabled={isUploading} />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                            {avatars.map((avatar) => (
                            <button
                                type="button"
                                key={avatar.id}
                                onClick={() => handleAvatarSelect(avatar.imageUrl)}
                                className={cn(
                                'relative aspect-square overflow-hidden rounded-full border-4 transition-all',
                                currentPhotoURL === avatar.imageUrl ? 'border-primary scale-110' : 'border-transparent hover:border-primary/50'
                                )}
                            >
                                <Image
                                src={avatar.imageUrl}
                                alt={avatar.description}
                                fill
                                sizes="10vw"
                                className="object-cover"
                                data-ai-hint={avatar.imageHint}
                                />
                            </button>
                            ))}
                        </div>

                         <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Or</span>
                            </div>
                        </div>

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
                </div>
              </div>

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us a little about yourself" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" className="w-full font-bold" disabled={isSaveDisabled}>
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 border-t px-6 py-4">
             <div className="space-y-2">
                 <h3 className="font-headline font-semibold">Danger Zone</h3>
                 <p className="text-sm text-muted-foreground">
                    Deleting your account is permanent and cannot be undone.
                 </p>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            account and remove your data from our servers.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Back</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount}>Yes, delete my account</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
             </div>
        </CardFooter>
      </Card>
    </div>
  );
}
