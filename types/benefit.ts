export interface BenefitTab {
  slug: string;
  name: string;
}

export interface Benefit {
  id: number;
  title: string;
  category: string;
  value: string;
  kind: string;
  regulationLevel: string;
  validity: string;
  description: string;
  summary: string;
  conditions: string;
  whoApplies: string;
  address: string;
  image: string;
  images: string[];
  contacts: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  sourceUrl?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  yandexMapQuery?: string | null;
  tabs: BenefitTab[];
  tabIds: number[];
}

export interface PublicTab {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  icon: string;
}

export interface PopularQuery {
  id: number;
  text: string;
  sort_order: number;
  is_active: boolean;
}
