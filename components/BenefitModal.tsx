"use client";

import { useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Star,
  Calendar,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import type { Benefit } from "@/types/benefit";
import { YandexMap } from "@/components/YandexMap";
import { useDialog } from "@/lib/useDialog";

interface BenefitModalProps {
  benefit: Benefit;
  onClose: () => void;
}

export function BenefitModal({ benefit, onClose }: BenefitModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(dialogRef, onClose);
  const [currentImage, setCurrentImage] = useState(0);
  const gallery =
    benefit.images.length > 0
      ? benefit.images
      : [benefit.image || "https://placehold.co/1200x800/e2e8f0/718096?text=Нет+изображения"];
  const sourceUrl = benefit.sourceUrl;

  const nextImage = () => setCurrentImage((p) => (p + 1) % gallery.length);
  const prevImage = () => setCurrentImage((p) => (p - 1 + gallery.length) % gallery.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 lg:p-8" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="benefit-modal-title"
        className="relative flex h-[100dvh] min-h-0 w-full max-w-[1100px] flex-col overflow-hidden rounded-none bg-white shadow-2xl outline-none sm:h-[92vh] sm:rounded-2xl lg:h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] px-4 py-4 md:items-center md:px-8 md:py-5">
          <div className="flex min-w-0 items-start gap-3 md:items-center">
            <div className="rounded-lg bg-[#EBF4FF] p-2">
              <Star aria-hidden="true" className="h-5 w-5 text-[#2B6CB0]" />
            </div>
            <div className="min-w-0">
              <h2
                id="benefit-modal-title"
                className="text-[16px] leading-snug text-[#1A1D26] md:text-[18px]"
              >
                {benefit.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-lg p-2 text-[#718096] transition-colors hover:bg-[#F7FAFC] hover:text-[#1A1D26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0]"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_320px]">
            <div className="border-[#E2E8F0] p-4 md:p-8 lg:border-r">
              <div className="relative mb-5 h-[clamp(180px,58vw,280px)] overflow-hidden rounded-xl bg-[#E8EEF5] sm:mb-6 sm:h-auto sm:aspect-[16/9] sm:max-h-[420px] lg:-mx-8 lg:-mt-8 lg:h-[420px] lg:max-h-none lg:aspect-auto lg:rounded-none">
                <img
                  src={gallery[currentImage]}
                  alt={benefit.title}
                  loading="eager"
                  className="h-full w-full object-cover object-center"
                />
                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      aria-label="Предыдущее изображение"
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0]"
                    >
                      <ChevronLeft aria-hidden="true" className="h-4 w-4 text-[#2D3748]" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      aria-label="Следующее изображение"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0]"
                    >
                      <ChevronRight aria-hidden="true" className="h-4 w-4 text-[#2D3748]" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {gallery.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentImage(i)}
                          aria-label={`Перейти к изображению ${i + 1} из ${gallery.length}`}
                          aria-current={i === currentImage}
                          className={`h-2 w-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0] ${
                            i === currentImage ? "bg-white" : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="mb-6 flex items-center gap-1.5 text-[14px] text-[#718096]">
                <Calendar className="h-4 w-4" /> Действует: {benefit.validity}
              </div>

              {benefit.summary && (
                <p className="mb-6 text-[15px] leading-relaxed text-[#2D3748]">
                  {benefit.summary}
                </p>
              )}

              {benefit.description && (
                <div className="mb-6">
                  <h4 className="mb-2 text-[14px] uppercase tracking-wide text-[#718096]">
                    Описание
                  </h4>
                  <p className="text-[15px] leading-relaxed text-[#1A1D26]">
                    {benefit.description}
                  </p>
                </div>
              )}

              {benefit.conditions && (
                <div className="mb-6">
                  <h4 className="mb-2 text-[14px] uppercase tracking-wide text-[#718096]">
                    Условия получения
                  </h4>
                  <p className="text-[15px] leading-relaxed text-[#1A1D26]">
                    {benefit.conditions}
                  </p>
                </div>
              )}

              {benefit.whoApplies && (
                <div className="mb-6">
                  <h4 className="mb-2 text-[14px] uppercase tracking-wide text-[#718096]">
                    Кто может получить
                  </h4>
                  <p className="text-[15px] leading-relaxed text-[#1A1D26]">
                    {benefit.whoApplies}
                  </p>
                </div>
              )}

              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2B6CB0] px-6 py-3 text-white transition-colors hover:bg-[#2C5282] sm:w-auto"
                >
                  <ExternalLink className="h-4 w-4" /> Подробнее на сайте
                </a>
              ) : null}
            </div>

            <div className="bg-[#FAFBFC] p-4 md:p-6">
              {benefit.lat != null && benefit.lng != null && (
                <YandexMap
                  address={benefit.address}
                  className="mb-4 h-[180px] sm:h-[200px]"
                  lat={benefit.lat}
                  lng={benefit.lng}
                  title={benefit.title}
                />
              )}

              {benefit.contacts && (
                <div className="mb-5">
                  <h4 className="mb-1.5 text-[13px] uppercase tracking-wide text-[#718096]">Контакты</h4>
                  <p className="flex items-start gap-2 text-[14px] text-[#1A1D26]">
                    <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2B6CB0]" />
                    {benefit.contacts}
                  </p>
                </div>
              )}

              {benefit.tabs.length > 0 && (
                <div className="mb-5">
                  <h4 className="mb-1.5 text-[13px] uppercase tracking-wide text-[#718096]">Разделы</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {benefit.tabs.map((tab) => (
                      <span
                        key={tab.slug}
                        className="inline-flex items-center rounded-lg bg-[#EBF4FF] px-2.5 py-0.5 text-[13px] text-[#2B6CB0]"
                      >
                        {tab.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {sourceUrl && (
                <div className="border-t border-[#E2E8F0] pt-4 text-[13px] text-[#718096]">
                  <p className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#38A169]" />
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#2B6CB0] hover:underline"
                    >
                      Официальный источник
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
