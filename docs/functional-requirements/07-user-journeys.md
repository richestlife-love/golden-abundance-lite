# 07 — User Journeys

Narrative flows that traverse multiple routes / endpoints. Each maps to acceptance criteria.

## 1. First-time sign-up

```
/sign-in (single "Continue with Google" button)
  → supabase.auth.signInWithOAuth({ provider: "google",
      options: { redirectTo: origin + "/auth/callback?returnTo=…" }})
  → Supabase → Google consent → back to /auth/callback?code=…
  → supabase.auth.exchangeCodeForSession(window.location.search)
      (Supabase persists the session in localStorage, auto-refresh on)
  → navigate to returnTo ?? "/"
  → /welcome (via _authed guard seeing profile_complete=false)
  → ProfileSetupForm
  → POST /me/profile (atomic: profile + led team)
      ↳ first authed call materialises the UserRow via current_user's
        upsert-on-first-sight
  → /home
```

## 2. Returning sign-in

```
/sign-in
  → supabase.auth.signInWithOAuth → Google → /auth/callback → exchange
  → / (index guard checks supabase.auth.getSession)
  → profile_complete? yes → /home ; no → /welcome
```

## 3. Session expiry mid-session

Any 401 → `setSessionExpiredHandler` → `signOut({reason:"expired", returnTo})` → toast + navigate to `/sign-in?returnTo=…` + `queryClient.clear()`. Detail in `08-error-semantics.md`.

## 4. Task completion with reward

```
/tasks → TaskCard → /tasks/:taskId → /tasks/:taskId/start
  → InterestForm or TicketForm
  → POST /tasks/{id}/submit
  → TaskSubmissionResponse {task, reward?}
  → pushSuccess({color, points, bonus, title})  ← celebration overlay
  → invalidate: task(id), myTasks, myRewards, me, leaderboard*
  → navigate to /tasks/:taskId (detail)
```

## 5. Team join (requester side)

> ⚠️ **Backend ready, UI deferred.** Team endpoints exist; no `/teams` routes in `frontend/src/router.ts`. `/tasks/T3/start` returns 404 and the MyScreen "搜尋加入" CTA toasts "coming soon" — see `10-deferred-scope.md`. Flow below is the target.

```
/teams (search with q/topic/leader_display_id)
  → /teams/:teamId (detail)
  → POST /teams/{id}/join-requests
  → local UI shows pending
  → (wait for leader approval)
  → on approval: GET /me/teams now shows `joined`
```

## 6. Team join (leader side)

```
/me → led team card → pending list
  → approve: POST …/{req_id}/approve → Team response with requester moved to members
  → reject:  POST …/{req_id}/reject → 204
```

## 7. Profile edit

```
/me/profile/edit
  → PATCH /me (partial ProfileUpdate)
  → updated User returned
  → invalidate: me
```

## 8. T3 team-challenge completion (no submit)

```
Leader: auto-created team at profile completion
  → members join (journeys 5+6)
  → total = max(led_total, joined_total) reaches cap=6
  → services/task.py derives Task.status = "completed" for every team member
    (read-side only; task_progress rows are not updated)
  → no Reward row created (T3 has bonus=None in seed)
```

Each journey's error branches (409/412/403) need UX copy — see `08-error-semantics.md`.

**Cache invalidation note**: mutations refresh related reads (`me`, `me/*`, `team(id)`, `teams`, `leaderboard*`, `task(id)`). Exact key-by-key mapping is implementation detail in `frontend/src/mutations/*.ts` and `frontend/src/queries/keys.ts`.
