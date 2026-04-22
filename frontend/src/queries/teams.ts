// frontend/src/queries/teams.ts
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import * as api from "../api/teams";
import type { TeamSearchParams } from "../api/teams";
import { qk } from "./keys";

export const teamQueryOptions = (uuid: string) =>
  queryOptions({
    queryKey: qk.team(uuid),
    queryFn: ({ signal }) => api.getTeam(uuid, { signal }),
    staleTime: 60_000,
  });

export const teamsInfiniteQueryOptions = (params: TeamSearchParams = {}) =>
  infiniteQueryOptions({
    queryKey: qk.teams(params),
    queryFn: ({ pageParam, signal }) => api.listTeams({ ...params, cursor: pageParam }, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    staleTime: 10_000,
  });
