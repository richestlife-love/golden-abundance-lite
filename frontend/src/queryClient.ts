import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Loaders own the initial fetch; we don't want background refetch
      // storms on every screen mount during dev. Per-query overrides are
      // fine for cases that genuinely want focus refetch.
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
