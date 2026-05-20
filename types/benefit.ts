export interface BenefitTab {
  slug: string;
  name: string;
}

export interface Benefit {
  id: number;
  title: string;
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
}
