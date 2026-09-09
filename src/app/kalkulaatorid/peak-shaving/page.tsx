import type { Metadata } from "next";
import { PeakShavingPageClient } from "@/components/peak-shaving-page";
import { CalculatorRouteShell } from "@/components/calculator-route-shell";

export const metadata: Metadata = {
  title: "Peak shaving",
  description:
    "Hinda tipukoormuse lõikamist akuga, piiravaid tegureid ja võimalikku võimsustasu säästu.",
  alternates: {
    canonical: "/kalkulaatorid/peak-shaving",
  },
};

export default function PeakShavingPage() {
  return (
    <CalculatorRouteShell
      title="Peak shaving kalkulaator"
      description="Hinda tipukoormuse lõikamise võimekust, piiravat tegurit ja võimalikku aastast säästu."
    >
      <PeakShavingPageClient />
    </CalculatorRouteShell>
  );
}
