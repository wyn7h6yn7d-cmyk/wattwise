import Link from "next/link";
import { PUBLIC_TOOLS } from "@/lib/nav";

export default function KalkulaatoridHubPage() {
  return (
    <section className="glass-panel rounded-3xl p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">Tööriistad</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Kolm energiaanalüüsi tööriista ülikooli projekti jaoks: börsihind, PV kalkulaator ja
            tööstusettevõtte PV + aku.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PUBLIC_TOOLS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="calc-card premium-card group relative flex min-h-[190px] flex-col justify-between overflow-hidden p-5 sm:min-h-[210px] sm:p-6"
          >
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/40 bg-emerald-400/10 text-xs font-semibold tracking-wide text-emerald-200 shadow-[0_0_26px_rgba(16,185,129,0.15)]">
                {c.icon}
              </div>
              <div className="text-lg font-semibold text-zinc-50">{c.title}</div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-400">{c.description}</div>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-200">
              Ava tööriist
              <span className="transition group-hover:translate-x-1">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
