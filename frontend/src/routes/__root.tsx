import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import GlobalStyles from "../ui/GlobalStyles";
import FormSuccessOverlay from "../ui/FormSuccessOverlay";
import { useUIState } from "../ui/useUIState";

export interface RouterContext {
  queryClient: QueryClient;
}

function NotFound() {
  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <h1 style={{ fontSize: 20 }}>找不到頁面</h1>
      <p>該路徑不存在。</p>
    </div>
  );
}

function RootLayout() {
  const { successData, setSuccessData, toasts, dismissToast } = useUIState();
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-shell)",
        fontFamily: "var(--font-sans)",
        overflow: "hidden",
      }}
    >
      <GlobalStyles />
      <Analytics />
      <SpeedInsights />
      <Outlet />
      {successData && <FormSuccessOverlay {...successData} onDone={() => setSuccessData(null)} />}
      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "0 16px",
            alignItems: "center",
            zIndex: 300,
            pointerEvents: "none",
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              onClick={() => t.id && dismissToast(t.id)}
              style={{
                maxWidth: 440,
                width: "100%",
                padding: "11px 16px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                background:
                  t.kind === "error"
                    ? "rgba(200,70,70,0.95)"
                    : t.kind === "success"
                      ? "rgba(70,160,110,0.95)"
                      : "rgba(50,50,60,0.95)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
                pointerEvents: "auto",
                cursor: "pointer",
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
});
