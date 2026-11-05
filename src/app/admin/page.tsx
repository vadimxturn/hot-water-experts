import Link from "next/link";
import { OwnerChart } from "@/components/admin/owner-chart";
import { OwnerRange } from "@/components/admin/owner-range";
import { RadialMix, SegmentMeter, Sparkline } from "@/components/admin/owner-visuals";
import { getSession } from "@/lib/auth";
import { buildOwnerHome, greetingFor, moneyCompact, resolveRange, type OwnerHome, type Trend } from "@/lib/owner-home";
import { officeToday } from "@/lib/queries";
import { getDb } from "@/lib/store";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const db = await getDb();
  const session = await getSession();
  const range = resolveRange(officeToday(db), params.range, params.from, params.to);
  const home = buildOwnerHome(db, range);
  const office = home.sampleData ? "Sample office" : "Office";

  return (
    <div className="mx-auto flex max-w-[1220px] flex-col gap-7 px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-medium leading-tight tracking-[-0.03em] text-ink">
            {greetingFor(session?.name || "there")}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2.5 text-[13px] text-[#6b7280]">
            <span>{office} · {home.range.monthTitle}</span>
            {home.sampleData && <span className="inline-flex h-5 items-center rounded-full bg-[#fff7ed] px-2 text-[11px] font-medium text-[#b45309]">Sample data</span>}
          </p>
        </div>
        <OwnerRange preset={home.range.preset} from={home.range.from} to={home.range.to} spanLabel={home.range.spanLabel} />
      </header>

      <SourceBanner home={home} />

      <section className="grid grid-cols-1 gap-px overflow-hidden rounded-[14px] border border-[#eceef2] bg-[#eceef2] sm:grid-cols-2 xl:grid-cols-4">
        {home.kpis.map((card) => (
          <article key={card.id} className="min-h-[132px] bg-white px-5 pb-5 pt-[22px] sm:px-6">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-[#6b7280]">{card.label}</p>
              {card.tag && <span className="rounded-full bg-[#fff7ed] px-1.5 py-0.5 text-[10px] font-medium text-[#b45309]">{card.tag}</span>}
            </div>
            <p className={card.missing ? "mt-2.5 font-display text-[22px] font-normal leading-none tracking-[-0.03em] text-[#6b7280]" : "mt-2.5 font-display text-[34px] font-light leading-none tracking-[-0.04em] text-ink"}>
              {card.value}
            </p>
            {card.trend ? <TrendLine trend={card.trend} /> : <p className="mt-2.5 h-[17px] text-xs text-[#9ca3af]">{card.missing ? "No source in the office file" : ""}</p>}
            <Sparkline values={card.spark} tone={card.sparkTone} fill={card.sparkFill} />
          </article>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.9fr]">
        <OwnerChart charts={home.charts} />
        <div className="flex flex-col gap-4">
          <section className="rounded-[14px] border border-[#eceef2] bg-white">
            <RadialMix slices={home.mix} total={moneyCompact(home.mixTotal)} />
          </section>
          <section className="rounded-[14px] border border-[#eceef2] bg-white px-5 py-[22px] sm:px-6">
            <p className="text-xs font-medium text-[#6b7280]">Permits within SLA</p>
            <p className="mt-2 font-display text-[34px] font-light leading-none tracking-[-0.04em] text-ink">
              {home.sla.total === 0 ? "None" : `${home.sla.within} of ${home.sla.total}`}
            </p>
            <SegmentMeter within={home.sla.within} total={home.sla.total} />
            <p className="mt-3 flex w-fit items-center gap-2 border-b border-dotted border-[#e2e5eb] pb-1.5 text-xs text-[#6b7280]">
              <i className="h-1.5 w-1.5 rounded-full bg-[#367af4]" />
              At or under 7-day permit SLA
            </p>
          </section>
        </div>
      </div>

      <section className="overflow-hidden rounded-[14px] border border-[#eceef2] bg-white">
        <div className="flex items-baseline justify-between gap-3 px-5 pb-2 pt-[22px] sm:px-6">
          <div>
            <h2 className="font-display text-sm font-semibold tracking-[-0.01em]">Job flow</h2>
            <p className="mt-0.5 text-xs text-[#6b7280]">Open work by stage · aging vs 7-day SLA</p>
          </div>
          <Link href="/admin/pipeline" className="text-[12.5px] font-medium text-[#6b7280]">View pipeline</Link>
        </div>
        <div className="grid grid-cols-2 border-t border-[#eceef2] sm:grid-cols-3 xl:grid-cols-6">
          {home.flow.map((stage) => (
            <Link key={stage.id} href={stage.href} className="border-b border-r border-[#eceef2] px-4 py-4 sm:px-[18px] xl:border-b-0">
              <p className="text-xs font-medium text-[#6b7280]">{stage.label}</p>
              <p className="mt-1.5 font-display text-[28px] font-light leading-none tracking-[-0.03em] text-ink">{stage.count}</p>
              <p className={`mt-1.5 text-[11.5px] tabular-nums ${stage.tone === "bad" ? "text-[#b91c1c]" : stage.tone === "warn" ? "text-[#b45309]" : "text-[#6b7280]"}`}>{stage.meta}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className="rounded-[14px] border border-[#eceef2] bg-white px-5 py-[22px] sm:px-6">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-semibold tracking-[-0.01em]">Today&apos;s schedule</h2>
              <p className="mt-0.5 text-xs text-[#6b7280]">{home.scheduleWhen}</p>
            </div>
            <Link href="/admin/day-plan" className="text-[12.5px] font-medium text-[#6b7280]">Open day plan</Link>
          </div>
          {home.schedule.length === 0 && <p className="py-8 text-sm text-[#6b7280]">No jobs on the board for the office date.</p>}
          <ul>
            {home.schedule.map((stop) => (
              <li key={stop.id} className="grid grid-cols-1 gap-2 border-b border-[#eceef2] py-3 last:border-b-0 sm:grid-cols-[76px_1fr_auto] sm:items-center sm:gap-3">
                <p className="text-xs font-medium tabular-nums text-[#6b7280]">{stop.time}</p>
                <div className="min-w-0">
                  <Link href={stop.href} className="text-[13.5px] font-medium text-ink">{stop.name}</Link>
                  <p className="mt-0.5 truncate text-xs text-[#6b7280]">{stop.meta}</p>
                </div>
                <div className="flex items-center gap-2">
                  {stop.tech && (
                    <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full border border-[#eceef2] py-0 pl-1 pr-2 text-xs text-ink">
                      <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-[#f7f8fa] text-[9px] font-semibold text-[#6b7280]">{stop.tech.initials}</span>
                      {stop.tech.name}
                    </span>
                  )}
                  <StatusChip tone={stop.statusTone} label={stop.status} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#eceef2] pt-3.5 text-xs text-[#6b7280]">
            <div className="flex flex-wrap gap-3.5">
              {home.techLoads.map((tech) => (
                <span key={tech.label}>{tech.label} <strong className="font-medium text-ink">{tech.text}</strong></span>
              ))}
            </div>
            <p>Next open install · <strong className="font-medium text-ink">{home.nextOpenLabel}</strong></p>
          </div>
        </section>

        <section className="rounded-[14px] border border-[#eceef2] bg-white px-5 py-[22px] sm:px-6">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-semibold tracking-[-0.01em]">Needs attention</h2>
              <p className="mt-0.5 text-xs text-[#6b7280]">{home.attentionTotal} {home.attentionTotal === 1 ? "item" : "items"} · oldest first</p>
            </div>
            <Link href="/admin/permits" className="text-[12.5px] font-medium text-[#6b7280]">View all</Link>
          </div>
          {home.attention.length === 0 && <p className="py-8 text-sm text-[#6b7280]">Nothing in the office file needs a chase.</p>}
          <ul>
            {home.attention.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="grid grid-cols-[10px_1fr_auto] items-start gap-2.5 border-b border-[#eceef2] py-2.5 last:border-b-0">
                  <span className={`mt-1.5 h-2 w-2 rounded-full ${item.tone === "bad" ? "bg-[#b91c1c]" : item.tone === "warn" ? "bg-[#b45309]" : "bg-[#367af4]"}`} />
                  <span>
                    <span className="block text-[13px] font-medium text-ink">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-[#6b7280]">{item.detail}</span>
                  </span>
                  <span className={`text-xs font-medium tabular-nums ${item.tone === "bad" ? "text-[#b91c1c]" : item.tone === "warn" ? "text-[#b45309]" : "text-[#6b7280]"}`}>{item.age}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-[14px] border border-[#eceef2] bg-white px-5 py-[22px] sm:px-6">
          <h2 className="font-display text-sm font-semibold tracking-[-0.01em]">Sales</h2>
          <p className="mt-0.5 text-xs text-[#6b7280]">Lead intake</p>
          <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3.5">
            <Stat label="Leads today" value={String(home.sales.leadsToday)} note={`${home.sales.leadsWeek} this week`} />
            <Stat label="Quotes waiting" value={String(home.sales.quotesWaiting)} note="Still in Quoted" />
          </div>
          <p className="mt-3.5 text-xs text-[#6b7280]">Cost per lead <span className="ml-1 rounded-full bg-[#fff7ed] px-1.5 py-0.5 text-[10px] font-medium text-[#b45309]">Not connected</span></p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {home.sales.sources.length === 0 && <span className="text-xs text-[#9ca3af]">No leads in this range</span>}
            {home.sales.sources.map((source) => (
              <span key={source.label} className="inline-flex h-6 items-center gap-1.5 rounded-md bg-[#f7f8fa] px-2 text-[11.5px] text-[#6b7280]">
                {source.label} <b className="font-medium text-ink">{source.count}</b>
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-[14px] border border-[#eceef2] bg-white px-5 py-[22px] sm:px-6">
          <h2 className="font-display text-sm font-semibold tracking-[-0.01em]">Operations</h2>
          <p className="mt-0.5 text-xs text-[#6b7280]">Permits and callbacks</p>
          <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3.5">
            <Stat label="Permits waiting" value={String(home.ops.permitsWaiting)} note={`${home.ops.permitsOld} aging past 7d`} noteTone={home.ops.permitsOld ? "warn" : "muted"} />
            <Stat label="Inspections" value={String(home.ops.inspections)} note={home.ops.inspectionsNote} />
            <div>
              <p className="text-xs font-medium text-[#6b7280]">Callbacks</p>
              <p className="mt-1 font-display text-xl font-normal tracking-[-0.02em] text-[#6b7280]">Not connected</p>
              <p className="mt-0.5 text-[11.5px] text-[#9ca3af]">No warranty records</p>
            </div>
            <Stat label="Install capacity" value={`${home.ops.installUsed}/${home.ops.installCap}`} note="slots used today" />
          </div>
        </section>

        <section className="rounded-[14px] border border-[#eceef2] bg-white px-5 py-[22px] sm:px-6 md:col-span-2 xl:col-span-1">
          <h2 className="font-display text-sm font-semibold tracking-[-0.01em]">Reputation</h2>
          <p className="mt-0.5 text-xs text-[#6b7280]">This month</p>
          <p className="mt-3.5 text-xs font-medium text-[#6b7280]">Average rating</p>
          <p className="mt-1 font-display text-xl font-normal tracking-[-0.02em] text-[#6b7280]">Not connected</p>
          <p className="mt-1 text-[11.5px] text-[#9ca3af]">No review source. Ratings stay blank until a real feed is added.</p>
        </section>
      </div>
    </div>
  );
}

function SourceBanner({ home }: { home: OwnerHome }) {
  const lead = home.sampleData
    ? "Sample data for owner review. Numbers are counted from the office file. Anything without a source is marked Not connected."
    : "Numbers are counted from the office file. Anything without a source is marked Not connected.";
  return (
    <details className="rounded-[10px] border border-dashed border-[#d1d5db] bg-[#fafafa] px-4 py-3 text-[12.5px] text-[#6b7280]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span>{lead}</span>
        <span className="inline-flex h-7 shrink-0 items-center rounded-md border border-[#e2e5eb] bg-white px-2.5 text-xs font-medium text-ink">View live sources</span>
      </summary>
      <ul className="mt-3 space-y-2 border-t border-[#eceef2] pt-3">
        {home.sources.map((source) => (
          <li key={source.id} className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-3">
            <span className="font-medium text-ink">
              {source.label}
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${source.state === "missing" ? "bg-[#fff7ed] text-[#b45309]" : "bg-[#f7f8fa] text-[#6b7280]"}`}>
                {source.state === "missing" ? "Not connected" : "Office file"}
              </span>
            </span>
            <span>{source.detail}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function TrendLine({ trend }: { trend: Trend }) {
  const up = trend.tone === "up";
  const down = trend.tone === "down";
  const color = up ? "text-[#15803d]" : down ? "text-[#b91c1c]" : "text-[#6b7280]";
  const bubble = up ? "bg-[#ecfdf3] text-[#15803d]" : down ? "bg-[#fef2f2] text-[#b91c1c]" : "bg-[#f7f8fa] text-[#6b7280]";
  return (
    <p className={`mt-2.5 flex items-center gap-1.5 text-xs font-medium tabular-nums ${color}`}>
      <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${bubble}`}>{up ? "↑" : down ? "↓" : "·"}</span>
      {trend.label}
    </p>
  );
}

function Stat({ label, value, note, noteTone = "muted" }: { label: string; value: string; note: string; noteTone?: "muted" | "warn" }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#6b7280]">{label}</p>
      <p className="mt-1 font-display text-xl font-normal tracking-[-0.02em] text-ink tabular-nums">{value}</p>
      <p className={`mt-0.5 text-[11.5px] ${noteTone === "warn" ? "text-[#b45309]" : "text-[#9ca3af]"}`}>{note}</p>
    </div>
  );
}

function StatusChip({ tone, label }: { tone: "enroute" | "onsite" | "scheduled" | "inspection"; label: string }) {
  const styles = {
    enroute: "bg-[#eef4ff] text-[#1d4ed8]",
    onsite: "bg-[#fff7ed] text-[#b45309]",
    scheduled: "bg-[#f7f8fa] text-[#6b7280]",
    inspection: "bg-[#f5f3ff] text-[#6d28d9]",
  } as const;
  const dots = {
    enroute: "bg-[#367af4]",
    onsite: "bg-[#b45309]",
    scheduled: "bg-[#9ca3af]",
    inspection: "bg-[#7c3aed]",
  } as const;
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11.5px] font-medium ${styles[tone]}`}>
      <i className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />
      {label}
    </span>
  );
}
