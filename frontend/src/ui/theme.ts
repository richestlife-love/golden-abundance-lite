// Shared pointers into the CSS custom properties defined in GlobalStyles.
// Screens destructure from useTheme() instead of re-declaring the same
// `const bg = "var(--bg)"` block in every file.
export const theme = {
  bg: "var(--bg)",
  fg: "var(--fg)",
  muted: "var(--muted)",
  cardBg: "var(--card)",
  cardBorder: "1px solid var(--card-strong)",
} as const;

export type Theme = typeof theme;

export function useTheme(): Theme {
  return theme;
}
