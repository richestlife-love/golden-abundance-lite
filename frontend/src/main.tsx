import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import * as Sentry from "@sentry/react";
import { AuthProvider } from "./auth/session";
import { UIStateProvider } from "./ui/UIStateProvider";
import { queryClient } from "./queryClient";
import { createAppRouter, setRouterRef } from "./router";
import { ApiError } from "./api/errors";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_RELEASE,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event, hint) {
      // 401s are expected when a token silently expires — the UI handles
      // them via the session-expired interceptor. Don't pollute Sentry.
      const err = hint?.originalException;
      if (err instanceof ApiError && err.status === 401) return null;

      // Scrub query strings off the request URL (may contain returnTo,
      // OAuth codes, cursors).
      if (event.request?.url) {
        try {
          const u = new URL(event.request.url);
          event.request.url = u.origin + u.pathname;
        } catch {
          // leave as-is if unparseable
        }
      }
      // Scrub query strings off breadcrumb URLs too.
      for (const b of event.breadcrumbs ?? []) {
        const rawUrl = (b.data as { url?: unknown } | undefined)?.url;
        if (typeof rawUrl === "string") {
          try {
            const u = new URL(rawUrl);
            (b.data as { url?: string }).url = u.origin + u.pathname;
          } catch {
            // leave as-is
          }
        }
      }
      return event;
    },
  });
}

const router = createAppRouter({ queryClient });
setRouterRef(router);

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("root element not found");

createRoot(rootEl).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{ padding: 32, fontFamily: "inherit" }}>
          <h1 style={{ marginTop: 0 }}>出了點問題</h1>
          <pre style={{ fontSize: 12, color: "#666", whiteSpace: "pre-wrap" }}>
            {error instanceof Error ? error.message : String(error)}
          </pre>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => {
                queryClient.clear();
                resetError();
              }}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "1px solid #6dae4a",
                background: "#6dae4a",
                color: "#fff",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              重試
            </button>
            <a
              href="/"
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "1px solid #6dae4a",
                color: "#6dae4a",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              回到首頁
            </a>
          </div>
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
