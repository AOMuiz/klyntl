// Root layout configuration for React Query and Database Provider
import { queryClient } from "@/services/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { DatabaseProvider } from "../services/database/context";

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
