import { SolarCalculatorPage } from "@/components/solar-calculator-page";
import { Suspense } from "react";

export default function PaikesejaamPage() {
  return (
    <Suspense
      fallback={
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="text-sm text-zinc-300">Laen kalkulaatorit...</div>
        </div>
      }
    >
      <SolarCalculatorPage />
    </Suspense>
  );
}

