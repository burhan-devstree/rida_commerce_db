"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ExpenseItem, type ExpensesResponse } from "@/lib/api";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { Pagination } from "@/components/Pagination";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/* ── Expense Form Modal ────────────────────────────────────────── */
type ExpenseFormProps = {
  expense?: ExpenseItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

function ExpenseForm({ expense, onClose, onSuccess }: ExpenseFormProps) {
  const isEdit = !!expense;
  const [expenseName, setExpenseName] = useState(expense?.expenseName ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      setError("Please enter a valid amount");
      return;
    }

    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        expenseName: expenseName.trim(),
        amount: amountNum,
      };

      const url = isEdit ? `/api/expenses/${expense!._id}` : "/api/expenses";
      const method = isEdit ? "PUT" : "POST";

      await api(url, { method, body: payload });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full min-h-[44px] rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-form-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="expense-form-title" className="text-xl font-bold text-zinc-900 mb-4">
          {isEdit ? "Edit Expense" : "Add New Expense"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="expense-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Expense name *
            </label>
            <input
              id="expense-name"
              type="text"
              placeholder="e.g. Office Supplies, Shipping, Rent…"
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="expense-amount" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Amount (Rs.) *
            </label>
            <input
              id="expense-amount"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 min-h-[44px] cursor-pointer rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : isEdit ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] cursor-pointer rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Expenses Page ─────────────────────────────────────────────── */
export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseItem | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (search.trim()) {
    params.set("search", search.trim());
  }

  const { data, isLoading, error } = useQuery<ExpensesResponse>({
    queryKey: ["expenses", page, limit, search],
    queryFn: () => api(`/api/expenses?${params}`),
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) => api(`/api/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "Failed to delete expense");
    },
  });

  return (
    <div>
      <nav className="mb-2 text-sm text-zinc-500" aria-label="Breadcrumb">
        <Link href="/dashboard" className="hover:text-zinc-700">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">Expenses</span>
      </nav>

      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">Expenses</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <span className="text-lg leading-none">+</span>
          Add Expense
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Search expense name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white pl-3 pr-4 text-sm font-medium text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        {isLoading && <div className="p-8 text-center text-zinc-500">Loading…</div>}
        {error && (
          <div className="p-8 text-center text-red-600">
            {error instanceof Error ? error.message : "Failed to load expenses"}
          </div>
        )}
        {data && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-sky-100">
                    <th className="p-3 font-semibold text-zinc-900">Expense name</th>
                    <th className="p-3 font-semibold text-zinc-900">Amount</th>
                    <th className="p-3 font-semibold text-zinc-900">Date</th>
                    <th className="p-3 font-semibold text-zinc-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-600">
                        No expenses found. Add one to get started.
                      </td>
                    </tr>
                  ) : (
                    data.expenses.map((item) => (
                      <tr key={item._id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                        <td className="p-3 font-medium text-zinc-900">{item.expenseName}</td>
                        <td className="p-3 font-semibold text-rose-600">{formatMoney(item.amount)}</td>
                        <td className="p-3 text-zinc-600">{formatDate(item.createdAt)}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditing(item)}
                              title="Edit"
                              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
                              aria-label="Edit Expense"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={() => {
                                if (confirm(`Delete expense "${item.expenseName}"?`)) {
                                  deleteExpense.mutate(item._id);
                                }
                              }}
                              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                              aria-label="Delete Expense"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
        <ExpenseForm
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false);
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          }}
        />
      )}
      {editing && (
        <ExpenseForm
          expense={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          }}
        />
      )}
    </div>
  );
}
