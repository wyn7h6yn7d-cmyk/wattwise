"use client";

export function ValuePropsSection() {
  return (
    <section className="section">
      <header className="section-head">
        <h2 className="section-h2">Miks valida Energiakalkulaator</h2>
        <p className="section-sub">
          Selge ülevaade nii kodu kui ettevõtte energiaotsuste jaoks.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          ["Kiire ülevaade", "Sisesta põhiandmed ja saa kohe arusaadav tulemus."],
          ["Mitu kalkulaatorit ühes kohas", "Päikesejaam, VPP, paketid, EV laadimine ja peak shaving."],
          ["Mis mõjutab tulemust", "Näed suurusjärke, võrdlusi ja peamisi mõjutegureid."],
          ["Beetaversioon", "Arendame kalkulaatoreid edasi ja täpsustame mudeleid."],
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

