import { createElement } from "react";
import type { ReactElement } from "react";
import {
  CircleGlyphXL,
  CircleIcon,
  FlowerGlyphXL,
  FlowerIcon,
  SparkleGlyphXL,
  SparkleIcon,
} from "./Icon";

// Canonical tag values emitted by the backend. "社区" is simplified — the
// UI displays it as traditional "社區" via taskTagLabel.
const EXPLORE = "探索";
const COMMUNITY = "社区";

type TagIconProps = { tag: string | null | undefined; size?: number };

export function TaskTagIcon({ tag, size }: TagIconProps): ReactElement {
  const Icon = tag === EXPLORE ? SparkleIcon : tag === COMMUNITY ? CircleIcon : FlowerIcon;
  return createElement(Icon, { size });
}

export function TaskTagWatermark({ tag, size }: TagIconProps): ReactElement {
  const Icon = tag === EXPLORE ? SparkleGlyphXL : tag === COMMUNITY ? CircleGlyphXL : FlowerGlyphXL;
  return createElement(Icon, { size });
}

export function taskTagLabel(tag: string | null | undefined): string {
  if (tag === COMMUNITY) return "社區";
  return tag ?? "";
}
