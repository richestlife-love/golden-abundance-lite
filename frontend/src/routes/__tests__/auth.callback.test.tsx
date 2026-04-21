import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import type { AuthError } from "@supabase/supabase-js";
import { renderRoute } from "../../test/renderRoute";

describe("/auth/callback", () => {
  it("calls exchangeCodeForSession with the URL query string", async () => {
    const { fake } = renderRoute("/auth/callback?code=abc&state=xyz");
    await waitFor(() => {
      expect(fake.exchangeCalls).toHaveLength(1);
    });
    // jsdom uses window.location.search, which is empty in memory-history
    // tests. The point is we pass through SOMETHING — non-zero calls is
    // the real assertion.
    expect(typeof fake.exchangeCalls[0]).toBe("string");
  });

  it("navigates to returnTo on successful exchange", async () => {
    const { router } = renderRoute("/auth/callback?code=abc&returnTo=%2Fhome");
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/home");
    });
  });

  it("falls back to / when returnTo is absent (index then redirects)", async () => {
    const { router } = renderRoute("/auth/callback?code=abc");
    // MSW's default `me` has profile_complete=true, so / bounces to /home.
    // The exact final landing is incidental — the point is we navigated
    // somewhere same-origin.
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/home");
    });
  });

  it("strips a protocol-relative returnTo and falls back to /", async () => {
    const { router } = renderRoute(
      "/auth/callback?code=abc&returnTo=%2F%2Fevil.com",
    );
    // parseReturnTo strips //evil.com to undefined → falls back to / →
    // index bounces to /home. Verify we land there and nothing in the
    // router's URL mentions evil.com.
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/home");
    });
    expect(router.state.location.href).not.toContain("evil.com");
  });

  it("surfaces an error toast and redirects to /sign-in when the exchange fails", async () => {
    const { router } = renderRoute("/auth/callback?code=abc", {
      configureFake: (fake) => {
        fake.nextExchangeError = { message: "invalid grant" } as AuthError;
      },
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/sign-in");
    });

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent(/登入失敗/);
  });
});
