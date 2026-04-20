import { createRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import ProfileSetupForm from "../screens/ProfileSetupForm";
import { useAppState } from "../state/AppStateContext";
import { useAuth } from "../auth/session";
import { tokenStore } from "../auth/token";
import { meQueryOptions } from "../queries/me";
import { rootRoute } from "./__root";

function WelcomeRoute() {
  const navigate = useNavigate();
  const { data: me } = useSuspenseQuery(meQueryOptions());
  const { handleProfileComplete } = useAppState();
  const { signOut } = useAuth();
  // Adapter: ProfileSetupForm still reads legacy camelCase. Migration to
  // snake_case + useCompleteProfile lands in plan 4c alongside the form rewrite.
  const formUser = { id: me.display_id, email: me.email, name: me.name };
  return (
    <ProfileSetupForm
      user={formUser}
      onCancel={() => {
        void signOut();
        navigate({ to: "/" });
      }}
      onSubmit={(profile) => {
        handleProfileComplete(profile);
        navigate({ to: "/home" });
      }}
    />
  );
}

export const welcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/welcome",
  beforeLoad: async ({ context, location }) => {
    if (!tokenStore.get()) {
      throw redirect({
        to: "/sign-in",
        search: { returnTo: location.href },
      });
    }
    const me = await context.queryClient.ensureQueryData(meQueryOptions());
    if (me.profile_complete) throw redirect({ to: "/home" });
  },
  component: WelcomeRoute,
});
