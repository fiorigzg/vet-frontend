"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, X } from "lucide-react";
import { adminApi, UnauthorizedError } from "@/lib/adminApi";
import type { AdminPopularQuery } from "@/lib/adminPopularQuery";

type EditableQuery = Omit<AdminPopularQuery, "id"> & { id: number | null };

const EMPTY: EditableQuery = {
  id: null,
  text: "",
  sort_order: 0,
  is_active: true,
};

// The actions column is a fixed width (not `auto`) so the column tracks are
// identical between the header row and data rows — otherwise content-derived
// `auto` widths differ (header has just "ACTIONS", rows have buttons) and the
// 1fr column expands differently in each, pushing all subsequent cells off.
const COLS = "sm:grid-cols-[1fr_120px_80px_180px]";

export default function PopularQueriesAdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminPopularQuery[]>([]);
  const [draft, setDraft] = useState<EditableQuery | null>(null);

  const safeApi = useCallback(
    async <T,>(fn: () => Promise<T>) => {
      try {
        return await fn();
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          router.replace("/admin/login");
        } else {
          window.alert(err instanceof Error ? err.message : "Ошибка");
        }
        return undefined;
      }
    },
    [router],
  );

  const load = useCallback(async () => {
    const data = await safeApi(() =>
      adminApi<AdminPopularQuery[]>("/admin/popular-queries"),
    );
    if (data) setItems(data);
  }, [safeApi]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveRow(row: EditableQuery, index: number | null) {
    if (!row.text.trim()) {
      window.alert("Заполните текст запроса");
      return;
    }
    const body = JSON.stringify({
      text: row.text,
      sort_order: row.sort_order,
      is_active: row.is_active,
    });

    if (row.id === null) {
      const created = await safeApi(() =>
        adminApi<AdminPopularQuery>("/admin/popular-queries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }),
      );
      if (created) {
        setItems((prev) => [...prev, created]);
        setDraft(null);
      }
    } else {
      const updated = await safeApi(() =>
        adminApi<AdminPopularQuery>(`/admin/popular-queries/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
        }),
      );
      if (updated && index !== null) {
        setItems((prev) => prev.map((q, i) => (i === index ? updated : q)));
      }
    }
  }

  async function deleteRow(id: number) {
    if (!window.confirm("Удалить запрос?")) return;
    await safeApi(() =>
      adminApi(`/admin/popular-queries/${id}`, { method: "DELETE" }),
    );
    setItems((prev) => prev.filter((q) => q.id !== id));
  }

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#454652]">
          Подсказки «Часто ищут» в hero публичного сайта. Клик по чипу запускает
          поиск по этому тексту.
        </p>
        {draft === null && (
          <button
            type="button"
            onClick={() => setDraft({ ...EMPTY })}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #24389c, #3f51b5)" }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Добавить запрос
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-md bg-white">
        <div
          className={`hidden grid-cols-1 items-center bg-[#f4f2fc] px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] text-[#454652] sm:grid sm:gap-2 ${COLS}`}
        >
          <div>Текст</div>
          <div>Порядок</div>
          <div>Active</div>
          <div className="text-right">Actions</div>
        </div>

        {draft !== null && (
          <QueryRow
            row={draft}
            onChange={setDraft}
            onSave={() => saveRow(draft, null)}
            onCancel={() => setDraft(null)}
          />
        )}

        {items.map((row, index) => (
          <QueryRow
            key={row.id}
            row={row}
            onChange={(updated) =>
              setItems((prev) =>
                prev.map((q, i) =>
                  i === index ? { ...q, ...updated, id: q.id } : q,
                ),
              )
            }
            onSave={() => saveRow(items[index], index)}
            onDelete={() => deleteRow(row.id)}
          />
        ))}

        {items.length === 0 && draft === null && (
          <div className="px-4 py-12 text-center text-sm text-[#454652]">
            Пока нет запросов.
          </div>
        )}
      </div>
    </div>
  );
}

function QueryRow({
  row,
  onChange,
  onSave,
  onDelete,
  onCancel,
}: {
  row: EditableQuery;
  onChange: (next: EditableQuery) => void;
  onSave: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
}) {
  return (
    <div
      className={`grid grid-cols-1 items-center gap-3 border-t border-[#f4f2fc] px-4 py-3 sm:gap-2 ${COLS}`}
    >
      <input
        type="text"
        placeholder="Текст запроса (например: Санаторий)"
        value={row.text}
        onChange={(e) => onChange({ ...row, text: e.target.value })}
        className="rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
      />
      <input
        type="number"
        placeholder="Порядок"
        value={row.sort_order}
        onChange={(e) =>
          onChange({ ...row, sort_order: Number(e.target.value) || 0 })
        }
        className="rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
      />
      <label className="flex items-center gap-2 text-xs text-[#454652]">
        <input
          type="checkbox"
          checked={row.is_active}
          onChange={(e) => onChange({ ...row, is_active: e.target.checked })}
          className="h-4 w-4 accent-[#3f51b5]"
        />
        <span className="sm:hidden">Active</span>
      </label>
      <div className="flex justify-end gap-1">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #24389c, #3f51b5)" }}
        >
          <Save className="h-3.5 w-3.5" aria-hidden="true" />
          Save
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-md bg-[#e9e7f0] px-2.5 py-2 text-xs font-medium text-[#454652] hover:bg-[#e3e1ea]"
            aria-label="Отмена"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md bg-red-50 px-2.5 py-2 text-xs font-medium text-[#ba1a1a] hover:bg-red-100"
            aria-label="Удалить"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
