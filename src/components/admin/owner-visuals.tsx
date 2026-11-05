import type { MixSlice } from "@/lib/owner-home";

const sparkStroke = {
  blue: "#367AF4",
  red: "#B91C1C",
  green: "#15803D",
  gray: "#9CA3AF",
} as const;

export function Sparkline({
  values,
  tone,
  fill = false,
}: {
  values: number[];
  tone: keyof typeof sparkStroke;
  fill?: boolean;
}) {
  if (values.length < 2) return <span className="mt-3 block h-7" />;
  const width = 140;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = 4 + (1 - (value - min) / span) * (height - 8);
    return [round(x), round(y)] as const;
  });
  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  return (
    <svg className="mt-3 block h-7 w-full max-w-[140px]" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {fill && <polyline points={area} fill="rgba(54,122,244,0.08)" stroke="none" />}
      <polyline points={line} fill="none" stroke={sparkStroke[tone]} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function RadialMix({ slices, total }: { slices: MixSlice[]; total: string }) {
  const ticks = 72;
  const counts = shareTicks(slices.map((slice) => slice.amount), ticks);
  const colors: string[] = [];
  slices.forEach((slice, index) => {
    for (let step = 0; step < (counts[index] ?? 0); step += 1) colors.push(slice.color);
  });
  while (colors.length < ticks) colors.push("#E5E7EB");
  const lines = colors.map((color, index) => {
    const angle = (index / ticks) * Math.PI * 2 - Math.PI / 2;
    return {
      color,
      x1: round(110 + Math.cos(angle) * 78),
      y1: round(110 + Math.sin(angle) * 78),
      x2: round(110 + Math.cos(angle) * 98),
      y2: round(110 + Math.sin(angle) * 98),
    };
  });
  return (
    <div className="flex flex-col items-center px-5 pb-4 pt-5">
      <div className="relative h-[220px] w-[220px]">
        <svg viewBox="0 0 220 220" className="h-[220px] w-[220px]" role="img" aria-label={`Revenue by job type ${total}`}>
          {lines.map((line) => (
            <line key={`${line.x1}-${line.y1}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={line.color} strokeWidth="2.25" strokeLinecap="round" />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs font-medium text-[#6b7280]">Revenue by job type</p>
          <p className="mt-1 font-display text-[32px] font-light leading-none tracking-[-0.04em] text-ink">{total}</p>
        </div>
      </div>
      <ul className="mt-2 w-full">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center gap-2 border-b border-dotted border-[#e2e5eb] py-1.5 text-[12.5px] text-[#6b7280] last:border-b-0">
            <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: slice.color }} />
            <span>{slice.label}</span>
            <span className="ml-auto font-medium text-ink tabular-nums">{slice.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SegmentMeter({ within, total }: { within: number; total: number }) {
  const marks = 40;
  const on = total === 0 ? 0 : Math.round(marks * (within / total));
  return (
    <div className="mt-4 flex h-9 gap-0.5" aria-hidden="true">
      {Array.from({ length: marks }, (_, index) => (
        <span key={index} className={`min-w-0 flex-1 rounded-[1px] ${index < on ? "bg-[#367af4]" : "bg-[#e5e7eb]"}`} />
      ))}
    </div>
  );
}

function shareTicks(weights: number[], target: number) {
  const sum = weights.reduce((total, value) => total + value, 0);
  if (sum <= 0) return weights.map(() => 0);
  const raw = weights.map((weight) => (weight / sum) * target);
  const floors = raw.map((value) => Math.floor(value));
  let left = target - floors.reduce((total, value) => total + value, 0);
  const order = raw
    .map((value, index) => ({ index, frac: value - floors[index] }))
    .sort((a, b) => b.frac - a.frac);
  for (const row of order) {
    if (left <= 0) break;
    floors[row.index] += 1;
    left -= 1;
  }
  return floors;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
