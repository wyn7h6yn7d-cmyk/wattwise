import { LegalLayout } from "@/app/(legal)/legal-layout";

export default function RefundsPage() {
  return (
    <LegalLayout title="Tagastused ja tellimused" updatedAt="07.04.2026">
      <p className="text-zinc-200">
        See leht kirjeldab digiteenuste ostu ja tagasimaksete põhimõtteid. Enne teenuse päris
        kasutuselevõttu palume sisu juristiga üle vaadata.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">1. Digiteenused ja hinnad</h2>
      <p className="mt-2">
        Hetkel pakume järgmisi digiteenuseid:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          <strong>Täisanalüüs</strong> – detailsem tulemuste vaade ja analüüs ühe projekti kohta.
        </li>
        <li>
          <strong>PDF raport</strong> – kokkuvõtte eksport ühele projektile.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">2. Digitaalse teenuse osutamine</h2>
      <p className="mt-2">
        Digiteenus loetakse osutatuks, kui ligipääs täisanalüüsile või raporti eksport on kasutajale
        avatud. Teenuse osutamine võib toimuda kohe pärast makse kinnitamist.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">3. Enne ostu kinnitatavad tingimused</h2>
      <p className="mt-2">
        Checkouti juures peab kasutaja kinnitama vähemalt:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>“Olen tutvunud kasutustingimustega.”</li>
        <li>“Olen tutvunud privaatsuspoliitikaga.”</li>
        <li>
          “Nõustun, et digitaalse teenuse kohene osutamine võib mõjutada minu taganemisõigust vastavalt
          kohaldatavale õigusele.”
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">4. Tagasimaksed</h2>
      <p className="mt-2">
        Tagasimakseid käsitletakse juhtumipõhiselt, arvestades digiteenuse osutamise asjaolusid ja
        kohaldatavat õigust. Palun esita taotlus e-postile:{" "}
        <strong>kennethalto95@gmail.com</strong>.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">5. Kontakt</h2>
      <p className="mt-2">
        Teenusepakkuja: <strong>Kenneth Alto</strong> · Kontakt:{" "}
        <strong>kennethalto95@gmail.com</strong>
      </p>
    </LegalLayout>
  );
}

