import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";

type Props = {
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
  /** "bottom" for sheets that slide up; "center" for dialogs. */
  align?: "center" | "bottom";
  zIndex?: number;
  /** Applied to the inner role=dialog container. */
  style?: CSSProperties;
};

// Backdrop + Escape/click-to-close + role=dialog wrapper. Consumers supply
// the dialog's visual style (background, radius, padding, animation) via
// `style`; Modal only owns the overlay and accessibility wiring.
export default function Modal({
  onClose,
  ariaLabel,
  children,
  align = "center",
  zIndex = 200,
  style,
}: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const bottom = align === "bottom";
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        background: "rgba(20,10,40,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: bottom ? "flex-end" : "center",
        justifyContent: "center",
        padding: bottom ? 0 : 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", ...style }}
      >
        {children}
      </div>
    </div>
  );
}
