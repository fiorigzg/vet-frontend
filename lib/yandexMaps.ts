"use client";

// Shared Yandex Maps 2.1 loader. The script is injected once and cached on
// window.yandexMapsPromise so every consumer (the modal map and the full
// benefits map) shares a single API instance.

export type YMapsMap = {
  behaviors: { disable: (behavior: string | string[]) => void };
  destroy: () => void;
  geoObjects: { add: (geoObject: unknown) => void };
  getZoom: () => number;
  setCenter: (
    center: [number, number],
    zoom?: number,
    options?: Record<string, unknown>,
  ) => Promise<unknown> | unknown;
  setBounds: (
    bounds: number[][],
    options?: Record<string, unknown>,
  ) => Promise<unknown> | unknown;
};

export type YMapsApi = {
  ready: (
    successCallback: () => void,
    errorCallback?: (error: unknown) => void,
  ) => void;
  Map: new (
    container: HTMLElement,
    state: {
      center: [number, number];
      controls?: string[];
      zoom: number;
    },
    options?: Record<string, unknown>,
  ) => YMapsMap;
  Placemark: new (
    geometry: [number, number],
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => {
    events: { add: (event: string, handler: () => void) => void };
  };
  Clusterer: new (options?: Record<string, unknown>) => {
    add: (objects: unknown) => void;
    getBounds: () => number[][] | null;
    events: {
      add: (event: string, handler: (e: unknown) => void) => void;
    };
  };
  templateLayoutFactory: {
    createClass: (
      template: string,
      overrides?: Record<string, unknown>,
    ) => unknown;
  };
};

declare global {
  interface Window {
    ymaps?: YMapsApi;
    yandexMapsPromise?: Promise<YMapsApi>;
  }
}

export const YANDEX_MAPS_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

export function parseCoordinate(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function loadYandexMaps(): Promise<YMapsApi> {
  if (!YANDEX_MAPS_API_KEY) {
    return Promise.reject(new Error("Yandex Maps API key is missing"));
  }

  if (window.ymaps) {
    return new Promise<YMapsApi>((resolve, reject) => {
      window.ymaps?.ready(() => resolve(window.ymaps as YMapsApi), reject);
    });
  }

  if (!window.yandexMapsPromise) {
    window.yandexMapsPromise = new Promise<YMapsApi>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(
        YANDEX_MAPS_API_KEY,
      )}&lang=ru_RU`;
      script.async = true;
      script.onload = () => {
        window.ymaps?.ready(() => resolve(window.ymaps as YMapsApi), reject);
      };
      script.onerror = () =>
        reject(new Error("Failed to load Yandex Maps API"));
      document.head.appendChild(script);
    });
  }

  return window.yandexMapsPromise;
}
