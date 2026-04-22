// frontend/src/api/me.ts
import type { components } from "./schema";
import { apiFetch } from "./client";

type User = components["schemas"]["User"];
type Task = components["schemas"]["Task"];
type Reward = components["schemas"]["Reward"];
type MeTeamsResponse = components["schemas"]["MeTeamsResponse"];
type MeProfileCreateResponse = components["schemas"]["MeProfileCreateResponse"];
type ProfileCreate = components["schemas"]["ProfileCreate"];
type ProfileUpdate = components["schemas"]["ProfileUpdate"];

interface FetchOpts {
  signal?: AbortSignal;
}

export const getMe = (opts: FetchOpts = {}): Promise<User> =>
  apiFetch<User>("/me", { signal: opts.signal });
export const getMyTasks = (opts: FetchOpts = {}): Promise<Task[]> =>
  apiFetch<Task[]>("/me/tasks", { signal: opts.signal });
export const getMyTeams = (opts: FetchOpts = {}): Promise<MeTeamsResponse> =>
  apiFetch<MeTeamsResponse>("/me/teams", { signal: opts.signal });
export const getMyRewards = (opts: FetchOpts = {}): Promise<Reward[]> =>
  apiFetch<Reward[]>("/me/rewards", { signal: opts.signal });

export const postProfile = (body: ProfileCreate): Promise<MeProfileCreateResponse> =>
  apiFetch<MeProfileCreateResponse>("/me/profile", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const patchMe = (body: ProfileUpdate): Promise<User> =>
  apiFetch<User>("/me", { method: "PATCH", body: JSON.stringify(body) });
