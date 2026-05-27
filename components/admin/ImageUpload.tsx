"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Upload, X } from "lucide-react";
import { adminUpload } from "@/lib/adminApi";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  /** Compact variant for table cells: small thumbnail, icon-only button. */
  compact?: boolean;
}

export function ImageUpload({ value, onChange, compact = false }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await adminUpload(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="cover"
            className={`rounded-md object-cover ${compact ? "h-10 w-10" : "h-24 w-24"}`}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#ba1a1a] shadow"
            aria-label="Удалить"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}

      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#e9e7f0] px-3 py-2 text-xs font-medium text-[#1a1b22] hover:bg-[#e3e1ea]">
        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
        {compact ? (
          uploading ? "…" : null
        ) : uploading ? "Загрузка..." : value ? "Заменить" : "Загрузить"}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
      </label>

      {error && (
        <span className="self-center text-xs text-[#ba1a1a]">{error}</span>
      )}
    </div>
  );
}
