"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type DashboardSummary } from "@/lib/api";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type DatePreset = "" | "week" | "month" | "year" | "custom";

function getDateRange(
  preset: DatePreset,
  customStart: string,
  customEnd: string
): { startDate: string; endDate: string } | null {
  const now = new Date();
  if (preset === "week") {
    const start = getStartOfWeek(now);
    const end = getEndOfWeek(now);
    return { startDate: toYYYYMMDD(start), endDate: toYYYYMMDD(end) };
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: toYYYYMMDD(start), endDate: toYYYYMMDD(end) };
  }
  if (preset === "year") {
    return {
      startDate: `${now.getFullYear()}-01-01`,
      endDate: `${now.getFullYear()}-12-31`,
    };
  }
  if (preset === "custom" && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd };
  }
  return null;
}

function getStartOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getEndOfWeek(d: Date): Date {
  const start = getStartOfWeek(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

const CARDS = [
  {
    label: "Total Revenue",
    key: "totalRevenue" as const,
    format: (d: DashboardSummary) => formatMoney(d.totalRevenue),
    color: "bg-blue-500",
    iconColor: "text-blue-500",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 11.985-4.787 1.125 1.125 0 0 1 1.035-.57 60.07 60.07 0 0 1 11.985 4.787 1.125 1.125 0 0 1 0 1.97 60.07 60.07 0 0 1-11.985 4.787 1.125 1.125 0 0 1-1.035-.57 60.07 60.07 0 0 1-11.985-4.787A1.125 1.125 0 0 1 2.25 18.75Z" />
      </svg>
    ),
  },
  {
    label: "Total Profit",
    key: "totalProfit" as const,
    format: (d: DashboardSummary) => formatMoney(d.totalProfit),
    color: "bg-emerald-500",
    iconColor: "text-emerald-500",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    label: "Total Expenses",
    key: "totalExpenses" as const,
    format: (d: DashboardSummary) => formatMoney(d.totalExpenses),
    color: "bg-rose-500",
    iconColor: "text-rose-500",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 11.985-4.787 1.125 1.125 0 0 1 1.035-.57 60.07 60.07 0 0 1 11.985 4.787 1.125 1.125 0 0 1 0 1.97 60.07 60.07 0 0 1-11.985 4.787 1.125 1.125 0 0 1-1.035-.57 60.07 60.07 0 0 1-11.985-4.787A1.125 1.125 0 0 1 2.25 18.75ZM12 12.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      </svg>
    ),
  },
  {
    label: "Profit After Expenses",
    key: "profitAfterExpenses" as const,
    format: (d: DashboardSummary) => formatMoney(d.profitAfterExpenses),
    color: (d: DashboardSummary) => (d.profitAfterExpenses < 0 ? "bg-red-600" : "bg-indigo-500"),
    valueColor: (d: DashboardSummary) => (d.profitAfterExpenses < 0 ? "text-red-600 font-bold" : "text-zinc-900 font-bold"),
    iconColor: (d: DashboardSummary) => (d.profitAfterExpenses < 0 ? "text-red-500" : "text-indigo-500"),
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    label: "Total Invoices",
    key: "totalInvoices" as const,
    format: (d: DashboardSummary) => String(d.totalInvoices),
    color: "bg-zinc-700",
    iconColor: "text-zinc-600",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const dateRange = useMemo(
    () => getDateRange(datePreset, customStart, customEnd),
    [datePreset, customStart, customEnd]
  );

  const queryParams = useMemo(() => {
    if (!dateRange) return "";
    return `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
  }, [dateRange]);

  const { data, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ["dashboard", "summary", queryParams],
    queryFn: () => api(`/api/dashboard/summary${queryParams}`),
  });

  if (isLoading) {
    return (
      <div>
        <nav className="mb-4 text-sm text-zinc-500">
          <Link href="/dashboard" className="hover:text-zinc-700">
            Dashboard
          </Link>
        </nav>
        <p className="text-zinc-500">Loading summary…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <nav className="mb-4 text-sm text-zinc-500">
          <Link href="/dashboard" className="hover:text-zinc-700">
            Dashboard
          </Link>
        </nav>
        <p className="text-red-600">
          {error instanceof Error ? error.message : "Failed to load dashboard"}
        </p>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div>
      <nav className="mb-2 text-sm text-zinc-500" aria-label="Breadcrumb">
        <Link href="/dashboard" className="hover:text-zinc-700">
          Dashboard
        </Link>
      </nav>
      <h1 className="mb-4 text-2xl font-bold text-zinc-900">Dashboard</h1>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-zinc-600">Date filter:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDatePreset("")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              datePreset === ""
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            All time
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("week")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              datePreset === "week"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("month")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              datePreset === "month"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("year")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              datePreset === "year"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Year
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("custom")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              datePreset === "custom"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Custom
          </button>
        </div>
        {datePreset === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-10 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              aria-label="From date"
            />
            <span className="text-zinc-500">–</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-10 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              aria-label="To date"
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ label, format, color, valueColor, iconColor, icon }) => {
          const barColor = typeof color === "function" ? color(data) : color;
          const txtColor = typeof valueColor === "function" ? valueColor(data) : "text-zinc-900";
          const iColor = typeof iconColor === "function" ? iconColor(data) : iconColor;
          return (
            <div
              key={label}
              className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-zinc-500">{label}</p>
              <p className={`mt-2 text-2xl font-bold ${txtColor}`}>{format(data)}</p>
              <div className={`mt-3 h-1 w-12 rounded ${barColor}`} />
              <div className={`absolute right-4 top-4 opacity-20 ${iColor}`}>
                {icon}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
