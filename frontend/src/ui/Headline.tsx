import { fs } from "../utils";

type Props = {
  text: string;
  fontSize: number;
};

export default function Headline({ text, fontSize }: Props) {
  return (
    <div
      style={{
        textAlign: "center",
        lineHeight: 1,
        fontSize: fs(fontSize),
        fontWeight: 900,
        letterSpacing: 2,
        fontFamily: "var(--font-sans)",
        background: "linear-gradient(180deg, #cb9f01 0%, #987701 55%, #655001 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        filter: "drop-shadow(0 2px 4px rgba(254,199,1,0.45))",
        color: "rgb(203, 159, 1)",
      }}
    >
      {text}
    </div>
  );
}
