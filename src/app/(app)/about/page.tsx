
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-6">
       <Button asChild variant="link" className="mb-4 pl-0 text-primary">
        <Link href="/home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
        </Link>
      </Button>
      <Card>
        <CardHeader className="items-center text-center p-6">
            <UserAvatar name="Phoebe Ayana A. Andal" className="h-24 w-24 mb-4" />
            <CardTitle className="font-headline text-2xl">Phoebe Ayana A. Andal</CardTitle>
            <CardDescription>BSIT-CPT03 Student</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <p className="text-center text-muted-foreground">
            The owner of this app is from a BSIT-CPT03 student named Phoebe Ayana A. Andal, this app promotes a chance for students to online post their items that they wanted to sell for other students and limit their time thinking where to promote those item as they can easily sell items where students can easily access.
          </p>
          <p className="text-center text-muted-foreground mt-4">
            the author of this app can be contacted through email, Facebook or by phone number. Your opinions and support is greatly appreciated and all of this is for everyone in campus to use freely. Once again thank you!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
