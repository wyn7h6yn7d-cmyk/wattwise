import { LegalLayout } from "@/app/(legal)/legal-layout";

export default function DisclaimerPage() {
  return (
    <LegalLayout title="Vastutusest loobumine" updatedAt="07.09.2026">
      <p className="text-zinc-200">
        Energiakalkulaatori tulemused on informatiivsed hinnangud. Platvorm on ülikooli projekt
        (kontakt: <strong>kennethalto95@gmail.com</strong>).
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">1. Informatiivne iseloom</h2>
      <p className="mt-2">
        Kalkulaatorid annavad hinnangu sisendandmete ja eelduste põhjal. Tulemused ei ole garantii
        ning võivad erineda tegelikest tulemustest.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">2. Ei ole finantsnõu</h2>
      <p className="mt-2">
        Tulemused ei ole finants-, investeerimis-, maksu- ega õigusnõu. Lõpliku otsuse tegemisel
        arvesta oma tegelikke tingimusi ja vajadusel konsulteeri spetsialistidega.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">3. Välised andmed</h2>
      <p className="mt-2">
        Välised andmeallikad (nt spot hinnad) võivad sisaldada viiteid, katkestusi või ebatäpsusi.
        Platvorm kasutab vajadusel varuandmeid.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">4. Vastutuse piirang</h2>
      <p className="mt-2">
        Projekti autor ei vastuta kahjude eest, mis tulenevad tulemuste kasutamisest. Kasutaja vastutab
        oma sisendite ja otsuste eest.
      </p>
    </LegalLayout>
  );
}
