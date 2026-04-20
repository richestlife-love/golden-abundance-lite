import type { SVGProps } from "react";

// Brand logos for the ShareSheet messenger picker. Each is drawn to sit
// inside a colored chip (the chip carries the brand color; the glyph is
// white). Kept simple and recognizable rather than pixel-perfect — the
// hosting chip supplies the brand color and context.

type LogoProps = Omit<SVGProps<SVGSVGElement>, "width" | "height" | "viewBox"> & {
  size?: number | string;
};

const base = (size: LogoProps["size"]) => ({
  width: size ?? "1em",
  height: size ?? "1em",
  viewBox: "0 0 24 24",
  fill: "currentColor",
});

export const LineLogo = ({ size, ...rest }: LogoProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3c5.5 0 10 3.6 10 8 0 3-2 5.6-5.2 7.2-.4.2-1 .5-1.4.8-.6.4-1 .9-1.2 1.4l-.4 1-.8-.2c-.3-.1-.6-.3-.8-.6-.3-.4-.3-.7-.1-1.2l.3-.6c-4.4-.6-7.7-3.7-7.7-7.8 0-4.4 4.5-8 9.3-8zm-4 6.2c-.3 0-.5.2-.5.5v4.6c0 .3.2.5.5.5s.5-.2.5-.5V9.7c0-.3-.2-.5-.5-.5zm2.5 0c-.3 0-.5.2-.5.5v4.6c0 .3.1.5.4.5h2.8c.3 0 .5-.2.5-.5s-.2-.5-.5-.5H11V9.7c0-.3-.2-.5-.5-.5zm6 0c-.3 0-.5.2-.5.5v4.6c0 .3.2.5.5.5s.5-.2.5-.5V9.7c0-.3-.2-.5-.5-.5zm-3.4 0c-.3 0-.5.2-.5.5v4.6c0 .3.2.5.5.5s.5-.2.5-.5v-3l2.2 3.3c.1.1.2.2.4.2.3 0 .5-.2.5-.5V9.7c0-.3-.2-.5-.5-.5s-.5.2-.5.5v3L12.5 9.4c-.1-.1-.2-.2-.4-.2z" />
  </svg>
);

export const WhatsappLogo = ({ size, ...rest }: LogoProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 2.2a9.8 9.8 0 0 0-8.4 14.9L2 22l5.1-1.5A9.8 9.8 0 1 0 12 2.2zm0 17.9a8 8 0 0 1-4.1-1.1l-.3-.2-3 .9.9-3-.2-.3a8 8 0 1 1 6.7 3.7zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1c-1.8-.9-3-2-3.7-3.6-.2-.4.2-.4.6-1.2.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.4-.6-.4H8c-.2 0-.5.1-.7.4s-1 1-1 2.4 1 2.8 1.1 3c.1.2 2 3 4.8 4.2 1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.3s.2-1.2.2-1.3c-.1-.1-.2-.1-.4-.2z" />
  </svg>
);

export const MessengerLogo = ({ size, ...rest }: LogoProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 2C6.5 2 2 6.1 2 11.2c0 2.9 1.5 5.5 3.8 7.2V22l3.5-1.9c.9.3 1.9.4 2.9.4 5.5 0 10-4.1 10-9.2S17.5 2 12 2zm1 12.4L10.5 12l-4.7 2.6 5.1-5.4 2.6 2.6 4.6-2.6z" />
  </svg>
);

export const InstagramLogo = ({ size, ...rest }: LogoProps) => (
  <svg
    {...base(size)}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" />
  </svg>
);

export const WeChatLogo = ({ size, ...rest }: LogoProps) => (
  <svg {...base(size)} {...rest}>
    <path d="M9 4C5 4 2 6.6 2 10c0 1.9 1 3.6 2.6 4.8L4 17l2.7-1.4c.7.2 1.5.3 2.3.3h.5a6 6 0 0 1-.1-1.2c0-3.4 3-6 6.8-6h.6C16.1 5.9 12.8 4 9 4zM6.8 9.3a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8zM11.2 9.3a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8z" />
    <path d="M22 14.6c0-2.8-2.7-5-6-5s-6 2.2-6 5 2.7 5 6 5c.7 0 1.3-.1 1.9-.2L20 20.5l-.4-2c1.5-.9 2.4-2.4 2.4-3.9zm-7.7-1a.7.7 0 1 1 0-1.5.7.7 0 0 1 0 1.5zm3.5 0a.7.7 0 1 1 0-1.5.7.7 0 0 1 0 1.5z" />
  </svg>
);

export const SmsLogo = ({ size, ...rest }: LogoProps) => (
  <svg
    {...base(size)}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4 4v-4H6a2 2 0 0 1-2-2z" />
    <circle cx="9" cy="10.5" r="0.9" fill="currentColor" />
    <circle cx="12" cy="10.5" r="0.9" fill="currentColor" />
    <circle cx="15" cy="10.5" r="0.9" fill="currentColor" />
  </svg>
);
