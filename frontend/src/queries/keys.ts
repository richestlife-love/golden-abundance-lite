import type { LeaderboardPeriod } from "../api/leaderboard";
import type { TeamSearchParams } from "../api/teams";

export const qk = {
  me: ["me"] as const,
  myTasks: ["me", "tasks"] as const,
  myTeams: ["me", "teams"] as const,
  myRewards: ["me", "rewards"] as const,
  task: (id: string) => ["tasks", id] as const,
  teams: (params: TeamSearchParams) => ["teams", params] as const,
  team: (id: string) => ["teams", id] as const,
  leaderboardUsers: (period: LeaderboardPeriod) => ["leaderboard", "users", period] as const,
  leaderboardTeams: (period: LeaderboardPeriod) => ["leaderboard", "teams", period] as const,
  news: ["news"] as const,
} as const;
