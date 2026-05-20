"use client";

import { useSyncExternalStore } from "react";

// "Версия для слабовидящих" — GOST-style accessibility mode toggled by the
// user. Settings are applied as data-* attributes on <html> so the CSS in
// app/globals.css can restyle the whole app (including modals rendered
// anywhere in the tree). Persisted in localStorage; no personal data,
// nothing leaves the browser.

export type LvScheme = "normal" | "bw" | "wb";

export interface LvSettings {
  enabled: boolean;
  font: 1 | 2 | 3;
  scheme: LvScheme;
  spacing: boolean;
  images: boolean;
}

const STORAGE_KEY = "vet-lowvision-v1";

const DEFAULTS: LvSettings = {
  enabled: false,
  font: 1,
  scheme: "normal",
  spacing: false,
  images: true,
};

function read(): LvSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw);
    return {
      enabled: !!p.enabled,
      font: [1, 2, 3].includes(p.font) ? p.font : 1,
      scheme: ["normal", "bw", "wb"].includes(p.scheme) ? p.scheme : "normal",
      spacing: !!p.spacing,
      images: p.images !== false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

let state: LvSettings = read();
const listeners = new Set<() => void>();

function applyToDom(s: LvSettings) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (s.enabled) {
    el.setAttribute("data-lv", "on");
    el.setAttribute("data-lv-font", String(s.font));
    el.setAttribute("data-lv-scheme", s.scheme);
    el.setAttribute("data-lv-spacing", s.spacing ? "on" : "off");
    el.setAttribute("data-lv-images", s.images ? "on" : "off");
  } else {
    el.removeAttribute("data-lv");
    el.removeAttribute("data-lv-font");
    el.removeAttribute("data-lv-scheme");
    el.removeAttribute("data-lv-spacing");
    el.removeAttribute("data-lv-images");
  }
}

function persist(s: LvSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable — keep in memory */
  }
}

if (typeof document !== "undefined") {
  applyToDom(state);
}

export function setLowVision(patch: Partial<LvSettings>) {
  state = { ...state, ...patch };
  applyToDom(state);
  persist(state);
  listeners.forEach((l) => l());
}

export function toggleLowVision() {
  setLowVision({ enabled: !state.enabled });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return DEFAULTS;
}

export function useLowVision(): LvSettings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
