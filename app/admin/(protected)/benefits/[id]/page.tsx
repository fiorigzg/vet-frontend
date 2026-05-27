"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BenefitEditor } from "@/components/admin/BenefitEditor";

export default function BenefitEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const benefitId = Number(params.id);

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/admin/benefits"
          className="inline-flex items-center gap-1 text-sm text-[#454652] hover:text-[#1a1b22]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Назад
        </Link>
      </div>
      <BenefitEditor
        benefitId={benefitId}
        onSaved={() => router.push("/admin/benefits")}
      />
    </div>
  );
}
