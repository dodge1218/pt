"use client";

interface ThinkingRadarProps {
  breadthScore?: number | null;
  depthScore?: number | null;
  synthesisScore?: number | null;
  velocityScore?: number | null;
  strategicAlignment?: number | null;
  size?: number;
  className?: string;
  overlay?: {
    breadthScore?: number | null;
    depthScore?: number | null;
    synthesisScore?: number | null;
    velocityScore?: number | null;
    strategicAlignment?: number | null;
  };
}

const AXES = [
  { key: "breadthScore", label: "Breadth" },
  { key: "depthScore", label: "Depth" },
  { key: "synthesisScore", label: "Synthesis" },
  { key: "velocityScore", label: "Velocity" },
  { key: "strategicAlignment", label: "Strategy" },
] as const;

export function ThinkingRadar({
  breadthScore,
  depthScore,
  synthesisScore,
  velocityScore,
  strategicAlignment,
  size = 200,
  className,
  overlay,
}: ThinkingRadarProps) {
  const scores: Record<string, number> = {
    breadthScore: breadthScore ?? 0,
    depthScore: depthScore ?? 0,
    synthesisScore: synthesisScore ?? 0,
    velocityScore: velocityScore ?? 0,
    strategicAlignment: strategicAlignment ?? 0,
  };

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  function getPoint(index: number, value: number) {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    return {
      x: cx + r * value * Math.cos(angle),
      y: cy + r * value * Math.sin(angle),
    };
  }

  function polygon(vals: Record<string, number>) {
    return AXES.map((a, i) => {
      const p = getPoint(i, vals[a.key] ?? 0);
      return `${p.x},${p.y}`;
    }).join(" ");
  }

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      {/* Grid rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={AXES.map((_, i) => {
            const p = getPoint(i, ring);
            return `${p.x},${p.y}`;
          }).join(" ")}
          fill="none"
          stroke="hsl(0 0% 20%)"
          strokeWidth="0.5"
        />
      ))}
      {/* Axes */}
      {AXES.map((_, i) => {
        const p = getPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(0 0% 20%)" strokeWidth="0.5" />;
      })}
      {/* Overlay polygon */}
      {overlay && (
        <polygon
          points={polygon({
            breadthScore: overlay.breadthScore ?? 0,
            depthScore: overlay.depthScore ?? 0,
            synthesisScore: overlay.synthesisScore ?? 0,
            velocityScore: overlay.velocityScore ?? 0,
            strategicAlignment: overlay.strategicAlignment ?? 0,
          })}
          fill="hsla(160, 84%, 39%, 0.15)"
          stroke="hsl(160 84% 39%)"
          strokeWidth="1.5"
        />
      )}
      {/* Main polygon */}
      <polygon
        points={polygon(scores)}
        fill="hsla(221, 83%, 53%, 0.2)"
        stroke="hsl(221 83% 53%)"
        strokeWidth="2"
      />
      {/* Labels */}
      {AXES.map((a, i) => {
        const p = getPoint(i, 1.2);
        return (
          <text
            key={a.key}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(0 0% 64%)"
            fontSize={size * 0.055}
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}
