import { SolarCalculatorPage } from "@/components/solar-calculator-page";
import { Suspense } from "react";

export default function PaikesejaamPage() {
  return (
    <Suspense
      fallback={
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="h-6 w-48 rounded bg-white/10" />
          <div className="mt-4 h-4 w-80 max-w-full rounded bg-white/10" />
          <div className="mt-8 h-48 rounded-3xl border border-white/10 bg-white/[0.02]" />
        </div>
      }
    >
      <SolarCalculatorPage />
    </Suspense>
  );
}

