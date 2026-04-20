import { createRoute } from "@tanstack/react-router";
import LeaderboardScreen from "../screens/LeaderboardScreen";
import {
  leaderboardTeamsInfiniteQueryOptions,
  leaderboardUsersInfiniteQueryOptions,
} from "../queries/leaderboard";
import { authedRoute } from "./_authed";

export const leaderboardRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/leaderboard",
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureInfiniteQueryData(leaderboardUsersInfiniteQueryOptions("week")),
      context.queryClient.ensureInfiniteQueryData(leaderboardTeamsInfiniteQueryOptions("week")),
    ]),
  component: LeaderboardScreen,
});
