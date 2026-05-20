"use client";

import { useSyncExternalStore } from "react";

const TOKEN_KEY = "vet-admin-token";

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
  notify();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useAdminToken(): string | null {
  return useSyncExternalStore(subscribe, getAdminToken, () => null);
}

export async function adminLogin(username: string, password: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const response = await fetch(`${apiBase}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error("Invalid credentials");
  }
  const data = (await response.json()) as { token: string };
  setAdminToken(data.token);
  return data.token;
}

export function adminLogout() {
  setAdminToken(null);
}
