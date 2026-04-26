import type { Metadata } from "next";
import { LegalLayout } from "@/app/(legal)/legal-layout";
import { OpenCookieSettingsButton } from "@/components/legal/OpenCookieSettingsButton";

export const metadata: Metadata = {
  title: "Küpsised | Energiakalkulaator",
};

export default function CookiesPage() {
  return (
    <LegalLayout title="Küpsised" updatedAt="26.04.2026">
      <p className="text-zinc-200">
        Küpsised on väikesed tekstifailid, mis salvestatakse sinu seadmesse. Need aitavad veebilehel
        toimida ja võimaldavad salvestada sinu valikuid.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">Milliseid küpsiseid kasutatakse</h2>
      <p className="mt-2">
        Kasutame küpsiseid kategooriate kaupa: hädavajalikud, analüütika ja funktsionaalsed.
      </p>

      <h3 className="mt-6 text-base font-semibold text-zinc-100">Hädavajalikud küpsised</h3>
      <p className="mt-1">
        Need on vajalikud veebilehe tööks, turvalisuseks ja sinu nõusolekuvalikute salvestamiseks.
      </p>

      <h3 className="mt-5 text-base font-semibold text-zinc-100">Analüütika küpsised</h3>
      <p className="mt-1">
        Aitavad mõista, kuidas lehte kasutatakse. Analüütikaküpsiseid võidakse lisada tulevikus ainult
        kasutaja nõusolekul.
      </p>

      <h3 className="mt-5 text-base font-semibold text-zinc-100">Funktsionaalsed küpsised</h3>
      <p className="mt-1">
        Aitavad salvestada kasutaja eelistusi ja parandada kasutuskogemust juhul, kui kasutaja need
        lubab.
      </p>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">Küpsiste ülevaade</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm text-zinc-300">
          <thead className="bg-white/[0.03] text-zinc-100">
            <tr>
              <th className="px-3 py-2">Kategooria</th>
              <th className="px-3 py-2">Eesmärk</th>
              <th className="px-3 py-2">Näited</th>
              <th className="px-3 py-2">Säilitusaeg</th>
              <th className="px-3 py-2">Nõusolek vajalik</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-white/10">
              <td className="px-3 py-2">Hädavajalikud</td>
              <td className="px-3 py-2">Veebilehe töö ja nõusoleku valikute salvestamine</td>
              <td className="px-3 py-2">Küpsise eelistuse kirje</td>
              <td className="px-3 py-2">Kuni kasutaja muudab valikut</td>
              <td className="px-3 py-2">Ei</td>
            </tr>
            <tr className="border-t border-white/10">
              <td className="px-3 py-2">Analüütika</td>
              <td className="px-3 py-2">Kasutusmustrite koondstatistika</td>
              <td className="px-3 py-2">Anonüümsed mõõdikud</td>
              <td className="px-3 py-2">Teenuse seadistuse järgi</td>
              <td className="px-3 py-2">Jah</td>
            </tr>
            <tr className="border-t border-white/10">
              <td className="px-3 py-2">Funktsionaalsed</td>
              <td className="px-3 py-2">Eelistuste meelespidamine</td>
              <td className="px-3 py-2">Kasutajaliidese eelistused</td>
              <td className="px-3 py-2">Teenuse seadistuse järgi</td>
              <td className="px-3 py-2">Jah</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-zinc-50">Kuidas valikuid muuta</h2>
      <p className="mt-2">
        Saad oma valikuid igal ajal muuta, avades küpsiste seaded.
      </p>
      <div className="mt-3">
        <OpenCookieSettingsButton className="btn-glow">Ava küpsiste seaded</OpenCookieSettingsButton>
      </div>
    </LegalLayout>
  );
}

