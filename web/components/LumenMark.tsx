type LumenMarkProps = {
  size?: number;
  /** "none" = static, "loop" = continuous (hero), "once" = single play */
  animate?: "none" | "loop" | "once";
  /** colour of the solid ("you") square — defaults to the dusk ink */
  solid?: string;
  /** colour of the AI outline square + intersection glow */
  accent?: string;
  className?: string;
  title?: string;
};

/**
 * Lumen mark — two offset rounded squares. The solid square is "you"; the
 * outline square (accent) is the AI; the low-opacity glow where they overlap is
 * Lumen, the space where evaluation happens. Pure CSS, no SVG, so it scales and
 * animates crisply at any size. Geometry is derived from `size` per the brand
 * spec (square 55%, offset 35%, origin 10%, glow 30%).
 */
export default function LumenMark({
  size = 40,
  animate = "none",
  solid = "var(--lm-dusk)",
  accent = "var(--lm-loop)",
  className = "",
  title = "Lumen",
}: LumenMarkProps) {
  const sq = size * 0.55;
  const offset = size * 0.35;
  const origin = size * 0.1;
  const inter = size * 0.3;
  const bw = Math.max(1.5, size * 0.034);
  const br = size * 0.11;
  const shift = size * 0.14;

  const animClass =
    animate === "loop" ? " is-loop" : animate === "once" ? " is-active" : "";

  return (
    <span
      className={`lumen-mark${animClass}${className ? ` ${className}` : ""}`}
      style={
        {
          position: "relative",
          display: "inline-block",
          width: size,
          height: size,
          flexShrink: 0,
          ["--lm-shift" as string]: `${shift}px`,
        } as React.CSSProperties
      }
      role="img"
      aria-label={title}
    >
      <span
        className="lm-inter"
        style={{
          position: "absolute",
          width: inter,
          height: inter,
          top: offset,
          left: offset,
          borderRadius: br * 0.45,
          background: accent,
          opacity: 0.2,
          pointerEvents: "none",
        }}
      />
      <span
        className="lm-you"
        style={{
          position: "absolute",
          width: sq,
          height: sq,
          top: origin,
          left: origin,
          background: solid,
          borderRadius: br,
        }}
      />
      <span
        className="lm-ai"
        style={{
          position: "absolute",
          width: sq,
          height: sq,
          top: offset,
          left: offset,
          border: `${bw}px solid ${accent}`,
          borderRadius: br,
          background: "transparent",
        }}
      />
    </span>
  );
}
