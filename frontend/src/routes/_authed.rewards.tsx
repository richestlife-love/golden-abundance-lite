import { createRoute } from "@tanstack/react-router";
import RewardsScreen from "../screens/RewardsScreen";
import { authedRoute } from "./_authed";

export const rewardsRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/rewards",
  component: RewardsScreen,
});
