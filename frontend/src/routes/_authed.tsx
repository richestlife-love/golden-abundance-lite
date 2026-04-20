import { createRoute, Outlet, redirect } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { tokenStore } from "../auth/token";
import { meQueryOptions, myTasksQueryOptions } from "../queries/me";

export const authedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_authed",
  beforeLoad: async ({ context, location }) => {
    if (!tokenStore.get()) {
      throw redirect({
        to: "/sign-in",
        search: { returnTo: location.href },
      });
    }
    const me = await context.queryClient.ensureQueryData(meQueryOptions());
    if (!me.profile_complete) {
      throw redirect({ to: "/welcome" });
    }
  },
  loader: async ({ context }) => {
    // Warm so child loaders (display_id → uuid lookups) hit cache.
    await context.queryClient.ensureQueryData(myTasksQueryOptions());
  },
  component: Outlet,
});
