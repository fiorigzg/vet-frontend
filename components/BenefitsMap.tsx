"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, MapPin } from "lucide-react";
import type { Benefit } from "@/types/benefit";
import { fetchBenefits } from "@/lib/api";
import { pluralRu } from "@/lib/plural";
import {
  loadYandexMaps,
  parseCoordinate,
  YANDEX_MAPS_API_KEY,
  type YMapsApi,
  type YMapsMap,
} from "@/lib/yandexMaps";

const MOSCOW: [number, number] = [55.751244, 37.618423];

const BADGE_STYLE =
  "transform:translate(-50%,-50%);min-width:42px;height:42px;display:flex;" +
  "align-items:center;justify-content:center;padding:0 8px;border-radius:13px;" +
  "background:#1A2332;border:3px solid #2B6CB0;color:#fff;" +
  "font:600 15px/1 Inter,Arial,sans-serif;box-shadow:0 6px 16px rgba(26,32,44,.35)";
const DOT_STYLE =
  "transform:translate(-50%,-50%);width:22px;height:22px;border-radius:50%;" +
  "background:#2B6CB0;border:3px solid #fff;box-shadow:0 3px 8px rgba(26,32,44,.4)";

interface Located {
  lat: number;
  lng: number;
  items: Benefit[];
}

