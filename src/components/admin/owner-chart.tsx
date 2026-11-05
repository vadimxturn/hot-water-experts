"use client";

import { useState } from "react";
import type { ChartModel } from "@/lib/owner-home";

export function OwnerChart({ charts }: { charts: ChartModel[] }) {
  const [active, setActive] = useState(charts[0]?.id ?? "revenue");
  const chart = charts.find((item) => item.id === active) ?? charts[0];
  if (!chart) return null;
  return (
    <section className="rounded-[14px] border border-[#eceef2] bg-white px-5 py-5 sm:px-6 sm:py-[22px]">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Chart">
        {charts.map((item) => {
          const on = item.id === chart.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={on}
              className={`inline-flex h-[30px] items-center rounded-full border border-[#e2e5eb] px-3 text-[12.5px] font-medium ${on ? "bg-[#f7f8fa] text-ink" : "bg-white text-[#6b7280]"}`}
              onClick={() => setActive(item.id)}
            >
              {item.tab}
            </button>
          );
        })}
      </div>
      <div className="mt-[18px] flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-[40px] font-light leading-none tracking-[-0.04em] text-ink">{chart.headline}</p>
          <p className="mt-1.5 text-[13px] text-[#6b7280]">{chart.caption}</p>
        </div>
        {chart.trend && <TrendMark trend={chart.trend} />}
      </div>
      <ChartSvg chart={chart} />
      <div className="mt-2 flex gap-[18px] text-xs text-[#6b7280]">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-0.5 w-4 bg-[#367af4]" />
          {chart.primaryName}
        </span>
        {chart.secondaryName && (
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block w-4 border-t-2 border-dashed border-[#9ca3af]" />
            {chart.secondaryName}
          </span>
        )}
      </div>
    </section>
  );
}

function TrendMark({ trend }: { trend: { label: string; tone: "up" | "down" | "flat" } }) {
  const up = trend.tone === "up";
  const down = trend.tone === "down";
  const color = up ? "text-[#15803d]" : down ? "text-[#b91c1c]" : "text-[#6b7280]";
  const bubble = up ? "bg-[#ecfdf3] text-[#15803d]" : down ? "bg-[#fef2f2] text-[#b91c1c]" : "bg-[#f7f8fa] text-[#6b7280]";
  const mark = up ? "↑" : down ? "↓" : "·";
  return (
    <p className={`flex items-center gap-1.5 text-[12.5px] font-medium ${color}`}>
      <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${bubble}`}>{mark}</span>
      {trend.label}
    </p>
  );
}

function ChartSvg({ chart }: { chart: ChartModel }) {
  const width = 640;
  const height = 220;
  const left = 44;
  const right = 628;
  const top = 16;
  const bottom = 188;
  const plot = (values: number[]) =>
    values.map((value, index) => {
      const x = values.length <= 1 ? (left + right) / 2 : left + (index / (values.length - 1)) * (right - left);
      const y = bottom - (Math.max(0, value) / chart.yMax) * (bottom - top);
      return [x, y] as const;
    });
  const primary = plot(chart.primary);
  const secondary = chart.secondary ? plot(chart.secondary) : [];
  const primaryPath = curve(primary);
  const area = primary.length
    ? `${primaryPath} L ${primary[primary.length - 1][0]} ${bottom} L ${primary[0][0]} ${bottom} Z`
    : "";
  const grid = [0, 1, 2, 3].map((step) => top + ((bottom - top) * step) / 4);
  return (
    <div className="mt-[18px] h-[220px]">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label={chart.caption}>
        {grid.map((y, index) => (
          <g key={y}>
            <line x1={left} y1={y} x2={right} y2={y} stroke="#ECEEF2" strokeDasharray="2 4" />
            <text x="0" y={y + 4} fill="#9CA3AF" fontSize="11">
              {chart.yLabels[index]}
            </text>
          </g>
        ))}
        {area && <path d={area} fill="rgba(54,122,244,0.08)" />}
        {primaryPath && <path d={primaryPath} fill="none" stroke="#367AF4" strokeWidth="2" />}
        {secondary.length > 0 && (
          <path d={curve(secondary)} fill="none" stroke="#9CA3AF" strokeWidth="1.75" strokeDasharray="4 3" />
        )}
        <text x={left} y="210" fill="#9CA3AF" fontSize="11">{chart.startLabel}</text>
        <text x="300" y="210" fill="#9CA3AF" fontSize="11">{chart.midLabel}</text>
        <text x="560" y="210" fill="#9CA3AF" fontSize="11" textAnchor="end">{chart.endLabel}</text>
      </svg>
    </div>
  );
}

function curve(points: Array<readonly [number, number]>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return path;
}
