"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileBadge,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Pin,
  ScrollText,
  Search,
  Settings,
  Shield,
  Users,
  Wrench,
  BarChart3,
  Kanban,
  Briefcase,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { newJobAction, logoutAction } from "@/server/actions";
import type { AlertItem } from "@/lib/queries";

interface SearchRow {
  title: string;
  meta: string;
  href: string;
  group: string;
}

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Inbox, count: "leads" },
  { href: "/admin/pipeline", label: "Pipeline", icon: Kanban, count: "pipeline" },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/day-plan", label: "Day plan", icon: CalendarDays },
  { href: "/admin/calendar", label: "Calendar", icon: Calendar },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/permits", label: "Permits", icon: FileBadge, count: "permits" },
  { href: "/admin/inspections", label: "Inspections", icon: ClipboardCheck },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/techs", label: "Techs", icon: Wrench },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
] as const;

export function AdminShell({
  session,
  counts,
  alerts,
  search,
  ghlLabel,
  children,
}: {
  session: { name: string; title: string; initials: string; role: string };
  counts: { leads: number; pipeline: number; permits: number; permitsOld: number; today: number };
  alerts: AlertItem[];
  search: SearchRow[];
  ghlLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState("");
  const [bell, setBell] = useState(false);
  const countMap: Record<string, number> = counts;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setCollapsed((value) => !value);
      }
      if (event.key === "Escape") setPalette(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? search.filter((row) => `${row.title} ${row.meta} ${row.group}`.toLowerCase().includes(q))
      : search.slice(0, 8);
    return rows.slice(0, 12);
  }, [query, search]);

  const crumb = crumbFor(pathname);

  return (
    <div className="min-h-dvh bg-canvas text-[#18181b]">
      <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-[#e9e9ec] bg-[#f7f7f8] transition-[width] duration-200 ${collapsed ? "w-14" : "w-[248px]"}`}>
        <div className="flex h-12 items-center justify-between px-3">
          <Link href="/admin" className={collapsed ? "sr-only" : ""}>
            <Logo className="h-7 w-auto" />
          </Link>
          <button type="button" aria-label="Collapse sidebar" className="grid h-8 w-8 place-items-center rounded-md text-slate" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? "»" : "«"}
          </button>
        </div>
        <button type="button" onClick={() => setPalette(true)} className="mx-2 mb-2 flex h-8 items-center gap-2 rounded-md px-2 text-[13px] text-[#71717a] hover:bg-white">
          <Search className="h-4 w-4" />
          {!collapsed && <span className="flex-1 text-left">Search or jump to...</span>}
          {!collapsed && <span className="rounded border border-[#e4e4e7] px-1 text-[10px]">⌘K</span>}
        </button>
        <nav className="flex-1 overflow-y-auto px-2">
          {links.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            const count = "count" in item ? countMap[item.count] : undefined;
            return (
              <Link key={item.href} href={item.href} className={`mb-0.5 flex h-8 items-center gap-2 rounded-md px-2 text-[13px] ${active ? "border border-[#e9e9ec] bg-white text-[#18181b]" : "text-[#71717a] hover:bg-white/70"}`}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && typeof count === "number" && <span className="text-xs text-[#a1a1aa]">{count}</span>}
              </Link>
            );
          })}
          {!collapsed && <p className="mt-4 px-2 text-xs text-[#71717a]">Pinned</p>}
          <Link href="/admin/permits" className="mt-1 flex h-8 items-center gap-2 rounded-md px-2 text-[13px] text-[#71717a]">
            <Pin className="h-4 w-4" />
            {!collapsed && <span className="flex-1">Permits &gt; 7 days</span>}
            {!collapsed && <span className="text-xs">{counts.permitsOld}</span>}
          </Link>
          <Link href="/admin/day-plan" className="flex h-8 items-center gap-2 rounded-md px-2 text-[13px] text-[#71717a]">
            <CalendarDays className="h-4 w-4" />
            {!collapsed && <span className="flex-1">Today&apos;s installs</span>}
            {!collapsed && <span className="text-xs">{counts.today}</span>}
          </Link>
          <div className="mt-4 border-t border-[#e9e9ec] pt-2">
            {(
              [
                { href: "/admin/staff", label: "Staff and roles", icon: Shield },
                { href: "/admin/activity", label: "Activity log", icon: ScrollText },
                { href: "/admin/sms", label: "SMS templates", icon: MessageSquare },
                { href: "/admin/settings", label: "Settings", icon: Settings },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={`mb-0.5 flex h-8 items-center gap-2 rounded-md px-2 text-[13px] ${pathname === item.href ? "bg-white" : "text-[#71717a]"}`}>
                  <Icon className="h-4 w-4" />
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <form action={logoutAction} className="border-t border-[#e9e9ec] p-2">
          <button type="submit" className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[11px] text-white">{session.initials}</span>
            {!collapsed && (
              <span>
                <span className="block font-medium">{session.name}</span>
                <span className="block text-[11px] text-[#71717a]">{session.title}</span>
              </span>
            )}
          </button>
        </form>
      </aside>

      <div className={collapsed ? "pl-14" : "pl-[248px]"}>
        <header className="sticky top-0 z-20 flex h-[52px] items-center gap-3 border-b border-[#e9e9ec] bg-canvas px-6">
          <p className="text-sm text-[#71717a]">
            {crumb[0]} <span className="px-1">/</span> <span className="text-[#18181b]">{crumb[1]}</span>
          </p>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1 text-xs text-[#71717a] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {ghlLabel}
            </span>
            <button type="button" className="relative grid h-8 w-8 place-items-center rounded-md hover:bg-white" aria-label="Alerts" onClick={() => setBell((value) => !value)}>
              <Bell className="h-4 w-4" />
              {alerts.length > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger" />}
            </button>
            {pathname.startsWith("/admin/settings") ? null : (
              <form action={newJobAction}>
                <button className="office-btn office-btn-primary" type="submit">+ New job</button>
              </form>
            )}
          </div>
          {bell && (
            <div className="absolute right-6 top-12 w-80 rounded-[10px] border border-[#e9e9ec] bg-white p-2 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)]">
              {alerts.map((alert) => (
                <Link key={alert.id} href={alert.href} onClick={() => setBell(false)} className="block rounded-md px-2 py-2 hover:bg-[#f4f4f5]">
                  <span className="block text-[13px] font-medium">{alert.title}</span>
                  <span className="block text-xs text-[#71717a]">{alert.detail}</span>
                </Link>
              ))}
            </div>
          )}
        </header>
        <div className="px-6 py-6">{children}</div>
      </div>

      {palette && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setPalette(false)}>
          <div className="mx-auto mt-[12vh] w-[min(640px,calc(100%-32px))] overflow-hidden rounded-xl border border-[#e9e9ec] bg-white" onClick={(event) => event.stopPropagation()}>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search or jump to..." className="h-12 w-full border-b border-[#e9e9ec] px-4 text-sm outline-none" />
            <ul className="max-h-80 overflow-auto p-2">
              {results.map((row) => (
                <li key={row.href + row.title}>
                  <Link href={row.href} onClick={() => setPalette(false)} className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-tint">
                    <span>{row.title}</span>
                    <span className="text-xs text-[#71717a]">{row.meta}</span>
                  </Link>
                </li>
              ))}
              {results.length === 0 && <li className="px-2 py-6 text-center text-sm text-[#71717a]">No matches</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function crumbFor(pathname: string): [string, string] {
  if (pathname.startsWith("/admin/jobs/")) return ["Jobs", pathname.split("/").pop() || "Job"];
  if (pathname.startsWith("/admin/permits/job/")) return ["Permits", "Job tracker"];
  if (pathname.includes("/packet")) return ["Permits", "Packet"];
  if (pathname.startsWith("/admin/customers/")) return ["Customers", "Profile"];
  if (pathname.startsWith("/admin/techs/")) return ["Technicians", "Profile"];
  const map: Record<string, [string, string]> = {
    "/admin": ["Operations", "Dashboard"],
    "/admin/leads": ["Sales", "Leads"],
    "/admin/pipeline": ["Operations", "Pipeline"],
    "/admin/jobs": ["Operations", "Jobs"],
    "/admin/day-plan": ["Dispatch", "Day plan"],
    "/admin/calendar": ["Dispatch", "Calendar"],
    "/admin/customers": ["Customers", "All"],
    "/admin/permits": ["Permits", "By jurisdiction"],
    "/admin/inspections": ["Permits", "Inspections"],
    "/admin/payments": ["Money", "Payments"],
    "/admin/techs": ["Team", "Technicians"],
    "/admin/reports": ["Reports", "Overview"],
    "/admin/staff": ["Team", "Staff and roles"],
    "/admin/activity": ["Office", "Activity log"],
    "/admin/sms": ["Messages", "SMS templates"],
    "/admin/settings": ["Settings", "Booking and price"],
  };
  return map[pathname] || ["Office", "Page"];
}
