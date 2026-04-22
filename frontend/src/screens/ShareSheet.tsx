import { fs } from "../utils";
import { useEffect, useRef } from "react";
import type { components } from "../api/schema";
import type { ComponentType, SVGProps } from "react";
import Modal from "../ui/Modal";
import { useTheme } from "../ui/theme";
import { CheckIcon, ClipboardIcon } from "../ui/Icon";
import {
  InstagramLogo,
  LineLogo,
  MessengerLogo,
  SmsLogo,
  WeChatLogo,
  WhatsappLogo,
} from "../ui/BrandLogos";

type Team = components["schemas"]["Team"];

type Props = {
  team: Team;
  message: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
};

type LogoProps = Omit<SVGProps<SVGSVGElement>, "width" | "height" | "viewBox"> & {
  size?: number | string;
};
type LogoComponent = ComponentType<LogoProps>;

export default function ShareSheet({ team, message, copied, onCopy, onClose }: Props) {
  const { fg, muted } = useTheme();
  const apps: { key: string; label: string; bg: string; Logo: LogoComponent }[] = [
    { key: "line", label: "LINE", bg: "#06C755", Logo: LineLogo },
    { key: "whatsapp", label: "WhatsApp", bg: "#25D366", Logo: WhatsappLogo },
    {
      key: "messenger",
      label: "Messenger",
      bg: "linear-gradient(135deg, #0078FF, #9745FF)",
      Logo: MessengerLogo,
    },
    {
      key: "ig",
      label: "Instagram",
      bg: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)",
      Logo: InstagramLogo,
    },
    { key: "wechat", label: "微信", bg: "#07C160", Logo: WeChatLogo },
    { key: "sms", label: "訊息", bg: "#34D399", Logo: SmsLogo },
  ];

  const sheetBg = "#FFFFFF";
  const previewBg = "rgba(254,210,52,0.15)";

  const copyButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    copyButtonRef.current?.focus();
  }, []);

  return (
    <Modal
      onClose={onClose}
      ariaLabel="分享團隊邀請"
      align="bottom"
      style={{
        maxWidth: 440,
        background: sheetBg,
        borderRadius: "22px 22px 0 0",
        padding: "12px 18px 22px",
        boxShadow: "0 -12px 40px rgba(0,0,0,0.25)",
        animation: "slideUp 0.28s ease-out",
      }}
    >
        {/* Grab handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBottom: 8,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              background: "rgba(40,30,70,0.2)",
            }}
          />
        </div>

        <div style={{ fontSize: fs(16), fontWeight: 800, color: fg, marginBottom: 2 }}>
          分享團隊邀請
        </div>
        <div style={{ fontSize: fs(12), color: muted, marginBottom: 14 }}>
          編號 {team.id}·將下列訊息分享到聊天
        </div>

        {/* Message preview */}
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            background: previewBg,
            border: "1px solid rgba(254,210,52,0.25)",
            fontSize: fs(12.5),
            lineHeight: 1.6,
            color: fg,
            whiteSpace: "pre-wrap",
            maxHeight: 160,
            overflowY: "auto",
            marginBottom: 16,
          }}
        >
          {message}
        </div>

        {/* Messenger apps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {apps.map((a) => {
            const Logo = a.Logo;
            return (
              <button
                key={a.key}
                type="button"
                aria-label={`分享到 ${a.label}`}
                onClick={onCopy}
                title={`分享到 ${a.label}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 2px",
                  borderRadius: 12,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: a.bg,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.12)",
                  }}
                >
                  <Logo size={24} />
                </div>
                <div
                  style={{
                    fontSize: fs(10.5),
                    color: fg,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  {a.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Copy + close row */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            ref={copyButtonRef}
            type="button"
            onClick={onCopy}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: copied
                ? "linear-gradient(135deg, #7FCFA3, #5BAE85)"
                : "linear-gradient(135deg, var(--gold-light), var(--gold))",
              color: "#fff",
              fontSize: fs(13),
              fontWeight: 800,
              fontFamily: "inherit",
              transition: "background 0.25s",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {copied ? <CheckIcon size={14} /> : <ClipboardIcon size={14} />}
            {copied ? "已複製到剪貼簿" : "複製訊息"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: "1px solid rgba(254,210,52,0.35)",
              background: "transparent",
              cursor: "pointer",
              color: muted,
              fontSize: fs(13),
              fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            關閉
          </button>
        </div>
    </Modal>
  );
}
