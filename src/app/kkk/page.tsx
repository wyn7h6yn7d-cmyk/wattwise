import { LegalLayout } from "@/app/(legal)/legal-layout";

export default function KkkPage() {
  return (
    <LegalLayout title="Korduma kippuvad küsimused" updatedAt="25.04.2026">
      <h2 className="mt-2 text-lg font-semibold text-zinc-50">Kas kalkulaatorid on tasuta?</h2>
      <p className="mt-2">
        Jah. Hetkel on kogu teenus tasuta beetaversioonina kasutamiseks.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">Kas tulemused on siduvad?</h2>
      <p className="mt-2">
        Ei. Tulemused on informatiivsed hinnangud ning sõltuvad sisenditest ja eeldustest.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">Kust andmed tulevad?</h2>
      <p className="mt-2">
        Börsihinna vaated kasutavad Eleringi/Nord Pooli andmeid. Muud tulemused arvutatakse sinu sisendite põhjal.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">Kuidas ühendust võtta?</h2>
      <p className="mt-2">
        Kirjuta aadressile <a className="text-emerald-200 underline underline-offset-4" href="mailto:kennethalto95@gmail.com">kennethalto95@gmail.com</a>.
      </p>
    </LegalLayout>
  );
}
