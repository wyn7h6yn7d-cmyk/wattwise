import { LegalLayout } from "@/app/(legal)/legal-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kasutustingimused | Energiakalkulaator",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Kasutustingimused" updatedAt="26.04.2026">
      <p className="text-zinc-200">
        Käesolevad kasutustingimused reguleerivad veebilehe energiakalkulaator.ee kasutamist.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">1. Teenuse kirjeldus</h2>
      <p className="mt-2">
        Energiakalkulaator on informatiivne tööriist energiaotsuste hindamiseks.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">2. Tulemuste olemus</h2>
      <p className="mt-2">
        Tulemused on hinnangulised ja põhinevad kasutaja sisestatud andmetel ning süsteemi eeldustel.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">3. Mitte nõustamine</h2>
      <p className="mt-2">
        Tööriist ei ole finants-, investeerimis-, maksu-, õigus- ega tehniline nõustamine.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">4. Kasutaja vastutus</h2>
      <p className="mt-2">Kasutaja vastutab sisestatud andmete õigsuse eest.</p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">5. Vastutuse piirang</h2>
      <p className="mt-2">
        Teenuse osutaja ei vastuta otsuste eest, mis tehakse ainult kalkulaatori tulemuste põhjal.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">6. Andmeallikad</h2>
      <p className="mt-2">
        Kui kasutatakse Eleringi, Open-Meteo, PVGIS või muid avalikke andmeallikaid, sõltuvad
        tulemused nende andmete kättesaadavusest ja täpsusest.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">7. Teenuse muutmine</h2>
      <p className="mt-2">
        Teenust võib muuta, täiendada või ajutiselt katkestada ilma ette teatamata.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">8. Tasulised lisavõimalused</h2>
      <p className="mt-2">
        Hetkel võib teenus olla tasuta beetaversioonis. Tasulised lisavõimalused võivad hiljem
        lisanduda.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">9. Kontakt</h2>
      <p className="mt-2">
        Kenneth Alto
        <br />
        <strong>kennethalto95@gmail.com</strong>
      </p>
    </LegalLayout>
  );
}

