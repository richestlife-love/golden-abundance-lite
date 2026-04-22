// frontend/src/api/leaderboard.ts
import type { components, paths } from "./schema";
import { apiFetch } from "./client";

// Derived from the backend's generated OpenAPI rather than hand-maintained.
// If the backend changes the accepted period set (adds "quarter", drops
// "all_time", etc.), `just gen-types` regenerates `schema.d.ts` and the
// drift lands in every caller at typecheck time — no drift-guard unit
// test needed.
export type LeaderboardPeriod = NonNullable<
  NonNullable<paths["/api/v1/leaderboard/users"]["get"]["parameters"]["query"]>["period"]
>;

type UserLeaderboardEntry = components["schemas"]["UserLeaderboardEntry"];
type TeamLeaderboardEntry = components["schemas"]["TeamLeaderboardEntry"];
type Paginated<T> = { items: T[]; next_cursor: string | null };

interface LeaderboardParams {
  period: LeaderboardPeriod;
  cursor?: string;
  limit?: number;
}

interface FetchOpts {
  signal?: AbortSignal;
}

function qs(p: LeaderboardParams): string {
  const usp = new URLSearchParams({ period: p.period });
  if (p.cursor) usp.set("cursor", p.cursor);
  if (p.limit) usp.set("limit", String(p.limit));
  return `?${usp.toString()}`;
}

export const listUserLeaderboard = (
  p: LeaderboardParams,
  opts: FetchOpts = {},
): Promise<Paginated<UserLeaderboardEntry>> =>
  apiFetch<Paginated<UserLeaderboardEntry>>(`/leaderboard/users${qs(p)}`, { signal: opts.signal });

export const listTeamLeaderboard = (
  p: LeaderboardParams,
  opts: FetchOpts = {},
): Promise<Paginated<TeamLeaderboardEntry>> =>
  apiFetch<Paginated<TeamLeaderboardEntry>>(`/leaderboard/teams${qs(p)}`, { signal: opts.signal });
