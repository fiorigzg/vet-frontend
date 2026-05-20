"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { adminApi, UnauthorizedError } from "@/lib/adminApi";
import type { AdminTab } from "@/lib/adminTab";

type EditableTab = Omit<AdminTab, "id"> & { id: number | null };

const EMPTY: EditableTab = {
  id: null,
  slug: "",
  name: "",
  subtitle: "",
  sort_order: 0,
  is_active: true,
};

export default function TabsAdminPage() {
  const router = useRouter();
  const [tabs, setTabs] = useState<AdminTab[]>([]);
  const [draft, setDraft] = useState<EditableTab | null>(null);

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
    const data = await safeApi(() => adminApi<AdminTab[]>("/admin/tabs"));
    if (data) setTabs(data);
  }, [safeApi]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveTab(tab: EditableTab, index: number | null) {
    if (!tab.slug.trim() || !tab.name.trim()) {
      window.alert("Заполните slug и name");
      return;
    }

    if (tab.id === null) {
      const created = await safeApi(() =>
        adminApi<AdminTab>("/admin/tabs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: tab.slug,
            name: tab.name,
            subtitle: tab.subtitle,
            sort_order: tab.sort_order,
            is_active: tab.is_active,
          }),
        }),
      );
      if (created) {
        setTabs((prev) => [...prev, created]);
        setDraft(null);
      }
    } else {
      const updated = await safeApi(() =>
        adminApi<AdminTab>(`/admin/tabs/${tab.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: tab.slug,
            name: tab.name,
            subtitle: tab.subtitle,
            sort_order: tab.sort_order,
            is_active: tab.is_active,
          }),
        }),
      );
      if (updated && index !== null) {
        setTabs((prev) => prev.map((t, i) => (i === index ? updated : t)));
      }
    }
  }

  async function deleteTab(id: number) {
    if (!window.confirm("Удалить вкладку?")) return;
    await safeApi(() => adminApi(`/admin/tabs/${id}`, { method: "DELETE" }));
    setTabs((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs text-[#454652]">
          Каждая вкладка — секция на публичном сайте. Льготы привязываются мультиселектом.
        </p>
        {draft === null && (
          <button
            type="button"
            onClick={() => setDraft({ ...EMPTY })}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #24389c, #3f51b5)" }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Добавить вкладку
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {draft !== null && (
          <TabRow
            tab={draft}
            onChange={setDraft}
            onSave={() => saveTab(draft, null)}
            onCancel={() => setDraft(null)}
          />
        )}

        {tabs.map((tab, index) => (
          <TabRow
            key={tab.id}
            tab={tab}
            onChange={(updated) =>
              setTabs((prev) => prev.map((t, i) => (i === index ? { ...t, ...updated } : t)))
            }
            onSave={() => saveTab(tabs[index], index)}
            onDelete={() => deleteTab(tab.id)}
          />
        ))}

        {tabs.length === 0 && draft === null && (
          <div className="rounded-md bg-white px-4 py-12 text-center text-sm text-[#454652]">
            Пока нет вкладок.
          </div>
        )}
      </div>
    </div>
  );
}

function TabRow({
  tab,
  onChange,
  onSave,
  onDelete,
  onCancel,
}: {
  tab: EditableTab;
  onChange: (next: EditableTab) => void;
  onSave: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="rounded-md bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr_1fr_100px_100px_auto]">
        <input
          type="text"
          placeholder="slug"
          value={tab.slug}
          onChange={(e) => onChange({ ...tab, slug: e.target.value })}
          className="rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
        />
        <input
          type="text"
          placeholder="Название (на сайте)"
          value={tab.name}
          onChange={(e) => onChange({ ...tab, name: e.target.value })}
          className="rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
        />
        <input
          type="text"
          placeholder="Подзаголовок (опционально)"
          value={tab.subtitle}
          onChange={(e) => onChange({ ...tab, subtitle: e.target.value })}
          className="rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
        />
        <input
          type="number"
          placeholder="Порядок"
          value={tab.sort_order}
          onChange={(e) =>
            onChange({ ...tab, sort_order: Number(e.target.value) || 0 })
          }
          className="rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
        />
        <label className="flex items-center gap-2 text-xs text-[#454652]">
          <input
            type="checkbox"
            checked={tab.is_active}
            onChange={(e) => onChange({ ...tab, is_active: e.target.checked })}
            className="h-4 w-4 accent-[#3f51b5]"
          />
          Active
        </label>
        <div className="flex gap-1 justify-self-end">
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
              className="rounded-md bg-[#e9e7f0] px-3 py-2 text-xs font-medium text-[#454652] hover:bg-[#e3e1ea]"
            >
              Cancel
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-[#ba1a1a] hover:bg-red-100"
              aria-label="Удалить"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
