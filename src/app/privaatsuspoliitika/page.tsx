import { LegalLayout } from "@/app/(legal)/legal-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privaatsuspoliitika | Energiakalkulaator",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privaatsuspoliitika" updatedAt="26.04.2026">
      <p className="text-zinc-200">
        Käesolev privaatsuspoliitika selgitab, kuidas energiakalkulaator.ee veebilehel andmeid
        töödeldakse ja millised on kasutaja õigused.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">1. Kes on andmete vastutav töötleja</h2>
      <p className="mt-2">
        Vastutav töötleja: <strong>Kenneth Alto</strong>
        <br />
        Kontakt: <strong>kennethalto95@gmail.com</strong>
      </p>
      <p className="mt-2 text-zinc-300">
        Ettevõtte andmed lisatakse pärast ettevõtlusvormi vormistamist.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">2. Milliseid andmeid võime töödelda</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Veebilehe kasutusandmed (nt lehevaatamised, tehnilised sündmused).</li>
        <li>Kasutaja sisestatud kalkulaatoriandmed.</li>
        <li>Kontaktivormi kaudu saadetud andmed (nimi, e-post, sõnum), kui vormi kasutatakse.</li>
        <li>Tehnilised andmed nagu IP-aadress, brauseri tüüp ja seadme info.</li>
        <li>Küpsiste eelistused ja nõusoleku valikud.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">3. Milleks andmeid kasutatakse</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Kalkulaatorite tööks ja tulemuste kuvamiseks.</li>
        <li>Päringutele vastamiseks ja kliendisuhtluseks.</li>
        <li>Teenuse arendamiseks ja kasutusmugavuse parandamiseks.</li>
        <li>Tehnilise töökindluse ning turvalisuse tagamiseks.</li>
        <li>Analüütikaks ainult kasutaja nõusoleku korral.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">4. Õiguslik alus</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Lepingu-eelsed toimingud või teenuse kasutamise võimaldamine.</li>
        <li>Õigustatud huvi teenuse turvalisuse ja arendamise eesmärgil.</li>
        <li>Nõusolek analüütika ja lisaküpsiste kasutamiseks.</li>
        <li>Seadusest tulenevad kohustused, kui see on asjakohane.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">5. Andmete säilitamine</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Kontaktpäringuid säilitatakse mõistliku aja jooksul vastamiseks ja järeltegevusteks.</li>
        <li>
          Kalkulaatori sisestusi ei seostata isikuga, kui kasutaja ei saada neid ise koos
          kontaktpäringuga.
        </li>
        <li>
          Küpsise eelistusi säilitatakse seni, kuni kasutaja neid muudab või kuni tehniliselt
          määratud perioodi lõpuni.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">6. Kolmandad osapooled</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Hostinguteenuse pakkuja (nt Vercel või muu kasutatav hostingu partner).</li>
        <li>Analüütika tööriistad ainult juhul, kui kasutaja on andnud vastava nõusoleku.</li>
        <li>Makseteenuse pakkuja tulevikus, kui saidile lisanduvad tasulised teenused.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">7. Kasutaja õigused</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Õigus küsida ligipääsu enda andmetele.</li>
        <li>Õigus andmete parandamisele.</li>
        <li>Õigus andmete kustutamisele.</li>
        <li>Õigus töötlemise piiramisele.</li>
        <li>Õigus nõusolek igal ajal tagasi võtta.</li>
        <li>Õigus esitada kaebus Andmekaitse Inspektsioonile.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">8. Kontakt</h2>
      <p className="mt-2">
        Andmekaitsega seotud küsimustes kirjuta: <strong>kennethalto95@gmail.com</strong>.
      </p>

      <p className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-zinc-300">
        See privaatsuspoliitika on koostatud üldiseks kasutamiseks. Vajadusel tuleb lõplik tekst
        üle vaadata juristiga.
      </p>
    </LegalLayout>
  );
}

