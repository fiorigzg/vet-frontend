"use client";

import { Eye } from "lucide-react";
import { useLowVision, setLowVision, toggleLowVision } from "@/lib/lowVision";

export function LowVisionToggle() {
  const s = useLowVision();
  return (
    <button
      type="button"
      onClick={toggleLowVision}
      aria-pressed={s.enabled}
      aria-label="Версия для слабовидящих"
      title="Версия для слабовидящих"
      className="flex min-h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 text-[13px] text-[#4A5568] transition-colors hover:border-[#2B6CB0] hover:text-[#2B6CB0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0]"
    >
      <Eye className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">Для слабовидящих</span>
    </button>
  );
}

export function LowVisionBar() {
  const s = useLowVision();
  if (!s.enabled) return null;

  return (
    <div
      className="lv-bar"
      role="region"
      aria-label="Настройки версии для слабовидящих"
    >
      <div className="lv-bar__group">
        <span className="lv-bar__label">Размер шрифта:</span>
        <button
          type="button"
          className="lv-btn"
          aria-pressed={s.font === 1}
          aria-label="Обычный размер шрифта"
          onClick={() => setLowVision({ font: 1 })}
        >
          А
        </button>
        <button
          type="button"
          className="lv-btn"
          aria-pressed={s.font === 2}
          aria-label="Крупный шрифт"
          onClick={() => setLowVision({ font: 2 })}
        >
          А+
        </button>
        <button
          type="button"
          className="lv-btn"
          aria-pressed={s.font === 3}
          aria-label="Очень крупный шрифт"
          onClick={() => setLowVision({ font: 3 })}
        >
          А++
        </button>
      </div>

      <div className="lv-bar__group">
        <span className="lv-bar__label">Цвета:</span>
        <button
          type="button"
          className="lv-btn"
          aria-pressed={s.scheme === "normal"}
          onClick={() => setLowVision({ scheme: "normal" })}
        >
          Обычные
        </button>
        <button
          type="button"
          className="lv-btn"
          aria-pressed={s.scheme === "bw"}
          onClick={() => setLowVision({ scheme: "bw" })}
        >
          Чёрным по белому
        </button>
        <button
          type="button"
          className="lv-btn"
          aria-pressed={s.scheme === "wb"}
          onClick={() => setLowVision({ scheme: "wb" })}
        >
          Белым по чёрному
        </button>
      </div>

      <div className="lv-bar__group">
        <span className="lv-bar__label">Интервал:</span>
        <button
          type="button"
          className="lv-btn"
          aria-pressed={s.spacing}
          onClick={() => setLowVision({ spacing: !s.spacing })}
        >
          {s.spacing ? "Увеличенный" : "Обычный"}
        </button>
      </div>

      <div className="lv-bar__group">
        <span className="lv-bar__label">Изображения:</span>
        <button
          type="button"
          className="lv-btn"
          aria-pressed={!s.images}
          onClick={() => setLowVision({ images: !s.images })}
        >
          {s.images ? "Показаны" : "Скрыты"}
        </button>
      </div>

      <button
        type="button"
        className="lv-btn"
        onClick={() => setLowVision({ enabled: false })}
        aria-label="Выключить версию для слабовидящих"
      >
        Обычная версия сайта
      </button>
    </div>
  );
}
