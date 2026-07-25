"use client";

import { api, type InvoiceItem, type InvoicesResponse, type RidaItem } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { EyeIcon, FunnelIcon, MenuIcon, PencilIcon, TrashIcon } from "@/components/icons";
import { InvoiceForm } from "./InvoiceForm";
import { Pagination } from "@/components/Pagination";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const LIMIT_OPTIONS = [10, 20, 50];

const SEARCH_FIELD_OPTIONS: { value: "invoiceNumber" | "customer" | "reseller"; label: string }[] = [
  { value: "invoiceNumber", label: "Invoice #" },
  { value: "customer", label: "Customer" },
  { value: "reseller", label: "Reseller" },
];

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<"invoiceNumber" | "customer" | "reseller">("invoiceNumber");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [ridaId, setRidaId] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<InvoiceItem | null>(null);
  const [viewing, setViewing] = useState<InvoiceItem | null>(null);
  const [ridaFilterSearch, setRidaFilterSearch] = useState("");
  const [mobileMenuFor, setMobileMenuFor] = useState<string | null>(null);

  const { data: ridasList = [] } = useQuery<RidaItem[]>({
    queryKey: ["ridas"],
    queryFn: () => api("/api/ridas"),
  });

  const inputStyle =
    "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  const selectStyle =
    "h-11 w-full min-w-0 cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (search.trim()) {
    params.set("search", search.trim());
    params.set("searchField", searchField);
  }
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (ridaId) params.set("ridaId", ridaId);

  const { data, isLoading, error } = useQuery<InvoicesResponse>({
    queryKey: ["invoices", page, limit, search, searchField, dateFrom, dateTo, ridaId],
    queryFn: () => api(`/api/invoices?${params}`),
  });

  const deleteInvoice = useMutation({
    mutationFn: (id: string) =>
      api(`/api/invoices/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "Failed to delete invoice");
    },
  });

  return (
    <div>
      <nav className="mb-2 text-sm text-zinc-500" aria-label="Breadcrumb">
        <Link href="/dashboard" className="hover:text-zinc-700">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">Invoices</span>
      </nav>

      <div className="mb-4 space-y-3 sm:flex sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-2xl font-bold text-zinc-900">Invoices</h1>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
          </button>
          {/* Mobile: compact Print button */}
          <Link
            href="/invoices/print-address"
            className="flex h-11 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 sm:hidden"
          >
            Print
          </Link>
          <Link
            href="/invoices/print-address"
            className="hidden h-11 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 sm:flex"
          >
            Print Addresses
          </Link>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="text-lg leading-none">+</span>
            Add New
          </button>
        </div>
      </div>

      {/* Filter drawer (from right) — mobile and laptop */}
      {filterDrawerOpen && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterDrawerOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-xl md:max-w-md">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-4">
              <h2 className="text-lg font-semibold text-zinc-900">Filters</h2>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
                aria-label="Close"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Show</label>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className={selectStyle}
                >
                  {LIMIT_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Search in</label>
                <select
                  value={searchField}
                  onChange={(e) => {
                    setSearchField(e.target.value as "invoiceNumber" | "customer" | "reseller");
                    setPage(1);
                  }}
                  className={selectStyle}
                >
                  {SEARCH_FIELD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Search</label>
                <input
                  type="text"
                  placeholder={`Search by ${SEARCH_FIELD_OPTIONS.find((o) => o.value === searchField)?.label ?? "field"}…`}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Rida</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search Rida…"
                    value={ridaFilterSearch}
                    onChange={(e) => setRidaFilterSearch(e.target.value)}
                    className={inputStyle}
                  />
                  <select
                    value={ridaId}
                    onChange={(e) => {
                      setRidaId(e.target.value);
                      setPage(1);
                    }}
                    className={selectStyle}
                    aria-label="Filter by Rida"
                  >
                    <option value="">All Ridas</option>
                    {ridasList
                      .filter((r) =>
                        ridaFilterSearch.trim()
                          ? r.ridaName
                            .toLowerCase()
                            .includes(ridaFilterSearch.trim().toLowerCase())
                          : true
                      )
                      .map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.ridaName}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Date range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className={inputStyle}
                    aria-label="From"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className={inputStyle}
                    aria-label="To"
                  />
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-zinc-200 p-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setLimit(10);
                  setSearch("");
                  setSearchField("invoiceNumber");
                  setDateFrom("");
                  setDateTo("");
                  setRidaId("");
                  setRidaFilterSearch("");
                  setPage(1);
                  setFilterDrawerOpen(false);
                }}
                className="w-full cursor-pointer rounded-lg border border-zinc-300 bg-white py-2.5 font-medium text-zinc-700 hover:bg-zinc-50 sm:flex-1"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="w-full cursor-pointer rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 sm:flex-1"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        {isLoading && <div className="p-8 text-center text-zinc-500">Loading…</div>}
        {error && (
          <div className="p-8 text-center text-red-600">
            {error instanceof Error ? error.message : "Failed to load invoices"}
          </div>
        )}
        {data && (
          <>
            {/* Desktop/tablet: table */}
            <div className="hidden max-h-[70vh] overflow-auto md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-zinc-200 bg-sky-100">
                    <th className="p-3 font-semibold text-zinc-900">Invoice #</th>
                    <th className="p-3 font-semibold text-zinc-900">Rida</th>
                    <th className="p-3 font-semibold text-zinc-900">QTY</th>
                    <th className="p-3 font-semibold text-zinc-900">Customer</th>
                    <th className="p-3 font-semibold text-zinc-900">Reseller</th>
                    <th className="p-3 font-semibold text-zinc-900">Amount</th>
                    <th className="p-3 font-semibold text-zinc-900">Profit</th>
                    <th className="p-3 font-semibold text-zinc-900">Address Status</th>
                    <th className="p-3 font-semibold text-zinc-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-600">
                        No invoices found. Try adjusting your filters or create a new invoice.
                      </td>
                    </tr>
                  ) : (
                    data.invoices.map((inv) => (
                      <tr key={inv._id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                        <td className="p-3 font-mono text-zinc-900">{inv.invoiceNumber}</td>
                        <td className="p-3 text-zinc-700">{typeof inv.ridaId === "object" && inv.ridaId !== null ? inv.ridaId.ridaName : "—"}</td>
                        <td className="p-3 text-zinc-700 font-medium">{inv.quantity ?? 1}</td>
                        <td className="p-3 text-zinc-700">{inv.customer}</td>
                        <td className="p-3 text-zinc-700">{inv.reseller}</td>
                        <td className="p-3 font-medium text-zinc-900">{formatMoney(inv.amount)}</td>
                        <td className="p-3 text-zinc-700">{formatMoney(inv.profit)}</td>
                        <td className="p-3 text-zinc-700">
                          {inv.isAddressPrinted ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              Printed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                              Not printed
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setViewing(inv)}
                              title="View full details"
                              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-zinc-600 hover:bg-blue-50 hover:text-blue-600"
                              aria-label="View full details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(inv)}
                              title="Edit invoice"
                              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-blue-600"
                              aria-label="Edit invoice"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              title="Delete invoice"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
                                  deleteInvoice.mutate(inv._id);
                                }
                              }}
                              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-zinc-600 hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete invoice"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )))}
                </tbody>
              </table>
            </div>

            {/* Mobile: card list */}
            <div className="md:hidden">
              {data.invoices.length === 0 ? (
                <div className="p-8 text-center text-zinc-600">
                  No invoices found. Try adjusting your filters or create a new invoice.
                </div>
              ) : (
                data.invoices.map((inv) => (
                  <div
                    key={inv._id}
                    className="border-b border-zinc-100 p-4 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-900">{inv.customer}</p>
                        <p className="text-sm text-zinc-600">
                          Rida: {typeof inv.ridaId === "object" && inv.ridaId !== null ? inv.ridaId.ridaName : "—"} · Qty: {inv.quantity ?? 1}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zinc-900">
                          {formatMoney(inv.amount)}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-600">
                          Profit: {formatMoney(inv.profit)}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-600">
                          Address:{" "}
                          {inv.isAddressPrinted ? "Printed" : "Not printed"}
                        </p>
                      </div>
                      <div className="relative flex items-start">
                        <button
                          type="button"
                          onClick={() =>
                            setMobileMenuFor((prev) => (prev === inv._id ? null : inv._id))
                          }
                          title="Actions"
                          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"
                          aria-label="Invoice actions"
                        >
                          <MenuIcon className="h-5 w-5" />
                        </button>
                        {mobileMenuFor === inv._id && (
                          <div className="absolute right-0 top-10 z-10 min-w-[9rem] rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setViewing(inv);
                                setMobileMenuFor(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-zinc-700 hover:bg-blue-50"
                            >
                              <EyeIcon className="h-4 w-4" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(inv);
                                setMobileMenuFor(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-zinc-700 hover:bg-zinc-50"
                            >
                              <PencilIcon className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMobileMenuFor(null);
                                if (
                                  confirm(
                                    "Are you sure you want to delete this invoice? This action cannot be undone."
                                  )
                                ) {
                                  deleteInvoice.mutate(inv._id);
                                }
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )))}
            </div>

            <Pagination
              page={page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      {createOpen && (
        <InvoiceForm
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false);
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          }}
        />
      )}
      {editing && (
        <InvoiceForm
          invoice={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          }}
        />
      )}

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-invoice-title"
          onClick={(e) => e.target === e.currentTarget && setViewing(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl border border-zinc-200 bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-zinc-200 px-4 py-4 sm:px-6">
              <h2 id="view-invoice-title" className="text-lg font-semibold text-zinc-900">
                Invoice details
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-zinc-500">Invoice #</dt>
                  <dd className="mt-0.5 font-mono text-zinc-900">{viewing.invoiceNumber}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Rida</dt>
                  <dd className="mt-0.5 text-zinc-900">{typeof viewing.ridaId === "object" && viewing.ridaId !== null ? viewing.ridaId.ridaName : "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Quantity</dt>
                  <dd className="mt-0.5 text-zinc-900 font-medium">{viewing.quantity ?? 1}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Customer</dt>
                  <dd className="mt-0.5 text-zinc-900">{viewing.customer}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Reseller</dt>
                  <dd className="mt-0.5 text-zinc-900">{viewing.reseller}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Amount</dt>
                  <dd className="mt-0.5 font-semibold text-zinc-900">{formatMoney(viewing.amount)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Profit</dt>
                  <dd className="mt-0.5 text-zinc-900">{formatMoney(viewing.profit)}</dd>
                </div>
                {viewing.address && (
                  <div>
                    <dt className="font-medium text-zinc-500">Address</dt>
                    <dd className="mt-0.5 text-zinc-900 whitespace-pre-wrap">{viewing.address}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium text-zinc-500">Address print status</dt>
                  <dd className="mt-0.5 text-zinc-900">
                    {viewing.isAddressPrinted
                      ? viewing.addressPrintedAt
                        ? `Printed on ${new Date(viewing.addressPrintedAt).toLocaleString()}`
                        : "Printed"
                      : "Not printed yet"}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="shrink-0 border-t border-zinc-200 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="w-full cursor-pointer rounded-lg border border-zinc-300 py-2.5 font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
