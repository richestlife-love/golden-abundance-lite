import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

function SentrySmokeRoute() {
  throw new Error("sentry smoke test — Phase 7b");
}

export const sentrySmokeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/debug/sentry-smoke",
  component: SentrySmokeRoute,
});
