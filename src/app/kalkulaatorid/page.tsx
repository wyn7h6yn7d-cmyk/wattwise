import Link from "next/link";
import { FEATURES } from "@/lib/features";

const cards = [
  {
    title: "Päikesejaama tasuvus",
    desc: "Sääst, omatarve, rahavoog ja tasuvusaeg Eesti tingimustel.",
    href: "/kalkulaatorid/paikesejaam",
  },
  {
    title: "VPP tasuvusmudel",
    desc: "Aku osalemise tulupotentsiaal ja lihtne tasuvusvaade.",
    href: "/kalkulaatorid/vpp",
  },
  {
    title: "Elektripaketi võrdlus",
    desc: "Spot vs fikseeritud — kiire aastakulu hinnang.",
    href: "/kalkulaatorid/elektripaketid",
  },
  {
    title: "EV laadimine",
    desc: "Laadimise aeg, kulu ja peakaitsest tulenev laadija soovitus.",
    href: "/kalkulaatorid/ev-laadimine",
  },
  {
    title: "Peak shaving",
    desc: "Tipukoormuse lõikamise hinnang ja säästu potentsiaal.",
    href: "/kalkulaatorid/peak-shaving",
  },
];

export default function KalkulaatoridHubPage() {
  return (
    <section className="glass-panel rounded-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">Kalkulaatorid</h1>
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
            className="card rounded-3xl p-6 transition-colors hover:bg-white/[0.05]"
          >
            <div className="mb-3 h-10 w-10 rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/20" />
            <div className="text-lg font-semibold text-zinc-50">{c.title}</div>
            <div className="mt-2 text-sm text-zinc-400">{c.desc}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

