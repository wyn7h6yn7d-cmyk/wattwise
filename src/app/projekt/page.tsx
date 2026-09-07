import Link from "next/link";
import type { Metadata } from "next";
import { LegalLayout } from "@/app/(legal)/legal-layout";

export const metadata: Metadata = {
  title: "Projekt | Energiakalkulaator",
};

export default function ProjectPage() {
  return (
    <LegalLayout title="Ülikooli projekt" updatedAt="07.09.2026">
      <p className="text-zinc-200">
        Energiakalkulaator.ee on üliõpilastöö raames arendatud informatiivne platvorm energiaotsuste
        hindamiseks Eesti tingimustes. Tegemist ei ole äriteenuse ega müügikeskkonnaga.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">Mida platvorm teeb</h2>
      <p className="mt-2">
        Projekt 2 keskendub kolmele analüüsitööriistale:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>börsihinna vaade Eleringi andmete põhjal;</li>
        <li>päikesejaama tasuvuse kalkulaator;</li>
        <li>tööstusettevõtte PV + akusalvestuse analüüs.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">Tulemuste olemus</h2>
      <p className="mt-2">
        Kõik arvutused on hinnangulised ja sõltuvad sisestatud andmetest ning valitud eeldustest.
        Tulemused ei ole finants-, investeerimis-, maksu- ega tehniline nõuanne.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">Kontakt</h2>
      <p className="mt-2">
        Küsimuste ja tagasiside jaoks:{" "}
        <a className="text-emerald-200 underline underline-offset-4" href="mailto:kennethalto95@gmail.com">
          kennethalto95@gmail.com
        </a>
        . Vaata ka{" "}
        <Link href="/kontakt" className="text-emerald-200 underline underline-offset-4">
          kontaktilehte
        </Link>
        .
      </p>
    </LegalLayout>
  );
}
