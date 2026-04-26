import { EvLaadiminePageClient } from "@/components/ev-laadimine-page";
import { Suspense } from "react";

export default function EvLaadiminePage() {
  return (
    <Suspense fallback={<div className="card text-sm text-zinc-300">Kalkulaator avaneb...</div>}>
      <EvLaadiminePageClient />
    </Suspense>
  );
}

