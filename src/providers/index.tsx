// Root layout configuration for React Query and Database Provider
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { DatabaseProvider } from "../services/database/context";

// Create a stable query client instance
const queryClient = new QueryClient({
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

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <DatabaseProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </DatabaseProvider>
  );
}

// Export the query client for manual access if needed
export { queryClient };
