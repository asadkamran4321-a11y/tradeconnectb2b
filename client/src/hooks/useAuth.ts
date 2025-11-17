import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Add some debugging
  console.log('useAuth - user:', user, 'isLoading:', isLoading, 'error:', error);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}