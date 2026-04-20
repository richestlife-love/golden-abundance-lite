import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  // Node 22+ ships an experimental `localStorage` that shadows jsdom's
  // implementation and lacks a `.clear()` method. Fall back to manual wipe
  // so token state never bleeds between tests regardless of which object
  // is bound to `localStorage`.
  const ls = window.localStorage;
  if (typeof ls?.clear === "function") {
    ls.clear();
  } else if (ls) {
    for (const key of Object.keys(ls)) {
      delete (ls as Record<string, unknown>)[key];
    }
  }
});
afterAll(() => server.close());
