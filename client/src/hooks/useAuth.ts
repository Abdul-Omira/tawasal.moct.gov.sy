import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { getToken } from '@/lib/jwtUtils';

export interface User {
  id: number;
  username: string;
  name?: string;
  isAdmin: boolean;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!getToken(), // Only run query if JWT token exists
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });

  // Check if token exists for authentication status
  const hasToken = !!getToken();

  return {
    user,
    isLoading: hasToken ? isLoading : false,
    isAuthenticated: !!user && hasToken,
    isAdmin: !!user?.isAdmin && hasToken,
    error,
  };
}