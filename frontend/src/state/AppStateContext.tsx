import { createContext, useContext, type ReactNode } from "react";

// Phase-4b interim shape: every member is a write-side stub that throws.
// Plan 4c rewrites every callsite to a real useMutation hook and then
// deletes this file entirely.

const NOT_MIGRATED = (name: string): never => {
  throw new Error(
    `${name} is not migrated yet (plan 4c rewires write-side mutations).`,
  );
};

export interface AppState {
  handleProfileComplete: (...args: unknown[]) => never;
  handleProfileUpdate: (...args: unknown[]) => never;
  joinTeam: (...args: unknown[]) => never;
  leaveLedTeam: (...args: unknown[]) => never;
  leaveJoinedTeam: (...args: unknown[]) => never;
  approveRequest: (...args: unknown[]) => never;
  rejectRequest: (...args: unknown[]) => never;
  renameTeam: (...args: unknown[]) => never;
  simulateJoinApproved: (...args: unknown[]) => never;
  completeTask: (...args: unknown[]) => never;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const value: AppState = {
    handleProfileComplete: () => NOT_MIGRATED("handleProfileComplete"),
    handleProfileUpdate: () => NOT_MIGRATED("handleProfileUpdate"),
    joinTeam: () => NOT_MIGRATED("joinTeam"),
    leaveLedTeam: () => NOT_MIGRATED("leaveLedTeam"),
    leaveJoinedTeam: () => NOT_MIGRATED("leaveJoinedTeam"),
    approveRequest: () => NOT_MIGRATED("approveRequest"),
    rejectRequest: () => NOT_MIGRATED("rejectRequest"),
    renameTeam: () => NOT_MIGRATED("renameTeam"),
    simulateJoinApproved: () => NOT_MIGRATED("simulateJoinApproved"),
    completeTask: () => NOT_MIGRATED("completeTask"),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside <AppStateProvider>");
  return ctx;
}
