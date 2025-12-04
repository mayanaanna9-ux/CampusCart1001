
import ProfilePage from '../page';

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  // This component re-uses the main ProfilePage component, 
  // but passes the userId from the URL to it as a prop.
  return <ProfilePage params={params} />;
}
