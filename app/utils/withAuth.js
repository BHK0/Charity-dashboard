import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userEmail, setUserEmail] = useState(null);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1];

          if (!token) {
            console.log('No token found in cookies');
            setIsLoading(false);
            router.replace('/login');
            return;
          }

          const response = await fetch('/api/auth/validate', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const data = await response.json();
          
          if (!data.valid || !data.user?.email) {
            console.log('Token validation failed');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
            setIsLoading(false);
            router.replace('/login');
            return;
          }

          console.log('Token validated successfully');
          setUserEmail(data.user.email);
          setIsAuthenticated(true);
          setIsLoading(false);
        } catch (error) {
          console.error('Authentication check failed:', error);
          setIsLoading(false);
          router.replace('/login');
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return <Component {...props} isLoading={true} />;
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} isLoading={false} userEmail={userEmail} />;
  };
}
