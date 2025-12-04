
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile, UserCredential } from 'firebase/auth';
import { useState } from 'react';
import { doc, serverTimestamp, getDoc, Firestore } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { UserProfile } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  username: z.string().min(3, 'Username must be at least 3 characters.').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

/**
 * Handles creating or merging a user profile in Firestore after authentication.
 */
export const handleUserCreation = async (
  userCredential: UserCredential, 
  firestore: Firestore,
  name?: string | null, 
  username?: string | null
) => {
  const user = userCredential.user;
  const userDocRef = doc(firestore, 'users', user.uid);

  // For new users, their display name in Auth might be null initially.
  const displayName = name || user.displayName || (user.isAnonymous ? 'Guest' : user.email);

  // Update the Auth user profile if a new name is provided.
  if (displayName && user.displayName !== displayName) {
    await updateProfile(user, { displayName });
  }

  // Check if the document already exists to avoid overwriting username on login.
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    // On login, just ensure the basic info is there but don't overwrite existing fields.
    const existingData = docSnap.data();
    const profileData: Partial<UserProfile> = {
      id: user.uid,
      email: user.email,
      displayName: displayName || existingData.displayName,
      profilePictureUrl: user.photoURL || existingData.profilePictureUrl || '',
    };
    setDocumentNonBlocking(userDocRef, profileData, { merge: true });
  } else {
    // On sign-up, create the full document.
    const userProfile: UserProfile = {
      id: user.uid,
      email: user.email,
      displayName: displayName || '',
      username: username || '',
      profilePictureUrl: user.photoURL || '',
      createdAt: serverTimestamp() as any,
    };
    setDocumentNonBlocking(userDocRef, userProfile, { merge: true });
  }
};


export function SignUpForm() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
    },
  });
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Firebase auth is not configured.',
      });
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await handleUserCreation(userCredential, firestore, values.name, values.username);
      toast({
        title: "Account created!",
        description: "Welcome to Campus Cart.",
      });

      // Navigate based on whether a profile picture exists.
      if (!userCredential.user.photoURL) {
        router.push('/setup-profile');
      } else {
        router.push('/home');
      }

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: "destructive",
          title: "Email already exists",
          description: "Please use a different email or sign in.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error.message || "Could not create account.",
        });
      }
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/20 p-6">
            <div className="rounded-full bg-primary/30 p-4">
              <ShoppingCart className="h-16 w-16 text-primary" />
            </div>
          </div>
        </div>
        <CardTitle className="font-headline text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Campus Cart
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground pt-4">
          Create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? 'Hide password' : 'Show password'}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-bold" size="lg">Sign Up</Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 pt-6">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
