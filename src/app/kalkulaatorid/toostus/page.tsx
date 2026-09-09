import type { Metadata } from "next";
import { CalculatorRouteShell } from "@/components/calculator-route-shell";
import { IndustrialPvBatteryPage } from "@/components/industrial-pv-battery-page";

export const metadata: Metadata = {
  title: "Tööstus: PV + aku",
  description:
    "Tööstusettevõtte PV ja akusalvestuse analüüs tarbimisprofiili, hinnaseeria ja stsenaariumite põhjal.",
  alternates: {
    canonical: "/kalkulaatorid/toostus",
  },
};

export default function ToostusPage() {
  return (
    <CalculatorRouteShell
      title="Tööstusettevõtte PV + akusalvestus"
      description="Sisesta tarbimine käsitsi või CSV-na, vali eeldused ja hinnarežiim ning võrdle PV ning aku stsenaariume. Tulemus on esialgne hinnang."
    >
      <IndustrialPvBatteryPage />
    </CalculatorRouteShell>
  );
}
