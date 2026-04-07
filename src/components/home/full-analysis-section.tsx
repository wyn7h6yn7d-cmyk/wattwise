"use client";

import Link from "next/link";
import { FEATURES } from "@/lib/features";

export function FullAnalysisSection() {
  return (
    <section className="section">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="glass-panel lg:col-span-7 rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-zinc-50">
            {FEATURES.paywallEnabled ? "Miks avada Täisanalüüs" : "Põhjalikum ülevaade"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Sisesta andmed ja vaata detailset analüüsi. Tulemused aitavad otsust põhjendada ja võrrelda eri stsenaariume.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Detailne rahavoog", "Aastate lõikes selge ülevaade kuludest ja tuludest."],
              ["Tundlikkus", "Näed, millised sisendid mõjutavad tulemust enim."],
              ["Võrdlused", "Akuga vs akuta, eri eeldused ja stsenaariumid."],
              ["Raport", "Kokkuvõte salvestamiseks ja jagamiseks."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="text-sm font-semibold text-zinc-50">{t}</div>
                <div className="mt-2 text-sm text-zinc-400">{d}</div>
              </div>
            ))}
          </div>

          {FEATURES.paywallEnabled ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pricing" className="btn-glow inline-flex">
                Vaata hindu
              </Link>
              <Link href="/kalkulaatorid/paikesejaam" className="btn-ghost inline-flex">
                Ava Täisanalüüs
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              <Link href="/kalkulaatorid" className="btn-glow inline-flex">
                Ava kalkulaatorid
              </Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
          <div className="text-sm font-semibold text-zinc-50">
            {FEATURES.paywallEnabled ? "Tasuta vs Täisanalüüs" : "Mida sa näed"}
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-xs text-zinc-400">Ülevaade</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                <li>Põhitulemused</li>
                <li>Lihtne hinnang</li>
                <li>1–2 lihtsat graafikut</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
              <div className="text-xs text-emerald-200">
                {FEATURES.paywallEnabled ? "Täisanalüüs" : "Detailne analüüs"}
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-100">
                <li>Detailne rahavoog</li>
                <li>Tundlikkus ja lisagraafikud</li>
                <li>Võrdlused ja detailsemad plokid</li>
                <li>Raporti allalaadimine</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            {FEATURES.paywallEnabled
              ? "Elegantne paywall: tasuta vaade jääb nähtavaks, detailne sisu avaneb projekti kaupa."
              : "Energiakalkulaator on hetkel tasuta kasutamiseks."}
          </p>
        </div>
      </div>
    </section>
  );
}

