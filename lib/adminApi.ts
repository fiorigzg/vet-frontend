"use client";

import { getAdminToken, setAdminToken } from "@/lib/adminAuth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function adminApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAdminToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 401) {
    // Token rejected — clear it so the auth gate re-routes to /admin/login.
    setAdminToken(null);
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return undefined as T;
}

export function adminWsUrl(path: string): string {
  const token = getAdminToken() ?? "";
  const wsBase = API_BASE.replace(/^http/, "ws");
  const sep = path.includes("?") ? "&" : "?";
  return `${wsBase}/api${path}${sep}token=${encodeURIComponent(token)}`;
}

export async function adminUpload(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  return adminApi<{ url: string }>("/admin/uploads", {
    method: "POST",
    body: form,
  });
}
