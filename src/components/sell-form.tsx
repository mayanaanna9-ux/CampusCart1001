
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Upload, X } from 'lucide-react';
import { Label } from './ui/label';
import { useState } from 'react';
import Image from 'next/image';

const formSchema = z.object({
  itemName: z.string().min(3, 'Item name must be at least 3 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  category: z.enum(['gadgets', 'books', 'clothes', 'food', 'other']),
  price: z.coerce.number().positive('Price must be a positive number.'),
  condition: z.enum(['new', 'used-like-new', 'used-good', 'used-fair']),
  images: z.array(z.string()).optional(),
});

export function SellForm() {
  const { toast } = useToast();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: '',
      description: '',
      price: 0,
      images: [],
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPreviews: string[] = [];
      const currentPreviews = form.getValues('images') || [];
      
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            const allPreviews = [...currentPreviews, ...newPreviews];
            form.setValue('images', allPreviews);
            setImagePreviews(allPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    const currentPreviews = [...imagePreviews];
    currentPreviews.splice(index, 1);
    setImagePreviews(currentPreviews);
    form.setValue('images', currentPreviews);
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Item Posted!",
      description: `${values.itemName} is now available for sale.`,
    });
    form.reset();
    setImagePreviews([]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Post a New Item</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
             <div>
                <Label>Item Images</Label>
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
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Label htmlFor="file-upload" className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input bg-card hover:bg-muted/50">
                    <div className="text-center">
                        <ImagePlus className="mx-auto h-10 w-10 text-muted-foreground" />
                        <span className="mt-2 block text-sm font-medium text-muted-foreground">
                            Upload
                        </span>
                    </div>
                     <Input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/png, image/jpeg, image/gif"/>
                  </Label>
                </div>
            </div>
            
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MacBook Air" {...field} />
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
                    <Textarea placeholder="Describe your item in detail..." className="min-h-[120px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gadgets">Gadgets</SelectItem>
                        <SelectItem value="books">Books</SelectItem>
                        <SelectItem value="clothes">Clothes</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 50.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the item's condition" />
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

            <Button type="submit" size="lg" className="w-full font-bold">Sell</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
