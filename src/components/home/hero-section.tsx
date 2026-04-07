"use client";

import Link from "next/link";
import { AnimatedEnergyBackground } from "@/components/animated-energy-background";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 shadow-[0_18px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
      <AnimatedEnergyBackground intensity="hero" />

      <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <p className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs tracking-wide text-emerald-200">
            Energiakalkulaator
          </p>
          <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight text-zinc-50 sm:text-5xl">
            Arvuta energiaotsuste tasuvus targemalt
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-300 sm:mt-4 sm:text-lg">
            Päikesejaama, VPP, elektripaketi, laadimise ja ettevõtte energiakulude kalkulaatorid ühes kohas.
          </p>

          <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
            <Link href="/kalkulaatorid" className="btn-glow w-full justify-center sm:w-auto">
              Proovi kalkulaatorit
            </Link>
            <Link href="/kalkulaatorid/paikesejaam" className="btn-ghost w-full justify-center sm:w-auto">
              Ava Täisanalüüs
            </Link>
          </div>

          <div className="mt-5 grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
            {[
              "Tasuta ülevaade mõne minutiga",
              "Ühtne premium UI kõigis moodulites",
              "PDF raport lisana (2,99 €)",
            ].map((t) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative rounded-3xl border border-white/10 bg-zinc-950/55 p-5 shadow-[0_0_60px_rgba(16,185,129,0.10)] backdrop-blur-2xl sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.18),transparent_42%),radial-gradient(circle_at_80%_70%,rgba(20,184,166,0.14),transparent_45%)]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-50">Näidisülevaade</div>
                  <div className="mt-1 text-xs text-zinc-400">Päikesejaama tasuvus (tasuta vaade)</div>
                </div>
                <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-200">
                  Live preview
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Aastane sääst", "1 250 €"],
                  ["Tasuvusaeg", "8,6 a"],
                  ["Omakasutus", "47%"],
                  ["Võrku müük", "3 100 kWh"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                    <div className="text-[11px] text-zinc-400">{k}</div>
                    <div className="mt-1 text-base font-semibold text-zinc-50">{v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Kumulatiivne rahavoog (näidis)</span>
                  <span>20 a</span>
                </div>
                <div className="mt-3 grid grid-cols-12 items-end gap-1">
                  {[2, 3, 4, 5, 7, 9, 10, 11, 12, 12, 12, 12].map((h, i) => (
                    <div
                      // eslint-disable-next-line react/no-array-index-key
                      key={i}
                      className="rounded-sm bg-gradient-to-t from-emerald-400/70 to-teal-300/70"
                      style={{ height: `${h * 5}px` }}
                    />
                  ))}
                </div>
                <div className="mt-3 text-xs text-zinc-400">
                  Täisanalüüs avab detailse rahavoo, võrdlused ja tundlikkuse.
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Märkus: see on näidis “product feel” eelvaade. Reaalsed tulemused sõltuvad sinu sisenditest.
          </p>
        </div>
      </div>
    </section>
  );
}

