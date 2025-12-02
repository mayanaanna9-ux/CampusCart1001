
'use client';

import { useState, useEffect } from 'react';
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
import { updateProfile, deleteUser, EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from 'firebase/auth';
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
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const formSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
  bio: z.string().max(160, 'Bio cannot exceed 160 characters.').optional(),
  profilePictureUrl: z.string().url('Invalid URL').optional(),
});

const reauthSchema = z.object({
  password: z.string().min(1, 'Password is required.'),
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
  const [newlyUploadedUrl, setNewlyUploadedUrl] = useState<string | null>(null);
  const [showReauthDialog, setShowReauthDialog] = useState(false);


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

  const reauthForm = useForm<z.infer<typeof reauthSchema>>({
    resolver: zodResolver(reauthSchema),
    defaultValues: { password: '' },
  });
  
  const isLoading = userLoading || profileLoading;

  useEffect(() => {
    // Check if form is dirty or there's a new upload to avoid resetting on other changes
    if (!form.formState.isDirty && !newlyUploadedUrl) {
      if (userProfile || authUser) {
        form.reset({
          displayName: userProfile?.displayName || authUser?.displayName || '',
          bio: userProfile?.bio || '',
          profilePictureUrl: userProfile?.profilePictureUrl || authUser?.photoURL || '',
        });
      }
    }
  }, [userProfile, authUser, form, form.formState.isDirty, newlyUploadedUrl]);


  if (isLoading || !authUser) {
    return <EditProfileSkeleton />;
  }

  const currentPhotoURL = form.watch('profilePictureUrl');

  const handleAvatarSelect = (url: string) => {
    form.setValue('profilePictureUrl', url, { shouldValidate: true, shouldDirty: true });
    setNewlyUploadedUrl(null);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!authUser || !storage) return;

    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Set preview immediately
        form.setValue('profilePictureUrl', dataUrl, { shouldValidate: true, shouldDirty: true });
        setNewlyUploadedUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !auth.currentUser || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication not ready.' });
      return;
    }
    
    // Navigate immediately for an optimistic UI
    router.push('/profile');

    const { displayName, bio } = values;
    const isNewImageUpload = newlyUploadedUrl && newlyUploadedUrl.startsWith('data:');
    const isStaticAvatarSelection = !isNewImageUpload && values.profilePictureUrl !== userProfile?.profilePictureUrl;


    try {
      const user = auth.currentUser;
      const userDocRef = doc(firestore, 'users', user.uid);
      const textProfileData: Partial<UserProfile> = { displayName, bio };
      
      // 1. Always update Auth display name and text fields in Firestore non-blockingly
      updateProfile(user, { displayName });
      setDocumentNonBlocking(userDocRef, textProfileData, { merge: true });

      // 2. If it's a static avatar from placeholder-images.json, update both Auth and Firestore non-blockingly
      if(isStaticAvatarSelection && values.profilePictureUrl) {
        updateProfile(user, { photoURL: values.profilePictureUrl });
        setDocumentNonBlocking(userDocRef, { profilePictureUrl: values.profilePictureUrl }, { merge: true });
      }

      // 3. If a new image was uploaded, handle the upload and final URL update in the background
      if (isNewImageUpload && storage) {
          setIsUploading(true); // Visually disable upload button
          const storageRef = ref(storage, `profile-pictures/${user.uid}/${Date.now()}`);
          
          // The upload now happens completely in the background. No `await` here.
          uploadString(storageRef, newlyUploadedUrl, 'data_url')
              .then(snapshot => getDownloadURL(snapshot.ref))
              .then(downloadURL => {
                  // 4. Once upload is complete, update both Auth and Firestore with the permanent URL
                  if (auth.currentUser) { // Check again in case user logged out
                      updateProfile(auth.currentUser, { photoURL: downloadURL });
                      const finalUserDocRef = doc(firestore, 'users', auth.currentUser.uid);
                      setDocumentNonBlocking(finalUserDocRef, { profilePictureUrl: downloadURL }, { merge: true });
                  }
                  setNewlyUploadedUrl(null);
              })
              .catch(error => {
                  toast({ variant: 'destructive', title: 'Image upload failed', description: 'Your profile changes were saved, but the new image failed to upload.' });
              })
              .finally(() => {
                  setIsUploading(false); // Re-enable upload button
              });
      }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'An unexpected error occurred while saving your profile.',
        });
    }
  }

  const performDeletion = async () => {
    if (!auth || !auth.currentUser || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication not ready.' });
      return;
    }
    const user = auth.currentUser;
    
    try {
        await deleteUser(user);
        toast({
          title: 'Account Deleted',
          description: 'Your Campus Cart account has been permanently deleted.',
        });
        const userDocRef = doc(firestore, 'users', user.uid);
        deleteDoc(userDocRef); // Delete firestore doc after auth deletion
        router.push('/');
    } catch (error: any) {
       if (error.code === 'auth/requires-recent-login') {
        toast({
          variant: 'destructive',
          title: 'Action Required',
          description: 'Please re-authenticate to delete your account.',
        });
        setShowReauthDialog(true);
      } else {
        console.error("Deletion failed:", error);
        toast({
          variant: 'destructive',
          title: 'Deletion Failed',
          description: error.message || 'An unexpected error occurred while deleting your account.',
        });
      }
    }
  }

  async function handleDeleteAccount() {
    await performDeletion();
  }
  
  async function handleReauthenticate(values: z.infer<typeof reauthSchema>) {
    if (!auth || !auth.currentUser || !auth.currentUser.email) return;

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, values.password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      setShowReauthDialog(false);
      await performDeletion();
    } catch (error) {
      reauthForm.setError('password', { type: 'manual', message: 'Incorrect password. Please try again.'});
    }
  }

  async function handleGoogleReauth() {
    if (!auth || !auth.currentUser) return;
    try {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(auth.currentUser, provider);
        setShowReauthDialog(false);
        await performDeletion();
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Re-authentication Failed',
            description: 'Could not re-authenticate with Google. Please try again.',
        });
    }
  }

  const isSaveDisabled = !form.formState.isDirty && !newlyUploadedUrl;
  const isEmailProvider = authUser?.providerData.some(p => p.providerId === 'password');

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
                        <Label htmlFor="picture-upload" className="cursor-pointer">
                            <Image src={currentPhotoURL || '/avatar_placeholder.png'} alt="Current avatar" width={96} height={96} className="h-24 w-24 rounded-full border-4 border-card object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                                <Upload className="h-6 w-6 text-white" />
                            </div>
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
                                    <div className='w-full text-center'>
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
                    Deleting your account is permanent and cannot be undone. This will only delete your Campus Cart data.
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
                            Campus Cart account and remove your data from our servers.
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

      <Dialog open={showReauthDialog} onOpenChange={setShowReauthDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirm Your Identity</DialogTitle>
                <DialogDescription>
                    For your security, please confirm your identity before deleting your account.
                </DialogDescription>
            </DialogHeader>
            {isEmailProvider ? (
                <Form {...reauthForm}>
                    <form onSubmit={reauthForm.handleSubmit(handleReauthenticate)} className="space-y-4">
                        <FormField
                            control={reauthForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" variant="destructive" disabled={reauthForm.formState.isSubmitting}>
                                {reauthForm.formState.isSubmitting ? 'Verifying...' : 'Confirm Deletion'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            ) : (
                <DialogFooter>
                    <Button onClick={handleGoogleReauth} variant="destructive">
                        Re-authenticate with Google
                    </Button>
                </DialogFooter>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

    