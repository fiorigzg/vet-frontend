import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchBenefit } from "@/lib/api";
import { BenefitDetail } from "@/components/BenefitDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadBenefit(rawId: string) {
  const benefitId = Number(rawId);
  if (!Number.isFinite(benefitId)) return null;
  try {
    return await fetchBenefit(benefitId);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const benefit = await loadBenefit(id);
  if (!benefit) {
    return { title: "Льгота не найдена — Льгота.Москва" };
  }
  return {
    title: `${benefit.title} — Льгота.Москва`,
    description: benefit.summary || benefit.description || undefined,
  };
}

export default async function BenefitPage({ params }: PageProps) {
  const { id } = await params;
  const benefit = await loadBenefit(id);
  if (!benefit) notFound();

  return <BenefitDetail benefit={benefit} />;
}
