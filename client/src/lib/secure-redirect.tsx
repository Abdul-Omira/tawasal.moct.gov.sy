import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

interface SecureRedirectProps {
  to: string;
  when: 'authenticated' | 'unauthenticated';
  adminOnly?: boolean;
}

export function useSecureRedirect({ to, when, adminOnly = false }: SecureRedirectProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    const shouldRedirect = 
      when === 'authenticated' ? isAuthenticated : !isAuthenticated;

    if (shouldRedirect) {
      // Additional admin check if required
      if (adminOnly && !isAdmin) {
        return;
      }
      
      // Prevent open redirects by validating the destination
      const isValidPath = to.startsWith('/') && !to.startsWith('//');
      if (isValidPath) {
        setLocation(to);
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, to, when, adminOnly, setLocation]);
}

// Secure navigation helper
export function useSecureNavigation() {
  const [, setLocation] = useLocation();
  
  const navigate = (path: string) => {
    // Validate path to prevent open redirects
    if (path.startsWith('/') && !path.startsWith('//')) {
      setLocation(path);
    } else {
      console.error('Invalid navigation path:', path);
    }
  };
  
  return navigate;
}