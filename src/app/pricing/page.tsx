import Link from "next/link";

const plans = [
  {
    name: "Tasuta",
    price: "0 €",
    desc: "Kiire ülevaade ja põhijäreldused.",
    features: ["Põhitulemused", "Lihtne graafik", "Piiratud detailid"],
    cta: { label: "Alusta tasuta", href: "/kalkulaatorid/paikesejaam", variant: "ghost" as const },
  },
  {
    name: "Täisanalüüs",
    price: "9,99 €",
    badge: "Soovitus",
    desc: "Detailsem analüüs ühe projekti kohta.",
    features: [
      "Detailsem tulemuste vaade",
      "Selgemad eeldused ja kokkuvõte",
      "Võrdlus (akuga vs akuta)",
      "Arvutusperioodi mõju (rahavoo vaade)",
    ],
    cta: { label: "Ava Täisanalüüs", href: "/kalkulaatorid/paikesejaam", variant: "glow" as const },
  },
  {
    name: "PDF raport",
    price: "2,99 €",
    desc: "Kokkuvõtte eksport ühe projekti kohta.",
    features: ["1 projekti kokkuvõte", "PDF raport", "Sobib jagamiseks"],
    cta: { label: "Lisa PDF raport", href: "/kalkulaatorid/paikesejaam", variant: "ghost" as const },
  },
];

export default function PricingPage() {
  return (
    <div className="relative page-bg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora" />
        <div className="grid-glow" />
      </div>

      <main className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header className="glass-panel rounded-3xl p-8 sm:p-12">
          <p className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs tracking-wide text-emerald-200">
            Hinnad
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
            Vali tase, mis sobib sinu otsustega
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-300">
            Tasuta annab kiire ülevaate. Täisanalüüs avab detailsema vaate ja PDF raport lisab mugava
            kokkuvõtte ühe projekti kohta.
          </p>
        </header>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((p) => (
            <article
              key={p.name}
              className={`card rounded-3xl p-7 ${
                p.badge ? "ring-1 ring-emerald-300/25 shadow-[0_0_40px_rgba(16,185,129,0.12)]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-50">{p.name}</h2>
                  {p.badge ? (
                    <span className="mt-2 inline-flex rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">
                      {p.badge}
                    </span>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-zinc-50">{p.price}</div>
                </div>
              </div>

              <p className="mt-3 text-sm text-zinc-400">{p.desc}</p>
              <ul className="mt-5 grid gap-2 text-sm text-zinc-300">
                {p.features.map((f) => (
                  <li key={f} className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Link href={p.cta.href} className={p.cta.variant === "glow" ? "btn-glow inline-flex" : "btn-ghost inline-flex"}>
                  {p.cta.label}
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-10 glass-panel rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-zinc-50">Miks tasuline versioon on väärt?</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Kui kasutad tulemust investeeringu või ettevõtte otsuse aluseks, on oluline näha riske,
            stsenaariume ja detailset rahavoogu.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Detailne cashflow", "Aastate lõikes tabel ja selged eeldused."],
              ["Stsenaariumid", "Võrdle akuga/akuta ja tundlikkust."],
              ["PDF raport", "Ühe projekti kokkuvõte jagamiseks."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="text-sm font-semibold text-zinc-50">{t}</div>
                <div className="mt-2 text-sm text-zinc-400">{d}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
            <p className="font-medium text-zinc-100">Teenusepakkuja</p>
            <p className="mt-1">
              Kenneth Alto ·{" "}
              <a className="text-emerald-200 underline underline-offset-4" href="mailto:kennethalto95@gmail.com">
                kennethalto95@gmail.com
              </a>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

