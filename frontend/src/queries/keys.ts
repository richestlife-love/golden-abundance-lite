import type { LeaderboardPeriod } from "../api/leaderboard";
import type { TeamSearchParams } from "../api/teams";

export const qk = {
  me: ["me"] as const,
  myTasks: ["me", "tasks"] as const,
  myTeams: ["me", "teams"] as const,
  myRewards: ["me", "rewards"] as const,
  task: (id: string) => ["tasks", id] as const,
  teams: (params: TeamSearchParams) => ["teams", params] as const,
  /** Prefix for all `teams` entries (list queries keyed by search params plus
   *  individual `team(id)` entries). Use this for bulk invalidation. */
  teamsAll: ["teams"] as const,
  team: (id: string) => ["teams", id] as const,
  leaderboardUsers: (period: LeaderboardPeriod) => ["leaderboard", "users", period] as const,
  leaderboardTeams: (period: LeaderboardPeriod) => ["leaderboard", "teams", period] as const,
  /** Prefix for leaderboard entries across periods + scopes. */
  leaderboardAll: ["leaderboard"] as const,
} as const;
