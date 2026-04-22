// frontend/src/mutations/me.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/me";
import { qk } from "../queries/keys";
import type { components } from "../api/schema";

type ProfileCreate = components["schemas"]["ProfileCreate"];
type ProfileUpdate = components["schemas"]["ProfileUpdate"];

// Note: qk.me is ["me"], which prefix-matches qk.myTasks / qk.myTeams /
// qk.myRewards — invalidating qk.me alone covers all of them.

export function useCompleteProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProfileCreate) => api.postProfile(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function usePatchMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProfileUpdate) => api.patchMe(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.me });
      // Not covered by qk.me prefix — the teams list cache lives under
      // ["teams", …] and a profile change may affect leader/alias there.
      qc.invalidateQueries({ queryKey: qk.teamsAll });
    },
  });
}
