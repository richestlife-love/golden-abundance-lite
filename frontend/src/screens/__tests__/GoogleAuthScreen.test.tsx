import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderRoute } from "../../test/renderRoute";

describe("GoogleAuthScreen via /sign-in", () => {
  it("clicking the Google button initiates OAuth redirect", async () => {
    const { fake } = renderRoute("/sign-in");
    const btn = await screen.findByRole("button", { name: /繼續使用 Google 登入/ });
    fireEvent.click(btn);

    // Assert the underlying Supabase call was made with the right provider.
    await waitFor(() => expect(fake.signInCalls).toHaveLength(1));
    expect(fake.signInCalls[0].provider).toBe("google");
    expect(fake.signInCalls[0].redirectTo).toMatch(/\/auth\/callback$/);

    // And the UI flips to the pending state.
    expect(
      screen.queryByRole("button", { name: /繼續使用 Google 登入/ }),
    ).not.toBeInTheDocument();
  });
});
