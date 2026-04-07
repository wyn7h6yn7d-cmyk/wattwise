"use client";

export function HowItWorksSection() {
  return (
    <section className="section">
      <header className="section-head">
        <h2 className="section-h2">Kuidas see töötab</h2>
        <p className="section-sub">
          Sisesta andmed, näe tasuta ülevaadet ja ava vajadusel detailne analüüs või PDF raport.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["1) Sisesta andmed", "Vali kalkulaator ja sisesta põhiandmed, et saada hinnang."],
          ["2) Vaata tasuta ülevaadet", "Näed põhitulemused ja lihtsa visuaalse ülevaate kohe."],
          ["3) Ava detailne analüüs või PDF", "Täisanalüüs avab rahavoo ja võrdlused, PDF lisab raporti jagamiseks."],
        ].map(([t, d]) => (
          <article key={t} className="feature-card">
            <div className="feature-icon" />
            <h3 className="feature-title">{t}</h3>
            <p className="feature-desc">{d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

