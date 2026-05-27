"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Sparkles, X } from "lucide-react";
import { adminApi, UnauthorizedError } from "@/lib/adminApi";
import type { AdminBenefit } from "@/lib/adminBenefit";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ImagesUpload } from "@/components/admin/ImagesUpload";
import { TabMultiselect } from "@/components/admin/TabMultiselect";

type FormState = AdminBenefit;

interface BenefitEditorProps {
  benefitId: number;
  /** Called after a successful save. */
  onSaved?: () => void;
  /** When provided, shows a Cancel button (used for inline editing). */
  onCancel?: () => void;
}

export function BenefitEditor({ benefitId, onSaved, onCancel }: BenefitEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminApi<AdminBenefit>(`/admin/benefits/${benefitId}`);
      setForm(data);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.replace("/admin/login");
      } else {
        setError("Не удалось загрузить");
      }
    }
  }, [benefitId, router]);

  useEffect(() => {
    if (Number.isFinite(benefitId)) load();
  }, [benefitId, load]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleClassify() {
    if (!form) return;
    setClassifying(true);
    setError(null);
    try {
      const updated = await adminApi<AdminBenefit>(
        `/admin/benefits/${benefitId}/classify`,
        { method: "POST" },
      );
      // Apply the AI suggestion (predicted category + regulation level) into
      // the form; the admin can still override before saving.
      setForm((prev) =>
        prev
          ? {
              ...prev,
              tab_ids: updated.tab_ids,
              tabs: updated.tabs,
              regulation_level: updated.regulation_level,
            }
          : prev,
      );
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.replace("/admin/login");
      } else {
        setError(err instanceof Error ? err.message : "Не удалось определить категорию");
      }
    } finally {
      setClassifying(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);

    const payload = {
      title: form.title,
      description: form.description,
      summary: form.summary,
      conditions: form.conditions,
      who_applies: form.who_applies,
      address: form.address,
      contacts: form.contacts,
      validity: form.validity,
      source_url: form.source_url,
      image: form.image,
      images: form.images ?? [],
      lat: form.lat,
      lng: form.lng,
      yandex_map_query: form.yandex_map_query,
      sort_order: form.sort_order,
      is_published: form.is_published,
      regulation_level: form.regulation_level,
      tab_ids: form.tab_ids,
    };

    try {
      await adminApi(`/admin/benefits/${benefitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onSaved?.();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.replace("/admin/login");
      } else {
        setError(err instanceof Error ? err.message : "Не удалось сохранить");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <div className="px-1 py-4 text-sm text-[#454652]">{error ?? "Загрузка..."}</div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-['Manrope',sans-serif] text-base font-semibold">
          Льгота #{form.id}
        </h2>
        <div className="ml-auto flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1 rounded-md bg-[#e9e7f0] px-3 py-2 text-xs font-medium text-[#454652] hover:bg-[#e3e1ea]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" /> Закрыть
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #24389c, #3f51b5)" }}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-[#ba1a1a]">
          {error}
        </div>
      )}

      <Section title="Основное">
        <Field label="Заголовок" full>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
            required
          />
        </Field>
        <Field label="Sort order">
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => update("sort_order", Number(e.target.value) || 0)}
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
          />
        </Field>
        <Field label="Опубликовано" hint="Снимите галку, чтобы скрыть с публичного сайта">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => update("is_published", e.target.checked)}
            className="h-4 w-4 accent-[#3f51b5]"
          />
        </Field>
        <Field label="Уровень регулирования" hint="Бейдж на карточке. Определяется ИИ, можно изменить">
          <select
            value={form.regulation_level || "Городская"}
            onChange={(e) => update("regulation_level", e.target.value)}
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
          >
            <option value="Федеральная">Федеральная</option>
            <option value="Городская">Городская</option>
            <option value="Партнёрская">Партнёрская</option>
          </select>
        </Field>
        <Field
          label="Категории (вкладки)"
          full
          hint="В каких разделах публичного сайта показывать. ИИ подставляет предполагаемую — можно переопределить вручную"
        >
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleClassify}
              disabled={classifying}
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-[#3f51b5] bg-white px-3 py-1.5 text-xs font-semibold text-[#24389c] transition-colors hover:bg-[#f4f2fc] disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {classifying ? "Определяем…" : "Определить категорию (ИИ)"}
            </button>
            <TabMultiselect
              value={form.tab_ids}
              onChange={(ids) => update("tab_ids", ids)}
            />
          </div>
        </Field>
      </Section>

      {form.source_draft && <SourceDraftSection benefit={form} />}

      <Section title="Описание">
        <Field label="Summary" full>
          <textarea
            value={form.summary}
            onChange={(e) => update("summary", e.target.value)}
            rows={2}
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
          />
        </Field>
        <Field label="Description" full>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={5}
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
          />
        </Field>
        <Field label="Conditions" full>
          <textarea
            value={form.conditions}
            onChange={(e) => update("conditions", e.target.value)}
            rows={3}
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
          />
        </Field>
        <Field label="Who applies" full>
          <textarea
            value={form.who_applies}
            onChange={(e) => update("who_applies", e.target.value)}
            rows={2}
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
          />
        </Field>
      </Section>

      <Section title="Контакты и срок действия">
        <Field label="Validity (текстом)" full>
          <input
            type="text"
            value={form.validity}
            onChange={(e) => update("validity", e.target.value)}
            placeholder="бессрочно"
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
          />
        </Field>
        <Field label="Contacts" full>
          <input
            type="text"
            value={form.contacts}
            onChange={(e) => update("contacts", e.target.value)}
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
          />
        </Field>
      </Section>

      <Section title="Расположение">
        <Field label="Address" full>
          <input
            type="text"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
          />
        </Field>
        <Field label="Latitude">
          <input
            type="number"
            step="0.000001"
            value={form.lat ?? ""}
            onChange={(e) =>
              update("lat", e.target.value === "" ? null : Number(e.target.value))
            }
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
          />
        </Field>
        <Field label="Longitude">
          <input
            type="number"
            step="0.000001"
            value={form.lng ?? ""}
            onChange={(e) =>
              update("lng", e.target.value === "" ? null : Number(e.target.value))
            }
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
          />
        </Field>
        <Field label="Yandex map query" full>
          <input
            type="text"
            value={form.yandex_map_query ?? ""}
            onChange={(e) => update("yandex_map_query", e.target.value || null)}
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
          />
        </Field>
      </Section>

      <Section title="Источник">
        <Field label="Source URL" full>
          <input
            type="url"
            value={form.source_url ?? ""}
            onChange={(e) => update("source_url", e.target.value || null)}
            className="w-full rounded bg-[#e9e7f0] px-3 py-2 text-sm focus:bg-[#e3e1ea] focus:outline-none"
          />
        </Field>
      </Section>

      <Section title="Изображения">
        <Field label="Cover image" full>
          <ImageUpload value={form.image} onChange={(url) => update("image", url)} />
        </Field>
        <Field label="Галерея" full>
          <ImagesUpload
            value={form.images ?? []}
            onChange={(urls) => update("images", urls)}
          />
        </Field>
      </Section>

      {form.source_page_id && !form.source_draft && (
        <p className="mt-2 text-xs text-[#454652]">
          Промотировано из page #{form.source_page_id} (index {form.source_index})
        </p>
      )}
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-md border border-[#e9e7f0] bg-white p-4">
      <h3 className="mb-4 font-['Manrope',sans-serif] text-sm font-semibold uppercase tracking-wider text-[#454652]">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  full = false,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
  hint?: string;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-[#454652]">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-[#454652]">{hint}</span>}
    </label>
  );
}

const DRAFT_FIELD_LABELS: Array<[string, string]> = [
  ["title", "Название"],
  ["summary", "Summary"],
  ["description", "Описание"],
  ["conditions", "Условия"],
  ["who_applies", "Кто может получить"],
  ["validity", "Срок действия"],
  ["value", "Выгода"],
  ["regulation_level", "Уровень"],
  ["category_slug", "Категория (slug)"],
];

function SourceDraftSection({ benefit }: { benefit: AdminBenefit }) {
  const draft = benefit.source_draft;
  if (!draft) return null;

  return (
    <section className="mb-4 rounded-md border border-dashed border-[#c5c5d4] bg-[#f4f2fc] p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-['Manrope',sans-serif] text-sm font-semibold uppercase tracking-wider text-[#454652]">
          Данные краулера (read-only)
        </h3>
        {(benefit.source_page_name || benefit.source_page_website) && (
          <p className="text-[11px] text-[#454652]">
            Источник:{" "}
            {benefit.source_page_name && (
              <span className="font-medium">{benefit.source_page_name}</span>
            )}
            {benefit.source_page_website && (
              <>
                {" "}
                ·{" "}
                <a
                  href={benefit.source_page_website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#3f51b5] hover:underline"
                >
                  {benefit.source_page_website}
                </a>
              </>
            )}
            {benefit.source_index !== null && (
              <span className="text-[#454652]"> · index {benefit.source_index}</span>
            )}
          </p>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[180px_1fr]">
        {DRAFT_FIELD_LABELS.map(([key, label]) => (
          <ReadonlyRow key={key} label={label} value={draft[key]} />
        ))}
      </dl>
    </section>
  );
}

function ReadonlyRow({ label, value }: { label: string; value: unknown }) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "string"
        ? value
        : JSON.stringify(value, null, 2);

  return (
    <>
      <dt className="text-[10px] uppercase tracking-[0.15em] text-[#454652]">{label}</dt>
      <dd className="whitespace-pre-wrap break-words text-sm text-[#1a1b22]">{display}</dd>
    </>
  );
}
