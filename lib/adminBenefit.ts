export interface AdminBenefitTab {
  id: number;
  slug: string;
  name: string;
}

export interface AdminBenefitSourceDraft {
  category?: string | null;
  benefit?: string | null;
  discount_value?: string | null;
  conditions?: string | null;
  documents?: string | null;
  [key: string]: unknown;
}

export interface AdminBenefit {
  id: number;
  source_page_id: number | null;
  source_index: number | null;
  source_page_name: string | null;
  source_page_website: string | null;
  source_draft: AdminBenefitSourceDraft | null;
  title: string;
  category: string;
  kind: string;
  format: string;
  value: string;
  description: string;
  summary: string;
  conditions: string;
  who_applies: string;
  address: string;
  contacts: string;
  validity: string;
  source_url: string | null;
  image: string;
  images: string[] | null;
  lat: number | null;
  lng: number | null;
  yandex_map_query: string | null;
  sort_order: number;
  is_published: boolean;
  tab_ids: number[];
  tabs: AdminBenefitTab[];
}

export interface AdminBenefitListResponse {
  items: AdminBenefit[];
  total: number;
  page: number;
  per_page: number;
}
