"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type RidaItem } from "@/lib/api";
import { PencilIcon, TrashIcon } from "@/components/icons";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

/* ── Image Preview Modal ─────────────────────────────────────── */
function ImagePreviewModal({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${alt}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
      >
        <span className="text-2xl leading-none">×</span>
      </button>

      {/* Image container — fills most of viewport on all devices */}
      <div className="relative max-h-[85dvh] max-w-[92dvw] sm:max-w-[80dvw] md:max-w-[70dvw] w-full rounded-xl overflow-hidden shadow-2xl">
        {/* Use a plain <img> here for unconstrained natural size */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="block max-h-[85dvh] w-full object-contain"
        />
      </div>

      {/* Label bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
        {alt}
      </div>
    </div>
  );
}

/* ── Eye icon ─────────────────────────────────────────────────── */
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

/* ── Rida Form ────────────────────────────────────────────────── */
type RidaFormProps = {
  rida?: RidaItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

function RidaForm({ rida, onClose, onSuccess }: RidaFormProps) {
  const isEdit = !!rida;
  const [ridaName, setRidaName] = useState(rida?.ridaName ?? "");
  const [price, setPrice] = useState(rida ? String(rida.price) : "");
  const [profit, setProfit] = useState(rida ? String(rida.profit) : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    rida?.ridaImage ?? null
  );
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setRemoveImage(false);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const priceNum = parseFloat(price) || 0;
    const profitNum = parseFloat(profit) || 0;
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("ridaName", ridaName.trim());
      fd.append("price", String(priceNum));
      fd.append("profit", String(profitNum));

      if (imageFile) {
        fd.append("image", imageFile);
      } else if (isEdit) {
        if (removeImage) {
          fd.append("ridaImage", "");
        } else if (rida?.ridaImage) {
          fd.append("ridaImage", rida.ridaImage);
        }
      }

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const url = isEdit ? `/api/ridas/${rida!._id}` : "/api/ridas";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, { method, headers, body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || "Request failed");
      }

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
      aria-labelledby="rida-form-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-6">
          <h2 id="rida-form-title" className="text-lg font-semibold text-zinc-900">
            {isEdit ? "Edit Rida" : "Add Rida"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-6">
          <div>
            <label htmlFor="rida-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Rida name *
            </label>
            <input
              id="rida-name"
              type="text"
              value={ridaName}
              onChange={(e) => setRidaName(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="rida-price" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Price (selling) *
            </label>
            <input
              id="rida-price"
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="rida-profit" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Default profit per piece *
            </label>
            <input
              id="rida-profit"
              type="number"
              step={0.01}
              value={profit}
              onChange={(e) => setProfit(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Rida image <span className="text-zinc-400">(optional)</span>
            </label>

            {imagePreview && !removeImage && (
              <div className="mb-2 flex items-center gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                  <Image
                    src={imagePreview}
                    alt="Rida preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-sm text-red-500 hover:text-red-700 hover:underline"
                >
                  Remove image
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full cursor-pointer rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-zinc-400">
              JPG, PNG, WEBP — max 32 MB
            </p>
          </div>

          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : isEdit ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Rida Page ────────────────────────────────────────────────── */
export default function RidaPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<RidaItem | null>(null);
  const [previewRida, setPreviewRida] = useState<RidaItem | null>(null);

  const { data: list, isLoading, error } = useQuery<RidaItem[]>({
    queryKey: ["ridas"],
    queryFn: () => api("/api/ridas"),
  });

  const deleteRida = useMutation({
    mutationFn: (id: string) => api(`/api/ridas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ridas"] });
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "Failed to delete Rida");
    },
  });

  return (
    <div>
      <nav className="mb-2 text-sm text-zinc-500" aria-label="Breadcrumb">
        <Link href="/dashboard" className="hover:text-zinc-700">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">Rida Module</span>
      </nav>

      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">Rida Module</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <span className="text-lg leading-none">+</span>
          Add Rida
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        {isLoading && <div className="p-8 text-center text-zinc-500">Loading…</div>}
        {error && (
          <div className="p-8 text-center text-red-600">
            {error instanceof Error ? error.message : "Failed to load Ridas"}
          </div>
        )}
        {list && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-sky-100">
                  <th className="p-3 font-semibold text-zinc-900">Image</th>
                  <th className="p-3 font-semibold text-zinc-900">Rida name</th>
                  <th className="p-3 font-semibold text-zinc-900">Price</th>
                  <th className="p-3 font-semibold text-zinc-900">Profit</th>
                  <th className="p-3 font-semibold text-zinc-900">Cost</th>
                  <th className="p-3 font-semibold text-zinc-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-600">
                      No Ridas yet. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  list.map((r) => (
                    <tr key={r._id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                      {/* Thumbnail + Preview button */}
                      <td className="p-3">
                        {r.ridaImage ? (
                          <button
                            type="button"
                            title="Preview image"
                            aria-label={`Preview image for ${r.ridaName}`}
                            onClick={() => setPreviewRida(r)}
                            className="group relative block h-10 w-10 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 transition-all hover:ring-2 hover:ring-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <Image
                              src={r.ridaImage}
                              alt={r.ridaName}
                              fill
                              className="object-cover transition-opacity group-hover:opacity-75"
                              unoptimized
                            />
                            {/* Hover overlay with eye icon */}
                            <span className="absolute inset-0 flex items-center justify-center bg-blue-600/0 transition-all group-hover:bg-blue-600/30">
                              <EyeIcon className="h-4 w-4 text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100" />
                            </span>
                          </button>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-400">
                            —
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-medium text-zinc-900">{r.ridaName}</td>
                      <td className="p-3 text-zinc-700">{formatMoney(r.price)}</td>
                      <td className="p-3 text-zinc-700">{formatMoney(r.profit)}</td>
                      <td className="p-3 text-zinc-600">{formatMoney(r.price - r.profit)}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {/* Preview button (pill — visible even without image, disabled if no image) */}
                          {r.ridaImage && (
                            <button
                              type="button"
                              onClick={() => setPreviewRida(r)}
                              title="Preview"
                              className="flex h-10 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                              aria-label="Preview"
                            >
                              <EyeIcon className="h-4 w-4" />
                              Preview
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditing(r)}
                            title="Edit"
                            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
                            aria-label="Edit Rida"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => {
                              if (confirm("Delete this Rida? Invoices using it will keep the stored name.")) {
                                deleteRida.mutate(r._id);
                              }
                            }}
                            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                            aria-label="Delete Rida"
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
        )}
      </div>

      {/* Image preview modal */}
      {previewRida?.ridaImage && (
        <ImagePreviewModal
          src={previewRida.ridaImage}
          alt={previewRida.ridaName}
          onClose={() => setPreviewRida(null)}
        />
      )}

      {createOpen && (
        <RidaForm
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false);
            queryClient.invalidateQueries({ queryKey: ["ridas"] });
          }}
        />
      )}
      {editing && (
        <RidaForm
          rida={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ["ridas"] });
          }}
        />
      )}
    </div>
  );
}
