
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Loader2, X, UserPlus, AlertCircle } from 'lucide-react';
import { Label } from './ui/label';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useStorage, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const formSchema = z.object({
  name: z.string().min(3, 'Item name must be at least 3 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  imageUrls: z.array(z.string()).min(1, 'Please upload at least one image.'),
});

function SellFormSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Post a New Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="aspect-square w-full" />
                        <Skeleton className="aspect-square w-full" />
                        <Skeleton className="aspect-square w-full" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-20 w-full" />
                </div>
                 <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    )
}

export function SellForm() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const storage = useStorage();
  const { user, loading: userLoading } = useUser();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      imageUrls: [],
    },
    mode: 'onChange',
  });

  const isGuest = user?.isAnonymous;
  const isFormDisabled = isSubmitting || isGuest;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
      const allPreviews = [...imagePreviews, ...newPreviews];
      setImagePreviews(allPreviews);
      
      const currentImages = form.getValues('imageUrls') || [];
      const allImages = [...currentImages, ...newPreviews];
      form.setValue('imageUrls', allImages, { shouldValidate: true });
    }
  };

  const removeImage = (index: number) => {
    const currentPreviews = [...imagePreviews];
    currentPreviews.splice(index, 1);
    setImagePreviews(currentPreviews);
    form.setValue('imageUrls', currentPreviews, { shouldValidate: true });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !storage) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be signed in to sell items.' });
        return;
    }
    if (isGuest) {
        toast({ variant: 'destructive', title: 'Action not allowed', description: 'Please create an account to sell items.' });
        return;
    }

    setIsSubmitting(true);
    router.push('/home'); // Immediately redirect

    // The rest of the function runs in the background
    (async () => {
        try {
            const uploadedImageUrls: string[] = [];
            
            // Step 1: Upload images to Firebase Storage
            for (const image of values.imageUrls) {
                const response = await fetch(image);
                const blob = await response.blob();
                const dataUrl = await new Promise<string>(resolve => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });

                const storageRef = ref(storage, `items/${user.uid}/${Date.now()}_${Math.random()}`);
                const uploadResult = await uploadString(storageRef, dataUrl, 'data_url');
                const downloadUrl = await getDownloadURL(uploadResult.ref);
                uploadedImageUrls.push(downloadUrl);
            }
            
            // Step 2: Add item document to Firestore non-blockingly
            const itemsCollection = collection(firestore, 'items');
            const itemData = {
                name: values.name,
                description: values.description,
                price: values.price,
                sellerId: user.uid,
                imageUrls: uploadedImageUrls,
                postedAt: serverTimestamp(),
            };
            
            // This function is non-blocking and handles its own errors
            addDocumentNonBlocking(itemsCollection, itemData);

            toast({
              title: "Item Posted!",
              description: `${values.name} is now available for sale.`,
            });

        } catch(error: any) {
            console.error("Error posting item in background:", error);
            // Since we've already redirected, we show a toast for failure.
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: error.message || 'There was an error posting your item in the background.',
            });
             // No need to emit a permission error here as addDocumentNonBlocking already handles it
        } finally {
            // No need to set isSubmitting to false as the component is unmounted
        }
    })();
  }
  
  if (userLoading) {
      return <SellFormSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Post a New Item</CardTitle>
        {isGuest && (
             <CardDescription className="!mt-4">
                 <div className="flex items-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                     <AlertCircle className="h-6 w-6 text-destructive" />
                     <div className="flex-1">
                        <p className="font-semibold text-destructive">Guest accounts cannot sell items.</p>
                        <p className="text-sm text-destructive/80">Please create a full account to start selling.</p>
                        <Button asChild variant="link" className="p-0 h-auto text-destructive">
                            <Link href="/signup">
                                <UserPlus className="mr-2" /> Create Account
                            </Link>
                        </Button>
                     </div>
                 </div>
             </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
             <div>
                <FormField
                  control={form.control}
                  name="imageUrls"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Images (at least 1 required)</FormLabel>
                        <div className="mt-2 grid grid-cols-3 gap-4">
                          {imagePreviews.map((src, index) => (
                            <div key={index} className="relative aspect-square">
                              <Image src={src} alt={`Preview ${index}`} fill className="rounded-lg object-cover" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => removeImage(index)}
                                disabled={isFormDisabled}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Label htmlFor="file-upload" className={cn("flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-input bg-card", isFormDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-muted/50')}>
                            <div className="text-center">
                                <ImagePlus className="mx-auto h-10 w-10 text-muted-foreground" />
                                <span className="mt-2 block text-sm font-medium text-muted-foreground">
                                    Upload
                                </span>
                            </div>
                             <Input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" disabled={isFormDisabled}/>
                          </Label>
                        </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MacBook Air" {...field} disabled={isFormDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your item in detail..." className="min-h-[120px]" {...field} disabled={isFormDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 50.00" {...field} disabled={isFormDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" size="lg" className="w-full font-bold" disabled={isFormDisabled}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Posting...' : 'Sell'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    