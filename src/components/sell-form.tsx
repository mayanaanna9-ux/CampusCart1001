
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Loader2, X, UserPlus, AlertCircle, Facebook, Smartphone, Book, Shirt, Utensils, VenetianMask } from 'lucide-react';
import { Label } from './ui/label';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useStorage, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"


const formSchema = z.object({
  name: z.string().min(3, 'Item name must be at least 3 characters long.'),
  category: z.string().min(1, 'Please select a category.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  condition: z.string().min(1, 'Please select a condition.'),
  imageUrls: z.array(z.string()).min(1, 'Please upload at least one image.'),
  contactNumber: z.string().optional(),
  location: z.string().optional(),
  facebookProfileUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      condition: '',
      category: '',
      imageUrls: [],
      contactNumber: '',
      location: '',
      facebookProfileUrl: '',
    },
    mode: 'onChange',
  });

  const isGuest = user?.isAnonymous;
  const isFormDisabled = isSubmitting || isGuest;
  const watchedImageUrls = form.watch('imageUrls');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const currentUrls = form.getValues('imageUrls');
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
    currentUrls.splice(index, 1);
    form.setValue('imageUrls', currentUrls, { shouldValidate: true, shouldDirty: true });
  }

 function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore || !storage) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be signed in to sell items.' });
      return;
    }
    if (isGuest) {
      toast({ variant: 'destructive', title: 'Action not allowed', description: 'Please create an account to sell items.' });
      return;
    }

    setIsSubmitting(true);
    
    router.push('/home');

    toast({
        title: "Posting your item...",
        description: "Your item is being uploaded in the background.",
    });

    const runAsyncOperations = async () => {
        try {
            const itemData = {
                name: values.name,
                description: values.description,
                price: values.price,
                condition: values.condition,
                category: values.category,
                sellerId: user.uid,
                postedAt: serverTimestamp(),
                contactNumber: values.contactNumber || '',
                location: values.location || '',
                email: user.email,
                facebookProfileUrl: values.facebookProfileUrl || '',
                imageUrls: [], // Start with empty array, will be updated
            };
            
            const itemsCollection = collection(firestore, 'items');
            const docRef = await addDoc(itemsCollection, itemData);

            const uploadedImageUrls = await Promise.all(
                values.imageUrls.map(async (localUrl) => {
                    const storageRef = ref(storage, `items/${user.uid}/${docRef.id}/${Date.now()}`);
                    const uploadResult = await uploadString(storageRef, localUrl, 'data_url');
                    return getDownloadURL(uploadResult.ref);
                })
            );
            
            await updateDoc(docRef, { id: docRef.id, imageUrls: uploadedImageUrls });

            toast({
                title: "Success!",
                description: `${values.name} has been posted.`,
            });

        } catch (error: any) {
            console.error("Error posting item:", error);
            toast({
                variant: 'destructive',
                title: 'Post Failed',
                description: error.message || 'There was an error posting your item.',
            });
        }
    };
    
    runAsyncOperations();
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
                          {watchedImageUrls.map((src, index) => (
                            <div key={index} className="relative aspect-square">
                              <Image src={src} alt={`Preview ${index}`} fill sizes="(max-width: 768px) 33vw, 25vw" className="rounded-lg object-cover" />
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isFormDisabled}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gadgets">
                          <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4" /> Gadgets
                          </div>
                      </SelectItem>
                      <SelectItem value="school-materials">
                           <div className="flex items-center gap-2">
                              <Book className="h-4 w-4" /> School Materials
                          </div>
                      </SelectItem>
                      <SelectItem value="clothes">
                           <div className="flex items-center gap-2">
                              <Shirt className="h-4 w-4" /> Clothes
                          </div>
                      </SelectItem>
                      <SelectItem value="food">
                           <div className="flex items-center gap-2">
                              <Utensils className="h-4 w-4" /> Food
                          </div>
                      </SelectItem>
                      <SelectItem value="other">
                           <div className="flex items-center gap-2">
                              <VenetianMask className="h-4 w-4" /> Others
                          </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                    <FormLabel>Price (₱)</FormLabel>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isFormDisabled}>
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
                <p className="text-sm text-muted-foreground">Provide ways for buyers to contact you. Your email ({user?.email}) will be included automatically.</p>
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

    