"use client";

import { Calendar } from "lucide-react";
import type { Benefit } from "@/types/benefit";

interface BenefitCardProps {
  benefit: Benefit;
  onClick: (benefit: Benefit) => void;
}

export function BenefitCard({ benefit, onClick }: BenefitCardProps) {
  const previewImage =
    benefit.image ||
    benefit.images[0] ||
    "https://placehold.co/800x500/e2e8f0/718096?text=Нет+изображения";

  return (
    <button
      onClick={() => onClick(benefit)}
      className="group h-full w-full cursor-pointer overflow-hidden rounded-xl border border-[#E2E8F0] bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#E8EEF5] sm:aspect-[16/10]">
        <img
          src={previewImage}
          alt={benefit.title}
          loading="lazy"
          className="absolute inset-0 block h-full w-full object-cover object-center transition-transform duration-300 md:group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <h3 className="line-clamp-2 min-h-[42px] text-[15px] leading-snug text-[#1A1D26] sm:min-h-[46px]">
          {benefit.title}
        </h3>
        <div className="flex items-center gap-1.5 text-[#718096]">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-[13px]">{benefit.validity}</span>
        </div>
      </div>
    </button>
  );
}
