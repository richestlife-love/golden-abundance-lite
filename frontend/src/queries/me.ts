// frontend/src/queries/me.ts
import { queryOptions } from "@tanstack/react-query";
import * as api from "../api/me";
import { qk } from "./keys";

export const meQueryOptions = () =>
  queryOptions({
    queryKey: qk.me,
    queryFn: ({ signal }) => api.getMe({ signal }),
    staleTime: 60_000,
  });

export const myTasksQueryOptions = () =>
  queryOptions({
    queryKey: qk.myTasks,
    queryFn: ({ signal }) => api.getMyTasks({ signal }),
    staleTime: 30_000,
  });

export const myTeamsQueryOptions = () =>
  queryOptions({
    queryKey: qk.myTeams,
    queryFn: ({ signal }) => api.getMyTeams({ signal }),
    staleTime: 60_000,
  });

export const myRewardsQueryOptions = () =>
  queryOptions({
    queryKey: qk.myRewards,
    queryFn: ({ signal }) => api.getMyRewards({ signal }),
    staleTime: 30_000,
  });
