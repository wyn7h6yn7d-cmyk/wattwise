"use client";

import { PUBLIC_TOOLS } from "@/lib/nav";
import Link from "next/link";

export function CalculatorGrid() {
  return (
    <section className="section">
      <header className="section-head">
        <h2 className="section-h2">Tööriistad</h2>
        <p className="section-sub">Vali tööriist ja alusta. Arvutus põhineb sisestatud andmetel.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PUBLIC_TOOLS.map((c) => (
          <Link key={c.href} href={c.href} className="calc-card">
            <div className="calc-card-top">
              <div className="calc-card-icon" />
              <div>
                <div className="calc-card-title">{c.title}</div>
                <div className="calc-card-desc">{c.description}</div>
              </div>
            </div>
            <div className="calc-card-cta">Ava tööriist →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
