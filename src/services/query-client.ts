import { QueryClient } from "@tanstack/react-query";

// Create a stable query client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global query defaults
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes by default
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes by default
      refetchOnWindowFocus: false, // Don't refetch on window focus by default
      refetchOnReconnect: true, // Refetch when reconnecting to internet
      refetchOnMount: true, // Refetch when component mounts
    },
    mutations: {
      // Global mutation defaults
      retry: 1,
      retryDelay: 1000,
    },
  },
});
