import Link from "next/link";
import { FEATURES } from "@/lib/features";

const cards = [
  {
    title: "Päikesejaama tasuvus",
    desc: "Sääst, omatarve, rahavoog ja tasuvusaeg Eesti tingimustel.",
    href: "/kalkulaatorid/paikesejaam",
    icon: (
      <path d="M12 3v3m0 12v3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M3 12h3m12 0h3M4.9 19.1l2.1-2.1m10-10 2.1-2.1M12 8a4 4 0 100 8 4 4 0 000-8z" />
    ),
  },
  {
    title: "VPP tasuvusmudel",
    desc: "Aku osalemise tulupotentsiaal ja lihtne tasuvusvaade.",
    href: "/kalkulaatorid/vpp",
    icon: <path d="M6 18h2l2-6h4l-2 6h2l2-12H8L6 18z" />,
  },
  {
    title: "Elektripaketi võrdlus",
    desc: "Spot vs fikseeritud — kiire aastakulu hinnang.",
    href: "/kalkulaatorid/elektripaketid",
    icon: <path d="M4 7h16M4 12h10M4 17h7m10-2 2 2-2 2m0-4h-6" />,
  },
  {
    title: "EV laadimine",
    desc: "Laadimise aeg, kulu ja peakaitsest tulenev laadija soovitus.",
    href: "/kalkulaatorid/ev-laadimine",
    icon: <path d="M7 7h8v10H7zM9 7V5m4 0v2m5 3h-3v4h3l-2 4" />,
  },
  {
    title: "Peak shaving",
    desc: "Tipukoormuse lõikamise hinnang ja säästu potentsiaal.",
    href: "/kalkulaatorid/peak-shaving",
    icon: <path d="M4 16l4-5 3 3 5-7 4 3M4 20h16" />,
  },
];

export default function KalkulaatoridHubPage() {
  return (
    <section className="glass-panel rounded-3xl p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">Kalkulaatorid</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Vali tööriist ja alusta. Hetkel on kõik kalkulaatorid beetaversioonina tasuta kasutamiseks.
          </p>
        </div>
        {FEATURES.paywallEnabled ? (
          <Link href="/pricing" className="btn-ghost inline-flex">
            Vaata hindu
          </Link>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="calc-card premium-card group relative flex min-h-[190px] flex-col justify-between overflow-hidden p-5 sm:min-h-[210px] sm:p-6"
          >
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/40 bg-emerald-400/10 text-emerald-200 shadow-[0_0_26px_rgba(16,185,129,0.15)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {c.icon}
                  </g>
                </svg>
              </div>
              <div className="text-lg font-semibold text-zinc-50">{c.title}</div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-400">{c.desc}</div>
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

