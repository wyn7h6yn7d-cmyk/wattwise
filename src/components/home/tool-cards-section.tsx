"use client";

import Link from "next/link";

const cards = [
  {
    title: "Kalkulaatorid",
    text: "Arvuta ja võrdle investeeringute tasuvust ja säästu.",
    href: "/kalkulaatorid",
  },
  {
    title: "Börsihind",
    text: "Jälgi elektri börsihinda reaalajas.",
    href: "/borsihind",
  },
  {
    title: "Hinnad",
    text: "Võrdle elektri hinda ja lepingutingimusi.",
    href: "/pricing",
  },
  {
    title: "Kontakt",
    text: "Võta ühendust ja küsi lisainfot.",
    href: "/kontakt",
  },
];

export function ToolCardsSection() {
  return (
    <section className="section">
      <header className="section-head">
        <h2 className="section-h2 text-center">Vali menüüst sobiv tööriist</h2>
      </header>

      <div className="grid gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="calc-card premium-card group relative flex min-h-[210px] flex-col justify-between overflow-hidden p-5"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-300/45 bg-emerald-400/10 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.16)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 12h16M12 4l8 8-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-100">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{card.text}</p>
            </div>
            <div className="mt-6 flex items-center justify-end text-emerald-200 transition group-hover:translate-x-1">→</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
