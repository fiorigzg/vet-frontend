"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Upload, X } from "lucide-react";
import { adminUpload } from "@/lib/adminApi";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
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
            className="h-24 w-24 rounded-md object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#ba1a1a] shadow"
            aria-label="Удалить"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#e9e7f0] px-3 py-2 text-xs font-medium text-[#1a1b22] hover:bg-[#e3e1ea]">
        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
        {uploading ? "Загрузка..." : value ? "Заменить" : "Загрузить"}
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
