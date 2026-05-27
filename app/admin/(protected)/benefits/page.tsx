"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Search, Trash2 } from "lucide-react";
import { adminApi, UnauthorizedError } from "@/lib/adminApi";
import type { AdminBenefit, AdminBenefitListResponse } from "@/lib/adminBenefit";
import { BenefitEditor } from "@/components/admin/BenefitEditor";

const PER_PAGE = 20;

export default function BenefitsAdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminBenefit[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const paginationRange = useMemo(() => {
    const tp = totalPages;
    const cp = currentPage;
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
    const range: Array<number | "..."> = [1];
    if (cp > 3) range.push("...");
    for (let i = Math.max(2, cp - 1); i <= Math.min(tp - 1, cp + 1); i++) range.push(i);
    if (cp < tp - 2) range.push("...");
    range.push(tp);
    return range;
  }, [currentPage, totalPages]);

  const safeApi = useCallback(
    async <T,>(fn: () => Promise<T>) => {
      try {
        return await fn();
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          router.replace("/admin/login");
        }
        return undefined;
      }
    },
    [router],
  );

  const fetchBenefits = useCallback(
    async (page: number, query: string) => {
      const data = await safeApi(() =>
        adminApi<AdminBenefitListResponse>(
          `/admin/benefits?page=${page}&per_page=${PER_PAGE}&search=${encodeURIComponent(query)}`,
        ),
      );
      if (!data) return;
      setItems(data.items);
      setTotal(data.total);
    },
    [safeApi],
  );

  useEffect(() => {
    fetchBenefits(1, "");
  }, [fetchBenefits]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchBenefits(1, value);
    }, 300);
  }

  function goPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setEditingId(null);
    setCurrentPage(p);
    fetchBenefits(p, search);
  }

  function toggleEdit(id: number) {
    setEditingId((prev) => (prev === id ? null : id));
  }

  async function togglePublished(benefit: AdminBenefit) {
    const next = !benefit.is_published;
    setItems((prev) =>
      prev.map((b) => (b.id === benefit.id ? { ...b, is_published: next } : b)),
    );
    await safeApi(() =>
      adminApi(`/admin/benefits/${benefit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: next }),
      }),
    );
  }

  async function handleDelete(benefit: AdminBenefit) {
    if (!window.confirm(`Удалить «${benefit.title}»?`)) return;
    if (editingId === benefit.id) setEditingId(null);
    await safeApi(() => adminApi(`/admin/benefits/${benefit.id}`, { method: "DELETE" }));
    fetchBenefits(currentPage, search);
  }

  function handleSaved() {
    setEditingId(null);
    fetchBenefits(currentPage, search);
  }

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex w-full flex-1 items-center rounded bg-[#e9e7f0] px-3 py-2 sm:w-auto sm:max-w-xs">
          <Search className="mr-2 h-4 w-4 text-[#454652]" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search benefits..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>
        <div className="text-xs text-[#454652]">Всего: {total}</div>
      </div>

      <div className="hidden overflow-hidden rounded-md bg-white md:block">
        <div className="grid grid-cols-[1fr_200px_120px_120px] items-center bg-[#f4f2fc] px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] text-[#454652]">
          <div>Title</div>
          <div>Categories</div>
          <div>Published</div>
          <div className="text-right">Actions</div>
        </div>

        {items.map((benefit) => {
          const isEditing = editingId === benefit.id;
          return (
            <div key={benefit.id} className="border-t border-[#f4f2fc]">
              <div
                className={`grid grid-cols-[1fr_200px_120px_120px] items-center px-4 py-3 text-sm transition-colors hover:bg-[#f4f2fc] ${
                  isEditing ? "bg-[#f4f2fc]" : ""
                }`}
              >
                <div className="truncate pr-2 font-medium">{benefit.title}</div>
                <div className="flex flex-wrap gap-1">
                  {benefit.tabs.length === 0 ? (
                    <span className="text-xs text-[#454652]">—</span>
                  ) : (
                    benefit.tabs.map((tab) => (
                      <span
                        key={tab.id}
                        className="inline-flex items-center rounded bg-[#e9e7f0] px-2 py-0.5 text-[11px] text-[#454652]"
                      >
                        {tab.name}
                      </span>
                    ))
                  )}
                </div>
                <div>
                  <input
                    type="checkbox"
                    checked={benefit.is_published}
                    onChange={() => togglePublished(benefit)}
                    className="h-4 w-4 accent-[#3f51b5]"
                  />
                </div>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => toggleEdit(benefit.id)}
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                      isEditing
                        ? "bg-[#cacfff] text-[#24389c]"
                        : "bg-[#e9e7f0] text-[#1a1b22] hover:bg-[#e3e1ea]"
                    }`}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    {isEditing ? "Закрыть" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(benefit)}
                    className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-[#ba1a1a] hover:bg-red-100"
                    aria-label="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="border-t border-[#c5c5d4]/40 bg-[#f4f2fc] px-4 py-4 sm:px-8">
                  <BenefitEditor
                    benefitId={benefit.id}
                    onSaved={handleSaved}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
            </div>
          );
        })}

        {!items.length && (
          <div className="px-4 py-12 text-center text-sm text-[#454652]">
            Пока нет benefits. Перейдите в Pages и нажмите «Promote» на каком-нибудь
            бенефите, найденном краулером.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 md:hidden">
        {items.map((benefit) => {
          const isEditing = editingId === benefit.id;
          return (
            <div key={`m-${benefit.id}`} className="rounded-md bg-white p-3">
              <div className="mb-2 break-words text-sm font-medium">{benefit.title}</div>
              {benefit.tabs.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {benefit.tabs.map((tab) => (
                    <span
                      key={tab.id}
                      className="inline-flex items-center rounded bg-[#e9e7f0] px-2 py-0.5 text-[11px] text-[#454652]"
                    >
                      {tab.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-[#454652]">
                  <input
                    type="checkbox"
                    checked={benefit.is_published}
                    onChange={() => togglePublished(benefit)}
                    className="h-4 w-4 accent-[#3f51b5]"
                  />
                  Published
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => toggleEdit(benefit.id)}
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                      isEditing
                        ? "bg-[#cacfff] text-[#24389c]"
                        : "bg-[#e9e7f0] text-[#1a1b22] hover:bg-[#e3e1ea]"
                    }`}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    {isEditing ? "Закрыть" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(benefit)}
                    className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-[#ba1a1a] hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="mt-3 border-t border-[#c5c5d4]/40 pt-3">
                  <BenefitEditor
                    benefitId={benefit.id}
                    onSaved={handleSaved}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
            </div>
          );
        })}

        {!items.length && (
          <div className="rounded-md bg-white px-4 py-12 text-center text-sm text-[#454652]">
            Пока нет benefits.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1 sm:justify-end">
          <button
            type="button"
            onClick={() => goPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-7 w-7 rounded text-xs text-[#454652] hover:bg-[#e9e7f0] disabled:opacity-30"
          >
            &lt;
          </button>
          {paginationRange.map((p, idx) =>
            p === "..." ? (
              <span key={`gap-${idx}`} className="px-1 text-xs text-[#454652]">
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => goPage(p)}
                className={`h-7 w-7 rounded text-xs ${
                  p === currentPage
                    ? "bg-[#3f51b5] font-semibold text-white"
                    : "text-[#454652] hover:bg-[#e9e7f0]"
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => goPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-7 w-7 rounded text-xs text-[#454652] hover:bg-[#e9e7f0] disabled:opacity-30"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}
