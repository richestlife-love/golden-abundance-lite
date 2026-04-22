import { fs } from "../utils";
import { useState } from "react";
import FormShell from "../ui/FormShell";
import FieldLabel from "../ui/FieldLabel";
import TextInput from "../ui/TextInput";
import ChipGroup from "../ui/ChipGroup";
import SubmitButton from "../ui/SubmitButton";
import { useTheme } from "../ui/theme";
import { COUNTRIES, COUNTRY_DIAL, DIAL_OPTIONS, REGIONS } from "../lib/regions";
import type { components } from "../api/schema";

type ProfileCreate = components["schemas"]["ProfileCreate"];

// Display-only shape the form reads from `user`/`initial`. The camelCase
// keys are internal to the component — submit emits snake_case
// `ProfileCreate` so the route can thread it straight into the mutation.
type ProfileInput = {
  id?: string;
  email?: string;
  name?: string;
  zhName?: string;
  enName?: string;
  nickname?: string;
  phone?: string;
  phoneCode?: string;
  lineId?: string;
  telegramId?: string;
  country?: string;
  location?: string;
};

type Props = {
  user: ProfileInput | null;
  initial?: ProfileInput | null;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (profile: ProfileCreate) => void | Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
};

export default function ProfileSetupForm({
  user,
  initial,
  onCancel,
  onSubmit,
  title = "完善個人資料",
  subtitle = "初次加入，請填寫基本資訊，稍後可於「我的」中修改",
  submitLabel = "完成註冊",
  isSubmitting = false,
  error = null,
}: Props) {
  const { fg, muted, cardBorder } = useTheme();
  const cardBg = "rgba(255,255,255,0.6)";

  const initEn =
    initial?.enName || ((user?.name || "").match(/[A-Za-z\s]/) ? user?.name || "" : "");
  const initZh =
    initial?.zhName || ((user?.name || "").match(/[\u4e00-\u9fa5]/) ? user?.name || "" : "");
  const [zhName, setZhName] = useState(initZh);
  const [enName, setEnName] = useState(initEn);
  const [nickname, setNickname] = useState(initial?.nickname || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [phoneCode, setPhoneCode] = useState(initial?.phoneCode || "+886");
  const [lineId, setLineId] = useState(initial?.lineId || "");
  const [telegramId, setTelegramId] = useState(initial?.telegramId || "");
  const [country, setCountry] = useState(initial?.country || "");
  const [location, setLocation] = useState(initial?.location || "");

  const regions = country ? REGIONS[country] : [];

  // Reset location when country changes
  const handleCountry = (v: string) => {
    setCountry(v);
    setLocation("");
    if (COUNTRY_DIAL[v]) setPhoneCode(COUNTRY_DIAL[v]);
  };

  const valid =
    zhName.trim() &&
    phone.trim() &&
    country &&
    (typeof location === "string" ? location.trim() : location);
  const card = {
    padding: "14px 14px",
    borderRadius: 16,
    background: cardBg,
    border: cardBorder,
    backdropFilter: "blur(10px)",
  };

  return (
    <FormShell
      title={title}
      subtitle={subtitle}
      onCancel={onCancel}
      footer={
        <>
          {error && (
            <div
              role="alert"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: "rgba(200,60,60,0.12)",
                border: "1px solid rgba(200,60,60,0.35)",
                color: "#a14646",
                fontSize: fs(13),
                marginBottom: 10,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
          <SubmitButton
            label={isSubmitting ? "送出中..." : submitLabel}
            onClick={() =>
              onSubmit({
                zh_name: zhName.trim(),
                en_name: enName.trim() || null,
                nickname: nickname.trim() || null,
                phone: phone.trim(),
                phone_code: phoneCode,
                line_id: lineId.trim() || null,
                telegram_id: telegramId.trim() || null,
                country,
                location,
              })
            }
            disabled={!valid || isSubmitting}
            color="#fec701"
          />
        </>
      }
    >
      {/* Welcome card with avatar */}
      <div
        style={{
          padding: "16px 14px",
          borderRadius: 16,
          background: "rgba(254,199,1,0.18)",
          border: "1px solid rgba(254,199,1,0.35)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--gold-light), var(--gold))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: fs(16),
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(254,199,1,0.35)",
          }}
        >
          {(user?.name || "U").slice(0, 1).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: fs(14), fontWeight: 700, color: fg }}>
            {user?.name || "新志工"}
          </div>
          <div
            style={{
              fontSize: fs(11),
              color: muted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.email}
          </div>
        </div>
      </div>

      <div style={card}>
        <FieldLabel required>中文姓名</FieldLabel>
        <TextInput value={zhName} onChange={setZhName} placeholder="請輸入你的中文姓名" />
      </div>

      <div style={card}>
        <FieldLabel>英文姓名</FieldLabel>
        <div
          style={{
            fontSize: fs(11),
            color: muted,
            marginBottom: 10,
            marginTop: -4,
          }}
        >
          如證件上之拼音 As per NRIC（選填）
        </div>
        <TextInput value={enName} onChange={setEnName} placeholder="e.g. Chia-Yi Lin" />
      </div>

      <div style={card}>
        <FieldLabel>暱稱 Nickname</FieldLabel>
        <div
          style={{
            fontSize: fs(11),
            color: muted,
            marginBottom: 10,
            marginTop: -4,
          }}
        >
          朋友們會這樣稱呼你（選填）
        </div>
        <TextInput value={nickname} onChange={setNickname} placeholder="e.g. 小佳 / Alice Ng" />
      </div>

      <div style={card}>
        <FieldLabel required>聯絡電話</FieldLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
              style={{
                height: 46,
                padding: "0 28px 0 12px",
                borderRadius: 12,
                border: "1px solid rgba(254, 210, 52, 0.4)",
                background: "rgba(255,255,255,0.85)",
                fontSize: fs(14),
                color: "var(--fg)",
                fontFamily: "inherit",
                outline: "none",
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            >
              {DIAL_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.label}
                </option>
              ))}
            </select>
            <span
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                fontSize: fs(10),
                color: "var(--muted)",
              }}
            >
              ▾
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TextInput value={phone} onChange={setPhone} placeholder="912-345-678" />
          </div>
        </div>
      </div>

      <div style={card}>
        <FieldLabel>LINE ID</FieldLabel>
        <div
          style={{
            fontSize: fs(11),
            color: muted,
            marginBottom: 10,
            marginTop: -4,
          }}
        >
          方便活動聯繫（選填）
        </div>
        <TextInput value={lineId} onChange={setLineId} placeholder="@your-line-id" />
      </div>

      <div style={card}>
        <FieldLabel>Telegram ID</FieldLabel>
        <div
          style={{
            fontSize: fs(11),
            color: muted,
            marginBottom: 10,
            marginTop: -4,
          }}
        >
          方便活動聯繫（選填）
        </div>
        <TextInput value={telegramId} onChange={setTelegramId} placeholder="@your-telegram-id" />
      </div>

      <div style={card}>
        <FieldLabel required>所在國家/地區</FieldLabel>
        <ChipGroup options={COUNTRIES} value={country} onChange={handleCountry} multi={false} />
      </div>

      {country && (
        <div style={card}>
          <FieldLabel required>所在城市/地區</FieldLabel>
          <div
            style={{
              fontSize: fs(11),
              color: muted,
              marginBottom: 10,
              marginTop: -4,
            }}
          >
            {country === "其他" ? "請輸入你的國家與城市" : "請選擇主要活動地區"}
          </div>
          {country === "其他" ? (
            <TextInput
              value={location}
              onChange={setLocation}
              placeholder="e.g. Canada, Vancouver"
            />
          ) : (
            <ChipGroup options={regions} value={location} onChange={setLocation} multi={false} />
          )}
        </div>
      )}
    </FormShell>
  );
}
