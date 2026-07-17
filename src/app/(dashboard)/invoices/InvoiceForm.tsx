"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { api, type InvoiceItem, type RidaItem } from "@/lib/api";

type FormValues = {
  ridaId: string;
  ridaDisplay: string;
  customer: string;
  reseller: string;
  amount: number;
  profit: number;
  address: string;
};

type Props = {
  invoice?: InvoiceItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function InvoiceForm({ invoice, onClose, onSuccess }: Props) {
  const isEdit = !!invoice;
  const [ridas, setRidas] = useState<RidaItem[]>([]);
  const [ridaDropdownOpen, setRidaDropdownOpen] = useState(false);
  const [ridaSearch, setRidaSearch] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      ridaId: "",
      ridaDisplay: "",
      customer: "",
      reseller: "",
      amount: 0,
      profit: 0,
      address: "",
    },
  });

  const ridaId = watch("ridaId");
  const ridaDisplay = watch("ridaDisplay");
  const amount = watch("amount");

  useEffect(() => {
    api<RidaItem[]>("/api/ridas").then(setRidas).catch(() => setRidas([]));
  }, []);

  useEffect(() => {
    if (invoice && ridas.length > 0) {
      setValue("customer", invoice.customer);
      setValue("reseller", invoice.reseller);
      setValue("amount", invoice.amount);
      setValue("profit", invoice.profit);
      setValue("address", invoice.address ?? "");
      const ridaIdVal = invoice.ridaId;
      const match =
        typeof ridaIdVal === "object" && ridaIdVal !== null
          ? ridas.find((r) => r._id === (ridaIdVal as { _id: string })._id)
          : ridas.find((r) => r._id === ridaIdVal);
      if (match) {
        setValue("ridaId", match._id);
        setValue("ridaDisplay", match.ridaName);
      }
    }
  }, [invoice, ridas, setValue]);

  const selectedRida = ridaId ? (ridas.find((r) => r._id === ridaId) || null) : null;
  const costPrice = selectedRida ? selectedRida.price - selectedRida.profit : null;

  useEffect(() => {
    if (costPrice != null && amount != null && !isEdit) {
      const p = Number(amount) - costPrice;
      if (!Number.isNaN(p)) setValue("profit", p);
    }
  }, [amount, costPrice, isEdit, setValue]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  const filteredRidas = ridaSearch.trim()
    ? ridas.filter((r) =>
      r.ridaName.toLowerCase().includes(ridaSearch.trim().toLowerCase())
    )
    : ridas;

  function handleSelectRida(r: RidaItem) {
    setValue("ridaId", r._id);
    setValue("ridaDisplay", r.ridaName);
    setValue("amount", r.price);
    setValue("profit", r.profit);
    clearErrors("ridaId");
    setRidaSearch("");
    setRidaDropdownOpen(false);
  }

  async function onSubmit(data: FormValues) {
    clearErrors("root");
    if (!data.ridaId?.trim()) {
      setError("ridaId", { type: "manual", message: "Please select a Rida" });
      return;
    }
    try {
      const body = {
        ridaId: data.ridaId,
        customer: data.customer.trim(),
        reseller: data.reseller.trim(),
        amount: Number(data.amount),
        profit: Number(data.profit),
        address: data.address?.trim() || undefined,
      };
      if (isEdit && invoice?._id) {
        await api(`/api/invoices/${invoice._id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await api("/api/invoices", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      onSuccess();
    } catch (err) {
      setError("root", {
        type: "manual",
        message: err instanceof Error ? err.message : "Request failed",
      });
    }
  }

  const inputClass =
    "w-full min-h-[44px] rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-form-title"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl border border-zinc-200 bg-white shadow-lg sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-6">
          <h2
            id="invoice-form-title"
            className="text-lg font-semibold text-zinc-900"
          >
            {isEdit ? "Edit Invoice" : "Create Invoice"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6"
        >
          <div className="space-y-4">

            {/* ── Rida selector ─────────────────────────────── */}
            <div className="relative">
              <label
                htmlFor="invoice-rida"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                Rida *
              </label>

              {/* Selected Rida image preview (shown when something is selected & dropdown closed) */}
              {selectedRida?.ridaImage && !ridaDropdownOpen && (
                <div className="mb-2 flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-2">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-white">
                    <Image
                      src={selectedRida.ridaImage}
                      alt={selectedRida.ridaName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {selectedRida.ridaName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      ₹{selectedRida.price} · profit ₹{selectedRida.profit}
                    </p>
                  </div>
                </div>
              )}

              <input
                id="invoice-rida"
                type="text"
                value={ridaDropdownOpen ? ridaSearch : ridaDisplay}
                onChange={(e) => {
                  const v = e.target.value;
                  setRidaSearch(v);
                  if (!ridaDropdownOpen) setRidaDropdownOpen(true);
                  if (!v.trim()) {
                    setValue("ridaId", "");
                    setValue("ridaDisplay", "");
                  }
                }}
                onFocus={() => {
                  setRidaDropdownOpen(true);
                  setRidaSearch(ridaDisplay);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setRidaDropdownOpen(false);
                    const trimmed = ridaSearch.trim();
                    const match = trimmed
                      ? (ridas.find((r) =>
                        r.ridaName.toLowerCase() === trimmed.toLowerCase()
                      ) || null)
                      : null;
                    if (match) {
                      setValue("ridaId", match._id);
                      setValue("ridaDisplay", match.ridaName);
                      clearErrors("ridaId");
                    } else {
                      if (selectedRida) {
                        setRidaSearch("");
                        setValue("ridaDisplay", selectedRida.ridaName);
                      } else {
                        setRidaSearch("");
                        setValue("ridaId", "");
                        setValue("ridaDisplay", "");
                      }
                    }
                  }, 200);
                }}
                className={inputClass}
                placeholder="Search or select Rida"
                autoComplete="off"
              />

              {/* Dropdown list with image thumbnails */}
              {ridaDropdownOpen && (
                <ul
                  className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-md"
                  role="listbox"
                  aria-activedescendant={
                    selectedRida ? `rida-option-${selectedRida._id}` : undefined
                  }
                >
                  {filteredRidas.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-zinc-500">
                      No Rida found
                    </li>
                  ) : (
                    filteredRidas.map((r) => {
                      const isSelected = selectedRida?._id === r._id;
                      return (
                        <li
                          key={r._id}
                          id={isSelected ? `rida-option-${r._id}` : undefined}
                          role="option"
                          aria-selected={isSelected}
                          className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-zinc-50 ${isSelected
                              ? "bg-blue-50 font-medium text-blue-800 ring-1 ring-blue-200"
                              : "text-zinc-900"
                            }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectRida(r);
                          }}
                        >
                          {/* Thumbnail in dropdown */}
                          {r.ridaImage ? (
                            <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
                              <Image
                                src={r.ridaImage}
                                alt={r.ridaName}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400">
                              ?
                            </div>
                          )}

                          {/* Name + price info */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium leading-tight">
                              {r.ridaName}
                            </p>
                            <p className={`text-xs leading-tight ${isSelected ? "text-blue-600" : "text-zinc-500"}`}>
                              ₹{r.price} · profit ₹{r.profit}
                            </p>
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}

              {errors.ridaId && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.ridaId.message}
                </p>
              )}
            </div>

            {/* ── Other fields ───────────────────────────────── */}
            <div>
              <label
                htmlFor="invoice-customer"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                Customer *
              </label>
              <input
                id="invoice-customer"
                type="text"
                className={inputClass}
                required
                {...register("customer", { required: "Customer is required" })}
              />
              {errors.customer && (
                <p className="mt-1 text-sm text-red-600">{errors.customer.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="invoice-reseller"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                Reseller *
              </label>
              <input
                id="invoice-reseller"
                type="text"
                className={inputClass}
                required
                {...register("reseller", { required: "Reseller is required" })}
              />
              {errors.reseller && (
                <p className="mt-1 text-sm text-red-600">{errors.reseller.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="invoice-amount"
                  className="mb-1.5 block text-sm font-medium text-zinc-700"
                >
                  Amount *
                </label>
                <input
                  id="invoice-amount"
                  type="number"
                  min={0}
                  step={0.01}
                  className={inputClass}
                  required
                  {...register("amount", {
                    required: "Amount is required",
                    valueAsNumber: true,
                    min: { value: 0, message: "Amount must be ≥ 0" },
                  })}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="invoice-profit"
                  className="mb-1.5 block text-sm font-medium text-zinc-700"
                >
                  Profit
                </label>
                <input
                  id="invoice-profit"
                  type="number"
                  step={0.01}
                  className={inputClass}
                  {...register("profit", { valueAsNumber: true })}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="invoice-address"
                className="mb-1.5 block text-sm font-medium text-zinc-700"
              >
                Address
              </label>
              <input
                id="invoice-address"
                type="text"
                className={inputClass}
                {...register("address")}
              />
            </div>
            {errors.root && (
              <p className="text-sm text-red-600" role="alert">
                {errors.root.message}
              </p>
            )}
          </div>
          <div className="mt-6 flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : isEdit ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
