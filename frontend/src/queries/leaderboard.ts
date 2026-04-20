// frontend/src/queries/leaderboard.ts
import { infiniteQueryOptions } from "@tanstack/react-query";
import * as api from "../api/leaderboard";
import type { LeaderboardPeriod } from "../api/leaderboard";
import { qk } from "./keys";

export const leaderboardUsersInfiniteQueryOptions = (period: LeaderboardPeriod) =>
  infiniteQueryOptions({
    queryKey: qk.leaderboardUsers(period),
    queryFn: ({ pageParam }) => api.listUserLeaderboard({ period, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    staleTime: 5 * 60_000,
  });

export const leaderboardTeamsInfiniteQueryOptions = (period: LeaderboardPeriod) =>
  infiniteQueryOptions({
    queryKey: qk.leaderboardTeams(period),
    queryFn: ({ pageParam }) => api.listTeamLeaderboard({ period, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    staleTime: 5 * 60_000,
  });
