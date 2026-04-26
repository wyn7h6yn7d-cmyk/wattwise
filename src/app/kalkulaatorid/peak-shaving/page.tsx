import { PeakShavingPageClient } from "@/components/peak-shaving-page";
import { Suspense } from "react";

export default function PeakShavingPage() {
  return (
    <Suspense fallback={<div className="card text-sm text-zinc-300">Kalkulaator avaneb...</div>}>
      <PeakShavingPageClient />
    </Suspense>
  );
}

