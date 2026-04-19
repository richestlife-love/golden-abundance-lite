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
