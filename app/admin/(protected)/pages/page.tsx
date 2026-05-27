"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  ListChecks,
  Plus,
  Search,
  SquareDashed,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import { adminApi, UnauthorizedError } from "@/lib/adminApi";

interface DraftBenefit {
  title?: string | null;
  summary?: string | null;
  description?: string | null;
  conditions?: string | null;
  who_applies?: string | null;
  validity?: string | null;
  value?: string | null;
  regulation_level?: string | null;
  category_slug?: string | null;
  contacts?: string | null;
  // Legacy crawler fields (pre-schema-change drafts).
  benefit?: string | null;
  category?: string | null;
  discount_value?: string | null;
}

interface PageItem {
  id: number;
  name: string;
  website: string | null;
  lon: number | null;
  lat: number | null;
  bbox: string | null;
  y_id: string | null;
  is_to_crawl: boolean;
  benefits: unknown;
}

interface PageListResponse {
  items: PageItem[];
  total: number;
  page: number;
  per_page: number;
}

const PER_PAGE = 20;

export default function PagesAdminPage() {
  const router = useRouter();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  // pageId → { sourceIndex: benefitId }
  const [promotedByPage, setPromotedByPage] = useState<Record<number, Record<string, number>>>({});
  const [promoting, setPromoting] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
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

  const fetchPages = useCallback(
    async (page: number, query: string) => {
      const data = await safeApi(() =>
        adminApi<PageListResponse>(
          `/pages?page=${page}&per_page=${PER_PAGE}&search=${encodeURIComponent(query)}`,
        ),
      );
      if (!data) return;
      setPages(data.items);
      setTotal(data.total);
    },
    [safeApi],
  );

  const loadPromoted = useCallback(
    async (pageId: number) => {
      const data = await safeApi(() =>
        adminApi<{ map: Record<string, number> }>(`/admin/benefits/by-page/${pageId}`),
      );
      if (!data) return;
      setPromotedByPage((prev) => ({ ...prev, [pageId]: data.map }));
    },
    [safeApi],
  );

  useEffect(() => {
    fetchPages(1, "");
  }, [fetchPages]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchPages(1, value);
    }, 300);
  }

  function goPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
    fetchPages(p, search);
  }

  function toggleSelect(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleExpand(pageId: number) {
    setExpanded((prev) => {
      const next = prev === pageId ? null : pageId;
      if (next !== null && promotedByPage[next] === undefined) {
        loadPromoted(next);
      }
      return next;
    });
  }

  async function toggleCrawl(page: PageItem) {
    const nextValue = !page.is_to_crawl;
    setPages((prev) =>
      prev.map((p) => (p.id === page.id ? { ...p, is_to_crawl: nextValue } : p)),
    );
    await safeApi(() =>
      adminApi("/pages/toggle-crawl", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [page.id], is_to_crawl: nextValue }),
      }),
    );
  }

  async function promoteDraft(pageId: number, index: number) {
    const key = `${pageId}-${index}`;
    setPromoting((prev) => new Set(prev).add(key));
    const result = await safeApi(() =>
      adminApi<{ id: number }>("/admin/benefits/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: pageId, index }),
      }),
    );
    if (result) {
      setPromotedByPage((prev) => ({
        ...prev,
        [pageId]: { ...(prev[pageId] ?? {}), [String(index)]: result.id },
      }));
    }
    setPromoting((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function selectAllOnPage() {
    setSelected(pages.map((p) => p.id));
  }

  // Promote every draft of every selected page. The promote endpoint is
  // idempotent, so already-promoted drafts are returned as-is.
  async function promoteAllSelected() {
    const targets = pages.filter(
      (p) => selected.includes(p.id) && Array.isArray(p.benefits) && p.benefits.length,
    );
    if (!targets.length) return;
    setBulkBusy(true);
    for (const page of targets) {
      const drafts = page.benefits as unknown[];
      for (let idx = 0; idx < drafts.length; idx++) {
        const result = await safeApi(() =>
          adminApi<{ id: number }>("/admin/benefits/promote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ page_id: page.id, index: idx }),
          }),
        );
        if (result) {
          setPromotedByPage((prev) => ({
            ...prev,
            [page.id]: { ...(prev[page.id] ?? {}), [String(idx)]: result.id },
          }));
        }
      }
    }
    setBulkBusy(false);
  }

  // Unpromote one draft = delete the Benefit row it created.
  async function unpromoteDraft(pageId: number, index: number, benefitId: number) {
    await safeApi(() => adminApi(`/admin/benefits/${benefitId}`, { method: "DELETE" }));
    setPromotedByPage((prev) => {
      const map = { ...(prev[pageId] ?? {}) };
      delete map[String(index)];
      return { ...prev, [pageId]: map };
    });
  }

  // Delete every promoted Benefit of every selected page.
  async function unpromoteAllSelected() {
    if (!selected.length) return;
    if (
      !window.confirm(
        "Удалить все промотированные Benefit для выбранных страниц?",
      )
    )
      return;
    setBulkBusy(true);
    for (const pageId of selected) {
      let map = promotedByPage[pageId];
      if (map === undefined) {
        const data = await safeApi(() =>
          adminApi<{ map: Record<string, number> }>(`/admin/benefits/by-page/${pageId}`),
        );
        map = data?.map ?? {};
      }
      for (const benefitId of Object.values(map)) {
        await safeApi(() => adminApi(`/admin/benefits/${benefitId}`, { method: "DELETE" }));
      }
      setPromotedByPage((prev) => ({ ...prev, [pageId]: {} }));
    }
    setBulkBusy(false);
  }

  async function exportAllBenefits() {
    const items = await safeApi(() => adminApi<PageItem[]>("/pages/with-benefits"));
    if (!items) return;
    downloadJson(items, `benefits-${Date.now()}.json`);
  }

  async function exportSelected() {
    if (!selected.length) return;
    const query = selected.map((id) => `ids=${id}`).join("&");
    const items = await safeApi(() => adminApi<PageItem[]>(`/pages/by-ids?${query}`));
    if (!items) return;
    downloadJson(items, `pages-${Date.now()}.json`);
  }

  async function deleteSelected() {
    if (!selected.length) return;
    const query = selected.map((id) => `ids=${id}`).join("&");
    await safeApi(() => adminApi(`/pages?${query}`, { method: "DELETE" }));
    setSelected([]);
    fetchPages(currentPage, search);
  }

  async function uploadPages(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    await safeApi(() => adminApi("/crawl/upload", { method: "POST", body: form }));
    event.target.value = "";
    fetchPages(currentPage, search);
  }

  const hasSelection = selected.length > 0;

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex w-full flex-1 items-center rounded bg-[#e9e7f0] px-3 py-2 sm:w-auto sm:max-w-xs">
          <Search className="mr-2 h-4 w-4 text-[#454652]" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search pages..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#e9e7f0] px-4 py-2 text-xs font-medium text-[#1a1b22] hover:bg-[#e3e1ea]">
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload
            <input type="file" accept=".csv" className="hidden" onChange={uploadPages} />
          </label>

          <button
            type="button"
            onClick={exportAllBenefits}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#e9e7f0] px-4 py-2 text-xs font-medium text-[#1a1b22] hover:bg-[#e3e1ea]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export all benefits
          </button>

          <button
            type="button"
            onClick={selectAllOnPage}
            disabled={!pages.length}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#e9e7f0] px-4 py-2 text-xs font-medium text-[#1a1b22] hover:bg-[#e3e1ea] disabled:opacity-40"
          >
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            Select all on this page
          </button>

          <button
            type="button"
            onClick={() => setSelected([])}
            disabled={!hasSelection}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium disabled:opacity-40 ${
              hasSelection
                ? "bg-[#e9e7f0] text-[#1a1b22] hover:bg-[#e3e1ea]"
                : "bg-[#e9e7f0] text-[#454652]"
            }`}
          >
            <SquareDashed className="h-4 w-4" aria-hidden="true" />
            Deselect all
          </button>

          <button
            type="button"
            onClick={exportSelected}
            disabled={!hasSelection}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium disabled:opacity-40 ${
              hasSelection
                ? "bg-[#e9e7f0] text-[#1a1b22] hover:bg-[#e3e1ea]"
                : "bg-[#e9e7f0] text-[#454652]"
            }`}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export JSON
          </button>

          <button
            type="button"
            onClick={promoteAllSelected}
            disabled={!hasSelection || bulkBusy}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #24389c, #3f51b5)" }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {bulkBusy ? "Working..." : "Promote all"}
          </button>

          <button
            type="button"
            onClick={unpromoteAllSelected}
            disabled={!hasSelection || bulkBusy}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium disabled:opacity-40 ${
              hasSelection && !bulkBusy
                ? "bg-amber-50 text-[#92400e] hover:bg-amber-100"
                : "bg-[#e9e7f0] text-[#454652]"
            }`}
          >
            <Undo2 className="h-4 w-4" aria-hidden="true" />
            Unpromote all
          </button>

          <button
            type="button"
            onClick={deleteSelected}
            disabled={!hasSelection}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium disabled:opacity-40 ${
              hasSelection
                ? "bg-red-50 text-[#ba1a1a] hover:bg-red-100"
                : "bg-[#e9e7f0] text-[#454652]"
            }`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-md bg-white md:block">
        <div className="grid grid-cols-[32px_1fr_100px_1fr_1fr_150px_90px_80px_40px] items-center bg-[#f4f2fc] px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] text-[#454652]">
          <div></div>
          <div>Name</div>
          <div>Yandex ID</div>
          <div>Website</div>
          <div>Address</div>
          <div>Coordinates (Lat/Lon)</div>
          <div>Benefits</div>
          <div>To Crawl</div>
          <div></div>
        </div>

        {pages.map((page) => (
          <div key={page.id}>
            <div
              className={`grid cursor-pointer grid-cols-[32px_1fr_100px_1fr_1fr_150px_90px_80px_40px] items-center px-4 py-3 text-sm transition-colors hover:bg-[#f4f2fc] ${
                selected.includes(page.id) ? "bg-[#f4f2fc]/50" : ""
              }`}
            >
              <div>
                <input
                  type="checkbox"
                  checked={selected.includes(page.id)}
                  onChange={() => toggleSelect(page.id)}
                  className="accent-[#3f51b5]"
                />
              </div>
              <div className="truncate pr-2 font-medium">{page.name}</div>
              <div className="font-mono text-xs text-[#454652]">{page.y_id || "—"}</div>
              <div className="text-xs">
                {page.website ? (
                  <a
                    href={page.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#3f51b5] hover:underline"
                  >
                    {shortUrl(page.website)}
                  </a>
                ) : (
                  <span className="text-[#454652]">—</span>
                )}
              </div>
              <div className="truncate text-xs text-[#454652]">{page.bbox || "—"}</div>
              <div className="text-xs text-[#454652]">
                {page.lat != null && page.lon != null
                  ? `${page.lat.toFixed(4)},  ${page.lon.toFixed(4)}`
                  : "—"}
              </div>
              <div className="text-xs text-[#454652]">{benefitsCount(page.benefits)}</div>
              <div>
                <input
                  type="checkbox"
                  checked={page.is_to_crawl}
                  onChange={() => toggleCrawl(page)}
                  className="h-4 w-4 accent-[#3f51b5]"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => toggleExpand(page.id)}
                  className="text-[#454652] hover:text-[#1a1b22]"
                  aria-label={expanded === page.id ? "Свернуть" : "Развернуть"}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expanded === page.id ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {expanded === page.id && (
              <div className="border-t border-[#c5c5d4]/40 bg-[#f4f2fc] px-4 py-4 sm:px-12">
                <DraftBenefitsList
                  page={page}
                  promoted={promotedByPage[page.id] ?? {}}
                  promoting={promoting}
                  onPromote={(idx) => promoteDraft(page.id, idx)}
                  onUnpromote={(idx, benefitId) => unpromoteDraft(page.id, idx, benefitId)}
                />
              </div>
            )}
          </div>
        ))}

        {!pages.length && (
          <div className="px-4 py-12 text-center text-sm text-[#454652]">No pages found</div>
        )}
      </div>

      <div className="flex flex-col gap-2 md:hidden">
        {pages.map((page) => (
          <div
            key={`m-${page.id}`}
            className={`rounded-md bg-white p-3 transition-colors ${
              selected.includes(page.id) ? "bg-[#f4f2fc]/50 ring-1 ring-[#3f51b5]/30" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.includes(page.id)}
                onChange={() => toggleSelect(page.id)}
                className="mt-1 flex-shrink-0 accent-[#3f51b5]"
              />
              <div className="min-w-0 flex-1">
                <div className="break-words text-sm font-medium">{page.name}</div>
                {page.website && (
                  <a
                    href={page.website}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-xs text-[#3f51b5] hover:underline"
                  >
                    {shortUrl(page.website)}
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleExpand(page.id)}
                className="flex-shrink-0 text-[#454652] hover:text-[#1a1b22]"
                aria-label={expanded === page.id ? "Свернуть" : "Развернуть"}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expanded === page.id ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <dt className="text-[10px] uppercase tracking-wider text-[#454652]">Yandex ID</dt>
              <dd className="truncate font-mono text-[#454652]">{page.y_id || "—"}</dd>

              <dt className="text-[10px] uppercase tracking-wider text-[#454652]">Address</dt>
              <dd className="break-words text-[#454652]">{page.bbox || "—"}</dd>

              <dt className="text-[10px] uppercase tracking-wider text-[#454652]">Coords</dt>
              <dd className="text-[#454652]">
                {page.lat != null && page.lon != null
                  ? `${page.lat.toFixed(4)}, ${page.lon.toFixed(4)}`
                  : "—"}
              </dd>

              <dt className="text-[10px] uppercase tracking-wider text-[#454652]">Benefits</dt>
              <dd className="text-[#454652]">{benefitsCount(page.benefits)}</dd>
            </dl>

            <label className="mt-3 flex items-center gap-2 text-xs text-[#454652]">
              <input
                type="checkbox"
                checked={page.is_to_crawl}
                onChange={() => toggleCrawl(page)}
                className="h-4 w-4 accent-[#3f51b5]"
              />
              To crawl
            </label>

            {expanded === page.id && (
              <div className="mt-3 border-t border-[#c5c5d4]/40 pt-3">
                <DraftBenefitsList
                  page={page}
                  promoted={promotedByPage[page.id] ?? {}}
                  promoting={promoting}
                  onPromote={(idx) => promoteDraft(page.id, idx)}
                  onUnpromote={(idx, benefitId) => unpromoteDraft(page.id, idx, benefitId)}
                />
              </div>
            )}
          </div>
        ))}

        {!pages.length && (
          <div className="rounded-md bg-white px-4 py-12 text-center text-sm text-[#454652]">
            No pages found
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

function DraftBenefitsList({
  page,
  promoted,
  promoting,
  onPromote,
  onUnpromote,
}: {
  page: PageItem;
  promoted: Record<string, number>;
  promoting: Set<string>;
  onPromote: (index: number) => void;
  onUnpromote: (index: number, benefitId: number) => void;
}) {
  if (!Array.isArray(page.benefits) || page.benefits.length === 0) {
    return <p className="text-xs italic text-[#454652]">No benefits found</p>;
  }

  return (
    <div className="space-y-3">
      {(page.benefits as DraftBenefit[]).map((draft, idx) => {
        const benefitId = promoted[String(idx)];
        const isPromoted = benefitId !== undefined;
        const isLoading = promoting.has(`${page.id}-${idx}`);

        const draftTitle = draft.title || draft.benefit || "—";
        const draftValue = draft.value || draft.discount_value;

        return (
          <div key={idx} className="rounded-md bg-white p-3 sm:p-4">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {draftValue && (
                  <span className="inline-block rounded bg-[#cacfff] px-2 py-0.5 text-[11px] text-[#24389c]">
                    {draftValue}
                  </span>
                )}
                {draft.regulation_level && (
                  <span className="inline-block rounded bg-[#e9e7f0] px-2 py-0.5 text-[11px] text-[#454652]">
                    {draft.regulation_level}
                  </span>
                )}
                {draft.category_slug && (
                  <span className="inline-block rounded bg-[#e9e7f0] px-2 py-0.5 text-[11px] text-[#454652]">
                    {draft.category_slug}
                  </span>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-1.5">
                {isPromoted ? (
                  <>
                    <Link
                      href={`/admin/benefits/${benefitId}`}
                      className="inline-flex items-center gap-1 rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Promoted
                      <ExternalLink className="ml-1 h-3 w-3" aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onUnpromote(idx, benefitId!)}
                      className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-[#92400e] hover:bg-amber-100"
                    >
                      <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Unpromote
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onPromote(idx)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #24389c, #3f51b5)" }}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    {isLoading ? "Promoting..." : "Promote"}
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm font-medium text-[#1a1b22]">{draftTitle}</p>
            {draft.summary && (
              <p className="mt-1 text-xs text-[#454652]">{draft.summary}</p>
            )}
            {draft.who_applies && (
              <p className="mt-2 text-xs text-[#454652]">
                <span className="font-semibold uppercase tracking-wide">Кто может получить: </span>
                {draft.who_applies}
              </p>
            )}
            {draft.conditions && (
              <p className="mt-1.5 text-xs text-[#454652]">
                <span className="font-semibold uppercase tracking-wide">Условия: </span>
                {draft.conditions}
              </p>
            )}
            {draft.validity && (
              <p className="mt-1.5 text-xs text-[#454652]">
                <span className="font-semibold uppercase tracking-wide">Срок действия: </span>
                {draft.validity}
              </p>
            )}
            {draft.contacts && (
              <p className="mt-1.5 text-xs text-[#454652]">
                <span className="font-semibold uppercase tracking-wide">Контакты: </span>
                {draft.contacts}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function shortUrl(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function benefitsCount(benefits: unknown): string {
  if (Array.isArray(benefits)) return String(benefits.length);
  if (benefits && typeof benefits === "object") return String(Object.keys(benefits).length);
  return "—";
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
