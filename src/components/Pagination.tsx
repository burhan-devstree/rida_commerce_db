"use client";

import React from "react";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  if (totalPages <= 1 && total === 0) return null;

  // Generate page numbers to display
  // e.g. [1, 2, 3, '...', 10]
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show page 1
      pages.push(1);

      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 2) {
        end = 3;
      }
      if (page >= totalPages - 1) {
        start = totalPages - 2;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-200 px-4 py-4 sm:flex-row">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm text-zinc-600">
          Showing <span className="font-semibold text-zinc-900">{total === 0 ? 0 : Math.min(total, (page - 1) * limit + 1)}</span> to{" "}
          <span className="font-semibold text-zinc-900">{Math.min(total, page * limit)}</span> of{" "}
          <span className="font-semibold text-zinc-900">{total}</span> items
        </span>
        <div className="flex items-center gap-1.5">
          <label htmlFor="pageSizeSelect" className="text-sm text-zinc-500 whitespace-nowrap">
            Per page:
          </label>
          <select
            id="pageSizeSelect"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-9 rounded-lg border border-zinc-300 bg-white px-2 text-sm font-medium text-zinc-900 focus:border-blue-500 focus:outline-none"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Previous Button */}
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex h-9 min-w-[36px] cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>

          {/* Page Numbers */}
          {pageNumbers.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`dots-${idx}`}
                  className="flex h-9 w-9 items-center justify-center text-sm text-zinc-400"
                >
                  ...
                </span>
              );
            }
            const isCurrent = p === page;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p as number)}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                  isCurrent
                    ? "bg-blue-600 text-white"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {p}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex h-9 min-w-[36px] cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
