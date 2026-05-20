"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Upload, X } from "lucide-react";
import { adminUpload } from "@/lib/adminApi";

interface ImagesUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

export function ImagesUpload({ value, onChange }: ImagesUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const { url } = await adminUpload(file);
        uploaded.push(url);
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, idx) => (
            <div key={`${url}-${idx}`} className="relative">
              <img
                src={url}
                alt={`Изображение ${idx + 1}`}
                className="h-20 w-20 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#ba1a1a] shadow"
                aria-label="Удалить"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md bg-[#e9e7f0] px-3 py-2 text-xs font-medium text-[#1a1b22] hover:bg-[#e3e1ea]">
        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
        {uploading ? "Загрузка..." : "Добавить изображения"}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </label>

      {error && <span className="text-xs text-[#ba1a1a]">{error}</span>}
    </div>
  );
}
