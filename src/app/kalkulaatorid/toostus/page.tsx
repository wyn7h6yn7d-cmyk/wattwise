import Link from "next/link";
import type { Metadata } from "next";
import { CalculatorRouteShell } from "@/components/calculator-route-shell";

export const metadata: Metadata = {
  title: "Tööstus: PV + aku | Energiakalkulaator",
};

export default function ToostusPage() {
  return (
    <CalculatorRouteShell
      title="Tööstusettevõtte PV + akusalvestus"
      description="Analüüsimoodul tööstusettevõtte päikesejaama, omatarbe ja akusalvestuse hindamiseks, sh võimsustasu mõju."
    >
      <div className="space-y-5 text-sm leading-relaxed text-zinc-300">
        <p>
          See moodul on Projekt 2 uus fookustööriist. Eesmärk on anda tööstusettevõttele ülevaade,
          kuidas päikesejaam ja aku koos mõjutavad ostetud energiat, võimsustasu ja tasuvust.
        </p>
        <p>
          Täisulatuses arvutusliides on koostamisel. Seni saad kasutada olemasolevat{" "}
          <Link href="/kalkulaatorid/paikesejaam" className="text-emerald-200 underline underline-offset-4">
            PV kalkulaatorit
          </Link>{" "}
          ja jälgida{" "}
          <Link href="/borsihind" className="text-emerald-200 underline underline-offset-4">
            börsihinda
          </Link>
          .
        </p>
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-zinc-200">
          <p className="font-semibold text-zinc-50">Plaanitavad sisendid</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>tööstuse tarbimisprofiil ja tipukoormus;</li>
            <li>PV võimsus, tootlus ja omatarve;</li>
            <li>aku maht, võimsus ja kasutegur;</li>
            <li>võimsustasu ning börsi- või lepinguhind.</li>
          </ul>
        </div>
        <p className="text-xs text-zinc-400">
          Tegu on ülikooli projektiga. Tulemused on informatiivsed hinnangud, mitte investeerimisnõuanne.
        </p>
      </div>
    </CalculatorRouteShell>
  );
}
