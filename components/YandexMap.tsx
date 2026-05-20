"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import {
  loadYandexMaps,
  parseCoordinate,
  YANDEX_MAPS_API_KEY,
  type YMapsMap,
} from "@/lib/yandexMaps";

type Coordinate = number | string | null | undefined;

interface YandexMapProps {
  address?: string;
  className?: string;
  lat?: Coordinate;
  lng?: Coordinate;
  title?: string;
}

const MAP_TEXT = {
  benefitAddress: "Адрес льготы",
  keyDescription:
    "Добавьте NEXT_PUBLIC_YANDEX_MAPS_API_KEY в .env.local и перезапустите frontend",
  keyTitle: "Ключ Яндекс.Карт не задан",
  loadError: "Не удалось загрузить карту",
  missingCoordsDescription: "Заполните lat и lng в таблице locations",
  missingCoordsTitle: "Координаты не указаны",
  restrictionsDescription: "Проверьте ключ API и ограничения домена",
};

export function YandexMap({ address, className = "", lat, lng, title }: YandexMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const center = useMemo(() => {
    const parsedLat = parseCoordinate(lat);
    const parsedLng = parseCoordinate(lng);
    return parsedLat !== null && parsedLng !== null
      ? ([parsedLat, parsedLng] as [number, number])
      : null;
  }, [lat, lng]);

  useEffect(() => {
    if (!center || !containerRef.current) return;

    let map: YMapsMap | null = null;
    let cancelled = false;
    setError(null);

    loadYandexMaps()
      .then((ymaps) => {
        if (cancelled || !containerRef.current) return;

        map = new ymaps.Map(containerRef.current, {
          center,
          controls: ["zoomControl", "fullscreenControl"],
          zoom: 15,
        });
        map.behaviors.disable("scrollZoom");

        const placemark = new ymaps.Placemark(
          center,
          {
            balloonContent: address || title || MAP_TEXT.benefitAddress,
            hintContent: title || address || MAP_TEXT.benefitAddress,
          },
          { iconColor: "#2B6CB0", preset: "islands#blueDotIcon" },
        );

        map.geoObjects.add(placemark);
      })
      .catch(() => {
        if (!cancelled) setError(MAP_TEXT.loadError);
      });

    return () => {
      cancelled = true;
      map?.destroy();
    };
  }, [address, center, title]);

  if (!YANDEX_MAPS_API_KEY) {
    return (
      <MapFallback
        className={className}
        title={MAP_TEXT.keyTitle}
        description={MAP_TEXT.keyDescription}
      />
    );
  }

  if (!center) {
    return (
      <MapFallback
        className={className}
        title={MAP_TEXT.missingCoordsTitle}
        description={MAP_TEXT.missingCoordsDescription}
      />
    );
  }

  if (error) {
    return (
      <MapFallback className={className} title={error} description={MAP_TEXT.restrictionsDescription} />
    );
  }

  return <div ref={containerRef} className={`overflow-hidden rounded-xl bg-[#E2E8F0] ${className}`} />;
}

function MapFallback({
  className = "",
  description,
  title,
}: {
  className?: string;
  description: string;
  title: string;
}) {
  return (
    <div className={`flex items-center justify-center rounded-xl bg-[#E2E8F0] ${className}`}>
      <div className="px-4 text-center text-[#718096]">
        <MapPin className="mx-auto mb-2 h-8 w-8 text-[#2B6CB0]" />
        <span className="block text-[13px] text-[#4A5568]">{title}</span>
        <span className="mt-1 block text-[12px] leading-snug">{description}</span>
      </div>
    </div>
  );
}
