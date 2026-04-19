export default function PaperBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--bg)",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* warm radial wash — uneven paper illumination */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255,236,170,0.55) 0%, transparent 55%), radial-gradient(ellipse 90% 60% at 85% 100%, rgba(255,215,140,0.35) 0%, transparent 60%), radial-gradient(ellipse 70% 50% at 10% 90%, rgba(255,224,170,0.25) 0%, transparent 60%)",
        }}
      />
      {/* fiber grain — SVG turbulence, tinted warm, multiply blend */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.22,
          mixBlendMode: "multiply",
        }}
      >
        <filter id="paperGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
          <feColorMatrix
            values="0 0 0 0 0.40
                    0 0 0 0 0.31
                    0 0 0 0 0.05
                    0 0 0 0.55 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#paperGrain)" />
      </svg>
      {/* coarse fibre streaks — lower-frequency turbulence, very faint */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.12,
          mixBlendMode: "multiply",
        }}
      >
        <filter id="paperFibre">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.9" numOctaves="1" seed="3" />
          <feColorMatrix
            values="0 0 0 0 0.30
                    0 0 0 0 0.22
                    0 0 0 0 0.02
                    0 0 0 0.6 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#paperFibre)" />
      </svg>
      {/* soft vignette — edges fall off into warm shadow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 100% 85% at 50% 50%, transparent 55%, rgba(120,85,10,0.12) 100%)",
        }}
      />
    </div>
  );
}
