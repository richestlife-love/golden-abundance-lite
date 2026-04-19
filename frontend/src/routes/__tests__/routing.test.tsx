import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderRoute } from "../../test/renderRoute";

describe("router scaffolding", () => {
  it("renders the landing screen at /", async () => {
    renderRoute("/");
    await waitFor(() => {
      expect(screen.getByText("金富有志工")).toBeInTheDocument();
    });
  });
});

describe("_authed layout", () => {
  it("is defined with the expected id", async () => {
    const { authedRoute } = await import("../_authed");
    expect(authedRoute.id).toContain("_authed");
  });
});

describe("public routes", () => {
  it("renders sign-in at /sign-in", async () => {
    renderRoute("/sign-in");
    // GoogleAuthScreen.tsx:98 renders "選擇帳號" (Traditional — present in source).
    await waitFor(() => {
      expect(screen.getByText("選擇帳號")).toBeInTheDocument();
    });
  });

  it("guest visiting /welcome is redirected to /sign-in", async () => {
    const { router } = renderRoute("/welcome");
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/sign-in");
    });
  });
});

describe("authed simple routes", () => {
  it("renders home at /home when authed + complete", async () => {
    renderRoute("/home", { seed: "authed-complete" });
    // BottomNav.tsx:55 renders "首页" (Simplified) — match exactly.
    await waitFor(() => {
      expect(screen.getByText("首页")).toBeInTheDocument();
    });
  });

  it("redirects guest /home to /", async () => {
    const { router } = renderRoute("/home");
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
  });

  it("redirects authed-incomplete /home to /welcome", async () => {
    const { router } = renderRoute("/home", { seed: "authed-incomplete" });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/welcome");
    });
  });
});

describe("me routes", () => {
  it("renders my screen at /me", async () => {
    renderRoute("/me", { seed: "authed-complete" });
    await waitFor(() => {
      // MyScreen title and BottomNav both render "我的" (Traditional).
      expect(screen.getAllByText("我的").length).toBeGreaterThan(0);
    });
  });

  it("renders profile view at /me/profile", async () => {
    renderRoute("/me/profile", { seed: "authed-complete" });
    // ProfileScreen.tsx renders "編輯" (Traditional) in the edit button.
    await waitFor(() => {
      expect(screen.queryByText(/編輯/)).not.toBeNull();
    });
  });

  it("cold-load /me/profile/edit redirects to /me/profile", async () => {
    const { router } = renderRoute("/me/profile/edit", { seed: "authed-complete" });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/me/profile");
    });
  });
});

describe("task routes", () => {
  it("renders task detail at /tasks/3", async () => {
    const { router } = renderRoute("/tasks/3", { seed: "authed-complete" });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/tasks/3");
    });
    // TASKS[2].title is "組隊挑戰" (Traditional — present in data.ts).
    await waitFor(() => {
      expect(screen.getByText("組隊挑戰")).toBeInTheDocument();
    });
  });

  it("redirects /tasks/3/start on cold load to /tasks/3", async () => {
    const { router } = renderRoute("/tasks/3/start", { seed: "authed-complete" });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/tasks/3");
    });
  });
});
