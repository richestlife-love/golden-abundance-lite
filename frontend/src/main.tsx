import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import * as Sentry from "@sentry/react";
import { AuthProvider } from "./auth/session";
import { UIStateProvider } from "./ui/UIStateProvider";
import { queryClient } from "./queryClient";
import { createAppRouter, setRouterRef } from "./router";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_RELEASE,
    tracesSampleRate: 0.1,
  });
}

const router = createAppRouter({ queryClient });
setRouterRef(router);

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("root element not found");

createRoot(rootEl).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error }) => (
        <div style={{ padding: 32 }}>
          <h1>出了點問題</h1>
          <pre style={{ fontSize: 12, color: "#666" }}>
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      )}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UIStateProvider>
            <RouterProvider router={router} />
          </UIStateProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
