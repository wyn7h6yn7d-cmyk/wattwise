import type { Metadata } from "next";
import { SolarCalculatorPage } from "@/components/solar-calculator-page";
import { CalculatorRouteShell } from "@/components/calculator-route-shell";

export const metadata: Metadata = {
  title: "PV kalkulaator",
  description:
    "Hinda päikesejaama tootlust, omatarvet ja tasuvust sisestatud andmete põhjal Eesti tingimustes.",
  alternates: {
    canonical: "/kalkulaatorid/paikesejaam",
  },
};

export default function PaikesejaamPage() {
  return (
    <CalculatorRouteShell
      title="Päikesejaama tasuvuse kalkulaator"
      description="Hinda päikesejaama tasuvust, rahavoogu ja omatarbimise mõju Eesti tingimustes."
    >
      <SolarCalculatorPage />
    </CalculatorRouteShell>
  );
}
