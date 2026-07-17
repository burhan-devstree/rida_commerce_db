"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, type AddressItem, type AddressesResponse } from "@/lib/api";
import { generateAddressPdf } from "@/lib/addressPdf";

function formatDownloadName(startDate?: string, endDate?: string): string {
  const from = startDate?.replace(/-/g, "") || "all";
  const to = endDate?.replace(/-/g, "") || "all";
  return `addresses_${from}_to_${to}.pdf`;
}

export default function PrintAddressesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showOnlyNotPrinted, setShowOnlyNotPrinted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastPdfInvoiceIds, setLastPdfInvoiceIds] = useState<string[]>([]);

  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const hasRange = useMemo(() => !!fromDate || !!toDate, [fromDate, toDate]);

  const visibleAddresses = useMemo(() => {
    const base = addresses;
    if (showOnlyNotPrinted) {
      return base.filter((a) => !a.isAddressPrinted);
    }
    return base;
  }, [addresses, showOnlyNotPrinted]);

  const printedCount = useMemo(
    () => addresses.filter((a) => a.isAddressPrinted).length,
    [addresses],
  );

  const visiblePrintedCount = useMemo(
    () => visibleAddresses.filter((a) => a.isAddressPrinted).length,
    [visibleAddresses],
  );

  useEffect(() => {
    if (addresses.length === 0) {
      setPdfUrl(null);
      setLastPdfInvoiceIds([]);
      return;
    }

    let active = true;
    const candidates = showOnlyNotPrinted
      ? addresses.filter((a) => !a.isAddressPrinted)
      : addresses;

    if (candidates.length === 0) {
      setPdfUrl(null);
      setLastPdfInvoiceIds([]);
      return;
    }

    async function updatePdf() {
      setPdfGenerating(true);
      try {
        const blob = await generateAddressPdf(
          candidates.map((c) => c.address),
          {
            startDate: fromDate || undefined,
            endDate: toDate || undefined,
          },
        );
        if (!active) return;
        const url = URL.createObjectURL(blob);
        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setLastPdfInvoiceIds(candidates.map((c) => c.id));
      } catch (err) {
        console.error("PDF generation failed:", err);
      } finally {
        if (active) setPdfGenerating(false);
      }
    }

    void updatePdf();

    return () => {
      active = false;
    };
  }, [addresses, showOnlyNotPrinted, fromDate, toDate]);

  async function handleGeneratePreview() {
    setError(null);

    if (fromDate && toDate && fromDate > toDate) {
      setError("End date cannot be before start date.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("startDate", fromDate);
      if (toDate) params.set("endDate", toDate);

      const data = await api<AddressesResponse>(
        `/api/invoices/addresses?${params.toString()}`,
      );

      const items = (data.addresses || []).filter(
        (item) => item.address && item.address.trim().length > 0,
      );
      setAddresses(items);

      if (items.length === 0) {
        setError("No addresses found for the selected range.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!pdfUrl || lastPdfInvoiceIds.length === 0) return;
    const anyAlreadyPrinted = visiblePrintedCount > 0;
    if (anyAlreadyPrinted) {
      setConfirmOpen(true);
    } else {
      void doDownloadAndMarkPrinted();
    }
  }

  async function doDownloadAndMarkPrinted() {
    if (!pdfUrl || lastPdfInvoiceIds.length === 0) return;

    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = formatDownloadName(fromDate || undefined, toDate || undefined);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    try {
      await api("/api/invoices/addresses/mark-printed", {
        method: "POST",
        body: JSON.stringify({ invoiceIds: lastPdfInvoiceIds }),
      } as RequestInit & { body?: Record<string, unknown> | string });

      // Invalidate invoice- and dashboard-related queries so other pages see fresh data.
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      const params = new URLSearchParams();
      if (fromDate) params.set("startDate", fromDate);
      if (toDate) params.set("endDate", toDate);
      const refreshed = await api<AddressesResponse>(
        `/api/invoices/addresses?${params.toString()}`,
      );
      setAddresses(
        refreshed.addresses.filter(
          (item) => item.address && item.address.trim().length > 0,
        ),
      );
    } catch {
      // ignore errors; user already have their PDF
    } finally {
      setConfirmOpen(false);
      router.push("/invoices");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-4 py-6">
      <nav className="mb-1 text-sm text-zinc-500" aria-label="Breadcrumb">
        <Link href="/dashboard" className="hover:text-zinc-700">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <Link href="/invoices" className="hover:text-zinc-700">
          Invoices
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">Preview</span>
      </nav>
      <header className="mb-2 border-b border-zinc-200 pb-3">
        <h1 className="text-xl font-semibold text-zinc-900">
          Print Addresses
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Choose a date range, generate a preview, and download an A4 PDF of
          invoice addresses.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label
              htmlFor="from-date"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              From date
            </label>
            <input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="to-date"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              To date
            </label>
            <input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleGeneratePreview}
            disabled={loading}
            className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate Preview"}
          </button>
          <button
            type="button"
            onClick={() => {
              setFromDate("");
              setToDate("");
              setAddresses([]);
              if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
              }
              setError(null);
            }}
            className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Reset
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {!error && hasRange && addresses.length === 0 && !loading && (
          <p className="text-sm text-zinc-500">
            No addresses loaded yet. Click &ldquo;Generate Preview&rdquo; to
            fetch them.
          </p>
        )}
        {addresses.length > 0 && (
          <div className="mt-2 flex flex-col gap-1 text-xs text-zinc-600">
            <div>
              Total in range:{" "}
              <span className="font-medium text-zinc-800">
                {addresses.length}
              </span>
              {printedCount > 0 && (
                <>
                  {" "}
                  — Printed before:{" "}
                  <span className="font-medium text-emerald-700">
                    {printedCount}
                  </span>
                  , New:{" "}
                  <span className="font-medium text-blue-700">
                    {addresses.length - printedCount}
                  </span>
                </>
              )}
            </div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300 text-blue-600"
                checked={showOnlyNotPrinted}
                onChange={(e) => setShowOnlyNotPrinted(e.target.checked)}
              />
              <span>Show only not printed addresses in PDF</span>
            </label>
            {visiblePrintedCount > 0 && (
              <p className="text-xs text-amber-700">
                Some addresses in this range were already printed before.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="flex-1 rounded-xl border border-dashed border-zinc-300 bg-white/60 p-3 shadow-inner">
        <h2 className="mb-2 text-sm font-medium text-zinc-700">PDF Preview</h2>
        {pdfUrl ? (
          <div className="h-[480px] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            <iframe
              title="Addresses PDF preview"
              src={pdfUrl}
              className="h-full w-full"
            />
          </div>
        ) : (
          <div className="flex h-[240px] flex-col items-center justify-center text-center text-sm text-zinc-500 px-4">
            {loading || pdfGenerating ? (
              <p>Generating preview…</p>
            ) : addresses.length > 0 && showOnlyNotPrinted && addresses.every(a => a.isAddressPrinted) ? (
              <p className="text-amber-700 font-medium">
                All addresses in this range have already been printed.<br />
                Uncheck &ldquo;Show only not printed addresses in PDF&rdquo; to view them.
              </p>
            ) : (
              <p>No preview yet. Choose dates and click &ldquo;Generate Preview&rdquo;.</p>
            )}
          </div>
        )}
      </section>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!pdfUrl}
          className="flex min-h-[44px] min-w-[160px] cursor-pointer items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
        >
          Download PDF
        </button>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-zinc-900">
              Addresses already printed
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Some addresses in this PDF were already printed before. Do you
              want to continue and mark them as printed again?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="min-h-[36px] rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="min-h-[36px] rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                onClick={() => void doDownloadAndMarkPrinted()}
              >
                Print again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

