import type { Benefit, PublicTab } from "@/types/benefit";

// In Docker the browser reaches the backend via localhost:8000 (port-forwarded
// from the host), but the SSR pass runs *inside* the frontend container — it
// has to go through the docker network (http://backend:8000). INTERNAL_API_URL
// is set only in the server environment so it wins on the server, while the
// browser bundle keeps NEXT_PUBLIC_API_URL.
const API_BASE_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export interface FetchBenefitsParams {
  q?: string;
  tab?: string;
}

export async function fetchBenefits(params: FetchBenefitsParams = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.tab) search.set("tab", params.tab);

  const response = await fetch(`${API_BASE_URL}/api/benefits?${search.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load benefits");
  }
  return (await response.json()) as { items: Benefit[]; total: number };
}

export async function fetchBenefit(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/benefits/${id}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to load benefit");
  }
  return (await response.json()) as Benefit;
}

export async function fetchTabs() {
  const response = await fetch(`${API_BASE_URL}/api/tabs`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load tabs");
  }
  return (await response.json()) as PublicTab[];
}
