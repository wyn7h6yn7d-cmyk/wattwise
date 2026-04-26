import { SolarCalculatorPage } from "@/components/solar-calculator-page";
import { Suspense } from "react";

export default function PaikesejaamPage() {
  return (
    <Suspense fallback={<div className="card text-sm text-zinc-300">Kalkulaator avaneb...</div>}>
      <SolarCalculatorPage />
    </Suspense>
  );
}

