import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import GlobalStyles from "../ui/GlobalStyles";
import FormSuccessOverlay from "../ui/FormSuccessOverlay";
import { useUIState } from "../ui/useUIState";

export interface RouterContext {
  queryClient: QueryClient;
}

function NotFound() {
  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <h1 style={{ fontSize: 20 }}>找不到页面</h1>
      <p>该路径不存在。</p>
    </div>
  );
}

function RootLayout() {
  const { successData, setSuccessData } = useUIState();
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
      <Outlet />
      {successData && <FormSuccessOverlay {...successData} onDone={() => setSuccessData(null)} />}
    </div>
  );
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
});
