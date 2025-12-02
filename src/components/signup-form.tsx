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
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useState } from 'react';

const formSchema = z.object({
    email: z.string().email('Invalid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
  });

export function SignUpForm() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'Firebase auth is not configured.',
        });
        return;
      }
      try {
        await createUserWithEmailAndPassword(auth, values.email, values.password);
        toast({
          title: "Account created!",
          description: "Welcome to Campus Cart.",
        });
        router.push('/setup-profile');
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

  async function onGoogleSignIn() {
    if (!auth) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: 'Firebase auth is not configured.',
        });
        return;
    }
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        toast({
            title: "Signed in with Google!",
        });
        router.push('/setup-profile');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: error.message || "Could not sign in with Google.",
        });
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
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
        </div>
        <Button variant="outline" className="w-full font-bold" size="lg" onClick={onGoogleSignIn}>
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 256S109.8 0 244 0c73 0 135.7 28.7 182.4 73.5l-65.5 63.5C334.4 111.9 292.1 94.5 244 94.5c-83.3 0-151.7 68.2-151.7 152.1s68.4 152.1 151.7 152.1c96.5 0 131.2-69.5 136-104.3H244v-73.6h236.1c2.4 12.7 3.9 26.5 3.9 41.6z"></path></svg>
            Google
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
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
