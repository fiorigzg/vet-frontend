"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Search,
  Phone,
  MapPin,
  Menu,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  FileText,
  CheckCircle,
  Clock,
  Check,
  X,
} from "lucide-react";
import { fetchBenefits } from "@/lib/api";
import { pluralRu } from "@/lib/plural";
import type { Benefit, PopularQuery, PublicTab } from "@/types/benefit";
import { BenefitCard } from "@/components/BenefitCard";
import { BenefitsMap } from "@/components/BenefitsMap";
import { LowVisionBar, LowVisionToggle } from "@/components/LowVisionBar";

const SECTION_PREVIEW_LIMIT = 8;
const PAGE_SIZE = 20;
const NAV_ITEMS = [
  { label: "Главная", href: "#top" },
  { label: "Льготы", href: "#benefits" },
  { label: "Карта", href: "#map" },
  { label: "Вопросы", href: "#faq" },
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

// Category badge: shows the icon uploaded in /admin/tabs if any, otherwise
// renders nothing (no auto-derived fallback).
function CategoryIcon({ tab }: { tab: PublicTab }) {
  if (!tab.icon) return null;
  return (
    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[10px] bg-[#E7F0FB]">
      <img src={tab.icon} alt="" className="h-6 w-6 object-contain" />
    </div>
  );
}

interface HomePageProps {
  initialBenefits: Benefit[];
  initialTabs: PublicTab[];
  initialPopularQueries: PopularQuery[];
  initialError: string | null;
}

export function HomePage({
  initialBenefits,
  initialTabs,
  initialPopularQueries,
  initialError,
}: HomePageProps) {
  const [benefits] = useState<Benefit[]>(initialBenefits);
  const [tabs] = useState<PublicTab[]>(initialTabs);
  const [popularQueries] = useState<PopularQuery[]>(initialPopularQueries);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Benefit[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [activeTabSlug, setActiveTabSlug] = useState<string | null>(null);
  const [activeSectionTitle, setActiveSectionTitle] = useState<string | null>(
    null,
  );
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(initialError);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Desktop nav scroll-spy + sliding indicator. `activeNav` tracks which
  // section is currently in view; `navIndicator` is the absolute-positioned
  // underline that animates between items.
  const navItemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [activeNav, setActiveNav] = useState<string>(NAV_ITEMS[0].href);
  const [navIndicator, setNavIndicator] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const hasActiveResultState =
    activeTabSlug !== null || Boolean(searchQuery.trim());
  const showFilteredResults = hasActiveResultState;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const b of benefits)
      for (const t of b.tabs) c[t.slug] = (c[t.slug] || 0) + 1;
    return c;
  }, [benefits]);

  // Count distinct locations, not just benefits-with-coordinates. Many
  // benefits can share one address (e.g. five measures at the same МФЦ).
  const addressCount = useMemo(() => {
    const seen = new Set<string>();
    for (const b of benefits) {
      if (b.lat != null && b.lng != null) {
        seen.add(`${b.lat}|${b.lng}`);
      }
    }
    return seen.size;
  }, [benefits]);

  // Reset + first-page load whenever the filter changes (search or tab).
  useEffect(() => {
    let cancelled = false;

    async function loadFirstPage() {
      if (!showFilteredResults) {
        setSearchResults([]);
        setSearchTotal(0);
        return;
      }
      try {
        setIsSearching(true);
        setLoadError(null);
        const response = await fetchBenefits({
          q: searchQuery.trim() || undefined,
          tab:
            activeTabSlug && activeTabSlug !== "__all__"
              ? activeTabSlug
              : undefined,
          limit: PAGE_SIZE,
          offset: 0,
        });
        if (cancelled) return;
        setSearchResults(response.items ?? []);
        setSearchTotal(response.total ?? 0);
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Не удалось выполнить поиск",
        );
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }

    loadFirstPage();
    return () => {
      cancelled = true;
    };
  }, [activeTabSlug, searchQuery, showFilteredResults]);

  async function handleShowMore() {
    if (isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      setLoadError(null);
      const response = await fetchBenefits({
        q: searchQuery.trim() || undefined,
        tab:
          activeTabSlug && activeTabSlug !== "__all__"
            ? activeTabSlug
            : undefined,
        limit: PAGE_SIZE,
        offset: searchResults.length,
      });
      // Append while de-duping by id — guards against races and double-clicks.
      setSearchResults((prev) => {
        const seen = new Set(prev.map((b) => b.id));
        return [...prev, ...(response.items ?? []).filter((b) => !seen.has(b.id))];
      });
      setSearchTotal(response.total ?? searchTotal);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Не удалось загрузить",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Scroll-spy: pick the deepest section whose top has crossed a marker just
  // below the sticky header. That section's nav item becomes active.
  useEffect(() => {
    const sections = NAV_ITEMS.map((it) => {
      const el = document.getElementById(it.href.slice(1));
      return el ? { href: it.href, el } : null;
    }).filter((x): x is { href: string; el: HTMLElement } => x !== null);

    function update() {
      const header = document.querySelector("header");
      const headerH = header instanceof HTMLElement ? header.offsetHeight : 0;
      const marker = headerH + 40;
      let current = NAV_ITEMS[0].href;
      for (const s of sections) {
        if (s.el.getBoundingClientRect().top - marker <= 0) current = s.href;
      }
      setActiveNav(current);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Position the sliding underline under the currently active nav item.
  useEffect(() => {
    function compute() {
      const el = navItemRefs.current[activeNav];
      if (!el) {
        setNavIndicator({ left: 0, width: 0 });
        return;
      }
      setNavIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [activeNav]);

  function benefitsForTab(slug: string) {
    return benefits.filter((b) => b.tabs.some((t) => t.slug === slug));
  }

  function scrollToSection(selector: string) {
    if (selector === "#top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const header = document.querySelector("header");
    const headerHeight =
      header instanceof HTMLElement ? header.offsetHeight : 0;
    const element = document.querySelector(selector);
    if (!element) return;
    const targetTop =
      element.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
  }

  function handleSearchSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setActiveTabSlug(null);
    setActiveSectionTitle(null);
    setSearchQuery(searchInput.trim());
    scrollToSection("#benefits");
  }

  function handleChipClick(text: string) {
    setSearchInput(text);
    setActiveTabSlug(null);
    setActiveSectionTitle(null);
    setSearchQuery(text);
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

  function showAllBenefits() {
    setSearchInput("");
    setSearchQuery("");
    setActiveTabSlug("__all__");
    setActiveSectionTitle(null);
    scrollToSection("#benefits");
  }

  function resetResultState() {
    setActiveTabSlug(null);
    setActiveSectionTitle(null);
    setSearchInput("");
    setSearchQuery("");
  }

  // "__all__" is a sentinel activeTabSlug meaning "show everything" — it keeps
  // the filtered view active but is mapped to no tab filter in the fetch above.

  return (
    <div
      className="min-h-screen bg-[#F2F5FA] text-[#0F1A2E] font-['Onest','Inter',sans-serif] [font-feature-settings:'ss01']"
      id="top"
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-[15px] focus:text-[#0D4D8C] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0D4D8C]"
      >
        Перейти к содержанию
      </a>

      <LowVisionBar />

      {/* ===================== Header ===================== */}
      <header className="sticky top-0 z-40 border-b border-[#E1E6EE] bg-white">
        <div className="relative mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-3 md:px-8 md:py-3.5">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("#top");
            }}
            className="flex min-w-0 items-center gap-3 rounded-lg transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4D8C] focus-visible:ring-offset-2"
            aria-label="Главная"
          >
            <img
              src="/logo.png"
              alt="Логотип"
              className="h-10 w-auto flex-shrink-0 object-contain md:h-11"
            />
            <div className="min-w-0 leading-tight">
              <span className="block truncate text-[16px] font-semibold tracking-[-0.01em] text-[#0F1A2E]">
                Льгота.Москва
              </span>
              <span className="block max-w-[180px] truncate text-[11.5px] text-[#5B6577] sm:max-w-none">
                Льготы для ветеранов СВО
              </span>
            </div>
          </a>

          <nav className="relative ml-8 hidden items-center gap-7 whitespace-nowrap lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.href;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  ref={(el) => {
                    navItemRefs.current[item.href] = el;
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.href);
                  }}
                  className={`py-1.5 text-[14.5px] transition-colors hover:text-[#0D4D8C] ${
                    isActive
                      ? "font-semibold text-[#0F1A2E]"
                      : "font-medium text-[#5B6577]"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            {navIndicator.width > 0 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 h-[2px] bg-[#0D4D8C] transition-[left,width] duration-300 ease-out"
                style={{ left: navIndicator.left, width: navIndicator.width }}
              />
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <LowVisionToggle />
            <a
              href={`tel:${CONTACT_PHONE_HREF}`}
              className="hidden items-center gap-2 rounded-lg bg-[#E7F0FB] px-3 py-2 text-[13.5px] font-semibold text-[#0D4D8C] transition-colors hover:bg-[#D7E6F8] xl:flex"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {CONTACT_PHONE_LABEL}
            </a>
            <button
              type="button"
              className="flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-[#E1E6EE] text-[#1F2A3E] transition-colors hover:border-[#0D4D8C] hover:text-[#0D4D8C] lg:hidden"
              aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((o) => !o)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className="border-t border-[#E1E6EE] bg-white px-6 pb-5 pt-4 lg:hidden">
            <div className="mx-auto flex max-w-[1240px] flex-col">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    scrollToSection(item.href);
                  }}
                  className="border-b border-[#E1E6EE] py-3.5 text-[16px] font-medium text-[#1F2A3E] transition-colors hover:text-[#0D4D8C]"
                >
                  {item.label}
                </a>
              ))}
              <a
                href={`tel:${CONTACT_PHONE_HREF}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#E7F0FB] px-3 py-2.5 text-[15px] font-semibold text-[#0D4D8C]"
              >
                <Phone className="h-4 w-4 flex-shrink-0" />
                {CONTACT_PHONE_LABEL}
              </a>
            </div>
          </nav>
        )}
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        {/* ===================== Hero ===================== */}
        <section className="relative overflow-hidden px-4 pb-12 pt-14 md:px-8 md:pb-12 md:pt-16">
          <div className="relative mx-auto max-w-[1240px]">
            {/* Decorative logo watermark — anchored to the right edge of the
                content block (not the screen edge) so it sits beside the copy. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-1/2 z-0 hidden h-[440px] w-[440px] -translate-y-1/2 opacity-[0.06] md:block"
            >
              <img
                src="/logo.png"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E1E6EE] bg-white py-1.5 pl-2 pr-3 text-[12.5px] font-medium text-[#1F2A3E]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#0D4D8C]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0D4D8C]" />
                  Обновлено сегодня
                </span>
                <span className="hidden h-3 w-px bg-[#E1E6EE] sm:block" />
                <span className="hidden text-[#5B6577] sm:inline">
                  {benefits.length}+ мер из официальных источников
                </span>
              </div>

              <h1 className="mt-4 max-w-[880px] text-[34px] font-semibold leading-[1.07] tracking-[-0.025em] text-[#0F1A2E] md:text-[52px]">
                Меры поддержки для ветеранов&nbsp;СВО{" "}
                <span className="text-[#0D4D8C]">в одном&nbsp;месте</span>
              </h1>

              <p className="mt-4 max-w-[660px] text-[16px] leading-relaxed text-[#5B6577] md:text-[17.5px]">
                Найдите доступные льготы, скидки и услуги в Москве. Проверенные
                меры из официальных источников — медицина, образование,
                транспорт, жильё.
              </p>

              <form
                className="mt-7 flex max-w-[760px] items-center gap-2 rounded-2xl border border-[#E1E6EE] bg-white p-2 shadow-[0_12px_32px_-16px_rgba(13,77,140,0.25)]"
                onSubmit={handleSearchSubmit}
                role="search"
                aria-label="Поиск мер поддержки"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3.5 py-2.5">
                  <Search
                    aria-hidden="true"
                    className="h-5 w-5 flex-shrink-0 text-[#5B6577]"
                  />
                  <input
                    type="text"
                    aria-label="Поиск льгот и услуг"
                    placeholder="Поиск льгот и услуг"
                    className="w-full min-w-0 bg-transparent text-[16px] text-[#0F1A2E] outline-none placeholder:text-[#8893A6] md:text-[16.5px]"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      aria-label="Очистить поиск"
                      onClick={clearSearchText}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F2F5FA] text-[#5B6577] transition-colors hover:bg-[#E7F0FB] hover:text-[#0D4D8C]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-[#0D4D8C] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#073A6E] sm:px-6"
                >
                  Найти <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {popularQueries.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[13px] text-[#5B6577]">
                    Часто ищут:
                  </span>
                  {popularQueries.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleChipClick(q.text)}
                      className="rounded-full border border-[#E1E6EE] bg-white px-3.5 py-1.5 text-[13.5px] font-medium text-[#1F2A3E] transition-colors hover:border-[#0D4D8C] hover:text-[#0D4D8C]"
                    >
                      {q.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="relative mx-auto max-w-[1240px]">
            {benefits.length > 0 && (
              <div className="mt-10 grid grid-cols-1 divide-y divide-[#E1E6EE] overflow-hidden rounded-2xl border border-[#E1E6EE] bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  { n: `${benefits.length}+`, l: "проверенных мер" },
                  {
                    n: `${tabs.length || "—"}`,
                    l: tabs.length
                      ? pluralRu(tabs.length, ["категория", "категории", "категорий"])
                      : "категорий",
                  },
                  {
                    n: `${addressCount || "—"}`,
                    l: addressCount
                      ? `${pluralRu(addressCount, ["адрес", "адреса", "адресов"])} на карте`
                      : "адресов на карте",
                  },
                ].map((s) => (
                  <div key={s.l} className="px-6 py-5">
                    <div className="text-[28px] font-semibold tracking-[-0.02em] text-[#0D4D8C] md:text-[30px]">
                      {s.n}
                    </div>
                    <div className="mt-1 text-[13.5px] text-[#5B6577]">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ===================== Category grid ===================== */}
        {tabs.length > 0 && (
          <section className="px-4 pb-4 pt-2 md:px-8 md:pb-14">
            <div className="mx-auto max-w-[1240px]">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <div className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#0D4D8C]">
                    Категории
                  </div>
                  <h2 className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#0F1A2E] md:text-[28px]">
                    Выберите направление
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={showAllBenefits}
                  className="inline-flex flex-shrink-0 items-center gap-1 text-[14px] font-semibold text-[#0D4D8C] hover:underline"
                >
                  Все {benefits.length} льгот{" "}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {tabs.map((tab) => {
                  const active = activeTabSlug === tab.slug;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        active ? resetResultState() : openTab(tab)
                      }
                      className={`relative flex flex-col gap-2.5 rounded-xl border p-5 text-left transition-colors ${
                        active
                          ? "border-[#0D4D8C] bg-[#F2F7FD]"
                          : "border-[#E1E6EE] bg-white hover:border-[#CDD6E3]"
                      }`}
                    >
                      <CategoryIcon tab={tab} />
                      <div className="mt-0.5 text-[15.5px] font-semibold text-[#0F1A2E]">
                        {tab.name}
                      </div>
                      <div className="-mt-1 text-[13px] text-[#5B6577]">
                        {counts[tab.slug] || 0}&nbsp;мер
                      </div>
                      {active && (
                        <div className="absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0D4D8C] text-white">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ===================== How it works (desktop+tablet only) ===================== */}
        {!showFilteredResults && (
          <section className="hidden px-4 pb-16 pt-2 md:block md:px-8">
            <div className="mx-auto max-w-[1240px]">
              <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#E1E6EE] bg-white md:grid-cols-[260px_1fr]">
                <div className="border-b border-[#E1E6EE] bg-[#F2F7FD] p-7 md:border-b-0 md:border-r">
                  <div className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#0D4D8C]">
                    Как это работает
                  </div>
                  <div className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#0F1A2E]">
                    Три шага до получения поддержки
                  </div>
                  <p className="mt-3.5 text-[13.5px] leading-relaxed text-[#5B6577]">
                    Один портал вместо десятков сайтов министерств и ведомств.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3">
                  {[
                    {
                      i: Search,
                      t: "Найдите льготу",
                      d: "Поиск, фильтр по категории и району — за секунды.",
                    },
                    {
                      i: FileText,
                      t: "Изучите условия",
                      d: "Полные требования, документы и сроки рассмотрения.",
                    },
                    {
                      i: CheckCircle,
                      t: "Получите поддержку",
                      d: "Адрес, телефон и ссылка на официальный портал.",
                    },
                  ].map((s, i) => (
                    <div
                      key={s.t}
                      className={`p-7 ${i < 2 ? "border-b border-[#E1E6EE] sm:border-b-0 sm:border-r" : ""}`}
                    >
                      <div className="text-[13px] font-semibold text-[#0D4D8C]">
                        Шаг {i + 1}
                      </div>
                      <div className="mt-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#E7F0FB] text-[#0D4D8C]">
                        <s.i className="h-[18px] w-[18px]" />
                      </div>
                      <div className="mt-3.5 text-[16px] font-semibold text-[#0F1A2E]">
                        {s.t}
                      </div>
                      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#5B6577]">
                        {s.d}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {loadError && (
          <section className="mx-auto max-w-[1240px] px-4 pb-6 md:px-8">
            <div className="rounded-xl border border-[#FEB2B2] bg-[#FFF5F5] px-5 py-4 text-[#C53030]">
              {loadError}
            </div>
          </section>
        )}

        {/* ===================== Catalog (filtered or grouped) ===================== */}
        <div id="benefits">
          {showFilteredResults ? (
            <FilteredGrid
              title={
                activeSectionTitle
                  ? activeSectionTitle
                  : searchQuery
                    ? `Результаты по «${searchQuery}»`
                    : "Все льготы"
              }
              subtitle={
                activeSectionTitle ? "Категория" : searchQuery ? "Поиск" : null
              }
              items={searchResults}
              total={searchTotal}
              loading={isSearching}
              loadingMore={isLoadingMore}
              onShowMore={handleShowMore}
              onReset={resetResultState}
            />
          ) : tabs.length === 0 ? (
            <SectionRow title="Все льготы">
              {benefits.length > 0 ? (
                <CardGrid>
                  {benefits.map((b) => (
                    <BenefitCard key={b.id} benefit={b} />
                  ))}
                </CardGrid>
              ) : (
                <EmptyBox>Пока нет опубликованных льгот.</EmptyBox>
              )}
            </SectionRow>
          ) : (
            <>
              {tabs.map((tab, idx) => {
              const tabBenefits = benefitsForTab(tab.slug);
              if (tabBenefits.length === 0) return null;
              return (
                <SectionRow
                  key={tab.id}
                  bg={idx % 2 === 1}
                  heading={
                    <div className="flex items-center gap-3">
                      <CategoryIcon tab={tab} />
                      <div>
                        <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-[#0F1A2E] md:text-[26px]">
                          {tab.name}
                        </h2>
                        <div className="text-[13.5px] text-[#5B6577]">
                          {tabBenefits.length} мер поддержки
                        </div>
                      </div>
                    </div>
                  }
                  onViewAll={() => openTab(tab)}
                  viewAllLabel="Все в разделе"
                >
                  <BenefitRail items={tabBenefits.slice(0, SECTION_PREVIEW_LIMIT)} />
                </SectionRow>
              );
              })}
            </>
          )}
        </div>

        {/* ===================== Map ===================== */}
        <BenefitsMap />

        {/* ===================== FAQ ===================== */}
        <section id="faq" className="border-t border-[#E1E6EE] bg-[#FAFBFD]">
          <div className="mx-auto max-w-[900px] px-4 py-14 md:px-8">
            <div className="mb-9 text-center">
              <div className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-[#0D4D8C]">
                Помощь
              </div>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-[#0F1A2E] md:text-[32px]">
                Частые вопросы
              </h2>
              <p className="mt-2 text-[15px] text-[#5B6577] md:text-[16px]">
                Ответы на популярные вопросы о мерах поддержки
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className={`overflow-hidden rounded-xl border bg-white transition-colors ${isOpen ? "border-[#CDD6E3]" : "border-[#E1E6EE]"}`}
                  >
                    <button
                      className="flex w-full items-start justify-between gap-3 px-5 py-[18px] text-left md:px-6"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                    >
                      <span className="flex min-w-0 items-start gap-3.5">
                        <span className="mt-0.5 min-w-[22px] text-[13px] font-bold text-[#0D4D8C]">
                          0{index + 1}
                        </span>
                        <span className="text-[16px] font-semibold leading-snug text-[#0F1A2E]">
                          {item.q}
                        </span>
                      </span>
                      <ChevronDown
                        className={`mt-1 h-[18px] w-[18px] flex-shrink-0 text-[#5B6577] transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="ml-[60px] mr-6 border-t border-[#E1E6EE] pb-5 pt-3">
                        <p className="text-[14.5px] leading-relaxed text-[#1F2A3E]">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ===================== Footer ===================== */}
      <footer id="footer" className="bg-[#1A2332] text-white">
        <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-12">
          <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-5 lg:mb-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(150px,0.65fr)_minmax(220px,0.9fr)] lg:gap-10">
            <div className="col-span-2 max-w-[420px] lg:col-span-1">
              <div className="mb-2 flex items-center md:mb-4">
                <span className="text-[15px] font-semibold md:text-[16px]">
                  Льгота.Москва
                </span>
              </div>
              <p className="text-[12px] leading-relaxed text-[#A0AEC0] md:text-[13px]">
                Единый агрегатор мер поддержки для ветеранов. Мы помогаем найти
                и получить доступные льготы.
              </p>
            </div>
            <div>
              <h4 className="mb-2 text-[13px] text-[#E2E8F0] md:mb-4 md:text-[14px]">
                Разделы
              </h4>
              <ul className="space-y-1 md:space-y-2">
                {NAV_ITEMS.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
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
              <h4 className="mb-2 text-[13px] text-[#E2E8F0] md:mb-4 md:text-[14px]">
                Контакты
              </h4>
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
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Building blocks
// ---------------------------------------------------------------------------

function SectionRow({
  title,
  subtitle,
  heading,
  children,
  bg = false,
  onViewAll,
  viewAllLabel = "Смотреть все",
}: {
  title?: string;
  subtitle?: string | null;
  heading?: React.ReactNode;
  children: React.ReactNode;
  bg?: boolean;
  onViewAll?: () => void;
  viewAllLabel?: string;
}) {
  return (
    <section className={bg ? "border-y border-[#E1E6EE] bg-[#FAFBFD]" : ""}>
      <div className="mx-auto max-w-[1240px] px-4 py-12 md:px-8 md:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          {heading ?? (
            <div className="min-w-0">
              <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-[#0F1A2E] md:text-[26px]">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1.5 text-[14px] text-[#5B6577]">{subtitle}</p>
              )}
            </div>
          )}
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex flex-shrink-0 items-center gap-1 text-[14px] font-medium text-[#0D4D8C] hover:underline"
            >
              {viewAllLabel} <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E1E6EE] bg-white px-6 py-10 text-center text-[14px] text-[#5B6577]">
      {children}
    </div>
  );
}

function FilteredGrid({
  title,
  subtitle,
  items,
  total,
  loading,
  loadingMore,
  onShowMore,
  onReset,
}: {
  title: string;
  subtitle: string | null;
  items: Benefit[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  onShowMore: () => void;
  onReset: () => void;
}) {
  const hasMore = !loading && items.length < total;
  return (
    <section>
      <div className="mx-auto max-w-[1240px] px-4 py-10 md:px-8 md:py-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {subtitle && (
              <div className="mb-1 text-[13px] font-semibold text-[#0D4D8C]">
                {subtitle}
              </div>
            )}
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#0F1A2E] md:text-[24px]">
              {loading
                ? title
                : total > 0
                  ? `${title}: ${total}`
                  : "Ничего не найдено"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#E1E6EE] bg-white px-3.5 py-2 text-[13.5px] font-medium text-[#1F2A3E] transition-colors hover:border-[#FEB2B2] hover:bg-[#FFF1F1] hover:text-[#C53030]"
          >
            <X className="h-3.5 w-3.5" /> Сбросить фильтр
          </button>
        </div>
        {loading ? (
          <EmptyBox>Загрузка данных…</EmptyBox>
        ) : items.length > 0 ? (
          <>
            <CardGrid>
              {items.map((b) => (
                <BenefitCard key={b.id} benefit={b} />
              ))}
            </CardGrid>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={onShowMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#E1E6EE] bg-white px-5 py-2.5 text-[14px] font-medium text-[#1F2A3E] transition-colors hover:border-[#0D4D8C] hover:text-[#0D4D8C] disabled:opacity-60"
                >
                  {loadingMore ? "Загрузка…" : "Показать ещё"}
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyBox>
            По запросу ничего не нашлось. Попробуйте изменить запрос или
            сбросить фильтр.
          </EmptyBox>
        )}
      </div>
    </section>
  );
}

// Horizontal rail for per-category section previews — one row, scroll x.
// `-mx-4 md:-mx-8` extends the rail to the parent container's box edges
// (cancelling SectionRow's px-4/8). With no internal padding, four cards at
// 290px + gap-4 fit inside 1240px (`4×290 + 3×16 = 1208`). On mobile the
// cards keep their fluid `min(78vw, 300px)` width so one card with a peek.
// `rounded-xl` matches the BenefitCard radius so the rail sits as a single
// rounded panel rather than a flush horizontal strip.
function BenefitRail({ items }: { items: Benefit[] }) {
  if (items.length === 0) {
    return <EmptyBox>В этом разделе пока нет льгот.</EmptyBox>;
  }
  return (
    <div className="benefit-slider -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scroll-px-4 md:-mx-8 md:snap-proximity md:pl-0 md:pr-8 md:scroll-pl-0">
      {items.map((b) => (
        <div
          key={b.id}
          className="w-[calc(100vw-3.5rem)] flex-none snap-start sm:w-[290px]"
        >
          <BenefitCard benefit={b} />
        </div>
      ))}
    </div>
  );
}
