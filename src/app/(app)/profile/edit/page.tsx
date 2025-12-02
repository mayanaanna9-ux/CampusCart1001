
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { UserProfile } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Upload, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { user: authUser, loading: userLoading } = useUser();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userDocRef);
  
  const avatars = PlaceHolderImages.filter(p => p.id.startsWith('avatar'));
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);

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
    setSelectedAvatarUrl(url);
    form.setValue('profilePictureUrl', url, { shouldValidate: true, shouldDirty: true });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !auth.currentUser || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication not ready.' });
      return;
    }

    try {
        const { displayName, bio, profilePictureUrl } = values;

        // Update Firebase Auth profile
        await updateProfile(auth.currentUser, {
            displayName,
            photoURL: profilePictureUrl,
        });

        // Update Firestore profile
        const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
        const updatedProfileData = {
            id: auth.currentUser.uid,
            displayName,
            bio,
            profilePictureUrl,
        };
        setDocumentNonBlocking(userDocRef, updatedProfileData, { merge: true });

        toast({
            title: 'Profile Updated',
            description: 'Your profile has been successfully updated.',
        });
        router.push('/profile');
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'An unexpected error occurred.',
        });
    }
  }

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
                <div className="flex items-center gap-6">
                    <Image src={currentPhotoURL || '/avatar_placeholder.png'} alt="Current avatar" width={96} height={96} className="h-24 w-24 rounded-full border-4 border-card object-cover" />
                    <div className="grid flex-1 grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
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
                </div>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                    </div>
                </div>
                 <Label htmlFor="picture-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG or JPG (MAX. 800x800px)</p>
                    </div>
                    <Input id="picture-upload" type="file" className="hidden" />
                </Label> 
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

              <Button type="submit" size="lg" className="w-full font-bold" disabled={!form.formState.isDirty}>Save Changes</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
