import { createRoute } from "@tanstack/react-router";
import RankScreen from "../screens/RankScreen";
import { authedRoute } from "./_authed";

export const leaderboardRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/leaderboard",
  component: RankScreen,
});
