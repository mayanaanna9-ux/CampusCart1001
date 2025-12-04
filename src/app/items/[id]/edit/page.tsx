
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Loader2, X, Facebook, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useFirestore, useStorage, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import type { Item } from '@/lib/types';


const formSchema = z.object({
  name: z.string().min(3, 'Item name must be at least 3 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  condition: z.string().min(1, 'Please select a condition.'),
  imageUrls: z.array(z.string().url()).min(1, 'Please upload at least one image.'),
  contactNumber: z.string().optional(),
  location: z.string().optional(),
  facebookProfileUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

function EditFormSkeleton() {
    return (
        <div className="container mx-auto max-w-2xl p-4 md:p-6">
            <Skeleton className="h-10 w-32 mb-6" />
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">
                        <Skeleton className="h-8 w-48" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-1/3" />
                        <div className="grid grid-cols-3 gap-4">
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
        </div>
    )
}

export default function EditItemPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const firestore = useFirestore();
  const storage = useStorage();
  const { user, loading: userLoading } = useUser();
  
  const itemId = params.id as string;
  const itemRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, 'items', itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading: itemLoading } = useDoc<Item>(itemRef);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      condition: '',
      imageUrls: [],
      contactNumber: '',
      location: '',
      facebookProfileUrl: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (item) {
        if (user && item.sellerId !== user.uid) {
            // Redirect if the current user is not the seller
            return notFound();
        }
        form.reset({
            name: item.name,
            description: item.description,
            price: item.price,
            condition: item.condition,
            imageUrls: item.imageUrls,
            contactNumber: item.contactNumber || '',
            location: item.location || '',
            facebookProfileUrl: item.facebookProfileUrl || '',
        });
    }
  }, [item, user, form]);

  const watchedImageUrls = form.watch('imageUrls');
  const isFormDisabled = isSubmitting;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const currentUrls = form.getValues('imageUrls');
      
      // We are using data URLs to represent new files for upload
      const dataUrlPromises = Array.from(files).map(file => {
        return new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(dataUrlPromises).then(dataUrls => {
         form.setValue('imageUrls', [...currentUrls, ...dataUrls], { shouldValidate: true, shouldDirty: true });
      })
    }
  };

  const removeImage = (index: number) => {
    const currentUrls = [...form.getValues('imageUrls')];
    const urlToRemove = currentUrls[index];

    // If it's a Firebase Storage URL, add it to the list of URLs to be deleted from storage
    if (urlToRemove.startsWith('https://firebasestorage.googleapis.com')) {
      setRemovedImageUrls(prev => [...prev, urlToRemove]);
    }

    currentUrls.splice(index, 1);
    form.setValue('imageUrls', currentUrls, { shouldValidate: true, shouldDirty: true });
  }

 function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !storage || !item) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
      return;
    }

    setIsSubmitting(true);
    
    toast({
        title: "Updating your item...",
        description: "Your changes are being saved in the background.",
    });

    // Immediately navigate away
    router.push(`/items/${item.id}`);

    // Perform all storage and Firestore operations in the background (non-blocking)
    const runAsyncOperations = async () => {
      try {
          // 1. Delete images that were removed from storage
          await Promise.all(
              removedImageUrls.map(url => {
                  try {
                    const imageRef = ref(storage, url);
                    return deleteObject(imageRef).catch(err => console.warn("Failed to delete old image:", err));
                  } catch (error) {
                    console.warn("Invalid URL for deletion:", url, error);
                    return Promise.resolve();
                  }
              })
          );
          
          // 2. Upload new images and get their URLs
          const finalImageUrls = await Promise.all(
              values.imageUrls.map(async (url) => {
                  if (url.startsWith('data:')) { // It's a new base64 image
                      const storageRef = ref(storage, `items/${user.uid}/${item.id}/${Date.now()}`);
                      const uploadResult = await uploadString(storageRef, url, 'data_url');
                      return getDownloadURL(uploadResult.ref);
                  }
                  return url; // It's an existing URL
              })
          );

          // 3. Update the Firestore document with all new data
          const itemData = {
              ...values,
              imageUrls: finalImageUrls,
              updatedAt: serverTimestamp(),
          };
        
          const docRef = doc(firestore, 'items', item.id);
          await updateDoc(docRef, itemData);

          // Optional: Show a success toast only after everything is actually done
          toast({
            title: "Success!",
            description: `${values.name} has been updated.`,
          });

      } catch (error: any) {
        console.error("Error updating item in background:", error);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: error.message || 'There was an error updating your item.',
        });
      } finally {
          // This would run on the server/background, so no need to set submitting state
      }
    };

    runAsyncOperations();
  }
  
  const isLoading = userLoading || itemLoading;

  if (isLoading) {
      return <EditFormSkeleton />;
  }

  if (!item) {
      return notFound();
  }
  
  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Item
        </Button>
        <Card>
        <CardHeader>
            <CardTitle className="font-headline">Edit Your Item</CardTitle>
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
                            {watchedImageUrls.map((src, index) => (
                                <div key={index} className="relative aspect-square">
                                <Image src={src} alt={`Preview ${index}`} fill className="rounded-lg object-cover" sizes="(max-width: 768px) 33vw, 25vw" />
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
                <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isFormDisabled}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a condition" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="used-like-new">Used - Like New</SelectItem>
                            <SelectItem value="used-good">Used - Good</SelectItem>
                            <SelectItem value="used-fair">Used - Fair</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                    />
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-medium text-sm">Contact Information (Optional)</h3>
                    <p className="text-sm text-muted-foreground">Provide ways for buyers to contact you. Your email ({user?.email}) is included automatically.</p>
                    <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                            <Input placeholder="123-456-7890" {...field} disabled={isFormDisabled} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="facebookProfileUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Facebook Profile URL</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="https://facebook.com/your-profile" {...field} disabled={isFormDisabled} className="pl-8" />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Pickup Location</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Main Campus Library" {...field} disabled={isFormDisabled} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                
                <Button type="submit" size="lg" className="w-full font-bold" disabled={isFormDisabled || !form.formState.isDirty}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}
