import { fs } from "../utils";
import { useState } from "react";
import GoogleLogo from "../ui/GoogleLogo";
import GoogleSpinner from "../ui/GoogleSpinner";
import { DEMO_ACCOUNTS } from "../dev/demo-accounts";

export interface GoogleAuthScreenProps {
  onCancel: () => void;
  onSelectAccount: (email: string) => Promise<void>;
}

// Visual palette for the demo account chips. Preserves the gradient
// avatar look of the prototype even though the backend doesn't carry
// per-user colors for seeded demo users.
const ACCOUNT_COLORS = ["#fed234", "#fec701", "#8AD4B0", "#B8A4E3", "#FFD6A8", "#C4B0E8"];

export default function GoogleAuthScreen({ onCancel, onSelectAccount }: GoogleAuthScreenProps) {
  const [pending, setPending] = useState<{ email: string; label: string; color: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const pick = async (email: string, label: string, color: string) => {
    setPending({ email, label, color });
    setError(null);
    try {
      await onSelectAccount(email);
    } catch (e) {
      setError(e instanceof Error ? e.message : "登入失敗");
      setPending(null);
    }
  };

  const stage = pending ? "loading" : "chooser";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        color: "var(--fg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "8px 0 24px",
          overflow: "hidden",
        }}
      >
        {/* Google header */}
        <div
          style={{
            padding: "16px 24px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "fadeIn 0.4s ease",
          }}
        >
          <GoogleLogo />
          {stage === "chooser" && (
            <button
              type="button"
              aria-label="關閉"
              onClick={onCancel}
              style={{
                background: "none",
                border: "none",
                padding: 8,
                margin: -8,
                cursor: "pointer",
                color: "#5F6368",
                fontSize: fs(20),
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>

        {stage === "chooser" && (
          <>
            <div style={{ padding: "24px 28px 0", animation: "fadeInUp 0.4s ease" }}>
              <h1
                style={{
                  fontFamily: '"Google Sans", "Noto Sans TC", sans-serif',
                  fontSize: fs(24),
                  fontWeight: 400,
                  color: "#202124",
                  margin: "0 0 6px",
                  lineHeight: 1.3,
                }}
              >
                選擇帳號
              </h1>
              <p
                style={{
                  fontSize: fs(14),
                  color: "#5F6368",
                  margin: "0 0 4px",
                  fontFamily: '"Google Sans", "Noto Sans TC", sans-serif',
                }}
              >
                繼續前往 <span style={{ color: "#1A73E8" }}>金富有志工</span>
              </p>
            </div>

            <div
              style={{
                margin: "28px 16px 0",
                borderRadius: 8,
                border: "1px solid #DADCE0",
                overflow: "hidden",
                animation: "fadeInUp 0.5s 0.1s ease backwards",
              }}
            >
              {DEMO_ACCOUNTS.map((acct, i) => {
                const color = ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
                return (
                  <button
                    key={acct.email}
                    type="button"
                    aria-label={`使用 ${acct.label} 登入`}
                    onClick={() => pick(acct.email, acct.label, color)}
                    style={{
                      color: "inherit",
                      font: "inherit",
                      textAlign: "left",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "14px 16px",
                      cursor: "pointer",
                      border: "none",
                      borderBottom: i < DEMO_ACCOUNTS.length - 1 ? "1px solid #DADCE0" : "none",
                      background: "transparent",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8F9FA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${color}, ${color}DD)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: fs(14),
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {acct.label[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: fs(14), color: "#202124", fontWeight: 500 }}>
                        {acct.label}
                      </div>
                      <div
                        style={{
                          fontSize: fs(12),
                          color: "#5F6368",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {acct.email}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div
                style={{
                  margin: "12px 28px 0",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #F2B8B5",
                  background: "#FCE8E6",
                  color: "#C5221F",
                  fontSize: fs(13),
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                padding: "20px 28px 0",
                fontSize: fs(12),
                color: "#5F6368",
                lineHeight: 1.5,
                animation: "fadeIn 0.6s 0.2s ease backwards",
              }}
            >
              如要繼續，Google
              會將您的姓名、電子郵件地址、語言偏好設定和大頭貼分享給「金富有志工」。使用此應用程式前，請先詳閱「金富有志工」的
              <span style={{ color: "#1A73E8" }}>隱私權政策</span>和
              <span style={{ color: "#1A73E8" }}>服務條款</span>。
            </div>
          </>
        )}

        {stage === "loading" && pending && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 32px",
              gap: 20,
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${pending.color}, ${pending.color}DD)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: fs(22),
                fontWeight: 600,
              }}
            >
              {pending.label[0]}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: fs(14), color: "#5F6368", marginBottom: 4 }}>正在登入…</div>
              <div style={{ fontSize: fs(13), color: "#202124" }}>{pending.email}</div>
            </div>
            <GoogleSpinner />
          </div>
        )}
      </div>
    </div>
  );
}
