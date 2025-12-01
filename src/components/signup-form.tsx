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
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const formSchema = z.object({
    email: z.string().email('Invalid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
  });

export function SignUpForm() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();

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
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error.message || "Could not create account.",
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
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-bold" size="lg">Sign Up</Button>
          </form>
        </Form>
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
