"use client";

import Link from "next/link";

const cards = [
  {
    title: "Päikesejaam",
    desc: "Sääst, omatarve, rahavoog ja tasuvusaeg Eesti tingimustel.",
    href: "/kalkulaatorid/paikesejaam",
  },
  {
    title: "VPP",
    desc: "Aku osalemise tulupotentsiaal ja lihtne tasuvusvaade.",
    href: "/kalkulaatorid/vpp",
  },
  {
    title: "Elektripaketid",
    desc: "Spot vs fikseeritud — kiire aastakulu võrdlus.",
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

export function CalculatorGrid() {
  return (
    <section className="section">
      <header className="section-head">
        <h2 className="section-h2">Kalkulaatorid</h2>
        <p className="section-sub">Vali tööriist ja alusta. Tasuta vaates näed põhitulemust kohe.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="calc-card">
            <div className="calc-card-top">
              <div className="calc-card-icon" />
              <div>
                <div className="calc-card-title">{c.title}</div>
                <div className="calc-card-desc">{c.desc}</div>
              </div>
            </div>
            <div className="calc-card-cta">Ava kalkulaator →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

