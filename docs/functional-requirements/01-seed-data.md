# 01 — Seed Data

Dev DB seed — `backend/src/backend/seed.py`. Run via `just -f backend/justfile seed`. Idempotent (skips existing rows by display_id / title / email).

MSW test fixtures at `frontend/src/test/msw/fixtures.ts` are test-internal and diverge from this seed — not covered here. See README's "tests as behavior spec" pointer.

## Task definitions

| ID | Title | Tag | Color | Points | Bonus | Est. min | Challenge | Form | Requires | Due |
|---|---|---|---|---|---|---|---|---|---|---|
| T1 | 填寫金富有志工表單 | 探索 | `#fec701` | 50 | — | 5 | no | `interest` | — | — |
| T2 | 夏季盛會報名 | 社区 | `#38b6ff` | 80 | 限定紀念徽章 | 10 | no | `ticket` | T1 | — |
| T3 | 組成 6 人團隊 | 陪伴 | `#ff5c8a` | 120 | — | 0 | yes (cap 6) | — | — | — |
| T4 | 志工培訓 (已結束) | 探索 | `#a3a3a3` | 0 | — | 60 | no | — | — | 2026-03-01 |

T1 has 4 steps: 確認電子郵件與手機 / 填寫個人興趣與專長 / 選擇可投入的時段 / 簽署志工服務同意書.

## News items

| Title | Category | Pinned | Published |
|---|---|---|---|
| 夏季盛會志工招募開跑 | 公告 | ✓ | now − 1d |
| 本月星點雙倍週即將開始 | 活動 | — | now − 3d |
| 新任務「長者陪伴」已上線 | 通知 | — | now − 5d |

## Demo users

All `@demo.ga`, country TW, `profile_complete=True`, each auto-gets a led team via `create_led_team`.

| Email | ZH | EN | Nickname | Phone | Location |
|---|---|---|---|---|---|
| jet@demo.ga | 金杰 | Jet Kan | Jet | +886 912345678 | 台北 |
| ami@demo.ga | 林詠瑜 | Ami Lin | Ami | +886 912345679 | 台北 |
| alex@demo.ga | 陳志豪 | Alex Chen | Alex | +886 912345680 | 新北 |
| mei@demo.ga | 王美玲 | Mei Wang | Mei | +886 912345681 | 台中 |
| kai@demo.ga | 黃凱文 | Kai Huang | Kai | +886 912345682 | 高雄 |
| yu@demo.ga | 張詩宇 | Yu Chang | Yu | +886 912345683 | 台南 |

Each demo user is seeded with a stable `UUID(int=i+1)` identity (1..6) so the backend test fixtures' `mint_access_token` helper can mint Supabase-shaped JWTs that resolve to the seeded rows.

## γ-fanout pending join requests

Exercises two-leader approval UX.

- alex → jet's team
- mei → jet's team
- kai → ami's team
- yu → ami's team

## Real sign-in (local dev)

Phase 6 removed the demo-account chooser. Local dev signs in via real Google OAuth against a dev Supabase project (or `supabase start` locally). No frontend-bundled account picker, no generated JSON.
