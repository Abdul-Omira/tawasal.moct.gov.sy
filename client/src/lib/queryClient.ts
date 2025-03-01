import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAuthHeader, getToken, handleTokenRefresh, isTokenExpired, removeToken } from "./jwtUtils";

type UnauthorizedBehavior = "redirect" | "returnNull";

const throwIfResNotOk = async (res: Response) => {
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized access - please login again");
    }
    
    try {
      const errorData = await res.json();
      throw new Error(errorData.message || `Request failed with status ${res.status}`);
    } catch (parseError) {
      throw new Error(`Request failed with status ${res.status}`);
    }
  }
};

/**
 * API request function that handles JWT tokens
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...getAuthHeader(),
  };
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  
  // Check for token refresh in response headers
  handleTokenRefresh(res);
  
  await throwIfResNotOk(res);
  return res;
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {
      ...getAuthHeader(),
    };
    
    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });
    
    // Check for token refresh in response headers
    handleTokenRefresh(res);
    
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      // If unauthorized and token exists, it might be expired - clear it
      if (getToken()) {
        removeToken();
      }
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 401 errors
        if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401 errors
        if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});