export function BenefitsMap() {
  const router = useRouter();
  const mapBoxRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Located[]>([]);
  const [picker, setPicker] = useState<Located | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchBenefits();
        if (cancelled) return;
        const byCoord = new Map<string, Located>();
        for (const b of res.items ?? []) {
          const la = parseCoordinate(b.lat);
          const ln = parseCoordinate(b.lng);
          if (la === null || ln === null) continue;
          const key = `${la.toFixed(6)},${ln.toFixed(6)}`;
          const g = byCoord.get(key);
          if (g) g.items.push(b);
          else byCoord.set(key, { lat: la, lng: ln, items: [b] });
        }
        setGroups([...byCoord.values()]);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Не удалось загрузить карту");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!YANDEX_MAPS_API_KEY || loading || error || groups.length === 0) return;
    if (!mapBoxRef.current) return;

    let map: YMapsMap | null = null;
    let cancelled = false;

    loadYandexMaps()
      .then((ymaps: YMapsApi) => {
        if (cancelled || !mapBoxRef.current) return;

        map = new ymaps.Map(
          mapBoxRef.current,
          { center: MOSCOW, zoom: 10, controls: ["zoomControl"] },
          { suppressMapOpenBlock: true },
        );
        map.behaviors.disable("scrollZoom");

        const ClusterLayout = ymaps.templateLayoutFactory.createClass(
          `<div style="${BADGE_STYLE}">{{ properties.geoObjects.length }}</div>`,
        );
        const CountBadge = ymaps.templateLayoutFactory.createClass(
          `<div style="${BADGE_STYLE}">{{ properties.count }}</div>`,
        );
        const Dot = ymaps.templateLayoutFactory.createClass(
          `<div style="${DOT_STYLE}"></div>`,
        );

        const clusterer = new ymaps.Clusterer({
          clusterIconLayout: ClusterLayout,
          clusterIconShape: {
            type: "Rectangle",
            coordinates: [
              [-24, -24],
              [24, 24],
            ],
          },
          clusterDisableClickZoom: true,
          groupByCoordinates: false,
          gridSize: 64,
          hasBalloon: false,
        });

        const placemarks = groups.map((g) => {
          const multi = g.items.length > 1;
          const pm = new ymaps.Placemark(
            [g.lat, g.lng],
            {
              count: g.items.length,
              hintContent: multi
                ? `${g.items.length} мер: ${g.items.map((b) => b.title).join(", ")}`
                : g.items[0].title,
            },
            multi
              ? {
                  iconLayout: CountBadge,
                  iconShape: {
                    type: "Rectangle",
                    coordinates: [
                      [-22, -22],
                      [22, 22],
                    ],
                  },
                }
              : {
                  iconLayout: Dot,
                  iconShape: { type: "Circle", coordinates: [0, 0], radius: 13 },
                },
          );
          pm.events.add("click", () => {
            const m = map;
            if (m) {
              const z = typeof m.getZoom === "function" ? m.getZoom() : 12;
              m.setCenter([g.lat, g.lng], Math.max(z, 15), { duration: 450 });
            }
            window.setTimeout(() => {
              if (g.items.length === 1) router.push(`/benefits/${g.items[0].id}`);
              else setPicker(g);
            }, 480);
          });
          return pm;
        });

        clusterer.add(placemarks);
        map.geoObjects.add(clusterer);

        clusterer.events.add("click", (event: unknown) => {
          const m = map;
          if (!m) return;
          const target = (
            event as { get: (key: string) => unknown }
          ).get("target") as {
            getGeoObjects?: () => unknown[];
            geometry?: { getCoordinates?: () => [number, number] };
          };
          if (!target || typeof target.getGeoObjects !== "function") return;
          const coords = target.geometry?.getCoordinates?.();
          if (!coords) return;
          const z = typeof m.getZoom === "function" ? m.getZoom() : 10;
          m.setCenter(coords, Math.min(z + 3, 17), { duration: 500 });
        });

        const bounds = clusterer.getBounds();
        if (bounds) {
          map.setBounds(bounds, {
            checkZoomRange: true,
            zoomMargin: 40,
            duration: 600,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить карту");
      });

    return () => {
      cancelled = true;
      map?.destroy();
    };
  }, [loading, error, groups, router]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <section id="map" className="border-t border-[#E2E8F0] bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-8 md:py-14">
        <h2 className="mb-3 text-center text-[22px] text-[#1A1D26]">
          Льготы на карте Москвы
        </h2>
        <p className="mb-8 text-center text-[15px] text-[#718096]">
          {loading
            ? "Загрузка карты…"
            : `${total} ${pluralRu(total, ["мера", "меры", "мер"])} в ${groups.length} ${pluralRu(groups.length, ["точке", "точках", "точках"])} — нажмите метку, чтобы открыть`}
        </p>

        <div className="relative h-[clamp(360px,60vh,600px)] w-full overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#E2E8F0]">
          {!YANDEX_MAPS_API_KEY ? (
            <MapNotice
              title="Ключ Яндекс.Карт не задан"
              text="Добавьте NEXT_PUBLIC_YANDEX_MAPS_API_KEY в .env.local и перезапустите frontend"
            />
          ) : error ? (
            <MapNotice
              title={error}
              text="Проверьте ключ API и ограничения домена"
            />
          ) : !loading && groups.length === 0 ? (
            <MapNotice
              title="Нет мер с координатами"
              text="Заполните lat/lng в таблице locations"
            />
          ) : (
            <div ref={mapBoxRef} className="absolute inset-0" />
          )}

          {picker && (
            <div className="absolute inset-0 z-10 flex items-end justify-center bg-black/30 p-4 sm:items-center">
              <div className="max-h-[80%] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[15px] text-[#1A1D26]">
                    {picker.items.length} мер по этому адресу
                  </h3>
                  <button
                    onClick={() => setPicker(null)}
                    aria-label="Закрыть список"
                    className="rounded-lg p-1.5 text-[#718096] hover:bg-[#F7FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0]"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
                <ul className="space-y-2">
                  {picker.items.map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/benefits/${b.id}`}
                        onClick={() => setPicker(null)}
                        className="block w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-left transition-colors hover:border-[#2B6CB0] hover:bg-[#EBF4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0]"
                      >
                        <span className="block text-[15px] text-[#1A1D26]">
                          {b.title}
                        </span>
                        {b.address && (
                          <span className="block text-[13px] text-[#718096]">
                            {b.address}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MapNotice({ title, text }: { title: string; text: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#F7FAFC]">
      <div className="px-6 text-center text-[#718096]">
        <MapPin aria-hidden="true" className="mx-auto mb-2 h-8 w-8 text-[#2B6CB0]" />
        <p className="text-[14px] text-[#4A5568]">{title}</p>
        <p className="mt-1 text-[13px]">{text}</p>
      </div>
    </div>
  );
}
