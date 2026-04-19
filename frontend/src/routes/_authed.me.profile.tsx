import { createRoute } from "@tanstack/react-router";
import ProfileScreen from "../screens/ProfileScreen";
import { meRoute } from "./_authed.me";

export const profileRoute = createRoute({
  getParentRoute: () => meRoute,
  path: "/profile",
  component: ProfileScreen,
});
