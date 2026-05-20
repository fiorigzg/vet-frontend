"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Search,
  Phone,
  MapPin,
  Menu,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CheckCircle,
  HelpCircle,
  Clock,
  X,
} from "lucide-react";
import { fetchBenefits } from "@/lib/api";
import type { Benefit, PublicTab } from "@/types/benefit";
import { BenefitCard } from "@/components/BenefitCard";
import { BenefitModal } from "@/components/BenefitModal";
import { BenefitsMap } from "@/components/BenefitsMap";
import { LowVisionBar, LowVisionToggle } from "@/components/LowVisionBar";

const SECTION_PREVIEW_LIMIT = 10;
const NAV_ITEMS = [
  { label: "Главная", href: "#top" },
  { label: "Льготы", href: "#benefits" },
  { label: "Частые вопросы", href: "#faq" },
  { label: "Контакты", href: "#footer" },
];
const CONTACT_PHONE_HREF = "+79919426100";
const CONTACT_PHONE_LABEL = "+7 (991) 942-61-00";

const FAQ_ITEMS = [
  {
    q: "Какие документы нужны для получения льгот?",
    a: "Единого документа нет — для каждой меры поддержки свой комплект. Точный перечень указан в карточке конкретной льготы. Как правило требуются паспорт и документ, подтверждающий статус участника СВО или ветерана боевых действий, плюс документы, специфичные для выбранной меры.",
  },
  {
    q: "Как узнать, какие льготы мне доступны?",
    a: "Воспользуйтесь поиском на нашем сайте, указав свою категорию и регион. Система покажет все доступные меры поддержки.",
  },
  {
    q: "Нужно ли продлевать право на льготы?",
    a: "Большинство льгот действуют бессрочно при наличии удостоверения. Некоторые программы имеют срок действия — он указан в описании каждой льготы.",
  },
  {
    q: "Могут ли члены семьи ветерана получать льготы?",
    a: "Да, ряд мер поддержки распространяется на членов семей ветеранов.",
  },
];

interface HomePageProps {
  initialBenefits: Benefit[];
  initialTabs: PublicTab[];
  initialError: string | null;
}

