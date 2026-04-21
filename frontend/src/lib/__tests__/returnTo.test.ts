import { describe, expect, it } from "vitest";
import { parseReturnTo } from "../returnTo";

describe("parseReturnTo", () => {
  it.each([
    ["/home"],
    ["/tasks/T1"],
    ["/me/profile"],
    ["/me?x=1&y=2"],
    ["/a/b/c#frag"],
  ])("accepts same-origin path %s", (input) => {
    expect(parseReturnTo(input)).toBe(input);
  });

  it.each([
    ["//evil.com"],
    ["//evil.com/pwn"],
    ["///evil.com"],
    ["https://evil.com"],
    ["http://evil.com/x"],
    ["javascript:alert(1)"],
    ["data:text/html,x"],
    ["/\\evil.com"],
    ["relative"],
    ["./rel"],
    [""],
    ["/"],
  ])("rejects open-redirect vector %s", (input) => {
    expect(parseReturnTo(input)).toBeUndefined();
  });

  it.each([[null], [undefined], [42], [{}], [[]]])(
    "rejects non-string %s",
    (input) => {
      expect(parseReturnTo(input)).toBeUndefined();
    },
  );
});
