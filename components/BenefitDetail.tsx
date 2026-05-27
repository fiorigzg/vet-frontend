"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Star,
  Calendar,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import type { Benefit } from "@/types/benefit";
import { YandexMap } from "@/components/YandexMap";
import { LowVisionBar, LowVisionToggle } from "@/components/LowVisionBar";

interface BenefitDetailProps {
  benefit: Benefit;
}

export function BenefitDetail({ benefit }: BenefitDetailProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const gallery =
    benefit.images.length > 0
      ? benefit.images
      : [benefit.image || "https://placehold.co/1200x800/e2e8f0/718096?text=Нет+изображения"];
  const sourceUrl = benefit.sourceUrl;

  const nextImage = () => setCurrentImage((p) => (p + 1) % gallery.length);
  const prevImage = () => setCurrentImage((p) => (p - 1 + gallery.length) % gallery.length);

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-['Inter',sans-serif]">
      <LowVisionBar />

      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 rounded-lg transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0] focus-visible:ring-offset-2 md:gap-3"
            aria-label="На главную"
          >
            <img src="/logo.png" alt="Логотип" className="h-11 w-14 object-contain md:h-14 md:w-[4.75rem]" />
            <div className="min-w-0">
              <span className="block truncate text-[16px] leading-tight text-[#1A1D26] md:text-[18px]">Льгота.Москва</span>
              <span className="block max-w-[180px] text-[11px] leading-tight text-[#718096] sm:max-w-none sm:text-[12px]">Льготы для ветеранов СВО</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            <LowVisionToggle />
            <Link
              href="/#benefits"
              className="hidden items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 py-2 text-[14px] text-[#4A5568] transition-colors hover:border-[#2B6CB0] hover:text-[#2B6CB0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0] sm:inline-flex"
            >
              <ArrowLeft className="h-4 w-4" /> Все льготы
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-5 md:px-8 md:py-8">
        <Link
          href="/#benefits"
          className="mb-4 inline-flex items-center gap-1.5 text-[14px] text-[#2B6CB0] transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0]"
        >
          <ArrowLeft className="h-4 w-4" /> Назад к льготам
        </Link>

        <article className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-[#E2E8F0] px-4 py-4 md:items-center md:px-8 md:py-5">
            <div className="rounded-lg bg-[#EBF4FF] p-2">
              <Star aria-hidden="true" className="h-5 w-5 text-[#2B6CB0]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[18px] leading-snug text-[#1A1D26] md:text-[22px]">
                {benefit.title}
              </h1>
            </div>
          </div>

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
                  <h2 className="mb-2 text-[14px] uppercase tracking-wide text-[#718096]">
                    Описание
                  </h2>
                  <p className="text-[15px] leading-relaxed text-[#1A1D26]">
                    {benefit.description}
                  </p>
                </div>
              )}

              {benefit.conditions && (
                <div className="mb-6">
                  <h2 className="mb-2 text-[14px] uppercase tracking-wide text-[#718096]">
                    Условия получения
                  </h2>
                  <p className="text-[15px] leading-relaxed text-[#1A1D26]">
                    {benefit.conditions}
                  </p>
                </div>
              )}

              {benefit.whoApplies && (
                <div className="mb-6">
                  <h2 className="mb-2 text-[14px] uppercase tracking-wide text-[#718096]">
                    Кто может получить
                  </h2>
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
              <YandexMap
                address={benefit.address}
                className="mb-4 h-[180px] sm:h-[200px]"
                lat={benefit.lat}
                lng={benefit.lng}
                title={benefit.title}
              />

              {benefit.address && (
                <div className="mb-5">
                  <h2 className="mb-1.5 text-[13px] uppercase tracking-wide text-[#718096]">Адрес</h2>
                  <p className="flex items-start gap-2 text-[14px] text-[#1A1D26]">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2B6CB0]" />
                    {benefit.address}
                  </p>
                </div>
              )}

              {benefit.contacts && (
                <div className="mb-5">
                  <h2 className="mb-1.5 text-[13px] uppercase tracking-wide text-[#718096]">Контакты</h2>
                  <p className="flex items-start gap-2 text-[14px] text-[#1A1D26]">
                    <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2B6CB0]" />
                    {benefit.contacts}
                  </p>
                </div>
              )}

              {benefit.tabs.length > 0 && (
                <div className="mb-5">
                  <h2 className="mb-1.5 text-[13px] uppercase tracking-wide text-[#718096]">Разделы</h2>
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
        </article>
      </main>
    </div>
  );
}
