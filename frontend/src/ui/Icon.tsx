import type { SVGProps } from "react";

// Outlined 24x24 icon set — one visual vocabulary for the whole app.
// Line width and cap style match BottomNav so nav and inline icons read
// as the same family. Fills are reserved for the Star because a hollow
// star reads as "unearned" in gamified UI and would mislead users.

type IconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height" | "viewBox"> & {
  /** Any CSS length; defaults to 1em so the icon scales with font-size. */
  size?: number | string;
};

const baseProps = (size: IconProps["size"]) => ({
  width: size ?? "1em",
  height: size ?? "1em",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const StarIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} fill="currentColor" stroke="none" {...rest}>
    <path d="M12 2.5 14.6 9l6.9.5-5.25 4.5L17.9 21 12 17.3 6.1 21l1.65-7L2.5 9.5 9.4 9z" />
  </svg>
);

export const CheckIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M4 12.5 9 17.5 20 6.5" />
  </svg>
);

export const CrossIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M6 6 18 18 M18 6 6 18" />
  </svg>
);

export const LockIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </svg>
);

export const GiftIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <rect x="3.5" y="9" width="17" height="12" rx="1.5" />
    <path d="M3.5 13h17" />
    <path d="M12 9v12" />
    <path d="M12 9s-3 0-4.5-1.5a2 2 0 0 1 2.8-2.8C11.8 6.2 12 9 12 9z" />
    <path d="M12 9s3 0 4.5-1.5a2 2 0 0 0-2.8-2.8C12.2 6.2 12 9 12 9z" />
  </svg>
);

export const ClockIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 8.5V13l3 2" />
    <path d="M10 3h4" />
  </svg>
);

export const MedalIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M7 3l2.5 6M17 3l-2.5 6" />
    <circle cx="12" cy="15" r="6" />
    <path d="M10 13.5 12 15.5 14.5 13" />
  </svg>
);

export const BabyIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="12" cy="9" r="5" />
    <path d="M9.5 9.5h.01M14.5 9.5h.01" />
    <path d="M10 12c.7.6 1.3.9 2 .9s1.3-.3 2-.9" />
    <path d="M9 20c0-2.5 1.5-4 3-4s3 1.5 3 4" />
    <path d="M12 14v2" />
  </svg>
);

export const CrownIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M3 9l3 7h12l3-7-4.5 2.5L12 5l-4.5 6.5z" />
    <path d="M6 19h12" />
  </svg>
);

export const SparkleIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} fill="currentColor" stroke="none" {...rest}>
    <path d="M12 2 13.2 9.3 20.5 10.5 13.2 11.7 12 19 10.8 11.7 3.5 10.5 10.8 9.3z" />
  </svg>
);

export const CircleIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

export const FlowerIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 4.5a3 3 0 0 1 0 5M12 14.5a3 3 0 0 1 0 5M4.5 12a3 3 0 0 1 5 0M14.5 12a3 3 0 0 1 5 0" />
  </svg>
);

export const ChevronLeftIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const ChevronRightIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export const MailIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="M4 7.5l8 6 8-6" />
  </svg>
);

export const SearchIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);

export const DoorIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M6 3h9a1 1 0 0 1 1 1v17H6z" />
    <path d="M4 21h18" />
    <circle cx="13" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const TrophyIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
    <path d="M7 6H4v2a3 3 0 0 0 3 3" />
    <path d="M17 6h3v2a3 3 0 0 1-3 3" />
    <path d="M10 15h4v3h-4z" />
    <path d="M8 21h8" />
  </svg>
);

export const ShareIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    <path d="M16 7l-4-4-4 4" />
    <path d="M12 3v13" />
  </svg>
);

export const HourglassIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M6 3h12M6 21h12" />
    <path d="M7 3c0 4 4 6 5 9 1-3 5-5 5-9" />
    <path d="M7 21c0-4 4-6 5-9 1 3 5 5 5 9" />
  </svg>
);

export const FlagIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M5 3v18" />
    <path d="M5 4h11l-2 3.5L16 11H5" />
  </svg>
);

export const PencilIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M4 20l4-1 10.5-10.5a2 2 0 0 0 0-2.8l-.7-.7a2 2 0 0 0-2.8 0L4.5 15.5z" />
    <path d="M14 6.5l3 3" />
  </svg>
);

export const PartyPopperIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M5 20l5.5-14 8 8z" />
    <path d="M13 3.5c.5 1 1.5 1.5 2.5 1.5M18.5 5c0 1 .5 2 1.5 2.5M20.5 10c-1 0-2 .5-2.5 1.5M16 14c0 1 .5 2 1.5 2.5" />
  </svg>
);

export const LinkIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </svg>
);

export const ClipboardIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4h6v3H9z" />
  </svg>
);

export const ChatBubbleIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4 4v-4H6a2 2 0 0 1-2-2z" />
  </svg>
);

export const GlobeIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a13 13 0 0 1 0 18a13 13 0 0 1 0-18z" />
  </svg>
);

export const UsersIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="10" cy="7" r="3.5" />
    <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M17 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const UserIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export const PhoneIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <path d="M5 4h3l2 5-2.5 1.5a12 12 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </svg>
);

export const AtIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} {...rest}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M15.5 12v2a2.5 2.5 0 0 0 5 0v-2" />
  </svg>
);

export const UpArrowIcon = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} fill="currentColor" stroke="none" {...rest}>
    <path d="M12 5l7 10H5z" />
  </svg>
);

// --- Tag watermark glyphs for TaskDetailScreen ---
// Rendered at large sizes (200+px) as background decoration. Stroke-based,
// scales without pixelation.
export const SparkleGlyphXL = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} fill="currentColor" stroke="none" {...rest}>
    <path d="M12 2 L13.2 10.2 L21.5 11.5 L13.2 12.8 L12 22 L10.8 12.8 L2.5 11.5 L10.8 10.2 Z" />
  </svg>
);

export const CircleGlyphXL = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} strokeWidth={1.5} {...rest}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
  </svg>
);

export const FlowerGlyphXL = ({ size, ...rest }: IconProps) => (
  <svg {...baseProps(size)} strokeWidth={1.4} {...rest}>
    <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
    <path d="M12 3a3 3 0 0 1 0 6M12 15a3 3 0 0 1 0 6M3 12a3 3 0 0 1 6 0M15 12a3 3 0 0 1 6 0" />
    <path d="M6 6a3 3 0 0 1 4 4M18 6a3 3 0 0 0-4 4M6 18a3 3 0 0 0 4-4M18 18a3 3 0 0 1-4-4" />
  </svg>
);