export function HomePage({
  initialBenefits,
  initialTabs,
  initialError,
}: HomePageProps) {
  const [benefits] = useState<Benefit[]>(initialBenefits);
  const [tabs] = useState<PublicTab[]>(initialTabs);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Benefit[]>([]);
  const [activeTabSlug, setActiveTabSlug] = useState<string | null>(null);
  const [activeSectionTitle, setActiveSectionTitle] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(initialError);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const hasActiveResultState =
    activeTabSlug !== null || Boolean(searchQuery.trim());
  const showFilteredResults = hasActiveResultState;

  useEffect(() => {
    let cancelled = false;

    async function loadSearchResults() {
      if (!showFilteredResults) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        setLoadError(null);

        const response = await fetchBenefits({
          q: searchQuery.trim() || undefined,
          tab: activeTabSlug ?? undefined,
        });

        if (cancelled) return;
        setSearchResults(response.items ?? []);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Не удалось выполнить поиск");
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }

    loadSearchResults();

    return () => {
      cancelled = true;
    };
  }, [activeTabSlug, searchQuery, showFilteredResults]);

  function benefitsForTab(slug: string) {
    return benefits.filter((b) => b.tabs.some((t) => t.slug === slug));
  }

  function scrollToSection(selector: string) {
    if (selector === "#top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const header = document.querySelector("header");
    const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 0;
    const element = document.querySelector(selector);
    if (!element) return;

    const extraOffset = selector === "#faq" ? 0 : 16;
    const targetTop =
      element.getBoundingClientRect().top + window.scrollY - headerHeight - extraOffset;

    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });
  }

  function handleSearchSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setActiveTabSlug(null);
    setActiveSectionTitle(null);
    setSearchQuery(searchInput.trim());
    scrollToSection("#benefits");
  }

  function clearSearchText() {
    setSearchInput("");
    setSearchQuery("");
  }

  function openTab(tab: PublicTab) {
    setSearchInput("");
    setSearchQuery("");
    setActiveTabSlug(tab.slug);
    setActiveSectionTitle(tab.name);
    scrollToSection("#benefits");
  }

  function resetResultState() {
    setActiveTabSlug(null);
    setActiveSectionTitle(null);
    setSearchInput("");
    setSearchQuery("");
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-['Inter',sans-serif]" id="top">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-[15px] focus:text-[#2B6CB0] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
      >
        Перейти к содержанию
      </a>

      <LowVisionBar />

      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white">
        <div className="relative mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
          <a
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("#top");
            }}
            className="flex min-w-0 items-center gap-2 rounded-lg transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0] focus-visible:ring-offset-2 md:gap-3"
            aria-label="Главная"
          >
            <div className="p-0">
              <img src="/logo.png" alt="Логотип" className="h-11 w-14 object-contain md:h-14 md:w-[4.75rem]" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-[16px] leading-tight text-[#1A1D26] md:text-[18px]">Льгота.Москва</span>
              <span className="block max-w-[180px] text-[11px] leading-tight text-[#718096] sm:max-w-none sm:text-[12px]">Льготы для ветеранов СВО</span>
            </div>
          </a>

          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 whitespace-nowrap lg:flex">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(item.href);
                }}
                className={`text-[15px] leading-none transition-colors hover:text-[#2B6CB0] ${
                  item.label === "Главная" ? "text-[#2B6CB0]" : "text-[#4A5568]"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <LowVisionToggle />

            <div className="hidden items-center gap-2 rounded-lg bg-[#EBF4FF] px-3 py-2 text-[14px] text-[#2B6CB0] xl:flex">
              <Phone className="h-4 w-4" aria-hidden="true" />
              {CONTACT_PHONE_LABEL}
            </div>

            <button
              type="button"
              className="flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#4A5568] transition-colors hover:border-[#2B6CB0] hover:text-[#2B6CB0] lg:hidden"
              aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className="border-t border-[#E2E8F0] bg-white px-6 pb-5 pt-6 lg:hidden">
            <div className="mx-auto flex max-w-[1280px] flex-col">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(event) => {
                    event.preventDefault();
                    setIsMobileMenuOpen(false);
                    scrollToSection(item.href);
                  }}
                  className="py-4 text-[15px] leading-none text-[#4A5568] transition-colors hover:text-[#2B6CB0]"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-5 border-t border-[#E2E8F0] pt-5">
                <a
                  href={`tel:${CONTACT_PHONE_HREF}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#EBF4FF] px-3 py-2 text-[14px] text-[#2B6CB0] transition-colors hover:bg-[#DBEAFE]"
                >
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  {CONTACT_PHONE_LABEL}
                </a>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        <section className="bg-gradient-to-b from-[#EBF4FF] to-[#F7F8FA] pb-3 pt-12 md:pb-6 md:pt-16">
          <div className="mx-auto max-w-[1280px] px-4 text-center md:px-8">
            <h1 className="mx-auto mb-3 max-w-[920px] text-[28px] leading-tight text-[#1A1D26] md:text-[32px]">
              <span className="md:hidden">Льготы для ветеранов СВО</span>
              <span className="hidden md:inline">Льготы и меры поддержки для ветеранов СВО</span>
            </h1>
            <p className="mx-auto mb-7 max-w-[600px] text-[15px] leading-relaxed text-[#718096] md:mb-8 md:text-[16px]">
              <span className="md:hidden">Найдите доступные меры поддержки в Москве.</span>
              <span className="hidden md:inline">Найдите доступные льготы, скидки и услуги в Москве. Все меры поддержки в одном месте.</span>
            </p>

            <form
              className="mx-auto mb-8 max-w-[720px]"
              onSubmit={handleSearchSubmit}
              role="search"
              aria-label="Поиск мер поддержки"
            >
              <div className="flex h-[56px] overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white shadow-[0_10px_24px_rgba(26,32,44,0.12)] md:h-[64px]">
                <div className="flex min-w-0 flex-1 items-center px-4 sm:px-5">
                  <Search aria-hidden="true" className="mr-3 h-5 w-5 flex-shrink-0 text-[#A0AEC0] md:h-6 md:w-6" />
                  <input
                    type="text"
                    aria-label="Поиск льгот и услуг"
                    placeholder="Поиск льгот и услуг"
                    className="w-full min-w-0 bg-transparent text-[15px] text-[#1A1D26] outline-none placeholder:text-[#A0AEC0] md:text-[16px]"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      aria-label="Очистить поиск"
                      onClick={clearSearchText}
                      className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[#718096] transition-colors hover:bg-[#EDF2F7] hover:text-[#1A1D26]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="flex min-w-[108px] items-center justify-center bg-[#2B6CB0] px-5 text-[15px] text-white transition-colors hover:bg-[#2C5282] sm:min-w-[140px] sm:px-8"
                >
                  Найти
                </button>
              </div>
            </form>

            {tabs.length > 0 && (
              <div className="category-tags -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 md:gap-3">
                {tabs.map((tab) => {
                  const isActive = activeTabSlug === tab.slug;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => (isActive ? resetResultState() : openTab(tab))}
                      className={`inline-flex flex-none items-center gap-2 rounded-full border px-4 py-2 text-[13px] transition-colors ${
                        isActive
                          ? "border-[#2B6CB0] bg-[#2B6CB0] text-white"
                          : "border-[#D7E3F3] bg-white/80 text-[#4A5568] hover:border-[#2B6CB0] hover:bg-[#EBF4FF] hover:text-[#2B6CB0]"
                      }`}
                    >
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto hidden max-w-[1280px] px-4 pb-10 pt-4 md:block md:px-8 md:pb-14 md:pt-6">
          <h2 className="mb-3 text-center text-[22px] text-[#1A1D26]">Как это работает</h2>
          <p className="mx-auto mb-10 max-w-[500px] text-center text-[15px] text-[#718096]">
            Три простых шага для получения мер поддержки
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-8">
            {[
              { icon: Search, title: "Найдите льготу", desc: "Используйте поиск или фильтры, чтобы найти подходящие меры поддержки." },
              { icon: ClipboardList, title: "Узнайте условия", desc: "Прочитайте подробную информацию об условиях и необходимых документах." },
              { icon: CheckCircle, title: "Получите поддержку", desc: "Обратитесь по указанному адресу или телефону с необходимыми документами." },
            ].map((step, index) => (
              <div key={index} className="rounded-xl border border-[#E2E8F0] bg-white p-6 text-center md:p-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EBF4FF]">
                  <step.icon className="h-6 w-6 text-[#2B6CB0]" />
                </div>
                <div className="mb-2 text-[13px] text-[#2B6CB0]">Шаг {index + 1}</div>
                <h3 className="mb-2 text-[16px] text-[#1A1D26]">{step.title}</h3>
                <p className="text-[14px] leading-relaxed text-[#718096]">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {hasActiveResultState && (
          <div className="mx-auto max-w-[1280px] px-4 pb-3 md:px-8 md:py-4">
            <button
              onClick={resetResultState}
              className="flex w-fit items-center justify-center gap-1 rounded-lg border border-[#D7DEE8] bg-[#EEF2F7] px-3 py-1.5 text-[13px] text-[#4A5568] shadow-sm transition-colors hover:border-[#FEB2B2] hover:bg-[#FFF1F1] hover:text-[#C53030]"
            >
              <X className="h-3.5 w-3.5" />
              Сбросить
            </button>
          </div>
        )}

        {loadError && (
          <section className="mx-auto max-w-[1280px] px-4 pb-6 md:px-8">
            <div className="rounded-xl border border-[#FEB2B2] bg-[#FFF5F5] px-5 py-4 text-[#C53030]">
              {loadError}
            </div>
          </section>
        )}

        {showFilteredResults && isSearching ? (
          <section className="mx-auto max-w-[1280px] px-4 pb-10 md:px-8 md:pb-12">
            {activeSectionTitle && (
              <p className="mb-2 text-[14px] text-[#2B6CB0]">{activeSectionTitle}</p>
            )}
            <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-10 text-center text-[#718096]">
              Загрузка данных...
            </div>
          </section>
        ) : showFilteredResults ? (
          <section id="benefits" className="mx-auto max-w-[1280px] px-4 pb-10 md:px-8 md:pb-12">
            {activeSectionTitle && (
              <p className="mb-2 text-[14px] text-[#2B6CB0]">{activeSectionTitle}</p>
            )}
            <h2 className={`mb-6 text-[20px] text-[#1A1D26] ${searchResults.length === 0 ? "pt-6 md:pt-0" : ""}`}>
              {searchResults.length > 0 ? `Найдено: ${searchResults.length}` : "Ничего не найдено"}
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {searchResults.map((benefit) => (
                <BenefitCard key={benefit.id} benefit={benefit} onClick={setSelectedBenefit} />
              ))}
            </div>
          </section>
        ) : tabs.length === 0 ? (
          <section id="benefits" className="mx-auto max-w-[1280px] px-4 pb-10 md:px-8 md:pb-12">
            <h2 className="mb-6 text-[20px] text-[#1A1D26]">Все льготы</h2>
            {benefits.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {benefits.map((benefit) => (
                  <BenefitCard key={benefit.id} benefit={benefit} onClick={setSelectedBenefit} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-8 text-center text-[14px] text-[#718096]">
                Пока нет опубликованных льгот.
              </div>
            )}
          </section>
        ) : (
          <>
            {tabs.map((tab, idx) => {
              const tabBenefits = benefitsForTab(tab.slug).slice(0, SECTION_PREVIEW_LIMIT);
              const id = idx === 0 ? "benefits" : `tab-${tab.slug}`;
              return (
                <Section
                  key={tab.id}
                  id={id}
                  title={tab.name}
                  subtitle={tab.subtitle}
                  bg={idx % 2 === 1}
                  onViewAll={() => openTab(tab)}
                >
                  <BenefitSlider benefits={tabBenefits} onSelect={setSelectedBenefit} />
                </Section>
              );
            })}
          </>
        )}

        <BenefitsMap />

        <section id="faq" className="border-t border-[#E2E8F0] bg-[#FAFBFC]">
          <div className="mx-auto max-w-[800px] px-4 py-10 md:px-8 md:py-14">
            <h2 className="mb-3 text-center text-[22px] text-[#1A1D26]">Часто задаваемые вопросы</h2>
            <p className="mb-8 text-center text-[15px] text-[#718096]">Ответы на популярные вопросы о мерах поддержки</p>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, index) => (
                <div key={index} className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
                  <button
                    className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left md:px-6"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="flex min-w-0 items-start gap-3 text-[15px] text-[#1A1D26]">
                      <HelpCircle className="h-5 w-5 flex-shrink-0 text-[#2B6CB0]" />
                      {item.q}
                    </span>
                    <ChevronDown className={`mt-0.5 h-4 w-4 flex-shrink-0 text-[#718096] transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === index && (
                    <div className="px-4 pb-5 pt-0 md:ml-8 md:px-6">
                      <p className="text-[14px] leading-relaxed text-[#4A5568]">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="footer" className="bg-[#1A2332] text-white">
        <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-12">
          <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 lg:mb-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(150px,0.65fr)_minmax(220px,0.9fr)] lg:gap-10">
            <div className="col-span-2 max-w-[420px] lg:col-span-1">
              <div className="mb-2 flex items-center md:mb-4">
                <span className="text-[15px] md:text-[16px]">Льгота.Москва</span>
              </div>
              <p className="text-[12px] leading-relaxed text-[#A0AEC0] md:text-[13px]">
                Единый агрегатор мер поддержки для ветеранов. Мы помогаем найти и получить доступные льготы.
              </p>
            </div>
            <div>
              <h4 className="mb-2 text-[13px] text-[#E2E8F0] md:mb-4 md:text-[14px]">Разделы</h4>
              <ul className="space-y-1 md:space-y-2">
                {NAV_ITEMS.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      onClick={(event) => {
                        event.preventDefault();
                        scrollToSection(item.href);
                      }}
                      className="text-[12px] text-[#A0AEC0] transition-colors hover:text-white md:text-[13px]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <h4 className="mb-2 text-[13px] text-[#E2E8F0] md:mb-4 md:text-[14px]">Контакты</h4>
              <div className="grid gap-2 text-[12px] text-[#A0AEC0] sm:grid-cols-3 md:text-[13px] lg:block lg:space-y-3">
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0 text-[#63B3ED]" />
                  {CONTACT_PHONE_LABEL}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0 text-[#63B3ED]" />
                  10:00-18:00
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#63B3ED]" />
                  Москва, Береговой проезд, 8, стр. 2
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-[#2D3748] pt-4 text-[11px] text-[#718096] md:pt-6 md:text-[12px]">
            <span>&copy; 2026 Льгота.Москва. Все права защищены.</span>
          </div>
        </div>
      </footer>

      {selectedBenefit && (
        <BenefitModal benefit={selectedBenefit} onClose={() => setSelectedBenefit(null)} />
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  bg = false,
  id,
  onViewAll,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  bg?: boolean;
  id?: string;
  onViewAll?: () => void;
}) {
  return (
    <section id={id} className={bg ? "border-b border-t border-[#E2E8F0] bg-[#FAFBFC]" : ""}>
      <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-8 md:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[20px] text-[#1A1D26]">{title}</h2>
            {subtitle && <p className="mt-1 text-[14px] text-[#718096]">{subtitle}</p>}
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="flex w-fit items-center gap-1 text-[14px] text-[#2B6CB0] hover:underline"
            >
              Смотреть все <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function BenefitSlider({
  benefits,
  onSelect,
}: {
  benefits: Benefit[];
  onSelect: (benefit: Benefit) => void;
}) {
  if (benefits.length === 0) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white px-6 py-8 text-center text-[14px] text-[#718096]">
        В этом разделе пока нет льгот.
      </div>
    );
  }

  return (
    <div className="benefit-slider flex snap-x snap-proximity gap-5 overflow-x-auto pb-2 sm:snap-mandatory">
      {benefits.map((benefit) => (
        <div key={benefit.id} className="w-[calc(100vw-2rem)] max-w-[360px] flex-none snap-start sm:w-[320px] lg:w-[360px] xl:w-[360px]">
          <BenefitCard benefit={benefit} onClick={onSelect} />
        </div>
      ))}
    </div>
  );
}
