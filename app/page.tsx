import { fetchBenefits, fetchPopularQueries, fetchTabs } from "@/lib/api";
import type { Benefit, PopularQuery, PublicTab } from "@/types/benefit";
import { HomePage } from "./HomePage";

async function loadInitialData(): Promise<{
  benefits: Benefit[];
  tabs: PublicTab[];
  popularQueries: PopularQuery[];
  error: string | null;
}> {
  try {
    const [benefitsResponse, tabsResponse, popularResponse] = await Promise.all([
      fetchBenefits(),
      fetchTabs(),
      fetchPopularQueries(),
    ]);
    return {
      benefits: benefitsResponse.items ?? [],
      tabs: tabsResponse,
      popularQueries: popularResponse,
      error: null,
    };
  } catch (error) {
    return {
      benefits: [],
      tabs: [],
      popularQueries: [],
      error: error instanceof Error ? error.message : "Не удалось загрузить данные",
    };
  }
}

export default async function Page() {
  const { benefits, tabs, popularQueries, error } = await loadInitialData();
  return (
    <HomePage
      initialBenefits={benefits}
      initialTabs={tabs}
      initialPopularQueries={popularQueries}
      initialError={error}
    />
  );
}
