"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminTab } from "@/lib/adminTab";

interface TabMultiselectProps {
  value: number[];
  onChange: (ids: number[]) => void;
}

export function TabMultiselect({ value, onChange }: TabMultiselectProps) {
  const [tabs, setTabs] = useState<AdminTab[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi<AdminTab[]>("/admin/tabs")
      .then((data) => {
        if (!cancelled) setTabs(data);
      })
      .catch(() => {
        if (!cancelled) setTabs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (tabs === null) {
    return <p className="text-xs text-[#454652]">Загрузка вкладок...</p>;
  }

  if (tabs.length === 0) {
    return (
      <p className="text-xs text-[#454652]">
        Пока нет вкладок. Создайте их в /admin/tabs.
      </p>
    );
  }

  function toggle(id: number) {
    const next = value.includes(id) ? value.filter((x) => x !== id) : [...value, id];
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isSelected = value.includes(tab.id);
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => toggle(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              isSelected
                ? "border-[#3f51b5] bg-[#cacfff] text-[#24389c]"
                : "border-[#c5c5d4] bg-white text-[#454652] hover:border-[#3f51b5]"
            }`}
          >
            {isSelected && <span aria-hidden="true">✓</span>}
            {tab.name}
            {!tab.is_active && (
              <span className="text-[10px] text-[#ba1a1a]">(off)</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
