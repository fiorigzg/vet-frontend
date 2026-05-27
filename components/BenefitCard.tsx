"use client";

import Link from "next/link";
import { Calendar, Star, Tag } from "lucide-react";
import type { Benefit } from "@/types/benefit";

interface BenefitCardProps {
  benefit: Benefit;
}

export function BenefitCard({ benefit }: BenefitCardProps) {
  const previewImage =
    benefit.image ||
    benefit.images[0] ||
    "https://placehold.co/800x500/e2e8f0/718096?text=Нет+изображения";

  const level = benefit.regulationLevel || "Городская";
  const isPartner = level === "Партнёрская";
  // The pill shows the section the benefit belongs to (its category/tab);
  // fall back to the free-text recipient category if no category is assigned.
  const categoryLabel = benefit.tabs[0]?.name || benefit.category;
  const value = benefit.value;

  return (
    <Link
      href={`/benefits/${benefit.id}`}
      className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-[#E1E6EE] bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#CDD6E3] hover:shadow-[0_14px_30px_-16px_rgba(15,26,46,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4D8C] focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#E8EEF5]">
        <img
          src={previewImage}
          alt={benefit.title}
          loading="lazy"
          className="absolute inset-0 block h-full w-full object-cover object-center transition-transform duration-300 md:group-hover:scale-105"
        />
        <span
          className={`absolute left-2.5 top-2.5 inline-flex max-w-[calc(100%-20px)] items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] leading-tight shadow-sm backdrop-blur-sm ${
            isPartner
              ? "bg-[#4A5568]/90 text-white"
              : "bg-white/95 text-[#2D3748]"
          }`}
        >
          {isPartner ? (
            <Tag className="h-3 w-3 flex-shrink-0" />
          ) : (
            <Star className="h-3 w-3 flex-shrink-0 fill-[#D69E2E] text-[#D69E2E]" />
          )}
          <span className="truncate">{level} программа</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 min-h-[42px] text-[15px] font-semibold leading-snug tracking-[-0.01em] text-[#0F1A2E]">
          {benefit.title}
        </h3>
        <div className="flex items-center gap-1.5 text-[#5B6577]">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-[13px]">{benefit.validity}</span>
        </div>
        <div className="mt-1 flex flex-col items-start gap-1.5">
          {categoryLabel && (
            <span className="inline-flex max-w-full items-center gap-1 rounded bg-[#F7FAFC] px-2 py-0.5 text-[13px] text-[#5B6577]">
              <Tag className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="min-w-0 truncate">{categoryLabel}</span>
            </span>
          )}
          {value && (
            <span className="inline-block max-w-full truncate rounded-md bg-[#E7F0FB] px-2.5 py-0.5 text-[13px] font-medium text-[#0D4D8C]">
              {value}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
