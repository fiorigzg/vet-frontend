import { fetchBenefits, fetchTabs } from "@/lib/api";
import type { Benefit, PublicTab } from "@/types/benefit";
import { HomePage } from "./HomePage";

async function loadInitialData(): Promise<{
  benefits: Benefit[];
  tabs: PublicTab[];
  error: string | null;
}> {
  try {
    const [benefitsResponse, tabsResponse] = await Promise.all([
      fetchBenefits(),
      fetchTabs(),
    ]);
    return {
      benefits: benefitsResponse.items ?? [],
      tabs: tabsResponse,
      error: null,
    };
  } catch (error) {
    return {
      benefits: [],
      tabs: [],
      error: error instanceof Error ? error.message : "Не удалось загрузить данные",
    };
  }
}

export default async function Page() {
  const { benefits, tabs, error } = await loadInitialData();
  return (
    <HomePage initialBenefits={benefits} initialTabs={tabs} initialError={error} />
  );
}
