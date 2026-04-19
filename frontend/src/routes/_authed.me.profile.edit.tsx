import { createRoute, redirect, useNavigate } from "@tanstack/react-router";
import ProfileSetupForm from "../screens/ProfileSetupForm";
import { useAppState } from "../state/AppStateContext";
import { profileRoute } from "./_authed.me.profile";

function ProfileEditRoute() {
  const navigate = useNavigate();
  const { user, handleProfileUpdate } = useAppState();
  return (
    <ProfileSetupForm
      user={user}
      initial={user}
      title="編輯個人資料"
      subtitle="更新你的基本資訊"
      submitLabel="儲存變更"
      onCancel={() => navigate({ to: "/me/profile" })}
      onSubmit={(profile) => {
        handleProfileUpdate(profile);
        navigate({ to: "/me/profile" });
      }}
    />
  );
}

export const profileEditRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: "/edit",
  beforeLoad: ({ location }) => {
    if (!location.state.fromProfile) {
      throw redirect({ to: "/me/profile" });
    }
  },
  component: ProfileEditRoute,
});
