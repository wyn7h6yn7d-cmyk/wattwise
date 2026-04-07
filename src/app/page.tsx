import Link from "next/link";
import { AnimatedEnergyBackground } from "@/components/animated-energy-background";

export default function Home() {
  return (
    <div className="relative page-bg">
      <AnimatedEnergyBackground intensity="page" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <section className="glass-panel relative overflow-hidden rounded-3xl p-8 sm:p-12">
          <AnimatedEnergyBackground intensity="hero" />
          <div className="relative">
            <p className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs tracking-wide text-emerald-200">
              Energiakalkulaator
            </p>
            <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-zinc-50 sm:text-5xl">
              Arvuta energiaotsuste tasuvus targemalt
            </h1>
            <p className="mt-4 max-w-2xl text-base text-zinc-300 sm:text-lg">
              Päikesejaama, VPP, elektripaketi, laadimise ja ettevõtte energiakulude kalkulaatorid ühes kohas.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/kalkulaatorid" className="btn-glow inline-flex">
                Proovi kalkulaatorit
              </Link>
              <Link href="/kalkulaatorid/paikesejaam" className="btn-ghost inline-flex">
                Ava Täisanalüüs
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            ["1. Sisesta andmed", "Vali kalkulaator ja sisesta põhiandmed, et saada hinnang."],
            ["2. Vaata tasuta ülevaadet", "Näed põhitulemust ja lihtsat graafikut kohe."],
            ["3. Ava detailne analüüs või PDF", "Täisanalüüs avab rahavoo ja võrdlused, PDF lisab raporti jagamiseks."],
          ].map(([t, d]) => (
            <article key={t} className="card rounded-3xl p-6">
              <div className="mb-3 h-10 w-10 rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/20" />
              <h2 className="text-lg font-semibold text-zinc-50">{t}</h2>
              <p className="mt-2 text-sm text-zinc-400">{d}</p>
            </article>
          ))}
        </section>

        <section className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-50">Kalkulaatorid</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Vali tööriist ja alusta. Kõik moodulid järgivad sama loogikat ja ühtset UI-d.
              </p>
            </div>
            <Link href="/kalkulaatorid" className="btn-ghost inline-flex">
              Ava kõik
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Päikesejaam", "/kalkulaatorid/paikesejaam"],
              ["VPP", "/kalkulaatorid/vpp"],
              ["Elektripaketid", "/kalkulaatorid/elektripaketid"],
              ["EV laadimine", "/kalkulaatorid/ev-laadimine"],
              ["Peak shaving", "/kalkulaatorid/peak-shaving"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.05]"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="glass-panel rounded-3xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-zinc-50">Miks Täisanalüüs?</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Kui teed otsuseid investeeringute või ettevõtte energiakulu kohta, on oluline näha riske ja rahavoogu.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-zinc-300">
              <li className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">Detailne rahavoog ja võrdlused</li>
              <li className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">Tundlikkuse plokk (mis mõjutab tulemust enim)</li>
              <li className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">PDF raport lisana (2,99 €) jagamiseks</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pricing" className="btn-glow inline-flex">
                Vaata hindu
              </Link>
              <Link href="/kalkulaatorid/paikesejaam" className="btn-ghost inline-flex">
                Ava Täisanalüüs
              </Link>
            </div>
          </article>

          <article className="glass-panel rounded-3xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-zinc-50">KKK</h2>
            <div className="mt-4 grid gap-3">
              {[
                [
                  "Kas tulemused on täpsed?",
                  "Tulemused on informatiivsed ja sõltuvad sisenditest ning eeldustest. Täisanalüüs avab detailse rahavoo ja selgema pildi riskidest.",
                ],
                [
                  "Mida ma tasuta vaates näen?",
                  "Põhitulemused ja lihtsa ülevaate. Detailne analüüs ja lisablokid avanevad pärast ostu.",
                ],
                [
                  "Milleks PDF raport?",
                  "PDF on professionaalne kokkuvõte, mida saad salvestada või partnerile saata — projekti kaupa.",
                ],
              ].map(([q, a]) => (
                <details key={q} className="faq-details rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <summary className="faq-summary font-medium text-zinc-100">{q}</summary>
                  <p className="mt-2 pl-8 text-sm leading-relaxed text-zinc-300 md:text-base">{a}</p>
                </details>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
