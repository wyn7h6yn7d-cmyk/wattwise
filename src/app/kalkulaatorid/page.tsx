import Link from "next/link";
import { PUBLIC_TOOLS } from "@/lib/nav";

export default function KalkulaatoridHubPage() {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">Tööriistad</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Neli energiaanalüüsi tööriista ülikooli projekti jaoks: börsihind, PV, peak shaving ja
            tööstusettevõtte PV + aku.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PUBLIC_TOOLS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="calc-card group relative flex min-h-[190px] flex-col justify-between p-5 sm:min-h-[210px] sm:p-6"
          >
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-semibold tracking-wide text-zinc-300">
                {c.icon}
              </div>
              <div className="text-lg font-semibold text-zinc-50">{c.title}</div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-400">{c.description}</div>
            </div>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-200">
              Ava tööriist
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
