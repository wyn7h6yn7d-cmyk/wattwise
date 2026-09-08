import type { Metadata } from "next";
import { CalculatorRouteShell } from "@/components/calculator-route-shell";
import { IndustrialPvBatteryPage } from "@/components/industrial-pv-battery-page";

export const metadata: Metadata = {
  title: "Tööstus: PV + aku | Energiakalkulaator",
};

export default function ToostusPage() {
  return (
    <CalculatorRouteShell
      title="Tööstusettevõtte PV + akusalvestus"
      description="Hinda tarbimisprofiili põhjal, kuidas päikesejaam ja aku mõjutavad omatarvet, tipukoormust ja energiakulu."
    >
      <IndustrialPvBatteryPage />
    </CalculatorRouteShell>
  );
}
