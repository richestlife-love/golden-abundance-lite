/**
 * Parse a user-supplied `returnTo` query param into a safe same-origin path,
 * or `undefined` if it's not safe to use.
 *
 * Open-redirect hardening — applied wherever we take `?returnTo=…` from a URL
 * (the OAuth callback, the sign-in page) before feeding it to the router.
 *
 * Accepts: a path starting with exactly one `/` followed by a non-slash,
 * non-backslash character (so `/home`, `/tasks/T1?x=y`, `/a#frag` pass).
 *
 * Rejects: protocol-relative URLs (`//evil.com`), absolute URLs (`https:…`,
 * `javascript:…`, `data:…`), paths that open with `\` (some parsers
 * normalise these to `//`), relative paths without a leading slash, the
 * bare `/` (no useful return target), non-strings, and empty strings.
 */
export function parseReturnTo(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  return /^\/[^/\\]/.test(raw) ? raw : undefined;
}
