import type { Shape } from "@/lib/shapes";

const COLORS: Record<Shape, string> = {
  Explorer: "var(--lm-depth)",
  Thinker: "var(--lm-depth)",
  Maker: "var(--lm-loop)",
  Delegator: "var(--lm-drift)",
  Balanced: "var(--lm-secondary)",
};

export default function ShapeBadge({ shape }: { shape: Shape }) {
  const color = COLORS[shape];
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-[6px]"
      style={{ background: `${color}14`, color }}
    >
      {shape}
    </span>
  );
}
